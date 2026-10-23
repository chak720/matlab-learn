/* MATLAB Learn interpreter: a teaching subset of MATLAB that runs in the browser.
   Values: double, logical, char, string, cell and struct arrays (2-D), plus function handles.
   Language: scripts with local functions, if/elseif/else, for, while, switch, try/catch,
   break/continue/return, anonymous functions, command syntax (hold on, format long, ...).
   Plots are recorded on the interpreter (I.figs) for app.js to draw.
   Also holds the checker (runTest) so app.js and tools/selftest.js share it. */
(function(root){
"use strict";

/* ---------- errors ---------- */
class MError extends Error{constructor(msg,extra){super(msg);this.name="MError";if(extra)Object.assign(this,extra)}}
function fail(msg,extra){throw new MError(msg,extra)}

/* ---------- values ---------- */
// {t:"double"|"logical"|"char"|"string"|"cell"|"struct"|"fh", r, c, d:[column-major data], f?:[struct field names]}
const mk=(t,r,c,d)=>({t,r,c,d});
const num=x=>mk("double",1,1,[x]);
const bool=x=>mk("logical",1,1,[x?1:0]);
const EMPTY=()=>mk("double",0,0,[]);
function chr(s){s=String(s);const d=new Array(s.length);for(let i=0;i<s.length;i++)d[i]=s.charCodeAt(i);return mk("char",d.length?1:0,d.length,d)}
const sstr=s=>mk("string",1,1,[String(s)]);
const numel=v=>v.r*v.c;
const isNum=v=>v.t==="double"||v.t==="logical"||v.t==="char";
const isText=v=>v.t==="char"||v.t==="string";
const isEmptyD=v=>v.t==="double"&&v.r===0&&v.c===0;
const rowOf=(a,t="double")=>mk(t,1,a.length,a);
const colOf=(a,t="double")=>mk(t,a.length,1,a);
const newStruct=()=>({t:"struct",r:1,c:1,f:[],d:[new Map()]});
const cellOf=(vals,r,c)=>mk("cell",r===undefined?1:r,c===undefined?vals.length:c,vals);
const COLON={colon:true};
const sizeStr=v=>`${v.r}×${v.c}`;
function cls(v){return v.t==="fh"?"function_handle":v.t}
function codesToStr(d){let s="";for(let i=0;i<d.length;i++)s+=String.fromCharCode(d[i]);return s}
function charRows(v){const rows=[];for(let i=0;i<v.r;i++){let s="";for(let j=0;j<v.c;j++)s+=String.fromCharCode(v.d[i+j*v.r]);rows.push(s)}return rows}
function textOf(v,what){
  if(v.t==="char"){if(v.r>1)fail(`${what||"Text input"} must be a single row of characters.`);return codesToStr(v.d)}
  if(v.t==="string"){if(numel(v)!==1)fail(`${what||"Text input"} must be a single string, not a ${sizeStr(v)} string array.`);return v.d[0]}
  fail(`${what||"Input"} must be text (a character vector like 'abc' or a string like "abc"), not ${cls(v)}.`);
}
// list of texts from char row, string array or cell array of text
function textList(v,what){
  if(v.t==="char")return v.r<=1?[codesToStr(v.d)]:charRows(v);
  if(v.t==="string")return v.d.slice();
  if(v.t==="cell")return v.d.map(x=>textOf(x,what));
  fail(`${what||"Input"} must be text.`);
}
function numData(v,op){
  if(v.t==="double"||v.t==="logical"||v.t==="char")return v.d;
  if(op)fail(`Operator '${op}' is not supported for operands of type '${cls(v)}'.`);
  fail(`Expected a number, but got a value of type '${cls(v)}'.`);
}
function scalar(v,what){
  if(!isNum(v))fail(`${what||"Input"} must be a number, not ${cls(v)}.`);
  if(!numel(v))fail(`${what||"Input"} must not be empty.`);
  return v.d[0];
}
function toDouble(v){return mk("double",v.r,v.c,numData(v).slice())}
function truthy(v,what){
  if(v.t==="double"||v.t==="logical"||v.t==="char"){
    if(!numel(v))return false;
    for(const x of v.d){if(Number.isNaN(x))fail("NaN's cannot be converted to logicals.");if(!x)return false}
    return true;
  }
  if(v.t==="string")fail(`${what||"Conditional expression"} must be logical or numeric. To compare text, use strcmp or ==.`);
  fail(`Conversion to logical from ${cls(v)} is not possible.`);
}
function copyVal(v){const o={...v,d:v.d.slice()};if(v.f)o.f=v.f.slice();delete o.own;return o}
const unown=v=>{if(v&&v.own)v.own=false;return v};

/* ---------- lexer ---------- */
const KW=new Set("if elseif else end for parfor while break continue return function switch case otherwise try catch global persistent".split(" "));
const CMDS=new Set("hold grid format clc clear clearvars close axis figure more warning box help doc rng clf beep pkg who whos".split(" "));
function lex(src){
  const T=[];const n=src.length;const stack=[];let i=0,line=1;
  const last=()=>T[T.length-1];
  const vEnd=k=>!!k&&(k.t==="num"||k.t==="str"||k.t==="dstr"||k.t==="id"||k.t==="endv"||(k.t==="op"&&(k.v===")"||k.v==="]"||k.v==="}"||k.v==="'"||k.v===".'")));
  const add=(t,v,s)=>T.push({t,v,line,s,e:i});
  const stmtStart=()=>{const k=last();return!k||k.t==="nl"||(k.t==="op"&&(k.v===";"||k.v===","))};
  while(i<n){
    const ch=src[i],s=i;
    if(ch==="\n"){i++;add("nl","\n",s);line++;continue}
    if(ch===" "||ch==="\t"||ch==="\r"||ch==="\f"||ch==="\u00a0"){
      let j=i;while(j<n&&" \t\r\f\u00a0".includes(src[j]))j++;
      const top=stack[stack.length-1];
      if((top==="["||top==="{")&&vEnd(last())){
        const c=src[j]||"",c2=src[j+1]||"";
        if(/[A-Za-z0-9_"'(\[{@]/.test(c)||(c==="."&&/\d/.test(c2))||((c==="+"||c==="-")&&c2&&!/[\s=+\-]/.test(c2))||((c==="~"||c==="!")&&c2!=="="))
          T.push({t:"op",v:",",line,s:i,e:i,virt:true});
      }
      i=j;continue;
    }
    if(ch==="."&&src.startsWith("...",i)){while(i<n&&src[i]!=="\n")i++;if(i<n){i++;line++}continue}
    if(ch==="%"){
      const ls=src.lastIndexOf("\n",i-1)+1;let le=src.indexOf("\n",i);if(le<0)le=n;
      if(src[i+1]==="{"&&!src.slice(ls,i).trim()&&!src.slice(i+2,le).trim()){
        let depth=1,k=le;
        while(k<n&&depth){const a=k+1;let b=src.indexOf("\n",a);if(b<0)b=n;const t=src.slice(a,b).trim();if(t==="%{")depth++;else if(t==="%}")depth--;line++;k=b}
        i=k;continue;
      }
      i=le;continue;
    }
    if(/[0-9]/.test(ch)||(ch==="."&&/[0-9]/.test(src[i+1]||""))){
      const m=/^(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/.exec(src.slice(i,i+80));
      let t=m[0];
      if(t.endsWith(".")&&/[*\/\\^']/.test(src[i+t.length]||""))t=t.slice(0,-1);
      i+=t.length;add("num",parseFloat(t),s);continue;
    }
    if(/[A-Za-z_]/.test(ch)){
      let j=i+1;while(j<n&&/[A-Za-z0-9_]/.test(src[j]))j++;
      const w=src.slice(i,j);
      if(KW.has(w)){
        if(w==="end"&&stack.some(x=>x==="("||x==="{")){i=j;add("endv","end",s);continue}
        i=j;add("kw",w,s);continue;
      }
      if(CMDS.has(w)&&stack.length===0&&stmtStart()){
        let k=j;while(k<n&&(src[k]===" "||src[k]==="\t"))k++;
        if(k>j&&/[A-Za-z0-9\-']/.test(src[k]||"")){
          let e=k;while(e<n&&src[e]!=="\n"&&src[e]!==";"&&src[e]!==","&&src[e]!=="%")e++;
          const args=src.slice(k,e).trim().split(/\s+/).filter(Boolean).map(a=>a.replace(/^'(.*)'$/,"$1"));
          i=j;add("id",w,s);i=e;add("cmd",args,k);continue;
        }
      }
      i=j;add("id",w,s);continue;
    }
    if(ch==='"'){
      let j=i+1,v="";
      for(;;){if(j>=n||src[j]==="\n")fail("String is not terminated properly. Every \" needs a closing \" on the same line.",{line,parse:true});
        if(src[j]==='"'){if(src[j+1]==='"'){v+='"';j+=2;continue}break}v+=src[j++]}
      i=j+1;add("dstr",v,s);continue;
    }
    if(ch==="'"){
      if(vEnd(last())){i++;add("op","'",s);continue}
      let j=i+1,v="";
      for(;;){if(j>=n||src[j]==="\n")fail("Character vector is not terminated properly. Every ' needs a closing ' on the same line.",{line,parse:true});
        if(src[j]==="'"){if(src[j+1]==="'"){v+="'";j+=2;continue}break}v+=src[j++]}
      i=j+1;add("str",v,s);continue;
    }
    const two=src.substr(i,2);
    if(two===".'"&&vEnd(last())){i+=2;add("op",".'",s);continue}
    if([".*","./",".\\",".^","==","~=","!=","<=",">=","&&","||"].includes(two)){i+=2;add("op",two==="!="?"~=":two,s);continue}
    if("+-*/\\^()[]{},;:=<>&|~!.@".includes(ch)){
      i++;
      if(ch==="("||ch==="["||ch==="{")stack.push(ch);else if(ch===")"||ch==="]"||ch==="}")stack.pop();
      add("op",ch==="!"?"~":ch,s);continue;
    }
    if("‘’“”".includes(ch))fail("Curly quotes like ‘ ’ “ ” aren't allowed in code. Retype them as straight quotes ' or \".",{line,parse:true});
    fail(`Invalid text character "${ch}". Check for an unsupported symbol, an invisible character, or text pasted from a document.`,{line,parse:true});
  }
  add("eof",null,n);
  return T;
}

/* ---------- parser ---------- */
const MSG_EXPR="Invalid expression. Check for missing multiplication operator, missing or unbalanced delimiters, or other syntax error.";
function parse(src){
  const T=lex(src);let p=0;
  const tk=()=>T[p];
  const peek=o=>T[p+o]||T[T.length-1];
  const isOp=v=>T[p].t==="op"&&T[p].v===v;
  const isKw=v=>T[p].t==="kw"&&T[p].v===v;
  const next=()=>T[p++];
  const perr=(msg,k)=>fail(msg,{line:(k||T[p]).line,parse:true});
  const expectOp=(v,msg)=>{if(!isOp(v))perr(msg||(v===")"?"Invalid expression. When calling a function or indexing a variable, use parentheses. Otherwise, check for mismatched delimiters.":MSG_EXPR));return next()};
  const skipNl=()=>{while(T[p].t==="nl")p++};
  const skipSeps=()=>{while(T[p].t==="nl"||isOp(";")||isOp(","))p++};
  const expectId=()=>{if(T[p].t!=="id")perr(T[p].t==="kw"?`"${T[p].v}" is a reserved word, so it can't be used as a name.`:MSG_EXPR);return next().v};
  const missingEnd=start=>perr(`At least one END is missing: the "${start.v}" on line ${start.line} has no matching end.`,start);

  function program(){
    const body=[],funcs={};let sawFunc=false;
    for(;;){
      skipSeps();
      if(tk().t==="eof")break;
      if(isKw("function")){const f=func();if(funcs[f.name])perr(`Function "${f.name}" is defined more than once.`);funcs[f.name]=f;sawFunc=true;continue}
      if(sawFunc)perr("Function definitions in a script must appear at the end of the file. Move all statements before the first function definition.");
      body.push(statement());
    }
    return{body,funcs};
  }
  function block(ends){
    const out=[];
    for(;;){skipSeps();const k=tk();
      if(k.t==="eof")return out;
      if(k.t==="kw"&&(ends.includes(k.v)||k.v==="function"))return out;
      out.push(statement());
    }
  }
  function endStmt(){
    if(isOp(";")){next();return false}
    if(isOp(",")||tk().t==="nl"){next();return true}
    if(tk().t==="eof")return true;
    const k=tk();
    if(k.t==="kw"&&["end","else","elseif","case","otherwise","catch"].includes(k.v))return true;
    if(isOp("="))perr("Incorrect use of '=' operator. To assign a value to a variable, use '='. To compare values for equality, use '=='.");
    if(k.t==="id"||k.t==="num")perr(`${MSG_EXPR} (Unexpected "${src.slice(k.s,k.e)}" here. Did you leave out an operator such as * or a comma?)`);
    perr(MSG_EXPR);
  }
  function findAssign(){
    let d=0;
    for(let k=p;k<T.length;k++){const t=T[k];
      if(t.t==="eof")return -1;
      if(t.t==="op"){
        if(t.v==="("||t.v==="["||t.v==="{")d++;
        else if(t.v===")"||t.v==="]"||t.v==="}")d--;
        else if(d===0&&(t.v===";"||t.v===","))return -1;
        else if(d===0&&t.v==="=")return k;
      }
      if(t.t==="nl"&&d<=0)return -1;
      if(t.t==="kw"&&d<=0)return -1;
    }
    return -1;
  }
  function statement(){
    const k=tk();const line=k.line;
    if(k.t==="kw"){
      switch(k.v){
        case "if":return ifStmt();
        case "for":case "parfor":return forStmt();
        case "while":return whileStmt();
        case "switch":return switchStmt();
        case "try":return tryStmt();
        case "break":case "continue":case "return":next();endStmt();return{k:k.v,line};
        case "global":case "persistent":next();while(tk().t==="id")next();endStmt();return{k:"nop",line};
        case "end":perr('Illegal use of reserved keyword "end". There may be an extra end, or an if, for or while missing above it.');
        case "else":case "elseif":perr(`"${k.v}" needs an "if" above it.`);
        case "case":case "otherwise":perr(`"${k.v}" needs a "switch" above it.`);
        case "catch":perr('"catch" needs a "try" above it.');
      }
    }
    if(k.t==="id"&&peek(1).t==="cmd"){next();const args=next().v;const show=endStmt();return{k:"cmd",name:k.v,args,show,line}}
    const eq=findAssign();
    if(eq>=0){
      if(isOp("[")){
        next();const lhs=[];
        while(!isOp("]")){
          if(isOp(",")){next();continue}
          if(isOp("~")){next();lhs.push(null);continue}
          lhs.push(lvalue());
        }
        next();expectOp("=");const e=expr();const show=endStmt();
        return{k:"massign",lhs,e,show,line};
      }
      if(k.t!=="id"){
        if(k.t==="num"&&peek(1).t==="id")perr(`Variable names must start with a letter, so "${src.slice(k.s,peek(1).e)}" isn't a valid name. Try something like x${peek(1).v} or ${peek(1).v}${k.v}.`);
        perr(MSG_EXPR);
      }
      const lhs=lvalue();
      if(!isOp("=")){
        if(tk().t==="id")perr(`Variable names can't contain spaces. Join the words, for example ${lhs.name}_${tk().v} or ${lhs.name}${tk().v[0].toUpperCase()+tk().v.slice(1)}.`);
        perr(MSG_EXPR);
      }
      next();
      if(tk().t==="nl"||tk().t==="eof"||isOp(";"))perr("Expression or statement is incomplete: there's nothing after the =.");
      const e=expr();const show=endStmt();
      return{k:"assign",lhs,e,show,line};
    }
    const e=expr();const show=endStmt();
    return{k:"expr",e,show,line};
  }
  function lvalue(){
    const name=expectId();const chain=[];
    for(;;){
      if(isOp("(")){next();chain.push({k:"paren",args:args(")")})}
      else if(isOp("{")){next();chain.push({k:"brace",args:args("}")})}
      else if(isOp(".")&&peek(1).t==="id"){next();chain.push({k:"field",name:next().v})}
      else if(isOp(".")&&peek(1).t==="op"&&peek(1).v==="("){next();next();const e=expr();expectOp(")");chain.push({k:"dyn",e})}
      else break;
    }
    return{name,chain};
  }
  function ifStmt(){
    const start=next();const conds=[];let els=null;
    let c=expr();if(isOp("="))perr("Incorrect use of '=' operator. To assign a value to a variable, use '='. To compare values for equality, use '=='.");
    conds.push([c,block(["elseif","else","end"])]);
    for(;;){
      if(isKw("elseif")){next();c=expr();if(isOp("="))perr("Incorrect use of '=' operator. To compare values for equality, use '=='.");conds.push([c,block(["elseif","else","end"])])}
      else if(isKw("else")){next();els=block(["end"]);if(!isKw("end"))missingEnd(start);next();break}
      else if(isKw("end")){next();break}
      else missingEnd(start);
    }
    return{k:"if",conds,els,line:start.line};
  }
  function forStmt(){
    const start=next();let paren=false;
    if(isOp("(")){paren=true;next()}
    const v=lvalue();
    if(!isOp("="))perr("A for loop needs the form: for i = 1:10");
    next();const e=expr();if(paren)expectOp(")");
    const body=block(["end"]);if(!isKw("end"))missingEnd(start);next();
    return{k:"for",v,e,body,line:start.line};
  }
  function whileStmt(){
    const start=next();const cond=expr();
    if(isOp("="))perr("Incorrect use of '=' operator. To compare values for equality, use '=='.");
    const body=block(["end"]);if(!isKw("end"))missingEnd(start);next();
    return{k:"while",cond,body,line:start.line};
  }
  function switchStmt(){
    const start=next();const e=expr();const cases=[];let other=null;
    skipSeps();
    for(;;){
      if(isKw("case")){next();const ce=expr();cases.push([ce,block(["case","otherwise","end"])])}
      else if(isKw("otherwise")){next();other=block(["case","otherwise","end"])}
      else if(isKw("end")){next();break}
      else missingEnd(start);
    }
    return{k:"switch",e,cases,other,line:start.line};
  }
  function tryStmt(){
    const start=next();const body=block(["catch","end"]);let id=null,cbody=[];
    if(isKw("catch")){const c=next();if(tk().t==="id"&&tk().line===c.line&&!(peek(1).t==="op"&&["(","=","."].includes(peek(1).v)))id=next().v;cbody=block(["end"])}
    if(!isKw("end"))missingEnd(start);next();
    return{k:"try",body,id,cbody,line:start.line};
  }
  function func(){
    const start=next();let outs=[],name,params=[];
    if(isOp("[")){next();while(!isOp("]")){if(tk().t==="id")outs.push(next().v);else if(isOp(","))next();else perr("Invalid function definition. It should look like: function [a, b] = name(x, y)")}next();expectOp("=");name=expectId()}
    else{const a=expectId();if(isOp("=")){next();outs=[a];name=expectId()}else name=a}
    if(isOp("(")){next();while(!isOp(")")){if(tk().t==="id")params.push(next().v);else if(isOp("~")){next();params.push("~")}else if(isOp(","))next();else perr("Invalid function definition. Inputs go in brackets, separated by commas: function y = name(a, b)")}next()}
    const body=block(["end"]);if(isKw("end"))next();
    return{name,params,outs,body,line:start.line};
  }
  function args(close){
    const out=[];skipNl();
    if(isOp(close)){next();return out}
    for(;;){
      skipNl();
      if(isOp(":")&&peek(1).t==="op"&&(peek(1).v===","||peek(1).v===close)){next();out.push({k:"colon"})}
      else out.push(expr());
      skipNl();
      if(isOp(",")){next();continue}
      if(isOp(close)){next();return out}
      if(isOp("="))perr("Incorrect use of '=' operator. To compare values for equality, use '=='. Inside a function call, name-value options are written as 'Name', value.");
      perr("Invalid expression. When calling a function or indexing a variable, use parentheses. Otherwise, check for mismatched delimiters.");
    }
  }
  const expr=()=>orOr();
  function bin(next_,ops){return function(){let a=next_();while(T[p].t==="op"&&ops.includes(T[p].v)){const op=next().v;a={k:"bin",op,a,b:next_()}}return a}}
  function cmp(){let a=range();while(T[p].t==="op"&&["==","~=","<","<=",">",">="].includes(T[p].v)){const op=next().v;a={k:"bin",op,a,b:range()}}return a}
  const andE=bin(cmp,["&"]),orE=bin(andE,["|"]),andAnd=bin(orE,["&&"]),orOr=bin(andAnd,["||"]);
  function range(){
    const a=add();
    if(isOp(":")&&!(peek(1).t==="op"&&[")",",","}"].includes(peek(1).v))){
      next();const b=add();
      if(isOp(":")){next();const c=add();return{k:"range",a,s:b,b:c}}
      return{k:"range",a,b};
    }
    return a;
  }
  function add(){let a=mul();while(isOp("+")||isOp("-")){const op=next().v;a={k:"bin",op,a,b:mul()}}return a}
  function mul(){let a=unary();while(T[p].t==="op"&&["*","/","\\",".*","./",".\\"].includes(T[p].v)){const op=next().v;a={k:"bin",op,a,b:unary()}}return a}
  function unary(){if(isOp("-")||isOp("+")||isOp("~")){const op=next().v;return{k:"un",op,a:unary()}}return pow()}
  function pow(){let a=postfix();while(isOp("^")||isOp(".^")){const op=next().v;a={k:"bin",op,a,b:powOperand()}}return a}
  function powOperand(){if(isOp("-")||isOp("+")||isOp("~")){const op=next().v;return{k:"un",op,a:powOperand()}}return postfix()}
  function postfix(){
    let a=primary();
    for(;;){
      if(isOp("(")&&!T[p].spaced){
        if(!["id","field","dyn","cellindex","index"].includes(a.k))perr("Invalid expression. Indexing with parentheses has to come straight after a variable name.");
        next();a={k:"index",obj:a,args:args(")")};
      }
      else if(isOp("{")){next();a={k:"cellindex",obj:a,args:args("}")}}
      else if(isOp(".")&&peek(1).t==="id"){next();a={k:"field",obj:a,name:next().v}}
      else if(isOp(".")&&peek(1).t==="op"&&peek(1).v==="("){next();next();const e=expr();expectOp(")");a={k:"dyn",obj:a,e}}
      else if(isOp("'")||isOp(".'")){next();a={k:"tr",a}}
      else break;
    }
    return a;
  }
  function primary(){
    const k=tk();
    if(k.t==="num"){next();return{k:"num",v:k.v}}
    if(k.t==="str"){next();return{k:"str",v:k.v}}
    if(k.t==="dstr"){next();return{k:"dstr",v:k.v}}
    if(k.t==="id"){next();return{k:"id",name:k.v}}
    if(k.t==="endv"){next();return{k:"end"}}
    if(k.t==="op"){
      if(k.v==="("){next();skipNl();const e=expr();skipNl();expectOp(")");return{k:"paren",e}}
      if(k.v==="["||k.v==="{")return matrix(k.v);
      if(k.v==="@"){
        next();
        if(isOp("(")){
          next();const params=[];
          while(!isOp(")")){if(tk().t==="id")params.push(next().v);else if(isOp("~")){next();params.push("~")}else if(isOp(","))next();else perr("Invalid anonymous function. It should look like @(x) x.^2")}
          next();const bs=tk().s;const body=expr();const be=T[p-1].e;
          return{k:"anon",params,body,text:`@(${params.join(",")})${squash(src.slice(bs,be))}`};
        }
        return{k:"fh",name:expectId()};
      }
      if(k.v===")"||k.v==="]"||k.v==="}")perr("Invalid expression. When calling a function or indexing a variable, use parentheses. Otherwise, check for mismatched delimiters.");
      if(k.v==="=")perr("Incorrect use of '=' operator. To assign a value to a variable, use '='. To compare values for equality, use '=='.");
    }
    if(k.t==="kw")perr(k.v==="end"?"\"end\" can only be used inside an index like x(end), or to close an if, for, while or function.":`"${k.v}" can't be used here. It's a reserved word.`);
    if(k.t==="eof"||k.t==="nl")perr("Expression or statement is incomplete or incorrect.");
    perr(MSG_EXPR);
  }
  function matrix(open){
    const close=open==="["?"]":"}";const start=next();const rows=[];let row=[];
    for(;;){
      if(isOp(close)){next();break}
      if(isOp(";")||tk().t==="nl"){next();if(row.length)rows.push(row);row=[];continue}
      if(isOp(",")){next();continue}
      if(tk().t==="eof")perr(`A "${open}" was opened here but never closed with "${close}".`,start);
      row.push(expr());
      if(!(isOp(",")||isOp(";")||tk().t==="nl"||isOp(close))){
        if(isOp(")")||isOp("]")||isOp("}"))perr(`Mismatched brackets: expected "${close}" to close the "${open}".`);
        perr(MSG_EXPR);
      }
    }
    if(row.length)rows.push(row);
    return{k:open==="["?"matrix":"cell",rows};
  }
  // mark "(" tokens that follow whitespace inside [ ] so [a (1)] isn't read as indexing
  for(let k=1;k<T.length;k++)if(T[k].t==="op"&&T[k].v==="("&&T[k-1].virt)T[k].spaced=true;
  return program();
}
function squash(s){let out="",q=null;for(let i=0;i<s.length;i++){const c=s[i];if(q){out+=c;if(c===q)q=null;continue}if(c==='"'||(c==="'"&&!/[\w)\]}'.]/.test(s[i-1]||"")))q=c;if(/\s/.test(c))continue;out+=c}return out}

/* ---------- indexing ---------- */
function idxList(a,len,pos,nargs,forAssign){
  if(a===COLON){const r=new Array(len);for(let i=0;i<len;i++)r[i]=i;return r}
  const where=nargs>1?`Index in position ${pos} is invalid. `:"";
  if(a.t==="logical"){
    const out=[];for(let i=0;i<a.d.length;i++)if(a.d[i]){if(i>=len&&!forAssign)fail(nargs>1?`Index in position ${pos} exceeds array bounds. Index must not exceed ${len}.`:`The logical index has ${a.d.length} elements but the array only has ${len}. Index must not exceed ${len}.`);out.push(i)}
    return out;
  }
  if(a.t==="double"||a.t==="char"){
    const out=new Array(a.d.length);
    for(let i=0;i<a.d.length;i++){const x=a.d[i];
      if(!(x>=1&&Number.isInteger(x)))fail(`${where}Array indices must be positive integers or logical values.${x===0?" (MATLAB counts from 1, so the first element is x(1), not x(0).)":Number.isInteger(x)?"":" ("+fmtShortNum(x)+" isn't a whole number.)"}`);
      out[i]=x-1;
    }
    return out;
  }
  fail(`${where}Array indices must be positive integers or logical values, not ${cls(a)}.`);
}
function index(v,args){
  const n=args.length;
  if(n===0)return v;
  if(v.t==="fh")fail("Use parentheses to call a function handle, for example f(2).");
  const base=d=>{const o=mk(v.t,0,0,d);if(v.f)o.f=v.f.slice();return o};
  if(n===1){
    const a=args[0],N=numel(v);
    const ids=idxList(a,N,1,1);
    for(const k of ids)if(k>=N)fail(N?`Index exceeds the number of array elements. Index must not exceed ${N}.`:"Index exceeds the number of array elements. The array is empty.");
    const d=ids.map(k=>v.d[k]);const o=base(d);
    if(a===COLON){o.r=d.length;o.c=1}
    else if(a.t==="logical"){if(v.r===1&&N>0){o.r=1;o.c=d.length}else{o.r=d.length;o.c=1}}
    else if((a.r===1||a.c===1)&&(v.r===1||v.c===1)&&N>1){if(v.r===1){o.r=1;o.c=d.length}else{o.r=d.length;o.c=1}}
    else{o.r=a.r;o.c=a.c}
    return o;
  }
  for(let k=2;k<n;k++){const ids=idxList(args[k],1,k+1,n);for(const x of ids)if(x>0)fail(`Index in position ${k+1} exceeds array bounds. Index must not exceed 1.`)}
  const R=idxList(args[0],v.r,1,n),C=idxList(args[1],v.c,2,n);
  for(const x of R)if(x>=v.r)fail(`Index in position 1 exceeds array bounds. Index must not exceed ${v.r}.`);
  for(const x of C)if(x>=v.c)fail(`Index in position 2 exceeds array bounds. Index must not exceed ${v.c}.`);
  const d=new Array(R.length*C.length);
  for(let j=0;j<C.length;j++)for(let i=0;i<R.length;i++)d[i+j*R.length]=v.d[R[i]+C[j]*v.r];
  const o=base(d);o.r=R.length;o.c=C.length;return o;
}
function fillFor(t){return t==="cell"?()=>EMPTY():t==="string"?()=>"":t==="struct"?null:()=>0}
function convertForAssign(v,rhs){
  // returns {t, data:[...]} with rhs converted to v's type
  const t=v.t;
  if(t==="cell"){if(rhs.t!=="cell")fail(`Conversion to cell from ${cls(rhs)} is not possible. Use curly braces to put a value inside a cell: c{2} = value.`);return rhs.d}
  if(t==="struct"){if(rhs.t!=="struct")fail(`Conversion to struct from ${cls(rhs)} is not possible.`);return rhs.d}
  if(t==="string"){
    if(rhs.t==="string")return rhs.d;
    if(rhs.t==="char")return rhs.r<=1?[codesToStr(rhs.d)]:charRows(rhs);
    if(isNum(rhs))return rhs.d.map(x=>numToString(x));
    if(rhs.t==="cell")return rhs.d.map(x=>textOf(x));
    fail(`Conversion to string from ${cls(rhs)} is not possible.`);
  }
  if(isNum(v)){
    if(rhs.t==="cell")fail(`Conversion to ${t} from cell is not possible. To get a value out of a cell, use curly braces: c{2}.`);
    if(rhs.t==="string")fail(`Conversion to ${t} from string is not possible.`);
    if(!isNum(rhs))fail(`Conversion to ${t} from ${cls(rhs)} is not possible.`);
    if(t==="logical")return rhs.d.map(x=>{if(Number.isNaN(x))fail("NaN's cannot be converted to logicals.");return x?1:0});
    return rhs.d;
  }
  fail(`Unable to perform assignment into a ${cls(v)}.`);
}
function indexAssign(v,args,rhs){
  if(v===undefined)v=rhs.t==="cell"?mk("cell",0,0,[]):rhs.t==="struct"?{t:"struct",r:0,c:0,f:rhs.f.slice(),d:[]}:rhs.t==="string"?mk("string",0,0,[]):EMPTY();
  if(isEmptyD(rhs)&&!(v.t==="cell"&&rhs.cellwrap))return deleteElems(v,args);
  if(v.t==="double"&&numel(v)===0&&rhs.t!=="double"){
    v=rhs.t==="struct"?{t:"struct",r:v.r,c:v.c,f:rhs.f.slice(),d:[]}:mk(rhs.t==="fh"?"cell":rhs.t,v.r,v.c,[]);
    if(rhs.t==="fh")fail("Function handles can't be stored in arrays. Use a cell array: c{1} = @sin.");
  }
  if(v.t==="fh")fail("Indexing into a function handle isn't allowed. Use f(x) to call it.");
  if(v.own!==true)v=copyVal(v);
  if(v.t==="struct"&&rhs.t==="struct"){
    for(const f of rhs.f)if(!v.f.includes(f)){v.f.push(f);v.d=v.d.map(m=>{const mm=new Map(m);mm.set(f,EMPTY());return mm})}
    if(rhs.f.length<v.f.length||rhs.f.some(f=>!v.f.includes(f))){rhs={...rhs,d:rhs.d.map(m=>{const mm=new Map();for(const f of v.f)mm.set(f,m.has(f)?m.get(f):EMPTY());return mm})}}
  }
  const R=convertForAssign(v,rhs);const rn=R.length;
  const fill=v.t==="struct"?()=>{const m=new Map();for(const f of v.f)m.set(f,EMPTY());return m}:fillFor(v.t);
  const n=args.length;
  if(n===1){
    const a=args[0];const N=numel(v);
    const ids=idxList(a,N,1,1,true);
    if(rn!==1&&rn!==ids.length)fail(`Unable to perform assignment because the left and right sides have a different number of elements. The left side has ${ids.length} and the right side has ${rn}.`);
    let mx=-1;for(const k of ids)if(k>mx)mx=k;
    if(mx>=N){
      if(N===0&&v.r===0&&v.c===0){v.r=1;v.c=0}
      if(v.r===1){for(let k=v.c;k<=mx;k++)v.d.push(fill());v.c=mx+1}
      else if(v.c===1){for(let k=v.r;k<=mx;k++)v.d.push(fill());v.r=mx+1}
      else if(N===0){for(let k=0;k<=mx;k++)v.d.push(fill());v.r=1;v.c=mx+1}
      else fail("Attempt to grow array along ambiguous dimension. A matrix can't grow from a single index; use A(row, col) = value instead.");
    }
    for(let i=0;i<ids.length;i++)v.d[ids[i]]=R[rn===1?0:i];
    v.own=true;return v;
  }
  for(let k=2;k<n;k++){const ids=idxList(args[k],1,k+1,n,true);for(const x of ids)if(x>0)fail("This site only supports 2-D arrays (rows and columns).")}
  const rd=a=>a===COLON&&v.r===0?(rn===1?1:rhs.r):null,cd=a=>a===COLON&&v.c===0?(rn===1?1:rhs.c):null;
  let Rr=rd(args[0]),Cc=cd(args[1]);
  const Ri=Rr!==null?[...Array(Rr).keys()]:idxList(args[0],v.r,1,n,true);
  const Ci=Cc!==null?[...Array(Cc).keys()]:idxList(args[1],v.c,2,n,true);
  const cnt=Ri.length*Ci.length;
  if(rn!==1&&rn!==cnt)fail(`Unable to perform assignment because the size of the left side is ${Ri.length}×${Ci.length} and the size of the right side is ${sizeStr(rhs)}.`);
  let nr=v.r,nc=v.c;for(const x of Ri)if(x+1>nr)nr=x+1;for(const x of Ci)if(x+1>nc)nc=x+1;
  if(nr!==v.r||nc!==v.c){
    const d=new Array(nr*nc);
    for(let j=0;j<nc;j++)for(let i=0;i<nr;i++)d[i+j*nr]=(i<v.r&&j<v.c)?v.d[i+j*v.r]:fill();
    v.d=d;v.r=nr;v.c=nc;
  }
  let q=0;for(let j=0;j<Ci.length;j++)for(let i=0;i<Ri.length;i++){v.d[Ri[i]+Ci[j]*v.r]=R[rn===1?0:q];q++}
  v.own=true;return v;
}
function deleteElems(v,args){
  const n=args.length;
  const out=d=>{const o=mk(v.t,0,0,d);if(v.f)o.f=v.f.slice();return o};
  if(n===1){
    if(args[0]===COLON){const o=out([]);return o}
    const N=numel(v);const ids=idxList(args[0],N,1,1);
    for(const k of ids)if(k>=N)fail(`Index exceeds the number of array elements. Index must not exceed ${N}.`);
    const del=new Set(ids);const d=v.d.filter((_,k)=>!del.has(k));const o=out(d);
    if(v.c===1&&v.r!==1){o.r=d.length;o.c=1}else{o.r=d.length?1:(v.r===1?1:0);o.c=d.length}
    if(!d.length&&v.r!==1&&v.c!==1){o.r=1;o.c=0}
    return o;
  }
  const full=(a,len)=>a===COLON||(()=>{try{const ids=idxList(a,len,1,2);return new Set(ids).size===len&&ids.every(x=>x<len)}catch(e){return false}})();
  if(full(args[0],v.r)){
    const del=new Set(idxList(args[1],v.c,2,2));for(const x of del)if(x>=v.c)fail(`Index in position 2 exceeds array bounds. Index must not exceed ${v.c}.`);
    const keep=[...Array(v.c).keys()].filter(j=>!del.has(j));const d=[];for(const j of keep)for(let i=0;i<v.r;i++)d.push(v.d[i+j*v.r]);
    const o=out(d);o.r=v.r;o.c=keep.length;return o;
  }
  if(full(args[1],v.c)){
    const del=new Set(idxList(args[0],v.r,1,2));for(const x of del)if(x>=v.r)fail(`Index in position 1 exceeds array bounds. Index must not exceed ${v.r}.`);
    const keep=[...Array(v.r).keys()].filter(i=>!del.has(i));const d=[];for(let j=0;j<v.c;j++)for(const i of keep)d.push(v.d[i+j*v.r]);
    const o=out(d);o.r=keep.length;o.c=v.c;return o;
  }
  fail("A null assignment can have only one non-colon index. To delete a row use A(2,:) = []; to delete a column use A(:,2) = [].");
}

/* ---------- concatenation ---------- */
function catType(vals){
  if(vals.some(v=>v.t==="string"))return"string";
  if(vals.some(v=>v.t==="cell"))return"cell";
  if(vals.some(v=>v.t==="struct"))return"struct";
  if(vals.some(v=>v.t==="fh"))fail("Function handles can't be put in an array with [ ]. Use a cell array: {@sin, @cos}.");
  if(vals.some(v=>v.t==="char"))return"char";
  if(vals.length&&vals.every(v=>v.t==="logical"))return"logical";
  return"double";
}
function asType(v,t){
  if(v.t===t)return v;
  if(t==="string"){
    if(v.t==="char")return v.r<=1?mk("string",1,1,[codesToStr(v.d)]):mk("string",v.r,1,charRows(v));
    if(isNum(v))return mk("string",v.r,v.c,v.d.map(x=>v.t==="logical"?(x?"true":"false"):numToString(x)));
    if(v.t==="cell")return mk("string",v.r,v.c,v.d.map(x=>textOf(x)));
  }
  if(t==="char"&&isNum(v))return mk("char",v.r,v.c,v.d.map(x=>Math.max(0,Math.floor(x))));
  if(t==="double"&&isNum(v))return mk("double",v.r,v.c,v.d);
  if(t==="cell")fail(`Can't join a cell array with a ${cls(v)} using [ ]. Put the value in braces first: [c, {value}].`);
  if(t==="struct")fail("Can't join a struct with a value of another type.");
  fail(`Can't join ${cls(v)} values with ${t} values.`);
}
function horzcat(vals){
  const t=catType(vals);
  let vs=vals.filter(v=>!(v.r===0&&v.c===0)&&!(v.t==="char"&&numel(v)===0&&t!=="char"));
  if(!vs.length){const e=mk(t==="struct"?"struct":t,0,0,[]);if(t==="struct")e.f=[];if(t==="char"&&vals.some(v=>v.t==="char"&&v.r===1)){e.r=1}return e}
  vs=vs.map(v=>asType(v,t));
  const r=vs[0].r;
  for(const v of vs)if(v.r!==r)fail(`Dimensions of arrays being concatenated are not consistent. Side by side ( [a b] ) needs the same number of rows, but one part has ${r} and another has ${v.r}.`);
  if(t==="struct"){const f=[];for(const v of vs)for(const x of v.f)if(!f.includes(x))f.push(x);const d=[];for(const v of vs)for(const m of v.d){const mm=new Map();for(const x of f)mm.set(x,m.has(x)?m.get(x):EMPTY());d.push(mm)}const o={t:"struct",r,c:0,f,d};o.c=d.length/r;return o}
  const d=[];let c=0;for(const v of vs){for(const x of v.d)d.push(x);c+=v.c}
  return mk(t,r,c,d);
}
function vertcat(vals){
  const t=catType(vals);
  let vs=vals.filter(v=>!(v.r===0&&v.c===0));
  if(!vs.length){const e=mk(t,0,0,[]);if(t==="struct")e.f=[];return e}
  vs=vs.map(v=>asType(v,t));
  const c=vs[0].c;
  for(const v of vs)if(v.c!==c){
    if(t==="char")fail("Dimensions of arrays being concatenated are not consistent. Rows of a char array must all be the same length. Use strings (\"...\") or a cell array {'...'} for text of different lengths.");
    fail(`Dimensions of arrays being concatenated are not consistent. Stacking ( [a; b] ) needs the same number of columns, but one row has ${c} and another has ${v.c}.`);
  }
  let r=0;for(const v of vs)r+=v.r;
  const d=new Array(r*c);let off=0;
  for(const v of vs){for(let j=0;j<c;j++)for(let i=0;i<v.r;i++)d[off+i+j*r]=v.d[i+j*v.r];off+=v.r}
  const o=mk(t,r,c,d);
  if(t==="struct"){const f=[];for(const v of vs)for(const x of v.f)if(!f.includes(x))f.push(x);o.f=f;o.d=d.map(m=>{const mm=new Map();for(const x of f)mm.set(x,m.has(x)?m.get(x):EMPTY());return mm})}
  return o;
}

/* ---------- arithmetic ---------- */
function bcast(a,b,f,t,op){
  if(a.t==="string"||b.t==="string")return stringOp(a,b,op);
  const A=numData(a,op),B=numData(b,op);
  const na=A.length,nb=B.length;
  if(na===1&&nb===1)return mk(t,1,1,[f(A[0],B[0])]);
  if(a.r===b.r&&a.c===b.c){const d=new Array(na);for(let i=0;i<na;i++)d[i]=f(A[i],B[i]);return mk(t,a.r,a.c,d)}
  if(na===1){const x=A[0],d=new Array(nb);for(let i=0;i<nb;i++)d[i]=f(x,B[i]);return mk(t,b.r,b.c,d)}
  if(nb===1){const y=B[0],d=new Array(na);for(let i=0;i<na;i++)d[i]=f(A[i],y);return mk(t,a.r,a.c,d)}
  if((a.r===b.r||a.r===1||b.r===1)&&(a.c===b.c||a.c===1||b.c===1)){
    const r=Math.max(a.r,b.r),c=Math.max(a.c,b.c);if(a.r===0||b.r===0||a.c===0||b.c===0)return mk(t,a.r===0||b.r===0?0:r,a.c===0||b.c===0?0:c,[]);
    const d=new Array(r*c);
    for(let j=0;j<c;j++)for(let i=0;i<r;i++)d[i+j*r]=f(A[(a.r===1?0:i)+(a.c===1?0:j)*a.r],B[(b.r===1?0:i)+(b.c===1?0:j)*b.r]);
    return mk(t,r,c,d);
  }
  fail(`Arrays have incompatible sizes for this operation. The left side is ${sizeStr(a)} and the right side is ${sizeStr(b)}.${op==="=="&&a.t==="char"&&b.t==="char"?" To compare text of different lengths, use strcmp(a, b).":""}`);
}
function stringOp(a,b,op){
  const S=v=>v.t==="string"?v:asType(v.t==="cell"?v:v,"string");
  if(a.t==="cell"||b.t==="cell")fail(`Operator '${op}' is not supported for operands of type 'cell'.`);
  const A=S(a),B=S(b);
  const f={"+":(x,y)=>x+y,"==":(x,y)=>x===y,"~=":(x,y)=>x!==y,"<":(x,y)=>x<y,">":(x,y)=>x>y,"<=":(x,y)=>x<=y,">=":(x,y)=>x>=y}[op];
  if(!f)fail(`Operator '${op}' is not supported for operands of type 'string'.${op==="*"||op==="-"?"":""}`);
  const t=op==="+"?"string":"logical";
  const g=op==="+"?f:(x,y)=>f(x,y)?1:0;
  const na=numel(A),nb=numel(B);
  if(na===1)return mk(t,B.r,B.c,B.d.map(y=>g(A.d[0],y)));
  if(nb===1)return mk(t,A.r,A.c,A.d.map(x=>g(x,B.d[0])));
  if(A.r===B.r&&A.c===B.c)return mk(t,A.r,A.c,A.d.map((x,i)=>g(x,B.d[i])));
  fail("Arrays have incompatible sizes for this operation.");
}
const ARITH={
  "+":(x,y)=>x+y,"-":(x,y)=>x-y,".*":(x,y)=>x*y,"./":(x,y)=>x/y,".\\":(x,y)=>y/x,".^":(x,y)=>Math.pow(x,y),
};
const CMP={"==":(x,y)=>x===y?1:0,"~=":(x,y)=>x!==y?1:0,"<":(x,y)=>x<y?1:0,"<=":(x,y)=>x<=y?1:0,">":(x,y)=>x>y?1:0,">=":(x,y)=>x>=y?1:0};
function logicalOp(a,b,op){
  const nanCheck=x=>{if(Number.isNaN(x))fail("NaN's cannot be converted to logicals.");return x};
  if(op==="&")return bcast(a,b,(x,y)=>(nanCheck(x)&&nanCheck(y))?1:0,"logical",op);
  return bcast(a,b,(x,y)=>(nanCheck(x)||nanCheck(y))?1:0,"logical",op);
}
function matmul(a,b){
  const A=numData(a,"*"),B=numData(b,"*");
  if(numel(a)===1||numel(b)===1)return bcast(a,b,(x,y)=>x*y,"double","*");
  if(a.c!==b.r)fail(`Incorrect dimensions for matrix multiplication. Check that the number of columns in the first matrix matches the number of rows in the second matrix. (Here ${sizeStr(a)} * ${sizeStr(b)}.) To multiply each element by the matching element, use .* instead.`);
  const r=a.r,c=b.c,k=a.c,d=new Array(r*c).fill(0);
  for(let j=0;j<c;j++)for(let i=0;i<r;i++){let s=0;for(let q=0;q<k;q++)s+=A[i+q*r]*B[q+j*k];d[i+j*r]=s}
  return mk("double",r,c,d);
}
function transpose(v){
  const d=new Array(v.d.length);
  for(let i=0;i<v.r;i++)for(let j=0;j<v.c;j++)d[j+i*v.c]=v.d[i+j*v.r];
  const o=mk(v.t,v.c,v.r,d);if(v.f)o.f=v.f.slice();return o;
}
function toMat(v){const A=numData(v);const M=[];for(let i=0;i<v.r;i++){const row=[];for(let j=0;j<v.c;j++)row.push(A[i+j*v.r]);M.push(row)}return M}
function fromMat(M,r,c){const d=new Array(r*c);for(let i=0;i<r;i++)for(let j=0;j<c;j++)d[i+j*r]=M[i][j];return mk("double",r,c,d)}
function solve(Am,Bm,n,m,I){ // square solve with partial pivoting: A (n×n) X = B (n×m)
  const A=Am.map(r=>r.slice()),B=Bm.map(r=>r.slice());let sing=false;
  for(let k=0;k<n;k++){
    let piv=k;for(let i=k+1;i<n;i++)if(Math.abs(A[i][k])>Math.abs(A[piv][k]))piv=i;
    if(Math.abs(A[piv][k])<1e-14){sing=true;continue}
    [A[k],A[piv]]=[A[piv],A[k]];[B[k],B[piv]]=[B[piv],B[k]];
    for(let i=k+1;i<n;i++){const f=A[i][k]/A[k][k];if(!f)continue;for(let j=k;j<n;j++)A[i][j]-=f*A[k][j];for(let j=0;j<m;j++)B[i][j]-=f*B[k][j]}
  }
  if(sing&&I)I.warn("Matrix is singular to working precision.");
  const X=Array.from({length:n},()=>new Array(m).fill(0));
  for(let j=0;j<m;j++)for(let i=n-1;i>=0;i--){let s=B[i][j];for(let q=i+1;q<n;q++)s-=A[i][q]*X[q][j];X[i][j]=s/A[i][i]}
  return X;
}
function mldivide(a,b,I){
  if(numel(a)===1)return bcast(a,b,(x,y)=>y/x,"double","\\");
  if(a.r!==b.r)fail(`Matrix dimensions must agree. For A\\b, A and b need the same number of rows (here ${a.r} and ${b.r}).`);
  if(a.r!==a.c){ // least squares via normal equations
    const AtA=matmul(transpose(a),a),Atb=matmul(transpose(a),b);
    return fromMat(solve(toMat(AtA),toMat(Atb),a.c,b.c,I),a.c,b.c);
  }
  return fromMat(solve(toMat(a),toMat(b),a.r,b.c,I),a.r,b.c);
}
function mrdivide(a,b,I){
  if(numel(b)===1)return bcast(a,b,(x,y)=>x/y,"double","/");
  return transpose(mldivide(transpose(b),transpose(a),I));
}
function mpower(a,b,I){
  if(numel(a)===1&&numel(b)===1)return bcast(a,b,(x,y)=>Math.pow(x,y),"double","^");
  if(a.r===a.c&&numel(b)===1&&Number.isInteger(scalar(b))){
    let k=scalar(b);let base=k<0?inv(a,I):toDouble(a);k=Math.abs(k);
    let res=eye(a.r);while(k){if(k&1)res=matmul(res,base);base=matmul(base,base);k>>=1}return res;
  }
  fail(`Incorrect dimensions for raising a matrix to a power. Check that the matrix is square and the power is a scalar. To raise each element to a power, use .^ instead (for example x.^2).`);
}
function eye(n,m){m=m===undefined?n:m;const d=new Array(n*m).fill(0);for(let i=0;i<Math.min(n,m);i++)d[i+i*n]=1;return mk("double",n,m,d)}
function inv(a,I){if(a.r!==a.c)fail("Matrix must be square.");const n=a.r;const X=solve(toMat(a),toMat(eye(n)),n,n,I);return fromMat(X,n,n)}
function det(a){
  if(a.r!==a.c)fail("Matrix must be square.");const n=a.r;const A=toMat(a);let d=1;
  for(let k=0;k<n;k++){let piv=k;for(let i=k+1;i<n;i++)if(Math.abs(A[i][k])>Math.abs(A[piv][k]))piv=i;if(A[piv][k]===0)return 0;if(piv!==k){[A[k],A[piv]]=[A[piv],A[k]];d=-d}d*=A[k][k];for(let i=k+1;i<n;i++){const f=A[i][k]/A[k][k];for(let j=k;j<n;j++)A[i][j]-=f*A[k][j]}}
  return d;
}
function colonRange(a,s,b){
  if([a,s,b].some(Number.isNaN))return rowOf([NaN]);
  if(s===0||(s>0&&a>b)||(s<0&&a<b))return rowOf([]);
  const q=(b-a)/s;const n=Math.floor(q+1e-10*Math.max(1,Math.abs(q)))+1;
  if(n>5e7)fail("That range is too big for this site (over 50 million elements).");
  const d=new Array(n);for(let k=0;k<n;k++)d[k]=a+k*s;
  if(n>1&&Math.abs(d[n-1]-b)<1e-10*Math.max(1,Math.abs(b)))d[n-1]=b;
  if(Number.isInteger(a)&&Number.isInteger(s))for(let k=0;k<n;k++)d[k]=a+k*s;
  return rowOf(d);
}

/* ---------- number formatting ---------- */
function fixExp(s){return s.replace(/e([+-])(\d)$/,"e$10$2")}
function cfmtE(x,p){return fixExp(x.toExponential(p))}
function cfmtG(x,p,alt){
  if(!Number.isFinite(x))return infStr(x);
  if(p===0)p=1;if(x===0)return alt?(0).toFixed(p-1):"0";
  const e=Number(x.toExponential(p-1).split("e")[1]);
  let s;
  if(e<-4||e>=p){s=x.toExponential(p-1);if(!alt)s=s.replace(/\.?0+e/,"e");s=fixExp(s)}
  else{s=x.toFixed(Math.max(0,p-1-e));if(!alt&&s.includes("."))s=s.replace(/\.?0+$/,"")}
  return s;
}
const infStr=x=>Number.isNaN(x)?"NaN":x>0?"Inf":"-Inf";
function fmtShortNum(x){ // compact human form used in messages and summaries
  if(!Number.isFinite(x))return infStr(x);
  if(Number.isInteger(x)&&Math.abs(x)<1e10)return String(x);
  const a=Math.abs(x);
  if(a>=1e-3&&a<1e5)return x.toFixed(4).replace(/0+$/,"").replace(/\.$/,"");
  return cfmtG(x,5);
}
function numToString(x){ // num2str / string() for one number
  if(!Number.isFinite(x))return infStr(x);
  if(Number.isInteger(x))return Math.abs(x)<1e15?String(x):cfmtG(x,15);
  let d=Math.floor(Math.log10(Math.abs(x)));if(!Number.isFinite(d))d=0;
  d=Math.min(Math.max(d+5,5),16);
  return cfmtG(x,d);
}
function fmtNumBlock(v,long){ // returns {head, lines} for a double/logical matrix (format short/long)
  const vals=v.d;const r=v.r,c=v.c;
  if(v.t==="logical"){const lines=[];for(let i=0;i<r;i++){let s="";for(let j=0;j<c;j++)s+=String(vals[i+j*r]).padStart(4);lines.push(s)}return{head:null,lines}}
  const fin=vals.filter(Number.isFinite);
  const allInt=fin.every(Number.isInteger);
  let maxa=0,mina=Infinity;for(const x of fin){const a=Math.abs(x);if(a>maxa)maxa=a;if(a&&a<mina)mina=a}
  let strs,field,head=null;
  if(allInt&&maxa<1e9){
    strs=vals.map(x=>Number.isFinite(x)?String(x):infStr(x));
    const w=Math.max(...strs.map(s=>s.length));field=Math.max(6,w+3);
  }else if(vals.length===1){
    const x=vals[0];const a=Math.abs(x);
    let s;
    if(long)s=(a>=1e-3&&a<100)||a===0?x.toFixed(15):cfmtE(x,15);
    else s=(a>=1e-3&&a<1000)?x.toFixed(4):cfmtE(x,4);
    return{head:null,lines:[(s.includes("e")||long?"   "+s:s.padStart(10))]};
  }else{
    let scale=1;
    if(maxa>=1000||(maxa<1e-3&&maxa>0)){const e=Math.floor(Math.log10(maxa));scale=Math.pow(10,e);head=`   1.0e${e<0?"-":"+"}${String(Math.abs(e)).padStart(2,"0")} *`}
    const dp=long?15:4;
    strs=vals.map(x=>x===0?"0":Number.isFinite(x)?(x/scale).toFixed(dp):infStr(x));
    const w=Math.max(...strs.map(s=>s.length));field=Math.max(long?20:10,w+3);
  }
  const lines=[];for(let i=0;i<r;i++){let s="";for(let j=0;j<c;j++)s+=strs[i+j*r].padStart(field);lines.push(s)}
  return{head,lines};
}
function elemSummary(x,inCell){ // used inside cell display and struct display
  if(x.t==="char")return x.r<=1?`'${codesToStr(x.d)}'`:`${sizeStr(x)} char`;
  if(x.t==="string")return numel(x)===1?`"${x.d[0]}"`:`${sizeStr(x)} string`;
  if(x.t==="cell")return`{${sizeStr(x)} cell}`;
  if(x.t==="struct")return`[${sizeStr(x)} struct]`;
  if(x.t==="fh")return x.text||("@"+x.name);
  if(numel(x)===0)return"[]";
  if(x.r===1&&x.c<=10){const s=x.d.map(v=>x.t==="logical"?String(v):fmtShortNum(v)).join(" ");return x.c===1?(inCell?`[${s}]`:s):`[${s}]`}
  return`${sizeStr(x)} ${x.t}`;
}
function cellLines(v){
  const strs=v.d.map(x=>`{${elemSummary(x,true)}}`);const lines=[];
  const w=[];for(let j=0;j<v.c;j++){let m=0;for(let i=0;i<v.r;i++)m=Math.max(m,strs[i+j*v.r].length);w.push(m)}
  for(let i=0;i<v.r;i++){let s="";for(let j=0;j<v.c;j++)s+="    "+strs[i+j*v.r].padEnd(w[j]);lines.push(s.replace(/\s+$/,""))}
  return lines;
}
function structLines(v){
  if(numel(v)!==1)return[`  ${sizeStr(v)} struct array with fields:`,"",...v.f.map(f=>"    "+f)];
  const w=Math.max(0,...v.f.map(f=>f.length));
  return v.f.map(f=>`    ${f.padStart(w)}: ${elemSummary(v.d[0].get(f))}`);
}
function stringLines(v){
  const strs=v.d.map(s=>`"${s}"`);const lines=[];
  const w=[];for(let j=0;j<v.c;j++){let m=0;for(let i=0;i<v.r;i++)m=Math.max(m,strs[i+j*v.r].length);w.push(m)}
  for(let i=0;i<v.r;i++){let s="";for(let j=0;j<v.c;j++)s+="    "+strs[i+j*v.r].padEnd(w[j]);lines.push(s.replace(/\s+$/,""))}
  return lines;
}
function dispText(v,long){
  if(v.t==="char")return v.r===0?"":charRows(v).join("\n")+"\n";
  if(v.t==="string")return numel(v)===1?v.d[0]+"\n":numel(v)?stringLines(v).join("\n")+"\n":"";
  if(v.t==="cell")return numel(v)?cellLines(v).join("\n")+"\n":"";
  if(v.t==="struct")return structLines(v).join("\n")+"\n";
  if(v.t==="fh")return"    "+(v.text||"@"+v.name)+"\n";
  if(!numel(v))return"";
  const b=fmtNumBlock(v,long);return(b.head?b.head+"\n\n":"")+b.lines.join("\n")+"\n";
}
function displayText(name,v,long,compact){
  const gap=compact?"\n":"\n\n";
  const wrap=body=>`${name} =${gap}${body}${gap}`;
  if(v.t==="char"){
    if(numel(v)===0)return wrap(`  ${sizeStr(v)} empty char array`);
    return wrap(charRows(v).map(s=>`    '${s}'`).join("\n"));
  }
  if(v.t==="string"){if(numel(v)===1)return wrap(`    "${v.d[0]}"`);if(!numel(v))return wrap(`  ${sizeStr(v)} empty string array`);return wrap(`  ${sizeStr(v)} string array${gap}${stringLines(v).join("\n")}`)}
  if(v.t==="cell"){if(!numel(v))return wrap(`  ${sizeStr(v)} empty cell array`);return wrap(`  ${sizeStr(v)} cell array${gap}${cellLines(v).join("\n")}`)}
  if(v.t==="struct"){if(numel(v)===1)return wrap(`  struct with fields:${gap}${structLines(v).join("\n")}`);return wrap(structLines(v).join("\n"))}
  if(v.t==="fh")return wrap(`  function_handle with value:${gap}    ${v.text||"@"+v.name}`);
  if(!numel(v))return wrap(v.r===0&&v.c===0?"     []":`  ${sizeStr(v)} empty ${v.t} ${v.r===1?"row vector":v.c===1?"column vector":"array"}`);
  const b=fmtNumBlock(v,long);
  const body=(v.t==="logical"?`  ${numel(v)===1?"logical":sizeStr(v)+" logical array"}${gap}`:"")+(b.head?b.head+gap:"")+b.lines.join("\n");
  return wrap(body);
}
function summary(v){ // one-line value for the workspace panel
  if(v.t==="double"||v.t==="logical"){
    if(numel(v)===0)return"[]";
    if(numel(v)===1)return v.t==="logical"?String(v.d[0]):fmtShortNum(v.d[0]);
    if(numel(v)<=8){const rows=[];for(let i=0;i<v.r;i++){const row=[];for(let j=0;j<v.c;j++)row.push(v.t==="logical"?String(v.d[i+j*v.r]):fmtShortNum(v.d[i+j*v.r]));rows.push(row.join(" "))}return`[${rows.join("; ")}]`}
    return`${sizeStr(v)} ${v.t}`;
  }
  if(v.t==="char")return v.r<=1&&v.c<=40?`'${codesToStr(v.d)}'`:`${sizeStr(v)} char`;
  if(v.t==="string")return numel(v)===1?`"${v.d[0]}"`:`${sizeStr(v)} string`;
  if(v.t==="cell")return`${sizeStr(v)} cell`;
  if(v.t==="struct")return`${sizeStr(v)} struct`;
  if(v.t==="fh")return v.text||"@"+v.name;
  return"?";
}
function mat2str(v,prec){
  const f=x=>!Number.isFinite(x)?infStr(x):prec?cfmtG(x,prec):Number.isInteger(x)?String(x):cfmtG(x,15);
  if(v.t==="char")return v.r<=1?`'${codesToStr(v.d).replace(/'/g,"''")}'`:"["+charRows(v).map(s=>`'${s}'`).join(";")+"]";
  if(v.t==="string")return numel(v)===1?`"${v.d[0]}"`:"["+v.d.map(s=>`"${s}"`).join(" ")+"]";
  if(!isNum(v))fail(`mat2str needs a numeric, logical or char input, not ${cls(v)}.`);
  const e=x=>v.t==="logical"?(x?"true":"false"):f(x);
  if(numel(v)===1)return e(v.d[0]);
  if(numel(v)===0)return v.r===0&&v.c===0?"[]":`zeros(${v.r},${v.c})`;
  const rows=[];for(let i=0;i<v.r;i++){const row=[];for(let j=0;j<v.c;j++)row.push(e(v.d[i+j*v.r]));rows.push(row.join(" "))}
  return"["+rows.join(";")+"]";
}

/* ---------- sprintf ---------- */
function unescapeFmt(s){
  return s.replace(/\\(n|t|r|a|b|f|v|\\|"|'|x[0-9a-fA-F]{1,2}|[0-7]{1,3})/g,(m,c)=>{
    if(c==="n")return"\n";if(c==="t")return"\t";if(c==="r")return"\r";if(c==="a")return"\x07";if(c==="b")return"\b";if(c==="f")return"\f";if(c==="v")return"\v";
    if(c==="\\")return"\\";if(c==='"')return'"';if(c==="'")return"'";if(c[0]==="x")return String.fromCharCode(parseInt(c.slice(1),16));return String.fromCharCode(parseInt(c,8));
  });
}
function formatText(fmtV,args){
  const fmt=unescapeFmt(textList(fmtV,"The format").join(""));
  const parts=[];const re=/%%|%([-+ 0#]*)(\*|\d+)?(?:\.(\*|\d+))?([diouxXfFeEgGcs])/g;let last=0,m;
  while((m=re.exec(fmt))){if(m.index>last)parts.push(fmt.slice(last,m.index));if(m[0]==="%%")parts.push("%");else parts.push({flags:m[1],w:m[2],p:m[3],conv:m[4]});last=re.lastIndex}
  if(last<fmt.length)parts.push(fmt.slice(last));
  const items=[];
  for(const a of args){
    if(a.t==="char")items.push({s:a.r<=1?codesToStr(a.d):codesToStr(a.d)});
    else if(a.t==="string")for(const s of a.d)items.push({s});
    else if(a.t==="double"||a.t==="logical")for(const x of a.d)items.push({n:x});
    else if(a.t==="cell")fail("sprintf and fprintf can't print a cell array directly. Get the value out with braces, like c{1}.");
    else fail(`sprintf and fprintf can't print a ${cls(a)}.`);
  }
  const specs=parts.filter(x=>typeof x!=="string");
  if(!specs.length)return parts.join("");
  let out="",k=0;
  const take=()=>items[k++];
  for(let pass=0;;pass++){
    for(const part of parts){
      if(typeof part==="string"){out+=part;continue}
      let w=part.w,p=part.p;
      if(w==="*"){const it=take();if(!it)return out;w=String(it.n)}
      if(p==="*"){const it=take();if(!it)return out;p=String(it.n)}
      if(!items.length){continue}
      if(k>=items.length)return out;
      out+=fmtOne(part,w,p,take());
    }
    if(!items.length||k>=items.length)break;
  }
  return out;
}
function fmtOne(sp,w,p,it){
  const flags=sp.flags||"";let conv=sp.conv;const prec=p===undefined?undefined:Number(p);
  let s;
  if(it.s!==undefined){
    if(conv==="s"||conv==="c"||"dioxXu".includes(conv)||"fFeEgG".includes(conv))s=prec!==undefined&&conv==="s"?it.s.slice(0,prec):it.s;
  }else{
    const x=it.n;
    if(conv==="s"||conv==="c"){
      if(Number.isInteger(x)&&x>=0&&x<1114112&&conv==="c")s=String.fromCodePoint(x);
      else if(Number.isInteger(x)&&x>=0&&x<1114112&&conv==="s")s=String.fromCodePoint(x);
      else{s=cfmtE(x,6)}
    }else if("diu".includes(conv)){
      if(!Number.isFinite(x))s=infStr(x);
      else if(!Number.isInteger(x))s=cfmtE(x,prec===undefined?6:prec);
      else s=Math.abs(x)<1e21?BigInt(x).toString():String(x);
      if(flags.includes("+")&&x>=0)s="+"+s;else if(flags.includes(" ")&&x>=0)s=" "+s;
    }else if("oxX".includes(conv)){
      if(!Number.isInteger(x))s=cfmtE(x,6);else{s=Math.abs(x).toString(conv==="o"?8:16);if(conv==="X")s=s.toUpperCase();if(x<0)s="-"+s}
    }else{
      const P=prec===undefined?6:prec;
      if(!Number.isFinite(x))s=infStr(x);
      else if(conv==="f"||conv==="F")s=Math.abs(x)<1e21?x.toFixed(P):cfmtE(x,P);
      else if(conv==="e"||conv==="E"){s=cfmtE(x,P);if(conv==="E")s=s.toUpperCase()}
      else{s=cfmtG(x,P,flags.includes("#"));if(conv==="G")s=s.toUpperCase()}
      if(Number.isFinite(x)&&x>=0&&!Object.is(x,-0)){if(flags.includes("+"))s="+"+s;else if(flags.includes(" "))s=" "+s}
    }
  }
  const W=w===undefined?0:Number(w);
  if(s.length<W){
    if(flags.includes("-"))s=s.padEnd(W);
    else if(flags.includes("0")&&it.n!==undefined&&Number.isFinite(it.n)&&conv!=="s"&&conv!=="c"){const neg=/^[+\- ]/.test(s)?s[0]:"";const body=neg?s.slice(1):s;s=neg+body.padStart(W-neg.length,"0")}
    else s=s.padStart(W);
  }
  return s;
}

/* ---------- random numbers ---------- */
function mulberry(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}}

/* ---------- interpreter ---------- */
const DEFAULT_COLORS=["#0072BD","#D95319","#EDB120","#7E2F8E","#77AC30","#4DBEEE","#A2142F"];
const LETTER_COLORS={r:"#FF0000",g:"#00B000",b:"#0000FF",c:"#00BFBF",m:"#BF00BF",y:"#E6C200",k:"#000000",w:"#FFFFFF"};
const NAMED_COLORS={red:"r",green:"g",blue:"b",cyan:"c",magenta:"m",yellow:"y",black:"k",white:"w"};
function newAxes(){return{items:[],title:"",xlabel:"",ylabel:"",legend:null,grid:false,hold:false,xlim:null,ylim:null,ci:0}}

class Interp{
  constructor(opts={}){
    this.base={vars:new Map(),fname:null};
    this.F=this.base;this.funcs={};this.out="";this.figs=[];this.cf=-1;
    this.inputs=(opts.inputs||[]).slice();this.steps=0;this.t0=Date.now();this.limit=opts.timeLimit||3000;
    this.long=false;this.compact=false;this.depth=0;this.ends=[];this.tic=null;
    this.rand=mulberry(opts.seed!==undefined?opts.seed:(Date.now()^(Math.random()*1e9)));
  }
  write(s){this.out+=s;if(this.out.length>300000)fail("Your program printed over 300,000 characters, so it was stopped. Is a loop printing forever?",{runaway:true})}
  warn(msg){this.write(`Warning: ${msg}\n`)}
  tick(){if((++this.steps&2047)===0&&Date.now()-this.t0>this.limit)throw new MError("timeout",{timeout:true})}
  run(code){
    this.t0=Date.now();
    const prog=typeof code==="string"?parse(code):code;
    Object.assign(this.funcs,prog.funcs);
    this.F=this.base;
    try{this.block(prog.body,this.base)}
    catch(e){throw wrapErr(e)}
  }
  evalExpr(src){
    const prog=parse(src);
    if(prog.body.length!==1||prog.body[0].k!=="expr")fail("Expected a single expression.");
    this.t0=Date.now();this.F=this.base;
    try{return this.eval1(prog.body[0].e,this.base)}catch(e){throw wrapErr(e)}
  }
  block(stmts,F){
    for(const s of stmts){const r=this.stmt(s,F);if(r)return r}
    return null;
  }
  stmt(s,F){
    this.tick();
    try{
      switch(s.k){
        case "expr":{
          const e=s.e;
          if(e.k==="id"&&F.vars.has(e.name)){if(s.show)this.write(displayText(e.name,F.vars.get(e.name),this.long,this.compact));return null}
          const r=this.ev(e,F,0);
          if(r.length){F.vars.set("ans",unown(r[0]));if(s.show)this.write(displayText("ans",r[0],this.long,this.compact))}
          return null;
        }
        case "assign":{
          const v=this.eval1(s.e,F,true);
          this.assign(s.lhs,v,F);
          if(s.show)this.write(displayText(s.lhs.name,F.vars.get(s.lhs.name),this.long,this.compact));
          return null;
        }
        case "massign":{
          const need=s.lhs.length;
          const r=this.ev(s.e,F,need);
          s.lhs.forEach((l,k)=>{if(!l)return;if(k>=r.length)fail(k===0?"Too many output arguments. That function doesn't return a value.":`Too many output arguments. Only ${r.length} value${r.length===1?"":"s"} came back, but you asked for ${need}.`);this.assign(l,r[k],F)});
          if(s.show)s.lhs.forEach(l=>{if(l)this.write(displayText(l.name,F.vars.get(l.name),this.long,this.compact))});
          return null;
        }
        case "if":{
          for(const[c,b]of s.conds){if(truthy(this.eval1(c,F),"An if condition"))return this.block(b,F)}
          return s.els?this.block(s.els,F):null;
        }
        case "for":{
          if(s.e.k==="range"){
            const a=scalar(this.eval1(s.e.a,F)),st=s.e.s?scalar(this.eval1(s.e.s,F)):1,b=scalar(this.eval1(s.e.b,F));
            const R=colonRange(a,st,b).d;
            for(const x of R){this.tick();this.assign(s.v,num(x),F);const r=this.block(s.body,F);if(r==="break")break;if(r==="return")return r}
            return null;
          }
          const v=this.eval1(s.e,F);
          const cols=v.c;
          for(let j=0;j<cols;j++){
            this.tick();
            let x;
            if(v.r===1){x=mk(v.t,1,1,[v.d[j]]);if(v.f)x.f=v.f.slice()}
            else{x=index(v,[COLON,num(j+1)])}
            if(v.t==="fh")x=v;
            this.assign(s.v,x,F);
            const r=this.block(s.body,F);if(r==="break")break;if(r==="return")return r;
          }
          return null;
        }
        case "while":{
          while(truthy(this.eval1(s.cond,F),"A while condition")){this.tick();const r=this.block(s.body,F);if(r==="break")break;if(r==="return")return r}
          return null;
        }
        case "switch":{
          const v=this.eval1(s.e,F);
          const match=c=>{
            if(c.t==="cell")return c.d.some(match);
            if(isText(v)||isText(c)){if(!isText(v)||!isText(c))return false;return textList(v).join("\n")===textList(c).join("\n")}
            if(isNum(v)&&isNum(c)){if(numel(v)!==1)fail("SWITCH expression must be a scalar or a character vector.");return numel(c)===1&&c.d[0]===v.d[0]}
            return false;
          };
          for(const[ce,b]of s.cases)if(match(this.eval1(ce,F)))return this.block(b,F);
          return s.other?this.block(s.other,F):null;
        }
        case "try":{
          try{return this.block(s.body,F)}
          catch(e){
            if(!(e instanceof MError)||e.timeout||e.runaway)throw e;
            if(s.id){const st=newStruct();st.f=["message","identifier"];st.d=[new Map([["message",chr(e.message)],["identifier",chr(e.identifier||"")]])];F.vars.set(s.id,st)}
            return this.block(s.cbody,F);
          }
        }
        case "break":return"break";
        case "continue":return"continue";
        case "return":return"return";
        case "cmd":{const r=this.call(s.name,s.args.map(a=>chr(a)),0,F);if(r.length&&s.show){F.vars.set("ans",r[0]);this.write(displayText("ans",r[0],this.long,this.compact))}return null}
        case "nop":return null;
      }
    }catch(e){
      if(e instanceof MError&&e.line===undefined&&!e.timeout){e.line=s.line;e.where=F.fname}
      throw e;
    }
    return null;
  }
  assign(lhs,v,F){
    if(v.t==="fh"&&lhs.chain.length&&lhs.chain[lhs.chain.length-1].k==="paren")fail("Function handles can't be stored with ( ). Use a cell array: c{1} = @sin.");
    if(!lhs.chain.length){F.vars.set(lhs.name,v.own?v:v);return}
    const cur=F.vars.get(lhs.name);
    if(cur===undefined&&lhs.chain[0].k==="paren"&&this.funcs[lhs.name]===undefined&&BUILTINS[lhs.name]&&!["i","j"].includes(lhs.name)){/* allowed: creates a variable that shadows a function */}
    F.vars.set(lhs.name,this.assignInto(cur,lhs.chain,0,v,F));
  }
  assignInto(base,chain,i,rhs,F){
    if(i===chain.length)return rhs;
    const a=chain[i];const last=i===chain.length-1;
    if(a.k==="paren"){
      if(base&&base.t==="fh")fail("Indexing into a function handle isn't allowed.");
      const idx=this.evArgs(a.args,F,base||EMPTY());
      if(last)return indexAssign(base,idx,rhs);
      let sub;try{sub=base&&numel(base)?index(base,idx):undefined}catch(e){sub=undefined}
      if(sub&&numel(sub)!==1)fail("Only one element can be changed this way. Index a single element, like s(2).name = value.");
      if(sub===undefined&&base&&base.t==="struct"){sub=newStruct();for(const f of base.f)sub.d[0].set(f,EMPTY());sub.f=base.f.slice()}
      const nsub=this.assignInto(sub,chain,i+1,rhs,F);
      return indexAssign(base,idx,nsub);
    }
    if(a.k==="brace"){
      if(base!==undefined&&base.t!=="cell"&&numel(base)>0)fail(`Unable to perform assignment because brace indexing is not supported for variables of type '${cls(base)}'. Braces { } are for cell arrays; use ( ) for ordinary arrays.`);
      const b=base&&base.t==="cell"?base:mk("cell",0,0,[]);
      const idx=this.evArgs(a.args,F,b);
      let elem;if(!last){try{elem=index(b,idx).d[0]}catch(e){elem=undefined}}
      const nv=last?rhs:this.assignInto(elem,chain,i+1,rhs,F);
      const w=mk("cell",1,1,[nv]);w.cellwrap=true;
      return indexAssign(b,idx,w);
    }
    // field
    const name=a.k==="field"?a.name:textOf(this.eval1(a.e,F),"A dynamic field name");
    let s=base;
    if(s===undefined||(s.t==="double"&&numel(s)===0))s=newStruct();
    if(s.t!=="struct")fail(`Unable to perform assignment because dot indexing is not supported for variables of type '${cls(s)}'. Only structs have fields.`);
    if(numel(s)!==1)fail("To set a field of one element of a struct array, index it first: s(2).name = value.");
    const cur=s.d[0].has(name)?s.d[0].get(name):undefined;
    const nv=this.assignInto(cur,chain,i+1,rhs,F);
    const ns={t:"struct",r:1,c:1,f:s.f.slice(),d:[new Map(s.d[0])]};
    if(!ns.f.includes(name))ns.f.push(name);
    ns.d[0].set(name,unown(nv));
    return ns;
  }
  endVal(){
    const t=this.ends[this.ends.length-1];
    if(!t)fail("\"end\" can only be used inside an index, like x(end).");
    const v=t.v;if(t.n===1)return numel(v);if(t.k===0)return v.r;if(t.k===1)return v.c;return 1;
  }
  evArgs(args,F,ctx){
    const out=[];
    for(let k=0;k<args.length;k++){
      const a=args[k];
      if(a.k==="colon"){out.push(COLON);continue}
      if(ctx)this.ends.push({v:ctx,k,n:args.length});
      try{for(const v of this.evM(a,F))out.push(v)}
      finally{if(ctx)this.ends.pop()}
    }
    return out;
  }
  evM(n,F){if(n.k==="cellindex"||n.k==="field"||n.k==="dyn")return this.ev(n,F,1);return[this.eval1(n,F)]}
  eval1(n,F,assigning){
    const r=this.ev(n,F,1);
    if(!r.length){
      if(n.k==="cellindex")fail("The cell index selects no elements, so there's no value to use.");
      const nm=n.k==="id"?n.name:n.k==="index"&&n.obj.k==="id"?n.obj.name:null;
      fail(nm?`Too many output arguments. ${nm} doesn't return a value${assigning?", so it can't be stored in a variable":""}.`:"Too many output arguments.");
    }
    return r[0];
  }
  ev(n,F,nout){
    switch(n.k){
      case "num":return[num(n.v)];
      case "str":return[chr(n.v)];
      case "dstr":return[sstr(n.v)];
      case "id":{const v=F.vars.get(n.name);if(v!==undefined)return[unown(v)];return this.call(n.name,[],nout,F)}
      case "end":return[num(this.endVal())];
      case "paren":return[this.eval1(n.e,F)];
      case "colon":fail("A bare : can only be used inside an index, like A(:,1).");
      case "bin":return[this.binop(n,F)];
      case "un":{
        const a=this.eval1(n.a,F);
        if(n.op==="-"){if(a.t==="string"||!isNum(a))fail(`Operator '-' is not supported for operands of type '${cls(a)}'.`);return[mk("double",a.r,a.c,a.d.map(x=>-x))]}
        if(n.op==="+"){if(!isNum(a))fail(`Operator '+' is not supported for operands of type '${cls(a)}'.`);return[toDouble(a)]}
        if(!isNum(a))fail(`Operator '~' is not supported for operands of type '${cls(a)}'.`);
        return[mk("logical",a.r,a.c,a.d.map(x=>{if(Number.isNaN(x))fail("NaN's cannot be converted to logicals.");return x?0:1}))];
      }
      case "tr":return[transpose(this.eval1(n.a,F))];
      case "range":{
        const A=this.eval1(n.a,F),S=n.s?this.eval1(n.s,F):null,B=this.eval1(n.b,F);
        for(const x of [A,S,B])if(x&&(!isNum(x)))fail(`The colon operator needs numbers, not ${cls(x)}.`);
        for(const x of [A,S,B])if(x&&!numel(x))return[rowOf([])];
        const r=colonRange(A.d[0],S?S.d[0]:1,B.d[0]);
        if(A.t==="char"&&B.t==="char")return[mk("char",1,r.c,r.d)];
        return[r];
      }
      case "matrix":{
        const rows=n.rows.map(row=>{const vals=[];for(const e of row)for(const v of this.evM(e,F))vals.push(v);return horzcat(vals)});
        if(!rows.length)return[EMPTY()];
        return[rows.length===1?rows[0]:vertcat(rows)];
      }
      case "cell":{
        const rows=n.rows.map(row=>{const vals=[];for(const e of row)for(const v of this.evM(e,F))vals.push(mk("cell",1,1,[unown(v)]));return horzcat(vals.length?vals:[mk("cell",0,0,[])])});
        if(!rows.length)return[mk("cell",0,0,[])];
        return[rows.length===1?rows[0]:vertcat(rows)];
      }
      case "anon":{
        const cap=new Map();const P=new Set(n.params);
        walkIds(n.body,name=>{if(!P.has(name)&&F.vars.has(name))cap.set(name,unown(F.vars.get(name)))});
        return[{t:"fh",r:1,c:1,d:[],params:n.params,body:n.body,cap,text:n.text}];
      }
      case "fh":return[{t:"fh",r:1,c:1,d:[],name:n.name}];
      case "index":{
        const o=n.obj;
        if(o.k==="id"){
          const v=F.vars.get(o.name);
          if(v===undefined)return this.call(o.name,this.evArgs(n.args,F,null),nout,F);
          if(v.t==="fh")return this.callFh(v,this.evArgs(n.args,F,null),nout);
          return[index(v,this.evArgs(n.args,F,v))];
        }
        const b=this.eval1(o,F);
        if(b.t==="fh")return this.callFh(b,this.evArgs(n.args,F,null),nout);
        return[index(b,this.evArgs(n.args,F,b))];
      }
      case "cellindex":{
        let b;
        if(n.obj.k==="id"){b=F.vars.get(n.obj.name);if(b===undefined)fail(`Unrecognized function or variable '${n.obj.name}'.`)}
        else b=this.eval1(n.obj,F);
        if(b.t!=="cell")fail(`Brace indexing is not supported for variables of type '${cls(b)}'. Braces { } are only for cell arrays; use ( ) instead.`);
        return index(b,this.evArgs(n.args,F,b)).d.map(unown);
      }
      case "field":case "dyn":{
        const b=this.eval1(n.obj,F);
        const name=n.k==="field"?n.name:textOf(this.eval1(n.e,F),"A dynamic field name");
        if(b.t!=="struct")fail(`Dot indexing is not supported for variables of type '${cls(b)}'. Only structs have fields like s.${name}.`);
        if(!b.f.includes(name))fail(`Unrecognized field name "${name}".${b.f.length?` The fields are: ${b.f.join(", ")}.`:""}`);
        return b.d.map(m=>unown(m.get(name)));
      }
    }
    fail("Internal error: unknown expression.");
  }
  binop(n,F){
    const op=n.op;
    if(op==="&&"||op==="||"){
      const sc=v=>{if(!isNum(v)||numel(v)!==1)fail(`Operands to the ${op} operator must be convertible to logical scalar values. Use ${op[0]} for arrays, or any()/all().`);if(Number.isNaN(v.d[0]))fail("NaN's cannot be converted to logicals.");return!!v.d[0]};
      const a=sc(this.eval1(n.a,F));
      if(op==="&&"&&!a)return bool(false);if(op==="||"&&a)return bool(true);
      return bool(sc(this.eval1(n.b,F)));
    }
    const a=this.eval1(n.a,F),b=this.eval1(n.b,F);
    if(ARITH[op]){if((a.t==="string"||b.t==="string")&&op!=="+")fail(`Operator '${op}' is not supported for operands of type 'string'.`);return bcast(a,b,ARITH[op],"double",op)}
    if(CMP[op])return bcast(a,b,CMP[op],"logical",op);
    if(op==="&"||op==="|")return logicalOp(a,b,op);
    if(a.t==="string"||b.t==="string")fail(`Operator '${op}' is not supported for operands of type 'string'.`);
    if(op==="*")return matmul(a,b);
    if(op==="/")return mrdivide(a,b,this);
    if(op==="\\")return mldivide(a,b,this);
    if(op==="^")return mpower(a,b,this);
    fail(`Unknown operator ${op}`);
  }
  call(name,args,nout,F){
    const uf=this.funcs[name];
    if(uf)return this.callUser(uf,args,nout);
    const bi=BUILTINS[name];
    if(bi){
      try{const r=bi(args,nout,this,name);return r===undefined?[]:Array.isArray(r)?r:[r]}
      catch(e){if(e instanceof MError&&!e.using&&e.where===undefined&&!e.timeout&&!e.user)e.using=name;throw e}
    }
    if(name==="i"||name==="j")fail(`Unrecognized function or variable '${name}'. (Complex numbers aren't supported on this site; did you mean to create ${name} first, for example in a for loop?)`);
    const near=suggest(name,[...F.vars.keys(),...Object.keys(this.funcs),...Object.keys(BUILTINS)]);
    fail(`Unrecognized function or variable '${name}'.${near?` Did you mean '${near}'?`:""}`,{undefinedName:name});
  }
  callUser(f,args,nout){
    const hasVarargin=f.params[f.params.length-1]==="varargin";
    const np=hasVarargin?f.params.length-1:f.params.length;
    if(args.length>np&&!hasVarargin)fail(`Too many input arguments. ${f.name} takes ${np} input${np===1?"":"s"} but was given ${args.length}.`,{using:f.name});
    if(nout>Math.max(1,f.outs.length)&&!(f.outs[f.outs.length-1]==="varargout"))fail(`Too many output arguments. ${f.name} only returns ${f.outs.length} value${f.outs.length===1?"":"s"}.`,{using:f.name});
    if(this.depth>=150)fail("Maximum recursion limit reached. Does your function call itself forever without a stopping case?");
    const vars=new Map();
    for(let k=0;k<np&&k<args.length;k++)if(f.params[k]!=="~")vars.set(f.params[k],args[k]);
    if(hasVarargin)vars.set("varargin",cellOf(args.slice(np).map(unown)));
    const frame={vars,fname:f.name,nargin:args.length,nargout:nout};
    const prevF=this.F;this.F=frame;this.depth++;
    try{this.block(f.body,frame)}
    finally{this.F=prevF;this.depth--}
    const out=[];
    const want=Math.max(nout,f.outs.length?1:0);
    for(let k=0;k<want&&k<f.outs.length;k++){
      if(f.outs[k]==="varargout"){const vo=vars.get("varargout");if(vo)for(const x of vo.d)out.push(x);continue}
      const v=vars.get(f.outs[k]);
      if(v===undefined){if(nout===0&&k===0)break;fail(`Output argument "${f.outs[k]}" (and possibly others) not assigned a value in the execution with "${f.name}" function. Make sure the function sets ${f.outs[k]} = ... before it ends.`,{using:f.name})}
      out.push(v);
    }
    return out;
  }
  callFh(fh,args,nout){
    if(fh.name)return this.call(fh.name,args,nout,this.F);
    const vars=new Map(fh.cap);
    if(args.length>fh.params.length&&fh.params[fh.params.length-1]!=="varargin")fail(`Too many input arguments. This anonymous function takes ${fh.params.length}.`);
    fh.params.forEach((p,k)=>{if(p==="varargin")vars.set(p,cellOf(args.slice(k)));else if(k<args.length&&p!=="~")vars.set(p,args[k])});
    if(this.depth>=150)fail("Maximum recursion limit reached.");
    const frame={vars,fname:"anonymous function",nargin:args.length,nargout:nout};
    const prevF=this.F;this.F=frame;this.depth++;
    try{return this.ev(fh.body,frame,nout)}
    finally{this.F=prevF;this.depth--}
  }
  callAny(f,args){ // function handle or name; returns first output
    const r=f.t==="fh"?this.callFh(f,args,1):this.call(textOf(f),args,1,this.F);
    if(!r.length)fail("The function didn't return a value.");return r[0];
  }
  axes(){if(this.cf<0){this.figs.push({n:1,ax:newAxes()});this.cf=0}return this.figs[this.cf].ax}
}
function walkIds(n,f){
  if(!n||typeof n!=="object")return;
  if(Array.isArray(n)){n.forEach(x=>walkIds(x,f));return}
  if(n.k==="id")f(n.name);
  if(n.k==="anon"){walkIds(n.body,name=>{if(!n.params.includes(name))f(name)});return}
  for(const key in n)if(key!=="k"&&typeof n[key]==="object")walkIds(n[key],f);
}
function wrapErr(e){
  if(e instanceof MError)return e;
  if(e instanceof RangeError)return new MError("Maximum recursion limit reached. Does a function call itself forever without a stopping case?");
  return new MError("Internal error in this site's MATLAB engine: "+e.message+". Your code may still be right; try writing it another way.",{internal:true});
}
function suggest(name,pool){
  const low=name.toLowerCase();
  const exact=pool.find(p=>p.toLowerCase()===low&&p!==name);if(exact)return exact;
  let best=null,bd=3;
  if(name.length<3)return null;
  for(const p of pool){if(Math.abs(p.length-name.length)>2)continue;const d=lev(low,p.toLowerCase());if(d<bd){bd=d;best=p}}
  return bd<=(name.length>5?2:1)?best:null;
}
function lev(a,b){const m=a.length,n=b.length;const d=Array.from({length:m+1},(_,i)=>[i]);for(let j=1;j<=n;j++)d[0][j]=j;for(let i=1;i<=m;i++)for(let j=1;j<=n;j++)d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]===b[j-1]?0:1));return d[m][n]}

/* ---------- builtin helpers ---------- */
const BUILTINS=Object.create(null);
const def=(names,f)=>{for(const n of names.split(" "))BUILTINS[n]=f};
function needArgs(args,min,max,name){
  if(args.length<min)fail(`Not enough input arguments.${name?` ${name} needs at least ${min}.`:""}`);
  if(max!==undefined&&args.length>max)fail(`Too many input arguments.${name?` ${name} takes at most ${max}.`:""}`);
}
function mapNum(v,f,t="double"){const A=numData(v);const d=new Array(A.length);for(let i=0;i<A.length;i++)d[i]=f(A[i]);return mk(t,v.r,v.c,d)}
function dimsFrom(args,name){
  const a=args.filter(x=>!isText(x));
  if(!a.length)return[1,1];
  if(a.length===1){const v=a[0];if(numel(v)===1){const n=Math.max(0,Math.floor(v.d[0]));return[n,n]}if(numel(v)>=2)return[Math.max(0,v.d[0]),Math.max(0,v.d[1])]}
  return[Math.max(0,Math.floor(scalar(a[0]))),Math.max(0,Math.floor(scalar(a[1])))];
}
const defDim=v=>v.r!==1?1:2;
function getDim(args,i,v){
  const a=args[i];if(a===undefined)return defDim(v);
  if(isText(a)&&textOf(a).toLowerCase()==="all")return"all";
  const d=scalar(a,"The dimension");if(d!==1&&d!==2)fail("The dimension must be 1 (down columns) or 2 (across rows).");return d;
}
function reduce(v,dim,f,t="double"){ // f(list)->number
  const A=numData(v);
  if(dim==="all")return mk(t,1,1,[f(A.slice())]);
  if(v.r===0&&v.c===0&&dim===1)return mk(t,1,1,[f([])]);
  if(dim===1){const d=[];for(let j=0;j<v.c;j++){const col=[];for(let i=0;i<v.r;i++)col.push(A[i+j*v.r]);d.push(f(col))}return mk(t,1,v.c,d)}
  const d=[];for(let i=0;i<v.r;i++){const row=[];for(let j=0;j<v.c;j++)row.push(A[i+j*v.r]);d.push(f(row))}return mk(t,v.r,1,d);
}
function slices(v,dim){ // returns {lists, rebuild(lists)}
  const A=v.d;const L=[];
  if(dim===1){for(let j=0;j<v.c;j++){const col=[];for(let i=0;i<v.r;i++)col.push(A[i+j*v.r]);L.push(col)}return{L,build:(Ls,t)=>{const r=Ls.length?Ls[0].length:0;const d=[];for(const col of Ls)d.push(...col);return mk(t||v.t,r,v.c,d)}}}
  for(let i=0;i<v.r;i++){const row=[];for(let j=0;j<v.c;j++)row.push(A[i+j*v.r]);L.push(row)}
  return{L,build:(Ls,t)=>{const c=Ls.length?Ls[0].length:0;const d=new Array(v.r*c);Ls.forEach((row,i)=>row.forEach((x,j)=>{d[i+j*v.r]=x}));return mk(t||v.t,v.r,c,d)}};
}
const sumL=L=>{let s=0;for(const x of L)s+=x;return s};
const sortNum=L=>L.slice().sort((a,b)=>a-b);
function median(L){const s=sortNum(L);const n=s.length;if(!n)return NaN;if(s.some(Number.isNaN))return NaN;return n%2?s[(n-1)/2]:(s[n/2-1]+s[n/2])/2}
function mode(L){if(!L.length)return NaN;const m=new Map();for(const x of L)m.set(x,(m.get(x)||0)+1);let best=null,bc=-1;for(const[x,c]of m)if(c>bc||(c===bc&&x<best)){best=x;bc=c}return best}
function variance(L,w){const n=L.length;if(n===0)return NaN;if(n===1)return 0;const mu=sumL(L)/n;let s=0;for(const x of L)s+=(x-mu)*(x-mu);return s/(w===1?n:n-1)}
function roundHalfAway(x){return Math.sign(x)*Math.round(Math.abs(x))}
function roundDigits(x,n){
  if(!Number.isFinite(x))return x;
  if(n===0)return roundHalfAway(x);
  const s=Math.sign(x),a=Math.abs(x);
  const r=Number(Math.round(Number(a+"e"+n))+"e"+(-n));
  return s*r;
}
function gcd(a,b){a=Math.abs(a);b=Math.abs(b);while(b){[a,b]=[b,a%b]}return a}
function isPrime(n){if(n<2||!Number.isInteger(n))return false;if(n<4)return true;if(n%2===0)return false;for(let k=3;k*k<=n;k+=2)if(n%k===0)return false;return true}
function textOut(v,s){return v.t==="string"?sstr(s):chr(s)}
function mapText(v,f){ // apply f(text)->text to char row / string array / cell of text
  if(v.t==="char")return v.r>1?chrRowsToMat(charRows(v).map(f)):chr(f(codesToStr(v.d)));
  if(v.t==="string")return mk("string",v.r,v.c,v.d.map(f));
  if(v.t==="cell")return mk("cell",v.r,v.c,v.d.map(x=>mapText(x,f)));
  fail(`Expected text, not ${cls(v)}.`);
}
function chrRowsToMat(rows){const w=Math.max(0,...rows.map(s=>s.length));const r=rows.length;const d=new Array(r*w);rows.forEach((s,i)=>{const p=s.padEnd(w);for(let j=0;j<w;j++)d[i+j*r]=p.charCodeAt(j)});return mk("char",r,w,d)}
function textPred(v,f){ // returns logical array: f(text)->bool for each text element
  if(v.t==="char")return bool(f(codesToStr(v.d)));
  if(v.t==="string")return mk("logical",v.r,v.c,v.d.map(s=>f(s)?1:0));
  if(v.t==="cell")return mk("logical",v.r,v.c,v.d.map(x=>f(textOf(x))?1:0));
  fail(`Expected text, not ${cls(v)}.`);
}
function nameValue(args,start){const o={};for(let k=start;k+1<args.length;k+=2){if(!isText(args[k]))break;o[textOf(args[k]).toLowerCase()]=args[k+1]}return o}
function isEqualVals(a,b){
  if(isNum(a)&&isNum(b)){if(a.r!==b.r||a.c!==b.c)return false;for(let i=0;i<a.d.length;i++)if(a.d[i]!==b.d[i])return false;return true}
  if(isText(a)&&isText(b)){if(a.t==="string"||b.t==="string"){const A=textList(a),B=textList(b);return A.length===B.length&&A.every((s,i)=>s===B[i])}return a.r===b.r&&a.c===b.c&&a.d.every((x,i)=>x===b.d[i])}
  if(a.t!==b.t||a.r!==b.r||a.c!==b.c)return false;
  if(a.t==="cell")return a.d.every((x,i)=>isEqualVals(x,b.d[i]));
  if(a.t==="struct"){if(a.f.length!==b.f.length||a.f.some(f=>!b.f.includes(f)))return false;return a.d.every((m,i)=>a.f.every(f=>isEqualVals(m.get(f),b.d[i].get(f))))}
  if(a.t==="fh")return a===b;
  return false;
}
function keyOf(v){return v.t==="char"?"s:"+codesToStr(v.d):v.t==="string"?"s:"+v.d[0]:"n:"+v.d[0]}
function elems(v){ // split into list of 1x1 values (or texts for cellstr)
  if(v.t==="cell")return v.d.map(x=>({key:"s:"+textOf(x),val:x}));
  if(v.t==="string")return v.d.map(s=>({key:"s:"+s,val:sstr(s)}));
  if(v.t==="char")return[{key:"s:"+codesToStr(v.d),val:v}];
  return numData(v).map(x=>({key:"n:"+x,n:x}));
}
function setResult(items,v,b){ // items are {key,n|val}; produce same kind as v
  const textual=v.t==="cell"||v.t==="string"||(b&&(b.t==="cell"||b.t==="string"))||v.t==="char";
  if(!textual){items.sort((x,y)=>x.n-y.n);const d=items.map(x=>x.n);return(v.c===1&&v.r>1&&(!b||b.c===1&&b.r>1))?colOf(d):rowOf(d)}
  items.sort((x,y)=>x.key<y.key?-1:x.key>y.key?1:0);
  const texts=items.map(x=>x.key.slice(2));
  if(v.t==="string")return rowOf(texts,"string");
  return cellOf(texts.map(chr));
}

/* ---------- builtins: constants and constructors ---------- */
def("pi",()=>num(Math.PI));
def("eps",a=>num(a.length?Math.pow(2,Math.floor(Math.log2(Math.abs(scalar(a[0]))))-52):Number.EPSILON));
def("realmax",()=>num(Number.MAX_VALUE));def("realmin",()=>num(2.2250738585072014e-308));
def("intmax",()=>num(2147483647));def("intmin",()=>num(-2147483648));def("flintmax",()=>num(9007199254740992));
const filled=(x,t="double")=>a=>{const[r,c]=dimsFrom(a);return mk(t,r,c,new Array(r*c).fill(x))};
def("Inf inf",filled(Infinity));def("NaN nan",filled(NaN));def("zeros",filled(0));def("ones",filled(1));
def("true",filled(1,"logical"));def("false",filled(0,"logical"));
def("eye",a=>{const[r,c]=dimsFrom(a);return eye(r,c)});
def("cell",a=>{const[r,c]=dimsFrom(a);return mk("cell",r,c,Array.from({length:r*c},EMPTY))});
def("strings",a=>{const[r,c]=dimsFrom(a);return mk("string",r,c,new Array(r*c).fill(""))});
def("rand",(a,_,I)=>{const[r,c]=dimsFrom(a);const d=new Array(r*c);for(let k=0;k<d.length;k++)d[k]=I.rand();return mk("double",r,c,d)});
def("randn",(a,_,I)=>{const[r,c]=dimsFrom(a);const d=new Array(r*c);for(let k=0;k<d.length;k++){let u=0;while(!u)u=I.rand();d[k]=Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*I.rand())}return mk("double",r,c,d)});
def("randi",(a,_,I)=>{
  needArgs(a,1,undefined,"randi");
  let lo=1,hi;const lim=a[0];if(numel(lim)>=2){lo=lim.d[0];hi=lim.d[1]}else hi=scalar(lim);
  if(hi<lo)fail("randi's upper limit must be at least its lower limit.");
  const[r,c]=dimsFrom(a.slice(1));const d=new Array(r*c);for(let k=0;k<d.length;k++)d[k]=lo+Math.floor(I.rand()*(hi-lo+1));return mk("double",r,c,d);
});
def("randperm",(a,_,I)=>{const n=scalar(a[0]);const p=[...Array(n).keys()].map(x=>x+1);for(let i=n-1;i>0;i--){const j=Math.floor(I.rand()*(i+1));[p[i],p[j]]=[p[j],p[i]]}return rowOf(a[1]?p.slice(0,scalar(a[1])):p)});
def("rng",(a,_,I)=>{if(!a.length)return;const x=a[0];if(isText(x)){const s=textOf(x);I.rand=mulberry(s==="default"?0:Date.now())}else I.rand=mulberry(scalar(x))});
def("linspace",a=>{needArgs(a,2,3,"linspace");const lo=scalar(a[0]),hi=scalar(a[1]);const n=a[2]?Math.floor(scalar(a[2])):100;if(n<1)return rowOf([]);if(n===1)return rowOf([hi]);const d=new Array(n);for(let k=0;k<n;k++)d[k]=lo+(hi-lo)*k/(n-1);d[n-1]=hi;return rowOf(d)});
def("colon",a=>{needArgs(a,2,3);return a.length===2?colonRange(scalar(a[0]),1,scalar(a[1])):colonRange(scalar(a[0]),scalar(a[1]),scalar(a[2]))});
def("magic",a=>{
  const n=Math.floor(scalar(a[0]));if(n<1)return EMPTY();if(n===2)return mk("double",2,2,[4,3,1,2]);
  const M=Array.from({length:n},()=>new Array(n).fill(0));
  const mod=(x,m)=>((x%m)+m)%m;
  if(n%2===1){for(let i=1;i<=n;i++)for(let j=1;j<=n;j++){const A=mod(i+j-(n+3)/2,n),B=mod(i+2*j-2,n);M[i-1][j-1]=n*A+B+1}}
  else if(n%4===0){for(let i=1;i<=n;i++)for(let j=1;j<=n;j++){const v=(i-1)*n+j;const K=Math.trunc(mod(i,4)/2)===Math.trunc(mod(j,4)/2);M[i-1][j-1]=K?n*n+1-v:v}}
  else{
    const p=n/2;const S=BUILTINS.magic([num(p)]);const s=(i,j)=>S.d[i+j*p];
    for(let i=0;i<p;i++)for(let j=0;j<p;j++){M[i][j]=s(i,j);M[i][j+p]=s(i,j)+2*p*p;M[i+p][j]=s(i,j)+3*p*p;M[i+p][j+p]=s(i,j)+p*p}
    const k=(n-2)/4;const cols=[];for(let j=1;j<=k;j++)cols.push(j);for(let j=n-k+2;j<=n;j++)cols.push(j);
    for(const j of cols)for(let i=0;i<p;i++){const t=M[i][j-1];M[i][j-1]=M[i+p][j-1];M[i+p][j-1]=t}
    for(const j of [1,k+1]){const i=k;const t=M[i][j-1];M[i][j-1]=M[i+p][j-1];M[i+p][j-1]=t}
  }
  return fromMat(M,n,n);
});
def("repmat",a=>{
  needArgs(a,2,3,"repmat");const v=a[0];let m,n;
  if(a.length===2){if(numel(a[1])>=2){m=a[1].d[0];n=a[1].d[1]}else{m=n=scalar(a[1])}}else{m=scalar(a[1]);n=scalar(a[2])}
  const rows=[];const row=[];for(let j=0;j<n;j++)row.push(v);const h=n?horzcat(row):mk(v.t,v.r,0,[]);for(let i=0;i<m;i++)rows.push(h);
  return m?vertcat(rows):mk(v.t,0,h.c,[]);
});
def("reshape",a=>{
  needArgs(a,2,3,"reshape");const v=a[0];let r,c;
  if(a.length===2){r=a[1].d[0];c=a[1].d[1]}else{r=isEmptyD(a[1])?null:scalar(a[1]);c=isEmptyD(a[2])?null:scalar(a[2])}
  const N=numel(v);if(r===null)r=N/c;if(c===null)c=N/r;
  if(r*c!==N||!Number.isInteger(r)||!Number.isInteger(c))fail(`Number of elements must not change. The input has ${N} elements, so ${r}×${c} doesn't fit. Use [] for one size to work it out automatically.`);
  const o={...v,r,c,d:v.d.slice()};delete o.own;return o;
});
def("transpose ctranspose",a=>transpose(a[0]));
def("fliplr",a=>{const v=a[0];return index(v,[COLON,colonRange(v.c,-1,1)])});
def("flipud",a=>{const v=a[0];return index(v,[colonRange(v.r,-1,1),COLON])});
def("flip",a=>{const v=a[0];const d=a[1]?scalar(a[1]):defDim(v);return d===1?BUILTINS.flipud([v]):BUILTINS.fliplr([v])});
def("circshift",a=>{const v=a[0];const k=scalar(a[1]);const dim=a[2]?scalar(a[2]):defDim(v);const n=dim===1?v.r:v.c;if(!n)return v;const ids=[...Array(n).keys()].map(i=>((i-k)%n+n)%n+1);return dim===1?index(v,[rowOf(ids),COLON]):index(v,[COLON,rowOf(ids)])});
def("horzcat",a=>horzcat(a));def("vertcat",a=>vertcat(a));
def("cat",a=>{const d=scalar(a[0]);return d===1?vertcat(a.slice(1)):horzcat(a.slice(1))});
def("diag",a=>{const v=a[0];if(v.r===1||v.c===1){const n=numel(v);const o=EMPTY();o.r=n;o.c=n;o.d=new Array(n*n).fill(0);for(let i=0;i<n;i++)o.d[i+i*n]=v.d[i];return o}const n=Math.min(v.r,v.c);const d=[];for(let i=0;i<n;i++)d.push(v.d[i+i*v.r]);return colOf(d)});
def("triu tril",(a,_,I,name)=>{const v=toDouble(a[0]);const k=a[1]?scalar(a[1]):0;const d=v.d.map((x,q)=>{const i=q%v.r,j=Math.floor(q/v.r);return(name==="triu"?j-i>=k:j-i<=k)?x:0});return mk("double",v.r,v.c,d)});
def("meshgrid",(a,nout)=>{const x=a[0],y=a[1]||a[0];const nx=numel(x),ny=numel(y);const X=new Array(nx*ny),Y=new Array(nx*ny);for(let i=0;i<ny;i++)for(let j=0;j<nx;j++){X[i+j*ny]=x.d[j];Y[i+j*ny]=y.d[i]}return[mk("double",ny,nx,X),mk("double",ny,nx,Y)]});

/* ---------- builtins: size and type ---------- */
def("size",(a,nout)=>{
  needArgs(a,1,2,"size");const v=a[0];
  if(a.length===2){const d=scalar(a[1]);return num(d===1?v.r:d===2?v.c:1)}
  if(nout<=1)return rowOf([v.r,v.c]);
  const out=[num(v.r),num(v.c)];for(let k=2;k<nout;k++)out.push(num(1));return out;
});
def("numel",a=>{needArgs(a,1,1,"numel");return num(numel(a[0]))});
def("length",a=>{needArgs(a,1,1,"length");const v=a[0];return num(numel(v)?Math.max(v.r,v.c):0)});
def("ndims",()=>num(2));
def("isempty",a=>{needArgs(a,1,1,"isempty");return bool(numel(a[0])===0)});
def("isscalar",a=>bool(numel(a[0])===1));
def("isvector",a=>bool((a[0].r===1||a[0].c===1)&&numel(a[0])>=1));
def("isrow",a=>bool(a[0].r===1));def("iscolumn",a=>bool(a[0].c===1));def("ismatrix",()=>bool(true));def("issquare",a=>bool(a[0].r===a[0].c));
def("class",a=>{needArgs(a,1,1,"class");return chr(cls(a[0]))});
def("isa",a=>{const c=cls(a[0]),t=textOf(a[1]);return bool(c===t||(t==="numeric"&&c==="double")||(t==="float"&&c==="double"))});
def("isnumeric",a=>bool(a[0].t==="double"));def("isfloat",a=>bool(a[0].t==="double"));def("isreal",a=>bool(isNum(a[0])));def("isinteger",()=>bool(false));
def("ischar",a=>bool(a[0].t==="char"));def("isstring",a=>bool(a[0].t==="string"));def("iscell",a=>bool(a[0].t==="cell"));
def("isstruct",a=>bool(a[0].t==="struct"));def("islogical",a=>bool(a[0].t==="logical"));
def("is_function_handle",a=>bool(a[0].t==="fh"));
def("iscellstr",a=>bool(a[0].t==="cell"&&a[0].d.every(x=>x.t==="char"&&x.r<=1)));
def("istext",a=>bool(isText(a[0])||(a[0].t==="cell"&&a[0].d.every(x=>x.t==="char"))));
def("double single",a=>{const v=a[0];if(v.t==="string")return mk("double",v.r,v.c,v.d.map(s=>parseNumber(s)));if(v.t==="cell")fail("Conversion to double from cell is not possible. Use str2double for a cell of text.");return toDouble(v)});
def("int8 int16 int32 int64 uint8 uint16 uint32 uint64",(a,_,I,name)=>{
  const lim={int8:[-128,127],int16:[-32768,32767],int32:[-2147483648,2147483647],int64:[-9223372036854775808,9223372036854775807],uint8:[0,255],uint16:[0,65535],uint32:[0,4294967295],uint64:[0,18446744073709551615]}[name];
  return mapNum(a[0],x=>Math.min(lim[1],Math.max(lim[0],roundHalfAway(x))));
});
def("logical",a=>{const v=a[0];if(!isNum(v))fail(`Conversion to logical from ${cls(v)} is not possible.`);return mapNum(v,x=>{if(Number.isNaN(x))fail("NaN's cannot be converted to logicals.");return x?1:0},"logical")});
def("exist",(a,_,I)=>{const n=textOf(a[0]);const kind=a[1]?textOf(a[1]):"";if(I.F.vars.has(n))return num(1);if(kind==="var")return num(0);if(I.funcs[n])return num(2);if(BUILTINS[n])return num(5);return num(0)});
def("isvarname",a=>bool(isText(a[0])&&/^[A-Za-z]\w{0,62}$/.test(textOf(a[0]))&&!KW.has(textOf(a[0]))));

/* ---------- builtins: elementwise maths ---------- */
const ELEM={abs:Math.abs,sqrt:Math.sqrt,exp:Math.exp,log:Math.log,log10:Math.log10,log2:Math.log2,log1p:Math.log1p,expm1:Math.expm1,
  sin:Math.sin,cos:Math.cos,tan:Math.tan,asin:Math.asin,acos:Math.acos,atan:Math.atan,sinh:Math.sinh,cosh:Math.cosh,tanh:Math.tanh,
  sind:x=>{const r=x%360;if(r%180===0)return 0;return Math.sin(x*Math.PI/180)},cosd:x=>{const r=((x%360)+360)%360;if(r===90||r===270)return 0;return Math.cos(x*Math.PI/180)},
  tand:x=>Math.tan(x*Math.PI/180),asind:x=>Math.asin(x)*180/Math.PI,acosd:x=>Math.acos(x)*180/Math.PI,atand:x=>Math.atan(x)*180/Math.PI,
  deg2rad:x=>x*Math.PI/180,rad2deg:x=>x*180/Math.PI,
  floor:Math.floor,ceil:Math.ceil,fix:Math.trunc,sign:Math.sign,gamma:x=>gammaFn(x),cbrt:Math.cbrt,
  factorial:x=>{if(!(x>=0&&Number.isInteger(x)))fail("N must be an array of real non-negative integers.");let r=1;for(let k=2;k<=x;k++)r*=k;return r},
};
for(const k in ELEM)def(k,a=>{needArgs(a,1,1,k);return mapNum(a[0],ELEM[k])});
function gammaFn(x){if(Number.isInteger(x)&&x>0&&x<171){let r=1;for(let k=2;k<x;k++)r*=k;return r}const g=7,c=[0.99999999999980993,676.5203681218851,-1259.1392167224028,771.32342877765313,-176.61502916214059,12.507343278686905,-0.13857109526572012,9.9843695780195716e-6,1.5056327351493116e-7];if(x<0.5)return Math.PI/(Math.sin(Math.PI*x)*gammaFn(1-x));x-=1;let s=c[0];for(let i=1;i<g+2;i++)s+=c[i]/(x+i);const t=x+g+0.5;return Math.sqrt(2*Math.PI)*Math.pow(t,x+0.5)*Math.exp(-t)*s}
def("isnan",a=>mapNum(a[0],x=>Number.isNaN(x)?1:0,"logical"));
def("isinf",a=>mapNum(a[0],x=>(x===Infinity||x===-Infinity)?1:0,"logical"));
def("isfinite",a=>mapNum(a[0],x=>Number.isFinite(x)?1:0,"logical"));
def("isprime",a=>mapNum(a[0],x=>isPrime(x)?1:0,"logical"));
def("primes",a=>{const n=scalar(a[0]);const d=[];for(let k=2;k<=n;k++)if(isPrime(k))d.push(k);return rowOf(d)});
def("round",a=>{needArgs(a,1,3,"round");const n=a[1]?scalar(a[1]):0;return mapNum(a[0],x=>n?roundDigits(x,n):roundHalfAway(x))});
def("mod",a=>{needArgs(a,2,2,"mod");return bcast(a[0],a[1],(x,y)=>{if(y===0)return x;const r=x-Math.floor(x/y)*y;return Math.abs(r-y)<1e-12*Math.abs(y)?0:r},"double")});
def("rem",a=>{needArgs(a,2,2,"rem");return bcast(a[0],a[1],(x,y)=>y===0?NaN:x-Math.trunc(x/y)*y,"double")});
def("idivide",a=>bcast(a[0],a[1],(x,y)=>Math.trunc(x/y),"double"));
def("power",a=>bcast(a[0],a[1],Math.pow,"double"));def("times",a=>bcast(a[0],a[1],(x,y)=>x*y,"double"));
def("plus",a=>bcast(a[0],a[1],(x,y)=>x+y,"double","+"));def("minus",a=>bcast(a[0],a[1],(x,y)=>x-y,"double"));
def("rdivide",a=>bcast(a[0],a[1],(x,y)=>x/y,"double"));def("mtimes",a=>matmul(a[0],a[1]));
def("hypot",a=>bcast(a[0],a[1],Math.hypot,"double"));def("atan2",a=>bcast(a[0],a[1],Math.atan2,"double"));
def("nthroot",a=>bcast(a[0],a[1],(x,n)=>{if(x<0&&n%2===1)return -Math.pow(-x,1/n);return Math.pow(x,1/n)},"double"));
def("gcd",a=>bcast(a[0],a[1],gcd,"double"));def("lcm",a=>bcast(a[0],a[1],(x,y)=>x&&y?Math.abs(x*y)/gcd(x,y):0,"double"));
def("nchoosek",a=>{const n=scalar(a[0]),k=scalar(a[1]);if(numel(a[0])>1)fail("This site supports nchoosek(n, k) with a single n.");let r=1;for(let i=1;i<=k;i++)r=r*(n-k+i)/i;return num(Math.round(r))});
def("not",a=>mapNum(a[0],x=>x?0:1,"logical"));
def("and",a=>logicalOp(a[0],a[1],"&"));def("or",a=>logicalOp(a[0],a[1],"|"));def("xor",a=>bcast(a[0],a[1],(x,y)=>(!!x!==!!y)?1:0,"logical"));
def("eq",a=>bcast(a[0],a[1],CMP["=="],"logical","=="));def("ne",a=>bcast(a[0],a[1],CMP["~="],"logical","~="));
def("lt",a=>bcast(a[0],a[1],CMP["<"],"logical","<"));def("gt",a=>bcast(a[0],a[1],CMP[">"],"logical",">"));
def("le",a=>bcast(a[0],a[1],CMP["<="],"logical","<="));def("ge",a=>bcast(a[0],a[1],CMP[">="],"logical",">="));

/* ---------- builtins: reductions ---------- */
function needNumeric(v,name){if(!isNum(v))fail(`Invalid data type. ${name} needs numbers or logical values, not ${cls(v)}.${v.t==="cell"?" To use the numbers inside a cell array, take them out first, for example [c{:}].":""}`)}
def("sum",a=>{needArgs(a,1,3,"sum");needNumeric(a[0],"sum");const v=a[0];const dim=getDim(a,1,v);const omit=a.some(x=>isText(x)&&textOf(x).toLowerCase()==="omitnan");return reduce(v,dim,L=>sumL(omit?L.filter(x=>!Number.isNaN(x)):L))});
def("prod",a=>{needNumeric(a[0],"prod");return reduce(a[0],getDim(a,1,a[0]),L=>L.reduce((p,x)=>p*x,1))});
def("mean",a=>{needArgs(a,1,3,"mean");needNumeric(a[0],"mean");const v=a[0];const omit=a.some(x=>isText(x)&&textOf(x).toLowerCase()==="omitnan");return reduce(v,getDim(a.filter(x=>!(isText(x)&&textOf(x).toLowerCase()==="omitnan")),1,v),L=>{if(omit)L=L.filter(x=>!Number.isNaN(x));return L.length?sumL(L)/L.length:NaN})});
def("median",a=>{needNumeric(a[0],"median");return reduce(a[0],getDim(a,1,a[0]),median)});
def("mode",a=>{needNumeric(a[0],"mode");return reduce(a[0],getDim(a,1,a[0]),mode)});
def("std",a=>{needNumeric(a[0],"std");const w=a[1]&&!isEmptyD(a[1])?scalar(a[1]):0;return reduce(a[0],getDim(a,2,a[0]),L=>Math.sqrt(variance(L,w)))});
def("var",a=>{needNumeric(a[0],"var");const w=a[1]&&!isEmptyD(a[1])?scalar(a[1]):0;return reduce(a[0],getDim(a,2,a[0]),L=>variance(L,w))});
def("range",a=>{needNumeric(a[0],"range");return reduce(a[0],getDim(a,1,a[0]),L=>Math.max(...L)-Math.min(...L))});
def("any",a=>{const v=a[0];needNumeric(v,"any");return reduce(v,getDim(a,1,v),L=>L.some(x=>x&&!Number.isNaN(x))?1:0,"logical")});
def("all",a=>{const v=a[0];needNumeric(v,"all");return reduce(v,getDim(a,1,v),L=>L.every(x=>x!==0)?1:0,"logical")});
def("nnz",a=>{needNumeric(a[0],"nnz");return num(a[0].d.filter(x=>x!==0).length)});
def("dot",a=>{const x=numData(a[0]),y=numData(a[1]);if(x.length!==y.length)fail("A and B must be the same size.");let s=0;for(let i=0;i<x.length;i++)s+=x[i]*y[i];return num(s)});
def("cross",a=>{const x=numData(a[0]),y=numData(a[1]);if(x.length!==3||y.length!==3)fail("cross needs two vectors of length 3.");const d=[x[1]*y[2]-x[2]*y[1],x[2]*y[0]-x[0]*y[2],x[0]*y[1]-x[1]*y[0]];return a[0].c===1?colOf(d):rowOf(d)});
def("trace",a=>{const v=a[0];let s=0;for(let i=0;i<Math.min(v.r,v.c);i++)s+=v.d[i+i*v.r];return num(s)});
def("det",a=>num(det(a[0])));def("inv",(a,_,I)=>inv(a[0],I));
def("norm",a=>{const v=a[0];const A=numData(v);const p=a[1]?(isText(a[1])?textOf(a[1]):scalar(a[1])):2;
  if(v.r===1||v.c===1){if(p===Infinity||p==="inf"||p==="Inf")return num(Math.max(...A.map(Math.abs)));if(p===1)return num(sumL(A.map(Math.abs)));if(p==="fro"||p===2)return num(Math.sqrt(sumL(A.map(x=>x*x))));return num(Math.pow(sumL(A.map(x=>Math.pow(Math.abs(x),p))),1/p))}
  if(p==="fro")return num(Math.sqrt(sumL(A.map(x=>x*x))));
  const AtA=matmul(transpose(v),v);let x=new Array(v.c).fill(1),lam=0;for(let it=0;it<500;it++){const y=matmul(AtA,colOf(x)).d;const nrm=Math.sqrt(sumL(y.map(z=>z*z)));if(!nrm)return num(0);x=y.map(z=>z/nrm);lam=nrm}return num(Math.sqrt(lam));
});
def("cumsum cumprod",(a,_,I,name)=>{const v=a[0];needNumeric(v,name);const{L,build}=slices(v,getDim(a,1,v));return build(L.map(l=>{let s=name==="cumsum"?0:1;return l.map(x=>s=name==="cumsum"?s+x:s*x)}),"double")});
def("cummax cummin",(a,_,I,name)=>{const v=a[0];const{L,build}=slices(v,getDim(a,1,v));return build(L.map(l=>{let s=null;return l.map(x=>s=s===null?x:(name==="cummax"?Math.max(s,x):Math.min(s,x)))}),"double")});
def("diff",a=>{let v=toDouble(a[0]);const n=a[1]?scalar(a[1]):1;for(let k=0;k<n;k++){const dim=v.r!==1?1:2;const{L,build}=slices(v,dim);v=build(L.map(l=>l.slice(1).map((x,i)=>x-l[i])),"double");if(dim===2)v.r=v.r||1}return v});
def("movmean movsum",(a,_,I,name)=>{const v=a[0];const k=scalar(a[1]);const A=numData(v);const n=A.length;const before=Math.floor((k-1)/2)+((k%2)?0:1),after=Math.floor((k-1)/2);const kb=k%2?Math.floor(k/2):k/2,ka=k%2?Math.floor(k/2):k/2-1;const d=A.map((_,i)=>{const lo=Math.max(0,i-kb),hi=Math.min(n-1,i+ka);let s=0;for(let q=lo;q<=hi;q++)s+=A[q];return name==="movsum"?s:s/(hi-lo+1)});return mk("double",v.r,v.c,d)});
function minmax(a,nout,isMax){
  needArgs(a,1,3,isMax?"max":"min");
  const better=isMax?(x,y)=>x>y:(x,y)=>x<y;
  if(a.length>=2&&!isEmptyD(a[1])){
    if(nout>1)fail(`${isMax?"max":"min"} with two input arrays only returns one output.`);
    return[bcast(a[0],a[1],(x,y)=>Number.isNaN(x)?y:Number.isNaN(y)?x:(better(x,y)?x:y),"double")];
  }
  const v=a[0];needNumeric(v,isMax?"max":"min");
  if(!numel(v))return[EMPTY(),EMPTY()];
  const dim=a.length>=3?getDim(a,2,v):defDim(v);
  const pick=L=>{let bi=-1;for(let i=0;i<L.length;i++){if(Number.isNaN(L[i]))continue;if(bi<0||better(L[i],L[bi]))bi=i}return bi<0?[NaN,1]:[L[bi],bi+1]};
  if(dim==="all"){const[m,i]=pick(v.d);return[num(m),num(i)]}
  const{L}=slices(v,dim);const res=L.map(pick);
  const shape=d=>dim===1?mk(v.t==="logical"?"logical":"double",1,v.c,d):mk("double",v.r,1,d);
  const m=shape(res.map(x=>x[0]));if(v.t==="char")m.t="double";
  const ix=shape(res.map(x=>x[1]));ix.t="double";
  return[m,ix];
}
def("max",(a,nout)=>minmax(a,nout,true));def("min",(a,nout)=>minmax(a,nout,false));
def("bounds",a=>[minmax([a[0]],1,false)[0],minmax([a[0]],1,true)[0]]);
def("sort",(a,nout)=>{
  needArgs(a,1,3,"sort");const v=a[0];
  let desc=false,dim=null;for(const x of a.slice(1)){if(isText(x)){const s=textOf(x).toLowerCase();if(s==="descend")desc=true;else if(s!=="ascend")fail("The sort direction must be 'ascend' or 'descend'.")}else dim=scalar(x)}
  if(v.t==="cell"||v.t==="string"){
    const texts=textList(v);const idx=texts.map((s,i)=>i);idx.sort((x,y)=>{const A=texts[x],B=texts[y];const c=A<B?-1:A>B?1:0;return(desc?-c:c)||x-y});
    const d=idx.map(i=>v.d[i]);const o=mk(v.t,v.r,v.c,d);return[o,mk("double",v.r,v.c,idx.map(i=>i+1))];
  }
  needNumeric(v,"sort");
  if(dim===null)dim=defDim(v);
  const{L,build}=slices(v,dim);const I=[];
  const S=L.map(l=>{const idx=l.map((_,i)=>i);idx.sort((x,y)=>{const A=l[x],B=l[y];if(Number.isNaN(A)&&Number.isNaN(B))return x-y;if(Number.isNaN(A))return desc?-1:1;if(Number.isNaN(B))return desc?1:-1;return(desc?B-A:A-B)||x-y});I.push(idx.map(i=>i+1));return idx.map(i=>l[i])});
  const out=build(S);return[out,build(I,"double")];
});
def("sortrows",(a,nout)=>{const v=a[0];let col=a[1]?scalar(a[1]):1;const desc=col<0;col=Math.abs(col)-1;const idx=[...Array(v.r).keys()];idx.sort((x,y)=>{const A=v.d[x+col*v.r],B=v.d[y+col*v.r];return(desc?B-A:A-B)||x-y});return[index(v,[colOf(idx.map(i=>i+1)),COLON]),colOf(idx.map(i=>i+1))]});
def("find",(a,nout)=>{
  needArgs(a,1,3,"find");const v=a[0];const A=numData(v);let lim=a[1]?scalar(a[1]):Infinity;const last=a[2]&&textOf(a[2])==="last";
  let ids=[];for(let i=0;i<A.length;i++)if(A[i])ids.push(i);
  if(last)ids=ids.slice(Math.max(0,ids.length-lim));else ids=ids.slice(0,lim);
  const shape=d=>v.r===1&&v.c!==1?rowOf(d):(v.r===1&&v.c===1?rowOf(d):colOf(d));
  if(nout>=2)return[shape(ids.map(i=>i%v.r+1)),shape(ids.map(i=>Math.floor(i/v.r)+1)),shape(ids.map(i=>A[i]))];
  const o=shape(ids.map(i=>i+1));if(!ids.length){o.r=v.r===1?1:0;o.c=v.r===1?0:(v.c===1?1:0);if(v.r!==1&&v.c!==1){o.r=0;o.c=1}}return o;
});
def("unique",(a,nout)=>{
  const v=a[0];const stable=a.slice(1).some(x=>isText(x)&&textOf(x)==="stable");
  const it=elems(v).map((e,i)=>({...e,i}));const seen=new Map();for(const e of it)if(!seen.has(e.key))seen.set(e.key,e);
  let u=[...seen.values()];
  if(!stable){if(u[0]&&u[0].n!==undefined)u.sort((x,y)=>x.n-y.n);else u.sort((x,y)=>x.key<y.key?-1:x.key>y.key?1:0)}
  let C;
  if(v.t==="cell")C=cellOf(u.map(e=>e.val),...(v.c===1&&v.r>1?[u.length,1]:[1,u.length]));
  else if(v.t==="string")C=v.c===1&&v.r>1?colOf(u.map(e=>e.key.slice(2)),"string"):rowOf(u.map(e=>e.key.slice(2)),"string");
  else{const d=u.map(e=>e.n);C=v.r===1?rowOf(d,v.t==="logical"?"logical":v.t==="char"?"char":"double"):colOf(d,v.t==="logical"?"logical":"double")}
  const pos=new Map(u.map((e,k)=>[e.key,k+1]));
  return[C,colOf(u.map(e=>e.i+1)),colOf(it.map(e=>pos.get(e.key)))];
});
def("ismember",(a,nout)=>{
  const A=elems(a[0]),B=elems(a[1]);const pos=new Map();B.forEach((e,i)=>{if(!pos.has(e.key))pos.set(e.key,i+1)});
  const v=a[0];const shapeOf=d=>v.t==="char"?mk("double",1,1,d):mk("double",v.r,v.c,d);
  const tf=shapeOf(A.map(e=>pos.has(e.key)?1:0));tf.t="logical";return[tf,shapeOf(A.map(e=>pos.get(e.key)||0))];
});
def("intersect union setdiff",(a,nout,I,name)=>{
  const A=elems(a[0]),B=elems(a[1]);const kb=new Set(B.map(e=>e.key)),ka=new Set(A.map(e=>e.key));const m=new Map();
  if(name==="intersect")for(const e of A){if(kb.has(e.key))m.set(e.key,e)}
  else if(name==="union")for(const e of [...A,...B])m.set(e.key,e);
  else for(const e of A)if(!kb.has(e.key))m.set(e.key,e);
  return setResult([...m.values()],a[0],a[1]);
});
def("histcounts",a=>{const A=numData(a[0]).filter(Number.isFinite);let edges;if(a[1]&&numel(a[1])>1)edges=a[1].d.slice();else{const nb=a[1]?scalar(a[1]):Math.max(1,Math.ceil(Math.sqrt(A.length)));const lo=Math.min(...A),hi=Math.max(...A);edges=[];for(let k=0;k<=nb;k++)edges.push(lo+(hi-lo)*k/nb)}const c=new Array(edges.length-1).fill(0);for(const x of A){for(let k=0;k<c.length;k++){if(x>=edges[k]&&(x<edges[k+1]||(k===c.length-1&&x===edges[k+1]))){c[k]++;break}}}return[rowOf(c),rowOf(edges)]});
def("trapz",a=>{let x,y;if(a.length===1){y=numData(a[0]);x=y.map((_,i)=>i+1)}else{x=numData(a[0]);y=numData(a[1])}let s=0;for(let i=1;i<y.length;i++)s+=(x[i]-x[i-1])*(y[i]+y[i-1])/2;return num(s)});
def("polyval",a=>{const p=numData(a[0]);return mapNum(a[1],x=>{let s=0;for(const c of p)s=s*x+c;return s})});
def("polyfit",(a,_,I)=>{const x=numData(a[0]),y=numData(a[1]),n=scalar(a[2]);if(x.length!==y.length)fail("The first two inputs must have the same number of elements.");const V=mk("double",x.length,n+1,[]);for(let j=0;j<=n;j++)for(let i=0;i<x.length;i++)V.d[i+j*x.length]=Math.pow(x[i],n-j);const p=mldivide(V,colOf(y),I);return rowOf(p.d)});
def("interp1",a=>{const x=numData(a[0]),y=numData(a[1]);return mapNum(a[2],q=>{for(let i=0;i<x.length-1;i++){if(q>=x[i]&&q<=x[i+1]){if(x[i+1]===x[i])return y[i];return y[i]+(y[i+1]-y[i])*(q-x[i])/(x[i+1]-x[i])}}return NaN})});

/* ---------- builtins: text ---------- */
function parseNumber(s){s=String(s).trim().replace(/,/g,"");if(/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(s))return parseFloat(s);if(/^[+-]?inf$/i.test(s))return s[0]==="-"?-Infinity:Infinity;if(/^nan$/i.test(s))return NaN;return NaN}
def("num2str",a=>{
  needArgs(a,1,2,"num2str");const v=a[0];
  if(v.t==="char")return v;if(v.t==="string")return chr(v.d[0]);
  if(!isNum(v))fail(`num2str needs a number, not ${cls(v)}.`);
  if(a[1]){
    if(isText(a[1]))return chr(formatText(a[1],[v]));
    const p=scalar(a[1]);return chr(v.d.map(x=>cfmtG(x,p)).join("  "));
  }
  if(numel(v)===0)return chr("");
  if(numel(v)===1)return chr(numToString(v.d[0]));
  const fin=v.d.filter(Number.isFinite);const allInt=fin.every(Number.isInteger);
  let strs;
  if(allInt){const w=Math.max(...v.d.map(x=>numToString(Math.abs(x)).length))+2+(v.d.some(x=>x<0)?1:0);strs=v.d.map(x=>numToString(x).padStart(w))}
  else{const mx=Math.max(...fin.map(Math.abs));let nd=Math.floor(Math.log10(mx));if(!Number.isFinite(nd))nd=0;nd=Math.min(Math.max(nd+5,5),16);const w=nd+7+(v.d.some(x=>x<0)?1:0);strs=v.d.map(x=>Number.isFinite(x)?cfmtG(x,nd).padStart(w):infStr(x).padStart(w))}
  const rows=[];for(let i=0;i<v.r;i++){let s="";for(let j=0;j<v.c;j++)s+=strs[i+j*v.r];rows.push(s)}
  const lead=Math.min(...rows.map(s=>s.length-s.trimStart().length));
  const out=rows.map(s=>s.slice(lead).replace(/\s+$/,""));
  return out.length===1?chr(out[0]):chrRowsToMat(out);
});
def("int2str",a=>BUILTINS.num2str([mapNum(a[0],roundHalfAway)]));
def("mat2str",a=>chr(mat2str(a[0],a[1]?scalar(a[1]):undefined)));
def("str2double",a=>{const v=a[0];if(v.t==="cell")return mk("double",v.r,v.c,v.d.map(x=>isText(x)?parseNumber(textOf(x)):NaN));if(v.t==="string")return mk("double",v.r,v.c,v.d.map(parseNumber));if(v.t==="char")return num(v.r<=1?parseNumber(codesToStr(v.d)):NaN);return num(NaN)});
def("str2num",(a,nout,I)=>{const s=textOf(a[0]);try{const J=new Interp();J.t0=Date.now();const v=J.evalExpr("["+s+"]");return[v,bool(true)]}catch(e){return[EMPTY(),bool(false)]}});
def("string",a=>{
  if(!a.length)return sstr("");const v=a[0];
  if(v.t==="string")return v;
  if(v.t==="char")return v.r<=1?sstr(codesToStr(v.d)):mk("string",v.r,1,charRows(v));
  if(v.t==="cell")return mk("string",v.r,v.c,v.d.map(x=>x.t==="string"?x.d[0]:isNum(x)&&x.t!=="char"?numToString(x.d[0]):textOf(x)));
  if(v.t==="logical")return mk("string",v.r,v.c,v.d.map(x=>x?"true":"false"));
  if(isNum(v))return mk("string",v.r,v.c,v.d.map(numToString));
  fail(`Conversion to string from ${cls(v)} is not possible.`);
});
def("char",a=>{
  if(!a.length)return chr("");
  if(a.length>1)return chrRowsToMat(a.map(x=>textList(x)).flat());
  const v=a[0];
  if(v.t==="char")return v;
  if(v.t==="string")return numel(v)===1?chr(v.d[0]):chrRowsToMat(v.d);
  if(v.t==="cell")return chrRowsToMat(v.d.map(x=>textOf(x)));
  if(isNum(v))return mk("char",v.r,v.c,v.d.map(x=>Math.max(0,Math.round(x))));
  fail(`Conversion to char from ${cls(v)} is not possible.`);
});
def("cellstr",a=>{const v=a[0];if(v.t==="cell")return v;if(v.t==="string")return mk("cell",v.r,v.c,v.d.map(chr));if(v.t==="char")return colOf(charRows(v).map(s=>chr(s.replace(/\s+$/,""))),"cell");fail("cellstr needs text.")});
def("sprintf",a=>{needArgs(a,1,undefined,"sprintf");const s=formatText(a[0],a.slice(1));return a[0].t==="string"?sstr(s):chr(s)});
def("compose",a=>sstr(formatText(a[0],a.slice(1))));
def("fprintf",(a,nout,I)=>{
  needArgs(a,1,undefined,"fprintf");
  let args=a;if(isNum(a[0])&&a[0].t!=="char"&&numel(a[0])===1&&(a[0].d[0]===1||a[0].d[0]===2)&&a.length>=2&&isText(a[1]))args=a.slice(1);
  if(!isText(args[0]))fail(`fprintf's first input must be the text to print, like fprintf('%d\\n', x). To show a number on its own, use disp(x).`);
  const s=formatText(args[0],args.slice(1));I.write(s);
  if(nout>0)return num(s.length);
});
def("disp",(a,_,I)=>{needArgs(a,1,1,"disp");I.write(dispText(a[0],I.long))});
def("display",(a,_,I)=>{I.write(displayText("ans",a[0],I.long,I.compact))});
def("upper",a=>mapText(a[0],s=>s.toUpperCase()));def("lower",a=>mapText(a[0],s=>s.toLowerCase()));
def("strtrim",a=>mapText(a[0],s=>s.replace(/^[\s\0]+|[\s\0]+$/g,"")));
def("deblank",a=>mapText(a[0],s=>s.replace(/[\s\0]+$/g,"")));
def("strip",a=>mapText(a[0],s=>s.trim()));
def("reverse",a=>mapText(a[0],s=>[...s].reverse().join("")));
def("blanks",a=>chr(" ".repeat(Math.max(0,scalar(a[0])))));
def("newline",()=>chr("\n"));
def("strlength",a=>{const v=a[0];if(v.t==="char")return num(v.c);if(v.t==="string")return mk("double",v.r,v.c,v.d.map(s=>s.length));if(v.t==="cell")return mk("double",v.r,v.c,v.d.map(x=>textOf(x).length));fail("strlength needs text.")});
def("strcat",a=>{
  if(a.some(x=>x.t==="cell")){const n=Math.max(...a.map(x=>x.t==="cell"?numel(x):1));const d=[];for(let k=0;k<n;k++)d.push(chr(a.map(x=>x.t==="cell"?textOf(x.d[k]):textOf(x)).join("")));const shape=a.find(x=>x.t==="cell");return mk("cell",shape.r,shape.c,d)}
  if(a.some(x=>x.t==="string"))return sstr(a.map(x=>textOf(x)).join(""));
  return chr(a.map(x=>x.t==="char"?textOf(x).replace(/[ \t\n\0]+$/,""):textOf(x)).join(""));
});
const cmpFn=(ci,n)=>(x,y)=>{if(n!==undefined){x=x.slice(0,n);y=y.slice(0,n)}return ci?x.toLowerCase()===y.toLowerCase():x===y};
function strcmpAny(a,b,f){
  const isT=v=>isText(v)&&(v.t==="string"?true:v.r<=1);
  if(a.t==="cell"||b.t==="cell"||(a.t==="string"&&numel(a)!==1)||(b.t==="string"&&numel(b)!==1)){
    const L=v=>v.t==="cell"?v.d.map(x=>isT(x)?textOf(x):null):v.t==="string"?v.d:[isT(v)?textOf(v):null];
    const A=L(a),B=L(b);const shape=(a.t==="cell"||a.t==="string")&&numel(a)!==1?a:b;
    const n=Math.max(A.length,B.length);const d=[];
    for(let k=0;k<n;k++){const x=A.length===1?A[0]:A[k],y=B.length===1?B[0]:B[k];d.push(x!==null&&y!==null&&f(x,y)?1:0)}
    return mk("logical",shape.r,shape.c,d);
  }
  if(!isT(a)||!isT(b))return bool(false);
  return bool(f(textOf(a),textOf(b)));
}
def("strcmp",a=>{needArgs(a,2,2,"strcmp");return strcmpAny(a[0],a[1],cmpFn(false))});
def("strcmpi",a=>{needArgs(a,2,2,"strcmpi");return strcmpAny(a[0],a[1],cmpFn(true))});
def("strncmp",a=>strcmpAny(a[0],a[1],cmpFn(false,scalar(a[2]))));def("strncmpi",a=>strcmpAny(a[0],a[1],cmpFn(true,scalar(a[2]))));
def("strfind",a=>{const s=textOf(a[0]),p=textOf(a[1]);const d=[];if(p.length)for(let i=s.indexOf(p);i>=0;i=s.indexOf(p,i+1))d.push(i+1);return d.length?rowOf(d):mk("double",1,0,[])});
def("strrep replace",a=>{needArgs(a,3,3);const o=textOf(a[1]),nw=textOf(a[2]);return mapText(a[0],s=>o.length?s.split(o).join(nw):s)});
def("contains",a=>{const pats=textList(a[1]);const ci=a[2]&&a[3]&&scalar(a[3]);return textPred(a[0],s=>pats.some(p=>ci?s.toLowerCase().includes(p.toLowerCase()):s.includes(p)))});
def("startsWith",a=>{const pats=textList(a[1]);return textPred(a[0],s=>pats.some(p=>s.startsWith(p)))});
def("endsWith",a=>{const pats=textList(a[1]);return textPred(a[0],s=>pats.some(p=>s.endsWith(p)))});
def("count",a=>{const p=textOf(a[1]);const f=s=>{if(!p)return 0;let n=0;for(let i=s.indexOf(p);i>=0;i=s.indexOf(p,i+p.length))n++;return n};const v=a[0];if(v.t==="char")return num(f(textOf(v)));return mk("double",v.r,v.c,textList(v).map(f))});
def("strsplit",a=>{const s=textOf(a[0]);let parts;if(a[1]){const ds=textList(a[1]).map(unescapeFmt);const re=new RegExp(ds.map(d=>d.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).join("|"));parts=s.split(re)}else parts=s.split(/\s+/);return cellOf(parts.map(chr))});
def("split",a=>{const s=textOf(a[0]);const parts=a[1]?s.split(textOf(a[1])):s.trim().split(/\s+/);return colOf(parts,"string")});
def("strjoin",a=>{const L=textList(a[0]);const d=a[1]?unescapeFmt(textOf(a[1])):" ";return chr(L.join(d))});
def("join",a=>{const L=textList(a[0]);const d=a[1]?textOf(a[1]):" ";return sstr(L.join(d))});
def("extractBefore extractAfter",(a,_,I,name)=>mapText(a[0],s=>{const p=a[1];let i;if(isText(p)){const t=textOf(p);i=s.indexOf(t);if(i<0)return"";return name==="extractBefore"?s.slice(0,i):s.slice(i+t.length)}i=scalar(p);return name==="extractBefore"?s.slice(0,i-1):s.slice(i)}));
def("pad",a=>mapText(a[0],s=>s.padEnd(a[1]?scalar(a[1]):s.length)));
def("isspace",a=>mapNum(a[0],x=>/\s/.test(String.fromCharCode(x))?1:0,"logical"));
def("isletter",a=>mapNum(a[0],x=>/[A-Za-z]/.test(String.fromCharCode(x))?1:0,"logical"));
def("isstrprop",a=>{const t=textOf(a[1]);const re={alpha:/[A-Za-z]/,digit:/[0-9]/,upper:/[A-Z]/,lower:/[a-z]/,wspace:/\s/,alphanum:/[A-Za-z0-9]/,punct:/[!-\/:-@\[-`{-~]/}[t];if(!re)fail(`Unknown category '${t}'.`);return mapNum(a[0],x=>re.test(String.fromCharCode(x))?1:0,"logical")});
function mRegex(p,opts=""){return new RegExp(p.replace(/\(\?<(\w+)>/g,"(?<$1>"),opts)}
def("regexprep",a=>{const p=textOf(a[1]),r=textOf(a[2]).replace(/\$(\d)/g,"$$$1");const ci=a.slice(3).some(x=>isText(x)&&textOf(x)==="ignorecase");return mapText(a[0],s=>s.replace(mRegex(p,"g"+(ci?"i":"")),r))});
def("regexp regexpi",(a,nout,I,name)=>{
  const s=textOf(a[0]),p=textOf(a[1]);const opts=a.slice(2).map(x=>textOf(x));const once=opts.includes("once");
  const re=mRegex(p,"g"+(name==="regexpi"?"i":""));const ms=[...s.matchAll(re)];
  const outs={match:()=>once?chr(ms[0]?ms[0][0]:""):cellOf(ms.map(m=>chr(m[0]))),start:()=>once?(ms[0]?num(ms[0].index+1):EMPTY()):rowOf(ms.map(m=>m.index+1)),
    tokens:()=>once?(ms[0]?cellOf(ms[0].slice(1).map(x=>chr(x||""))):cellOf([])):cellOf(ms.map(m=>cellOf(m.slice(1).map(x=>chr(x||""))))),
    split:()=>cellOf(s.split(mRegex(p,name==="regexpi"?"i":"")).filter(x=>x!==undefined).map(chr))};
  const want=opts.filter(o=>outs[o]);if(!want.length)return[outs.start()];
  return want.map(o=>outs[o]());
});

/* ---------- builtins: cells, structs, handles ---------- */
def("struct",a=>{
  if(!a.length)return newStruct();
  if(a.length%2)fail("struct needs pairs of inputs: struct('name', value, 'name2', value2).");
  const names=[],vals=[];for(let k=0;k<a.length;k+=2){names.push(textOf(a[k],"A field name"));vals.push(a[k+1])}
  let n=1;for(const v of vals)if(v.t==="cell"&&numel(v)!==1){if(n!==1&&numel(v)!==n)fail("All cell inputs to struct must be the same size.");n=numel(v)}
  const d=[];for(let k=0;k<n;k++){const m=new Map();names.forEach((nm,q)=>{const v=vals[q];m.set(nm,v.t==="cell"?(numel(v)===1?v.d[0]:v.d[k]):v)});d.push(m)}
  return{t:"struct",r:n?1:0,c:n,f:names,d};
});
def("fieldnames",a=>{const v=a[0];if(v.t!=="struct")fail("fieldnames needs a struct.");return colOf(v.f.map(chr),"cell")});
def("isfield",a=>{const v=a[0];if(v.t!=="struct")return bool(false);if(a[1].t==="cell")return mk("logical",a[1].r,a[1].c,a[1].d.map(x=>v.f.includes(textOf(x))?1:0));return bool(v.f.includes(textOf(a[1])))});
def("rmfield",a=>{const v=a[0];const names=textList(a[1]);for(const n of names)if(!v.f.includes(n))fail(`A field named "${n}" doesn't exist.`);return{t:"struct",r:v.r,c:v.c,f:v.f.filter(f=>!names.includes(f)),d:v.d.map(m=>{const mm=new Map(m);for(const n of names)mm.delete(n);return mm})}});
def("getfield",a=>{const v=a[0],n=textOf(a[1]);if(v.t!=="struct"||!v.f.includes(n))fail(`Unrecognized field name "${n}".`);return v.d[0].get(n)});
def("setfield",a=>{const v=a[0].t==="struct"?a[0]:newStruct();const n=textOf(a[1]);const ns={t:"struct",r:1,c:1,f:v.f.includes(n)?v.f.slice():[...v.f,n],d:[new Map(v.d[0])]};ns.d[0].set(n,a[2]);return ns});
def("num2cell",a=>{const v=a[0];return mk("cell",v.r,v.c,v.d.map(x=>v.t==="cell"?x:mk(v.t==="struct"?"struct":v.t,1,1,[x])))});
def("cell2mat",a=>{const v=a[0];if(v.t!=="cell")fail("cell2mat needs a cell array.");if(!numel(v))return EMPTY();const rows=[];for(let i=0;i<v.r;i++){const row=[];for(let j=0;j<v.c;j++)row.push(v.d[i+j*v.r]);rows.push(horzcat(row))}return vertcat(rows)});
def("cellfun arrayfun",(a,nout,I,name)=>{
  needArgs(a,2,undefined,name);
  let f=a[0];if(isText(f))f={t:"fh",r:1,c:1,d:[],name:textOf(f)};
  if(f.t!=="fh")fail(`The first input to ${name} must be a function handle, like @length.`);
  const ins=[];let k=1;for(;k<a.length;k++){if(isText(a[k])&&/^(UniformOutput|ErrorHandler)$/i.test(textOf(a[k])))break;ins.push(a[k])}
  const nv=nameValue(a,k);const uni=nv.uniformoutput?truthy(nv.uniformoutput):true;
  const n=numel(ins[0]);for(const x of ins)if(numel(x)!==n)fail(`All inputs to ${name} must be the same size.`);
  const pieces=[];
  for(let q=0;q<n;q++){
    const args=ins.map(x=>name==="cellfun"?(x.t!=="cell"?fail("cellfun needs cell array inputs. For ordinary arrays, use arrayfun."):x.d[q]):(x.t==="cell"?mk("cell",1,1,[x.d[q]]):x.t==="struct"?{t:"struct",r:1,c:1,f:x.f.slice(),d:[x.d[q]]}:mk(x.t,1,1,[x.d[q]])));
    const r=f.name?I.call(f.name,args,Math.max(1,nout),I.F):I.callFh(f,args,Math.max(1,nout));
    pieces.push(r);
  }
  const outs=[];const no=Math.max(1,nout);const sh=ins[0];
  for(let o=0;o<no;o++){
    if(uni){const d=pieces.map(r=>{const v=r[o];if(!v||numel(v)!==1||!(isNum(v)))fail(`${name}'s function must return one number (or true/false) each time. Add 'UniformOutput', false to collect other results in a cell array.`);return v.d[0]});
      const t=pieces.length&&pieces.every(r=>r[o].t==="logical")?"logical":"double";outs.push(mk(t,sh.r,sh.c,d))}
    else outs.push(mk("cell",sh.r,sh.c,pieces.map(r=>r[o])));
  }
  return outs;
});
def("func2str",a=>chr(a[0].text||a[0].name));
def("str2func",a=>{const s=textOf(a[0]);if(s.startsWith("@")){const I2=new Interp();I2.run("f__="+s+";");return I2.base.vars.get("f__")}return{t:"fh",r:1,c:1,d:[],name:s}});
def("feval",(a,nout,I)=>{const f=a[0];return f.t==="fh"?I.callFh(f,a.slice(1),nout):I.call(textOf(f),a.slice(1),nout,I.F)});
def("deal",(a,nout)=>{if(a.length===1)return Array.from({length:Math.max(1,nout)},()=>a[0]);if(nout>a.length||(nout>1&&nout!==a.length))fail("The number of outputs should match the number of inputs.");return a.slice()});
def("isequal",a=>{needArgs(a,2,undefined,"isequal");for(let k=1;k<a.length;k++)if(!isEqualVals(a[0],a[k]))return bool(false);return bool(true)});
def("isequaln",a=>bool(isEqualVals(a[0],a[1])));
def("nargin",(a,_,I)=>{if(!I.F.fname)fail("You can only call nargin from inside a function.");return num(I.F.nargin)});
def("nargout",(a,_,I)=>{if(!I.F.fname)fail("You can only call nargout from inside a function.");return num(I.F.nargout)});

/* ---------- builtins: errors, environment ---------- */
def("error",(a)=>{
  needArgs(a,1,undefined,"error");
  let id="",rest=a;
  if(a.length>=2&&isText(a[0])&&/^[A-Za-z][\w-]*(:[\w-]+)+$/.test(textOf(a[0]))){id=textOf(a[0]);rest=a.slice(1)}
  if(a[0].t==="struct"){const m=a[0].d[0];throw new MError(textOf(m.get("message")),{user:true,identifier:m.has("identifier")?textOf(m.get("identifier")):""})}
  const msg=rest.length>1||id?formatText(rest[0],rest.slice(1)):textOf(rest[0]);
  throw new MError(msg,{user:true,identifier:id});
});
def("rethrow throw",a=>{const m=a[0].d[0];throw new MError(textOf(m.get("message")),{user:true,identifier:m.has("identifier")?textOf(m.get("identifier")):""})});
def("MException",a=>{const st=newStruct();st.f=["identifier","message"];st.d=[new Map([["identifier",chr(textOf(a[0]))],["message",chr(formatText(a[1],a.slice(2)))]])];return st});
def("warning",(a,_,I)=>{if(!a.length)return;const first=textOf(a[0]);if(["on","off","query"].includes(first))return;let rest=a;if(a.length>=2&&/^[A-Za-z][\w-]*(:[\w-]+)+$/.test(first))rest=a.slice(1);I.warn(rest.length>1?formatText(rest[0],rest.slice(1)):textOf(rest[0]))});
def("assert",a=>{
  needArgs(a,1,undefined,"assert");const c=a[0];
  let ok;try{ok=numel(c)>0&&truthy(c)}catch(e){ok=false}
  if(!ok){const msg=a.length>=2?(a.length>2?formatText(a[1],a.slice(2)):textOf(a[1])):"Assertion failed.";throw new MError(msg,{user:true,assert:true})}
});
def("input",(a,nout,I)=>{
  const prompt=a.length?textOf(a[0]):"";const asText=a[1]&&textOf(a[1])==="s";
  if(!I.inputs.length)fail("The program asked for input, but there are no more lines in the Input box. Add one line for each input() call.");
  const line=I.inputs.shift();I.write(prompt+line+"\n");
  if(asText)return chr(line);
  if(!line.trim())return EMPTY();
  try{const J=new Interp();J.base.vars=new Map(I.base.vars);J.funcs=I.funcs;return J.evalExpr(line)}catch(e){fail(`input() couldn't understand "${line}" as a MATLAB value. To read text, use input(prompt, 's').`)}
});
def("tic",(a,nout,I)=>{I.tic=Date.now();if(nout>0)return num(I.tic)});
def("toc",(a,nout,I)=>{const t=((Date.now()-(I.tic||I.t0))/1000);if(nout>0)return num(t);I.write(`Elapsed time is ${t.toFixed(6)} seconds.\n`)});
def("pause drawnow beep more pkg format_compact",()=>{});
def("clc",(a,_,I)=>{I.out=""});
def("clear clearvars",(a,_,I)=>{const names=a.map(x=>textOf(x)).filter(x=>!["all","variables","-all"].includes(x));if(!names.length){I.F.vars.clear();return}for(const n of names){if(n.includes("*")){const re=new RegExp("^"+n.replace(/\*/g,".*")+"$");for(const k of [...I.F.vars.keys()])if(re.test(k))I.F.vars.delete(k)}else I.F.vars.delete(n)}});
def("format",(a,_,I)=>{const m=a.length?textOf(a[0]).toLowerCase():"short";if(m==="long")I.long=true;else if(m==="short")I.long=false;else if(m==="compact")I.compact=true;else if(m==="loose")I.compact=false;if(a[1]){const m2=textOf(a[1]).toLowerCase();if(m2==="g"){}}});
def("who",(a,_,I)=>{const names=[...I.F.vars.keys()].sort();I.write(names.length?`\nYour variables are:\n\n${names.join("  ")}\n\n`:"")});
def("whos",(a,_,I)=>{
  const names=[...I.F.vars.keys()].sort();if(!names.length)return;
  const bytes=v=>v.t==="double"?8*numel(v):v.t==="char"?2*numel(v):v.t==="logical"?numel(v):v.t==="string"?numel(v)*150:v.t==="cell"?numel(v)*112:v.t==="struct"?numel(v)*176:32;
  let s="  Name      Size            Bytes  Class\n\n";
  for(const n of names){const v=I.F.vars.get(n);s+=`  ${n.padEnd(8)}  ${sizeStr(v).replace("×","x").padEnd(14)}  ${String(bytes(v)).padStart(5)}  ${cls(v)}\n`}
  I.write(s+"\n");
});
def("datestr",()=>chr(new Date().toISOString().slice(0,19).replace("T"," ")));
def("now",()=>num(Date.now()/864e5+719529));
def("clock",()=>{const d=new Date();return rowOf([d.getFullYear(),d.getMonth()+1,d.getDate(),d.getHours(),d.getMinutes(),d.getSeconds()])});
def("version",()=>chr("MATLAB Learn (browser subset)"));
const HELP={
  disp:"disp(X) displays the value of X without printing its name.",fprintf:"fprintf(format, A, ...) prints text using a format like '%d items cost %.2f\\n'. %d whole number, %f decimal, %.2f two decimals, %s text, \\n new line.",
  sum:"sum(A) adds up the elements. For a matrix it adds each column; sum(A, 2) adds each row; sum(A, 'all') adds everything.",mean:"mean(A) is the average. For a matrix, the average of each column.",
  max:"max(A) is the largest element. [m, i] = max(A) also gives its position. max(A, [], 2) works across rows.",min:"min(A) is the smallest element. [m, i] = min(A) also gives its position.",
  size:"size(A) gives [rows cols]. [r, c] = size(A) stores them separately. size(A, 1) is the number of rows.",numel:"numel(A) is the number of elements in A.",length:"length(A) is the size of the longest dimension. For a vector it's the number of elements.",
  zeros:"zeros(n) is an n-by-n matrix of zeros; zeros(r, c) is r-by-c.",ones:"ones(r, c) is an r-by-c matrix of ones.",rand:"rand(r, c) is an r-by-c matrix of random numbers between 0 and 1.",randi:"randi(imax, r, c) gives random whole numbers from 1 to imax. randi([lo hi], r, c) uses your own range.",
  linspace:"linspace(a, b, n) gives n evenly spaced points from a to b, including both ends.",sort:"sort(A) sorts ascending. sort(A, 'descend') sorts the other way. [s, i] = sort(A) also returns the original positions.",
  find:"find(X) gives the positions of the nonzero (true) elements. find(X, n) gives the first n.",round:"round(X) rounds to the nearest whole number. round(X, 2) rounds to 2 decimal places.",
  mod:"mod(a, b) is the remainder after dividing a by b. mod(7, 3) is 1. It's handy for testing even/odd: mod(n, 2) == 0.",plot:"plot(x, y) draws y against x. plot(x, y, 'r--o') sets a red dashed line with circle markers. Use hold on to add more lines.",
  num2str:"num2str(x) turns a number into text so you can join it with other text: ['Total: ' num2str(t)].",strcmp:"strcmp(a, b) is true if the two pieces of text are exactly the same.",
  abs:"abs(x) is the absolute value (distance from zero).",sqrt:"sqrt(x) is the square root.",numel_:"",cumsum:"cumsum(A) is the running total: each element is the sum of everything up to it.",
  diff:"diff(x) gives the differences between neighbours: [x(2)-x(1), x(3)-x(2), ...]. It is one element shorter than x.",any:"any(X) is true if at least one element is nonzero.",all:"all(X) is true if every element is nonzero.",
  isempty:"isempty(A) is true if A has no elements.",floor:"floor(x) rounds down towards minus infinity.",ceil:"ceil(x) rounds up.",fix:"fix(x) rounds towards zero (chops off the decimals).",
  exp:"exp(x) is e raised to the power x.",log:"log(x) is the natural logarithm (base e). Use log10 for base 10.",title:"title('text') adds a title to the current plot.",xlabel:"xlabel('text') labels the x-axis.",ylabel:"ylabel('text') labels the y-axis.",legend:"legend('a', 'b') labels each line on the plot, in the order they were drawn.",
  bar:"bar(y) draws a bar chart. bar(x, y) puts the bars at positions x.",hold:"hold on keeps the current plot so the next plot adds to it. hold off goes back to replacing it.",
  struct:"struct('name', value, ...) creates a structure with named fields. You can also just write s.name = value.",cell:"cell(r, c) makes an r-by-c cell array of empty cells. Usually you write cells directly: c = {1, 'two', [3 4]}.",
  input:"x = input(prompt) asks the user to type a value. input(prompt, 's') reads text instead.",isequal:"isequal(A, B) is true if A and B have the same size and values.",
  upper:"upper(s) converts text to UPPERCASE.",lower:"lower(s) converts text to lowercase.",strrep:"strrep(s, old, new) replaces every old with new.",length_:"",
};
def("help",(a,_,I)=>{if(!a.length){I.write("Type help followed by a function name, for example: help sum\n");return}const n=textOf(a[0]);const h=HELP[n];
  I.write(h?` ${n}\n   ${h}\n\n   Full documentation: https://www.mathworks.com/help/matlab/ref/${n}.html\n`:BUILTINS[n]?` ${n} is a MATLAB function. There's no short help for it on this site.\n   Full documentation: https://www.mathworks.com/help/matlab/ref/${n}.html\n`:`${n} not found.\n`)});
def("doc",(a,_,I)=>{const n=a.length?textOf(a[0]):"";I.write(`Documentation: https://www.mathworks.com/help/matlab/${n?"ref/"+n+".html":""}\n`)});

/* ---------- builtins: plotting (recorded, drawn by app.js) ---------- */
function parseSpec(s){const o={};let rest=s;for(const ls of ["--","-.",":","-"])if(rest.includes(ls)){o.ls=ls;rest=rest.replace(ls,"");break}for(const ch of rest){if(LETTER_COLORS[ch])o.color=LETTER_COLORS[ch];else if("o+*.xsd^v<>ph".includes(ch))o.marker=ch;else return null}if(o.marker&&!o.ls)o.ls="none";return o}
function colorFrom(v){if(isText(v)){const s=textOf(v);const k=NAMED_COLORS[s.toLowerCase()]||s;if(LETTER_COLORS[k])return LETTER_COLORS[k];if(/^#[0-9a-f]{6}$/i.test(s))return s;fail(`Unknown color '${s}'. Use 'r', 'g', 'b', 'k', a name like "red", or [r g b] numbers from 0 to 1.`)}const d=numData(v);if(d.length!==3)fail("A color as numbers must be [r g b] with each from 0 to 1.");return"#"+d.map(x=>Math.round(Math.max(0,Math.min(1,x))*255).toString(16).padStart(2,"0")).join("")}
function startPlot(I){const ax=I.axes();if(!ax.hold){const keepFig=I.figs[I.cf];keepFig.ax=newAxes();return keepFig.ax}return ax}
function applyOpts(item,opts){if(opts.linewidth)item.lw=scalar(opts.linewidth);if(opts.color)item.color=colorFrom(opts.color);if(opts.displayname)item.name=textOf(opts.displayname);if(opts.marker)item.marker=textOf(opts.marker);if(opts.linestyle)item.ls=textOf(opts.linestyle);if(opts.markersize)item.ms=scalar(opts.markersize);if(opts.markerfacecolor)item.mfc=colorFrom(opts.markerfacecolor)}
const NV_NAMES=["linewidth","color","displayname","marker","linestyle","markersize","markerfacecolor","markeredgecolor","facecolor","edgecolor","barwidth"];
def("plot",(a,nout,I)=>{
  needArgs(a,1,undefined,"plot");
  let k=0;const series=[];
  while(k<a.length){
    if(isText(a[k])){const s=textOf(a[k]);if(NV_NAMES.includes(s.toLowerCase()))break;fail(`plot got the text '${s}' where it expected numbers. A line style like 'r--' goes after the x and y data.`)}
    const x=a[k],y=a[k+1]&&!isText(a[k+1])?a[k+1]:null;
    let spec=null;let used=y?2:1;
    if(a[k+used]&&isText(a[k+used])&&!NV_NAMES.includes(textOf(a[k+used]).toLowerCase())){spec=parseSpec(textOf(a[k+used]));if(!spec)fail(`'${textOf(a[k+used])}' isn't a valid line style. Combine a color (r g b c m y k w), a line (- -- : -.) and a marker (o + * . x s d ^ v).`);used++}
    if(!isNum(x)||(y&&!isNum(y)))fail("plot needs numbers for x and y.");
    if(y&&numel(x)!==numel(y)&&!(x.r===1||x.c===1))fail("Vectors must be the same length.");
    if(y&&(y.r===1||y.c===1)&&numel(x)!==numel(y))fail(`Vectors must be the same length. x has ${numel(x)} elements but y has ${numel(y)}.`);
    const cols=y?(y.r===1||y.c===1?[numData(y)]:slices(y,1).L):(x.r===1||x.c===1?[numData(x)]:slices(x,1).L);
    for(const yy of cols){const xx=y?numData(x).slice():yy.map((_,i)=>i+1);series.push({x:xx,y:yy.slice(),spec})}
    k+=used;
  }
  const opts=nameValue(a,k);
  const ax=startPlot(I);
  for(const s of series){const it={type:"line",x:s.x,y:s.y,color:DEFAULT_COLORS[ax.ci++%7],ls:"-",marker:"",lw:1,name:""};if(s.spec){if(s.spec.color){it.color=s.spec.color;ax.ci--}if(s.spec.ls)it.ls=s.spec.ls;if(s.spec.marker)it.marker=s.spec.marker}applyOpts(it,opts);ax.items.push(it)}
  if(nout>0)return num(ax.items.length);
});
def("scatter",(a,nout,I)=>{needArgs(a,2,undefined,"scatter");const ax=startPlot(I);const it={type:"scatter",x:numData(a[0]).slice(),y:numData(a[1]).slice(),color:DEFAULT_COLORS[ax.ci++%7],marker:"o",name:"",ms:6};let k=2;if(a[k]&&!isText(a[k])){if(numel(a[k])===1)it.ms=Math.sqrt(scalar(a[k]));k++}if(a[k]&&!isText(a[k])){k++}if(a[k]&&isText(a[k])&&textOf(a[k])==="filled"){it.filled=true;k++}if(a[k]&&isText(a[k])&&!NV_NAMES.includes(textOf(a[k]).toLowerCase())){const sp=parseSpec(textOf(a[k]));if(sp){if(sp.color)it.color=sp.color;if(sp.marker)it.marker=sp.marker}k++}applyOpts(it,nameValue(a,k));ax.items.push(it)});
def("bar barh",(a,nout,I)=>{needArgs(a,1,undefined,"bar");const ax=startPlot(I);let x,y,k;if(a[1]&&!isText(a[1])){x=numData(a[0]).slice();y=numData(a[1]).slice();k=2}else{y=numData(a[0]).slice();x=y.map((_,i)=>i+1);k=1}if(x.length!==y.length)fail("bar needs x and y with the same number of elements.");const it={type:"bar",x,y,color:DEFAULT_COLORS[ax.ci++%7],name:""};if(a[k]&&!isText(a[k])){k++}if(a[k]&&isText(a[k])&&!NV_NAMES.includes(textOf(a[k]).toLowerCase())){const sp=parseSpec(textOf(a[k]));if(sp&&sp.color)it.color=sp.color;k++}const o=nameValue(a,k);if(o.facecolor)it.color=colorFrom(o.facecolor);applyOpts(it,{displayname:o.displayname});ax.items.push(it)});
def("histogram hist",(a,nout,I)=>{const[c,e]=BUILTINS.histcounts(a.slice(0,2).filter(x=>!isText(x)));const ax=startPlot(I);const E=e.d;ax.items.push({type:"hist",x:E.slice(0,-1).map((v,i)=>(v+E[i+1])/2),y:c.d.slice(),edges:E.slice(),color:DEFAULT_COLORS[ax.ci++%7],name:""})});
def("area",(a,nout,I)=>{BUILTINS.plot(a,0,I);const ax=I.axes();ax.items[ax.items.length-1].fill=true});
def("stairs stem",(a,nout,I,name)=>{BUILTINS.plot(a,0,I);const ax=I.axes();ax.items[ax.items.length-1].kind=name});
def("fplot",(a,nout,I)=>{const f=a[0];const lim=a[1]?numData(a[1]):[-5,5];const xs=[],ys=[];for(let i=0;i<=200;i++){const x=lim[0]+(lim[1]-lim[0])*i/200;xs.push(x);ys.push(scalar(I.callAny(f,[num(x)])))}const rest=a.slice(2);BUILTINS.plot([rowOf(xs),rowOf(ys),...rest],0,I)});
def("title xlabel ylabel",(a,nout,I,name)=>{needArgs(a,1,undefined,name);const ax=I.axes();const v=a[0];ax[name]=v.t==="cell"?textList(v).join("\n"):isText(v)?textList(v).join("\n"):isNum(v)?numToString(v.d[0]):textOf(v)});
def("subtitle",()=>{});
def("legend",(a,nout,I)=>{const ax=I.axes();if(!a.length){ax.legend=ax.items.map((it,i)=>it.name||`data${i+1}`);return}const first=a[0];if(isText(first)&&["off","hide"].includes(textOf(first).toLowerCase())){ax.legend=null;return}if(isText(first)&&["show","on"].includes(textOf(first).toLowerCase())){ax.legend=ax.items.map((it,i)=>it.name||`data${i+1}`);return}const names=[];for(const v of a){if(isText(v)&&["location","orientation","fontsize","box"].includes(textOf(v).toLowerCase()))break;names.push(...textList(v))}ax.legend=names});
def("grid box",(a,nout,I,name)=>{if(name==="box")return;const ax=I.axes();const m=a.length?textOf(a[0]).toLowerCase():"toggle";ax.grid=m==="on"?true:m==="off"?false:m==="minor"?true:!ax.grid});
def("hold",(a,nout,I)=>{const ax=I.axes();const m=a.length?textOf(a[0]).toLowerCase():"toggle";ax.hold=m==="on"||m==="all"?true:m==="off"?false:!ax.hold});
def("ishold",(a,_,I)=>bool(I.cf>=0&&I.axes().hold));
def("xlim ylim",(a,nout,I,name)=>{const ax=I.axes();if(!a.length)return rowOf(ax[name]||[0,1]);if(isText(a[0]))return;const d=numData(a[0]);if(d.length!==2||!(d[0]<d[1]))fail(`${name} needs [low high] with low < high.`);ax[name]=[d[0],d[1]]});
def("axis",(a,nout,I)=>{const ax=I.axes();if(a.length&&!isText(a[0])){const d=numData(a[0]);if(d.length>=4){ax.xlim=[d[0],d[1]];ax.ylim=[d[2],d[3]]}}else if(a.length&&textOf(a[0])==="equal")ax.equal=true});
def("figure",(a,nout,I)=>{let n;if(a.length&&!isText(a[0])){n=scalar(a[0]);const k=I.figs.findIndex(f=>f.n===n);if(k>=0){I.cf=k;return}}else n=I.figs.length?Math.max(...I.figs.map(f=>f.n))+1:1;I.figs.push({n,ax:newAxes()});I.cf=I.figs.length-1;if(nout>0)return num(n)});
def("close clf",(a,nout,I,name)=>{if(name==="clf"){if(I.cf>=0)I.figs[I.cf].ax=newAxes();return}if(a.length&&textOf(a[0])==="all"||!a.length){if(!a.length&&I.cf>=0){I.figs.splice(I.cf,1);I.cf=I.figs.length-1}else{I.figs=[];I.cf=-1}}});
def("gca gcf",(a,nout,I)=>num(1));
def("subplot",()=>fail("subplot isn't supported on this site. Use figure to start a new figure instead."));
def("text annotation colorbar colormap shg set view zlabel",()=>{});

/* ---------- checker ---------- */
function normOut(s){return String(s).replace(/\r/g,"").split("\n").map(l=>l.trim()).filter(l=>l).join("\n")}
function stripComments(code){return code.split("\n").map(l=>{let q=null;for(let i=0;i<l.length;i++){const c=l[i];if(q){if(c===q)q=null;continue}if(c==='"'||(c==="'"&&!/[\w)\]}'.]/.test(l[i-1]||"")))q=c;else if(c==="%")return l.slice(0,i)}return l}).join("\n")}
function short(v){
  if(isText(v)){const L=textList(v);return v.t==="string"&&L.length===1?`"${L[0]}"`:L.length===1?`'${L[0]}'`:`{${L.map(s=>`'${s}'`).join(", ")}}`}
  if(isNum(v)){if(numel(v)>40)return`a ${sizeStr(v)} array`;const f=x=>v.t==="logical"?String(x):fmtShortNum(x);if(numel(v)===1)return f(v.d[0]);const rows=[];for(let i=0;i<v.r;i++){const row=[];for(let j=0;j<v.c;j++)row.push(f(v.d[i+j*v.r]));rows.push(row.join(" "))}return`[${rows.join("; ")}]`}
  if(v.t==="cell")return`a ${sizeStr(v)} cell array`;
  if(v.t==="struct")return`a ${sizeStr(v)} struct`;
  if(v.t==="fh")return v.text||"@"+v.name;
  return cls(v);
}
function describe(v){return isText(v)?`text (${short(v)})`:v.t==="cell"?"a cell array":v.t==="struct"?"a struct":v.t==="fh"?"a function handle":`${short(v)}`}
const close=(a,b)=>(Number.isNaN(a)&&Number.isNaN(b))||a===b||Math.abs(a-b)<=1e-6*Math.max(1,Math.abs(b));
function compareVals(got,want,L){
  if(want.t==="double"||want.t==="logical"){
    if(!(got.t==="double"||got.t==="logical"))return`${L} should be ${numel(want)===1?"a number":"numbers"} (${short(want)}), but yours is ${describe(got)}.`;
    if(got.r!==want.r||got.c!==want.c){
      if(numel(got)===numel(want)&&got.r===want.c&&got.c===want.r)return`${L} has the right numbers but the wrong shape: it's ${sizeStr(got)} and should be ${sizeStr(want)}. ${want.r===1?"Make it a row (spaces or commas between elements), or transpose it with '.":"Make it a column (semicolons between elements), or transpose it with '."}`;
      return`${L} should be ${sizeStr(want)}${numel(want)<=12?` (${short(want)})`:""}, but yours is ${sizeStr(got)}${numel(got)<=12?` (${short(got)})`:""}.`;
    }
    for(let i=0;i<want.d.length;i++)if(!close(got.d[i],want.d[i]))return`${L} should be ${short(want)}, but yours is ${short(got)}.`;
    return null;
  }
  if(want.t==="char"||want.t==="string"){
    if(!isText(got)&&got.t!=="cell")return`${L} should be text (${short(want)}), but yours is ${describe(got)}.${isNum(got)?" Use num2str or sprintf to turn numbers into text.":""}`;
    if(got.t==="cell")return`${L} should be text (${short(want)}), but yours is a cell array.`;
    const a=textList(got).join("\n"),b=textList(want).join("\n");
    if(a!==b){
      let extra="";if(a.toLowerCase()===b.toLowerCase())extra=" Only the capitals differ.";else if(a.replace(/\s+/g,"")===b.replace(/\s+/g,""))extra=" Only the spaces differ.";
      return`${L} should be ${short(want)}, but yours is ${short(got)}.${extra}`;
    }
    return null;
  }
  if(want.t==="cell"){
    if(got.t!=="cell")return`${L} should be a cell array (use curly braces { }), but yours is ${describe(got)}.`;
    if(got.r!==want.r||got.c!==want.c)return`${L} should be a ${sizeStr(want)} cell array, but yours is ${sizeStr(got)}.`;
    for(let i=0;i<want.d.length;i++){const m=compareVals(got.d[i],want.d[i],`${L}{${i+1}}`);if(m)return m}
    return null;
  }
  if(want.t==="struct"){
    if(got.t!=="struct")return`${L} should be a struct, but yours is ${describe(got)}.`;
    if(numel(got)!==numel(want))return`${L} should be a ${sizeStr(want)} struct array, but yours is ${sizeStr(got)}.`;
    for(let k=0;k<want.d.length;k++)for(const f of want.f){
      const lab=numel(want)===1?`${L}.${f}`:`${L}(${k+1}).${f}`;
      if(!got.f.includes(f))return`${lab} is missing. Field names are case-sensitive.`;
      const m=compareVals(got.d[k].get(f),want.d[k].get(f),lab);if(m)return m;
    }
    return null;
  }
  return isEqualVals(got,want)?null:`${L} isn't right.`;
}
function errInfo(e){
  return{message:e.message,line:e.line,where:e.where,using:e.using,parse:!!e.parse,timeout:!!e.timeout,internal:!!e.internal,undefinedName:e.undefinedName};
}
// Run code the way the site's Run button does. Returns {out, error, I}.
function runCode(code,{pre,inputs,seed}={}){
  const I=new Interp({inputs,seed});
  if(pre){try{I.run(pre)}catch(e){return{out:"",error:{message:"Problem setup failed: "+e.message,internal:true},I}}}
  I.out="";let error=null;
  try{I.run(code)}catch(e){error=errInfo(wrapErr(e))}
  return{out:I.out,error,I};
}
// Expected values: an expression, or code that sets a variable called want.
function evalFresh(expr,pre){const J=new Interp({seed:1});if(pre)J.run(pre);J.out="";if(/[;\n]/.test(expr)&&/\bwant\s*=/.test(expr)){J.run(expr);const w=J.base.vars.get("want");if(!w)throw new Error("expected code didn't set want");return w}return J.evalExpr(expr)}
// Check a learner's code against one test. Returns {fails:[...], out, error, I}.
function runTest(code,t,p={}){
  const pre=t.pre!==undefined?t.pre:(p.pre||"");
  const r=runCode(code,{pre,inputs:t.inputs,seed:t.seed});
  const fails=[];const I=r.I;
  if(r.error&&r.error.timeout){fails.push({k:"timeout"});return{...r,fails}}
  if(r.error&&!t.err){fails.push({k:"crash"});return{...r,fails}}
  if(t.err){
    if(!r.error)fails.push({k:"msg",msg:"Your code should have stopped with an error here (using error(...)), but it finished normally."});
    else if(t.errIncludes&&!r.error.message.toLowerCase().includes(t.errIncludes.toLowerCase()))fails.push({k:"msg",msg:`Your error message should mention "${t.errIncludes}". Yours was: ${r.error.message}`});
  }
  if(t.out!==undefined){
    const got=normOut(r.out),want=normOut(t.out);let ok;
    if(t.match==="contains")ok=t.ci?got.toLowerCase().includes(want.toLowerCase()):got.includes(want);
    else if(t.match==="regex")ok=new RegExp(t.out,t.ci?"i":"").test(got);
    else ok=t.ci?got.toLowerCase()===want.toLowerCase():got===want;
    if(!ok)fails.push({k:"out",want:t.match==="regex"?null:want,got});
  }
  for(const e of t.eq||[]){
    const[gx,wx,label]=e;const L=label||gx;
    if(/^[A-Za-z]\w*$/.test(gx)&&!I.base.vars.has(gx)&&!I.funcs[gx]){
      const near=[...I.base.vars.keys()].find(k=>k.toLowerCase()===gx.toLowerCase());
      fails.push({k:"msg",msg:near?`There's no variable called ${gx}, but there is one called ${near}. Capitals count in MATLAB, so rename it to ${gx}.`:`There's no variable called ${gx} yet. Create it with ${gx} = ... (spelling and capitals count).`});continue;
    }
    let got;try{I.t0=Date.now();got=I.evalExpr(gx)}catch(err){fails.push({k:"msg",msg:`Running ${gx} gave an error: ${err.message}`});continue}
    let want;try{want=evalFresh(wx,pre)}catch(err){fails.push({k:"msg",msg:"Internal: expected value failed: "+err.message});continue}
    const m=compareVals(got,want,L);if(m)fails.push({k:"msg",msg:m});
  }
  if(t.check){try{I.t0=Date.now();const before=I.out;I.run(t.check);I.out=before}catch(err){fails.push({k:"msg",msg:err.message})}}
  if(t.plot){const m=checkPlot(I,t.plot,pre);if(m)fails.push({k:"msg",msg:m})}
  const src=stripComments(code);
  for(const[re,msg]of t.src||[])if(!new RegExp(re).test(src))fails.push({k:"msg",msg});
  for(const[re,msg]of t.nosrc||[])if(new RegExp(re).test(src))fails.push({k:"msg",msg});
  return{...r,fails};
}
function checkPlot(I,P,pre){
  const fig=I.figs[I.cf];const ax=fig&&fig.ax;
  if(!ax||!ax.items.length)return"No plot was drawn. Use plot(x, y) to draw one.";
  const items=ax.items;
  if(P.type&&!items.some(it=>it.type===P.type))return`Expected a ${P.type==="line"?"line plot (plot)":P.type==="bar"?"bar chart (bar)":P.type==="scatter"?"scatter plot (scatter)":P.type} but found ${items.map(it=>it.type).join(", ")}.`;
  if(P.lines&&items.length<P.lines)return`Expected ${P.lines} lines on the same plot, but found ${items.length}. Use hold on after the first plot so the next one adds to it instead of replacing it.`;
  for(const k of ["title","xlabel","ylabel"]){
    if(P[k]===true&&!ax[k])return`The plot needs ${k==="title"?"a title. Use title('...')":`an ${k==="xlabel"?"x":"y"}-axis label. Use ${k}('...')`}.`;
    if(typeof P[k]==="string"&&ax[k]!==P[k])return`The ${k==="title"?"title":k==="xlabel"?"x-axis label":"y-axis label"} should be '${P[k]}', but yours is '${ax[k]}'.`;
  }
  if(P.legend&&!(ax.legend&&ax.legend.length))return"The plot needs a legend. Use legend('first', 'second') with one name per line.";
  if(P.legend&&P.lines&&ax.legend.length<P.lines)return`The legend should name all ${P.lines} lines.`;
  if(P.grid&&!ax.grid)return"Turn the grid on with grid on.";
  const pick=k=>items[k]||items[0];
  if(P.yfn){const it=items.find(i=>i.type==="line")||items[0];const J=new Interp({seed:1});J.base.vars.set("x",rowOf(it.x));const want=J.evalExpr(P.yfn);const m=compareVals(rowOf(it.y),want.r!==1?transpose(want):want,"The plotted y-values");if(m)return m+" (Plot y against x, for example plot(x, y).)"}
  if(P.ys)for(let k=0;k<P.ys.length;k++){const it=items[k];if(!it)return`Expected ${P.ys.length} lines on the plot.`;const want=evalFresh(P.ys[k],pre);const m=compareVals(rowOf(it.y),want.r!==1?transpose(want):want,`The y-values of line ${k+1}`);if(m)return m}
  for(const[key,expr,k]of [["y",P.y,P.yi||0],["x",P.x,P.yi||0]]){
    if(!expr)continue;const it=pick(k);const want=evalFresh(expr,pre);const got=rowOf(it[key]);
    const w=want.r!==1?transpose(want):want;
    const m=compareVals(got,w,`The plotted ${key}-values`);if(m)return m;
  }
  if(P.color&&!items.some(it=>it.color===LETTER_COLORS[P.color]))return`Expected a line in color '${P.color}'. Add a style like '${P.color}-' after the data: plot(x, y, '${P.color}-').`;
  if(P.ls&&!items.some(it=>it.ls===P.ls))return`Expected a '${P.ls}' line style, for example plot(x, y, '${P.ls}').`;
  if(P.marker&&!items.some(it=>it.marker===P.marker))return`Expected '${P.marker}' markers, for example plot(x, y, '${P.marker}-').`;
  return null;
}

const MLAB={Interp,MError,parse,lex,runCode,runTest,normOut,compareVals,summary,sizeStr,cls,numel,textList,isText,short,evalFresh,stripComments,BUILTINS,displayText,dispText,DEFAULT_COLORS};
if(typeof module!=="undefined"&&module.exports)module.exports=MLAB;else root.MLAB=MLAB;
})(typeof window!=="undefined"?window:globalThis);
