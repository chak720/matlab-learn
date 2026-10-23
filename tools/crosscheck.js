// Cross-check the browser interpreter against GNU Octave on value-level results.
// Usage: node tools/crosscheck.js snippets.json   (each snippet: {code, vars:[names]})
const fs=require("fs"),cp=require("child_process"),path=require("path");
const M=require(path.join(__dirname,"../assets/mlab.js"));
const snippets=JSON.parse(fs.readFileSync(process.argv[2],"utf8"));
const fmt=v=>{
  if(!v)return"<missing>";
  if(v.t==="char")return"char:"+M.textList(v).join("|");
  if(v.t==="string")return"char:"+v.d.join("|");
  if(v.t==="double"||v.t==="logical")return`num:${v.r}x${v.c}:`+v.d.map(x=>Number.isNaN(x)?"NaN":Number.isFinite(x)?Number(x.toPrecision(12)).toString():(x>0?"Inf":"-Inf")).join(",");
  if(v.t==="cell")return`cell:${v.r}x${v.c}:`+v.d.map(fmt).join(";");
  return v.t;
};
let oct="";
snippets.forEach((s,k)=>{
  oct+=`try\n${s.code}\n`;
  for(const n of s.vars)oct+=`__p(${k},'${n}',${n});\n`;
  oct+=`catch err\n printf('%d|ERR|%s\\n',${k},strrep(err.message,char(10),' '));\nend\nclear -x __p\n`;
});
const helper=`1;
function s = __f(v)
  if ischar(v)
    s = ['char:' strjoin(cellstr(v)','|')];
  elseif isnumeric(v) || islogical(v)
    v = double(v); parts = cell(1,numel(v));
    for i=1:numel(v)
      x = v(i);
      if isnan(x) parts{i}='NaN'; elseif isinf(x) if x>0 parts{i}='Inf'; else parts{i}='-Inf'; end
      else parts{i}=regexprep(sprintf('%.12g',x),'^-0$','0'); end
    end
    s = sprintf('num:%dx%d:%s', rows(v), columns(v), strjoin(parts,','));
  elseif iscell(v)
    parts = cellfun(@__f, v(:)', 'UniformOutput', false);
    s = sprintf('cell:%dx%d:%s', rows(v), columns(v), strjoin(parts,';'));
  else s = class(v); end
end
function __p(k,n,v)
  printf('%d|%s|%s\\n', k, n, __f(v));
end
`;
const tmp=fs.mkdtempSync("/tmp/claude-0/-home-user/57492c44-0294-5a1b-8664-e25f4a0999c2/scratchpad/oct");
fs.writeFileSync(tmp+"/run.m",helper+oct);
const res=cp.spawnSync("octave",["--no-gui","--quiet","--norc",tmp+"/run.m"],{encoding:"utf8",timeout:120000});
const got={};
for(const line of res.stdout.split("\n")){const m=/^(\d+)\|([^|]+)\|(.*)$/.exec(line);if(m)(got[m[1]]||(got[m[1]]={}))[m[2]]=m[3]}
let bad=0;
snippets.forEach((s,k)=>{
  const r=M.runCode(s.code,{seed:1});
  const o=got[k]||{};
  if(o.ERR){if(!r.error){console.log(`#${k} Octave error but we ran: ${o.ERR}\n   ${s.code}`);bad++}return}
  if(r.error){console.log(`#${k} we errored: ${r.error.message}\n   ${s.code}`);bad++;return}
  for(const n of s.vars){
    let a=fmt(r.I.base.vars.get(n)),b=o[n];
    if(a.replace(/-0(?=[,;]|$)/g,"0")!==b){console.log(`#${k} ${n}: ours ${a}\n      octave ${b}\n   ${s.code.replace(/\n/g,"\n   ")}`);bad++}
  }
});
console.log(`${snippets.length} snippets, ${bad} differences`);
if(res.stderr.trim())console.log("octave stderr:",res.stderr.slice(0,2000));
