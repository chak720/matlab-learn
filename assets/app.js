"use strict";
/* MATLAB Learn: state, views, checking and plot drawing. Code runs through MLAB (assets/mlab.js). Progress lives in localStorage. */
/* ---------- utils ---------- */
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const todayKey=()=>new Date().toLocaleDateString("en-CA");
const daysSince=d=>d?Math.max(0,(Date.parse(todayKey())-Date.parse(d))/864e5):99;
const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const reduced=()=>window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
const lsGet=k=>{try{return localStorage.getItem(k)}catch(e){return null}};
const lsSet=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}};
const lsDel=k=>{try{localStorage.removeItem(k)}catch(e){}};
const later=f=>new Promise(res=>setTimeout(()=>res(f()),30));

/* ---------- indexes ---------- */
const PROBS={},QUICK={};
for(const U of UNITS){U.problems.forEach(p=>{PROBS[p.id]={...p,unit:U.n}});U.quick.forEach((q,i)=>{QUICK[U.n+"."+i]={...q,unit:U.n,id:U.n+"."+i}})}
const TOTAL=()=>UNITS.reduce((a,U)=>a+U.problems.length,0);
const unitOf=n=>UNITS.find(U=>U.n===n);

/* ---------- state ---------- */
function blankState(){return{v:1,solved:{},prob:{},quick:{},mistakes:[],days:{},lessonsRead:[],updated:null}}
let S=blankState(),DAY=null,DAILY=null;
function mergeState(x){if(!x)return;const b=blankState();S={...b,...x}}
let saveTimer=null;
function queueSave(){clearTimeout(saveTimer);saveTimer=setTimeout(save,300)}
function save(){S.updated=new Date().toISOString();
  const ks=Object.keys(S.days).sort();if(ks.length>200)for(const k of ks.slice(0,ks.length-200))delete S.days[k];
  lsSet("ml_state",JSON.stringify(S));if(DAY)lsSet("ml_day",JSON.stringify(DAY))}
function today(){return S.days[todayKey()]||(S.days[todayKey()]={n:0,c:0,solved:0,daily:false})}
const isSolved=id=>!!S.solved[id];
const pstat=id=>S.prob[id]||(S.prob[id]={checks:0,fails:0,hints:0,shown:false});
function unitSolved(U){return U.problems.filter(p=>isSolved(p.id)).length}
function unitDone(U){return unitSolved(U)===U.problems.length}
function currentUnit(){return UNITS.find(U=>!unitDone(U))||null}

function recordQuick(q,ok){
  const st=S.quick[q.id]||(S.quick[q.id]={n:0,c:0,last:null});st.n++;if(ok)st.c++;st.last=todayKey();
  const d=today();d.n++;if(ok)d.c++;
  const m=S.mistakes.find(m=>m.kind==="q"&&m.key===q.id);
  if(!ok){if(m)m.fixes=0;else S.mistakes.unshift({kind:"q",key:q.id,t:todayKey(),fixes:0})}
  else if(m){m.fixes++;if(m.fixes>=2)S.mistakes=S.mistakes.filter(x=>x!==m)}
  S.mistakes=S.mistakes.slice(0,80);queueSave();renderStrip();
}
function recordSolve(id,review){
  const first=!isSolved(id);if(first)S.solved[id]=todayKey();
  const d=today();d.solved++;
  (S.reviewed||(S.reviewed={}))[id]=todayKey();
  if(review)S.mistakes=S.mistakes.filter(m=>!(m.kind==="p"&&m.key===id));
  queueSave();renderStrip();return first;
}
function flagProblem(id){if(!S.mistakes.some(m=>m.kind==="p"&&m.key===id))S.mistakes.unshift({kind:"p",key:id,t:todayKey(),fixes:0});queueSave()}

/* ---------- daily set ---------- */
function quickWeight(id){const st=S.quick[id];if(!st)return 3;return 0.4+2.5*(1-(st.c+1)/(st.n+2))+0.15*Math.min(daysSince(st.last),10)}
function pickQuick(n){
  const out=[];const cu=currentUnit();const upto=cu?cu.n:UNITS.length;
  for(const m of S.mistakes)if(m.kind==="q"&&QUICK[m.key]&&out.length<1)out.push(m.key);
  if(cu)for(const id of shuffle(cu.quick.map((_,i)=>cu.n+"."+i)))if(out.length<n-1&&!out.includes(id)&&!(S.quick[id]&&S.quick[id].c))out.push(id);
  const pool=Object.keys(QUICK).filter(id=>QUICK[id].unit<=upto&&!out.includes(id));
  while(out.length<n&&pool.length){const w=pool.map(quickWeight);let r=Math.random()*w.reduce((a,b)=>a+b,0);let k=0;for(;k<pool.length-1;k++){r-=w[k];if(r<=0)break}out.push(pool.splice(k,1)[0])}
  return out;
}
function nextNew(n,skip=[]){
  const out=[];for(const U of UNITS)for(const p of U.problems)if(!isSolved(p.id)&&!skip.includes(p.id)&&out.length<n)out.push(p.id);return out;
}
function pickReview(skip){
  const m=S.mistakes.find(m=>m.kind==="p"&&PROBS[m.key]&&!skip.includes(m.key));if(m)return{id:m.key,review:true};
  const cu=currentUnit();
  const old=Object.keys(S.solved).filter(id=>PROBS[id]&&!skip.includes(id)&&(!cu||PROBS[id].unit<cu.n||daysSince(S.solved[id])>=3));
  if(old.length){old.sort((a,b)=>((S.reviewed||{})[a]||"").localeCompare((S.reviewed||{})[b]||""));return{id:old[0],review:true}}
  return null;
}
function buildDay(){
  const probs=[];
  if(DAILY&&Array.isArray(DAILY.problems))for(const p of DAILY.problems.slice(0,2))if(PROBS[p.id])probs.push({id:p.id});
  for(const id of nextNew(2-probs.length,probs.map(p=>p.id)))probs.push({id});
  const rv=pickReview(probs.map(p=>p.id));
  if(rv)probs.push(rv);else for(const id of nextNew(1,probs.map(p=>p.id)))probs.push({id});
  return{date:todayKey(),quick:pickQuick(3),quickDone:false,problems:probs.map(p=>({...p,done:false}))};
}
function dayDone(){return DAY&&DAY.quickDone&&DAY.problems.every(p=>p.done)}
function markDayProgress(){if(dayDone()){const d=today();if(!d.daily){d.daily=true;queueSave();renderStrip();return true}}return false}

/* ---------- text formatting ---------- */
function inline(s){return esc(s).replace(/`([^`]+)`/g,"<code>$1</code>")}
function fmtText(s){
  return String(s).split(/```\n?([\s\S]*?)\n?```/).map((chunk,i)=>{
    if(i%2)return`<pre class="codeblock">${esc(chunk)}</pre>`;
    return chunk.split(/\n{2,}/).filter(x=>x.trim()).map(par=>{
      const lines=par.split("\n");
      if(lines.every(l=>/^- /.test(l)))return`<ul>${lines.map(l=>`<li>${inline(l.slice(2))}</li>`).join("")}</ul>`;
      return`<p>${lines.map(inline).join("<br>")}</p>`}).join("");
  }).join("");
}

/* ---------- editor ---------- */
function makeEditor(host,value,onChange,onRun){
  if(window.CodeMirror){
    const cm=CodeMirror(host,{value,mode:"octave",lineNumbers:true,indentUnit:4,tabSize:4,indentWithTabs:false,matchBrackets:true,viewportMargin:Infinity,lineWrapping:false,
      extraKeys:{Tab:c=>{if(c.somethingSelected())c.indentSelection("add");else c.replaceSelection("    ","end")},"Shift-Tab":c=>c.indentSelection("subtract"),"Ctrl-Enter":()=>onRun(),"Cmd-Enter":()=>onRun()}});
    cm.on("change",()=>onChange(cm.getValue()));
    setTimeout(()=>cm.refresh(),0);
    return{get:()=>cm.getValue(),set:v=>cm.setValue(v),focus:()=>cm.focus(),refresh:()=>cm.refresh()};
  }
  const ta=document.createElement("textarea");ta.className="plain-editor";ta.value=value;ta.spellcheck=false;ta.setAttribute("aria-label","Code editor");ta.rows=12;host.appendChild(ta);
  ta.addEventListener("keydown",e=>{
    if(e.key==="Tab"){e.preventDefault();ta.setRangeText("    ",ta.selectionStart,ta.selectionEnd,"end")}
    else if(e.key==="Enter"&&(e.ctrlKey||e.metaKey)){e.preventDefault();onRun()}
    else if(e.key==="Enter"){const before=ta.value.slice(0,ta.selectionStart);const line=before.split("\n").pop();let ind=line.match(/^ */)[0];if(/^\s*(if|for|while|function|switch|case|otherwise|else|elseif|try|catch)\b/.test(line))ind+="    ";e.preventDefault();ta.setRangeText("\n"+ind,ta.selectionStart,ta.selectionEnd,"end")}
  });
  ta.addEventListener("input",()=>onChange(ta.value));
  return{get:()=>ta.value,set:v=>{ta.value=v},focus:()=>ta.focus(),refresh(){}};
}

/* ---------- plots ---------- */
function niceTicks(lo,hi,n=5){
  if(!(hi>lo)){const c=Number.isFinite(lo)?lo:0;lo=c-1;hi=c+1}
  const raw=(hi-lo)/n;const mag=Math.pow(10,Math.floor(Math.log10(raw)));const f=raw/mag;
  const step=(f<1.5?1:f<3?2:f<7?5:10)*mag;
  const a=Math.floor(lo/step+1e-9)*step,b=Math.ceil(hi/step-1e-9)*step;
  const t=[];for(let v=a;v<=b+step*1e-6;v+=step)t.push(Math.abs(v)<step*1e-9?0:v);
  return{lo:a,hi:b,ticks:t,step};
}
const tickStr=(v,step)=>{const d=Math.max(0,-Math.floor(Math.log10(step)+1e-9));return Math.abs(v)>=1e5||(Math.abs(v)>0&&Math.abs(v)<1e-4)?v.toExponential(1):v.toFixed(d)};
function markerSVG(m,x,y,c,s,filled){
  const r=s||3.5;const f=filled?c:"none";
  switch(m){
    case "o":return`<circle cx="${x}" cy="${y}" r="${r}" fill="${f}" stroke="${c}" stroke-width="1.3"/>`;
    case ".":return`<circle cx="${x}" cy="${y}" r="1.8" fill="${c}"/>`;
    case "s":return`<rect x="${x-r}" y="${y-r}" width="${2*r}" height="${2*r}" fill="${f}" stroke="${c}" stroke-width="1.3"/>`;
    case "d":return`<path d="M${x} ${y-r-1}L${x+r+1} ${y}L${x} ${y+r+1}L${x-r-1} ${y}Z" fill="${f}" stroke="${c}" stroke-width="1.3"/>`;
    case "^":return`<path d="M${x} ${y-r-1}L${x+r+1} ${y+r}L${x-r-1} ${y+r}Z" fill="${f}" stroke="${c}" stroke-width="1.3"/>`;
    case "v":return`<path d="M${x} ${y+r+1}L${x+r+1} ${y-r}L${x-r-1} ${y-r}Z" fill="${f}" stroke="${c}" stroke-width="1.3"/>`;
    case "x":return`<path d="M${x-r} ${y-r}L${x+r} ${y+r}M${x-r} ${y+r}L${x+r} ${y-r}" stroke="${c}" stroke-width="1.3"/>`;
    case "+":return`<path d="M${x-r-1} ${y}L${x+r+1} ${y}M${x} ${y-r-1}L${x} ${y+r+1}" stroke="${c}" stroke-width="1.3"/>`;
    case "*":return`<path d="M${x-r} ${y-r}L${x+r} ${y+r}M${x-r} ${y+r}L${x+r} ${y-r}M${x-r-1} ${y}L${x+r+1} ${y}M${x} ${y-r-1}L${x} ${y+r+1}" stroke="${c}" stroke-width="1.2"/>`;
    default:return`<circle cx="${x}" cy="${y}" r="${r}" fill="${f}" stroke="${c}" stroke-width="1.3"/>`;
  }
}
const DASH={"--":"7 4",":":"2 3","-.":"8 3 2 3","-":""};
function plotSVG(ax,label){
  const W=560,H=380,L=60,R=18,T=ax.title?40:18,B=ax.xlabel?52:34;
  const its=ax.items;let xs=[],ys=[];
  for(const it of its){for(let i=0;i<it.x.length;i++){if(Number.isFinite(it.x[i])&&Number.isFinite(it.y[i])){xs.push(it.x[i]);ys.push(it.y[i])}}if(it.type==="bar"||it.type==="hist")ys.push(0)}
  if(!xs.length){xs=[0,1];ys=[0,1]}
  let x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);
  const barLike=its.some(i=>i.type==="bar");
  let bw=0.8;if(barLike){const bx=[...new Set(its.filter(i=>i.type==="bar").flatMap(i=>i.x))].sort((a,b)=>a-b);let gap=1;for(let i=1;i<bx.length;i++)gap=Math.min(gap,bx[i]-bx[i-1]);bw=0.8*(bx.length>1?gap:1);x0-=bw;x1+=bw}
  if(its.some(i=>i.type==="hist")){const e=its.find(i=>i.type==="hist").edges;x0=Math.min(x0,e[0]);x1=Math.max(x1,e[e.length-1])}
  const tx=niceTicks(ax.xlim?ax.xlim[0]:x0,ax.xlim?ax.xlim[1]:x1);const ty=niceTicks(ax.ylim?ax.ylim[0]:y0,ax.ylim?ax.ylim[1]:y1);
  const xa=ax.xlim?ax.xlim[0]:(its.every(i=>i.type==="line"||i.type==="scatter")&&x1>x0?x0:tx.lo),xb=ax.xlim?ax.xlim[1]:(its.every(i=>i.type==="line"||i.type==="scatter")&&x1>x0?x1:tx.hi);
  const ya=ax.ylim?ax.ylim[0]:ty.lo,yb=ax.ylim?ax.ylim[1]:ty.hi;
  const px=x=>L+(x-xa)/(xb-xa||1)*(W-L-R),py=y=>T+(1-(y-ya)/(yb-ya||1))*(H-T-B);
  const f=n=>Math.round(n*10)/10;
  let s=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label||ax.title||"Plot")}" xmlns="http://www.w3.org/2000/svg" font-family="IBM Plex Sans, system-ui, sans-serif" font-size="12">`;
  s+=`<rect x="0" y="0" width="${W}" height="${H}" fill="#ffffff"/>`;
  s+=`<clipPath id="pc"><rect x="${L}" y="${T}" width="${W-L-R}" height="${H-T-B}"/></clipPath>`;
  const xticks=tx.ticks.filter(v=>v>=xa-1e-9&&v<=xb+1e-9),yticks=ty.ticks.filter(v=>v>=ya-1e-9&&v<=yb+1e-9);
  if(ax.grid){for(const v of xticks)s+=`<line x1="${f(px(v))}" y1="${T}" x2="${f(px(v))}" y2="${H-B}" stroke="#e3e6ea"/>`;for(const v of yticks)s+=`<line x1="${L}" y1="${f(py(v))}" x2="${W-R}" y2="${f(py(v))}" stroke="#e3e6ea"/>`}
  s+=`<g clip-path="url(#pc)">`;
  for(const it of its){
    if(it.type==="bar"){for(let i=0;i<it.x.length;i++){const y=it.y[i];if(!Number.isFinite(y))continue;const a=py(Math.max(0,y)),b=py(Math.min(0,y));s+=`<rect x="${f(px(it.x[i]-bw/2))}" y="${f(a)}" width="${f(px(it.x[i]+bw/2)-px(it.x[i]-bw/2))}" height="${f(Math.max(0.5,b-a))}" fill="${it.color}" fill-opacity=".85" stroke="#333" stroke-width=".5"/>`}continue}
    if(it.type==="hist"){const e=it.edges;for(let i=0;i<it.y.length;i++){const a=py(it.y[i]),b=py(0);s+=`<rect x="${f(px(e[i]))}" y="${f(a)}" width="${f(px(e[i+1])-px(e[i]))}" height="${f(Math.max(0,b-a))}" fill="${it.color}" fill-opacity=".8" stroke="#333" stroke-width=".5"/>`}continue}
    const pts=[];let seg=[];
    for(let i=0;i<it.x.length;i++){if(Number.isFinite(it.x[i])&&Number.isFinite(it.y[i]))seg.push([px(it.x[i]),py(it.y[i])]);else if(seg.length){pts.push(seg);seg=[]}}
    if(seg.length)pts.push(seg);
    const ls=it.type==="scatter"?"none":(it.ls||"-");
    if(ls!=="none"){
      for(const sg of pts){
        if(it.fill)s+=`<path d="M${f(sg[0][0])} ${f(py(Math.max(ya,0)))}L${sg.map(p=>`${f(p[0])} ${f(p[1])}`).join("L")}L${f(sg[sg.length-1][0])} ${f(py(Math.max(ya,0)))}Z" fill="${it.color}" fill-opacity=".35"/>`;
        s+=`<polyline points="${sg.map(p=>`${f(p[0])},${f(p[1])}`).join(" ")}" fill="none" stroke="${it.color}" stroke-width="${(it.lw||1)*1.6}" stroke-linejoin="round" stroke-linecap="round" ${DASH[ls]?`stroke-dasharray="${DASH[ls]}"`:""}/>`;
      }
    }
    const mk=it.type==="scatter"?(it.marker||"o"):it.marker;
    if(mk)for(const sg of pts)for(const p of sg)s+=markerSVG(mk,f(p[0]),f(p[1]),it.color,it.ms?Math.min(8,it.ms*0.6):3.5,it.filled||!!it.mfc);
  }
  s+=`</g><rect x="${L}" y="${T}" width="${W-L-R}" height="${H-T-B}" fill="none" stroke="#444" stroke-width="1"/>`;
  for(const v of xticks){s+=`<line x1="${f(px(v))}" y1="${H-B}" x2="${f(px(v))}" y2="${H-B-5}" stroke="#444"/><text x="${f(px(v))}" y="${H-B+16}" text-anchor="middle" fill="#333">${esc(tickStr(v,tx.step))}</text>`}
  for(const v of yticks){s+=`<line x1="${L}" y1="${f(py(v))}" x2="${L+5}" y2="${f(py(v))}" stroke="#444"/><text x="${L-7}" y="${f(py(v))+4}" text-anchor="end" fill="#333">${esc(tickStr(v,ty.step))}</text>`}
  if(ax.title)s+=`<text x="${(L+W-R)/2}" y="24" text-anchor="middle" font-weight="600" font-size="14" fill="#111">${esc(ax.title)}</text>`;
  if(ax.xlabel)s+=`<text x="${(L+W-R)/2}" y="${H-12}" text-anchor="middle" fill="#222">${esc(ax.xlabel)}</text>`;
  if(ax.ylabel)s+=`<text transform="translate(16 ${(T+H-B)/2}) rotate(-90)" text-anchor="middle" fill="#222">${esc(ax.ylabel)}</text>`;
  if(ax.legend&&ax.legend.length){
    const names=ax.legend.slice(0,its.length);const w=Math.min(220,Math.max(...names.map(n=>n.length))*7+44),h=names.length*18+8;
    const lx=W-R-w-8,ly=T+8;
    s+=`<rect x="${lx}" y="${ly}" width="${w}" height="${h}" fill="#fff" stroke="#999"/>`;
    names.forEach((n,i)=>{const it=its[i];const y=ly+14+i*18;
      if(it.type==="bar"||it.type==="hist")s+=`<rect x="${lx+8}" y="${y-6}" width="20" height="10" fill="${it.color}"/>`;
      else{if(it.type!=="scatter"&&it.ls!=="none")s+=`<line x1="${lx+6}" y1="${y}" x2="${lx+30}" y2="${y}" stroke="${it.color}" stroke-width="${(it.lw||1)*1.6}" ${DASH[it.ls]?`stroke-dasharray="${DASH[it.ls]}"`:""}/>`;const mk=it.type==="scatter"?"o":it.marker;if(mk)s+=markerSVG(mk,lx+18,y,it.color,3.5)}
      s+=`<text x="${lx+36}" y="${y+4}" fill="#222">${esc(n)}</text>`});
  }
  return s+"</svg>";
}
function figsHTML(I){
  const figs=I.figs.filter(f=>f.ax.items.length||f.ax.title);
  if(!figs.length)return"";
  return`<div class="stack"><h3>${figs.length>1?"Figures":"Figure"}</h3>${figs.map(fg=>`<figure class="fig">${figs.length>1?`<figcaption class="small muted">Figure ${fg.n}</figcaption>`:""}${plotSVG(fg.ax,`Figure ${fg.n}`)}</figure>`).join("")}</div>`;
}

/* ---------- running and output ---------- */
function workspaceHTML(I,pre){
  const vars=[...I.base.vars.entries()].sort((a,b)=>a[0].localeCompare(b[0]));
  if(!vars.length)return`<div class="stack"><h3>Workspace</h3><p class="small muted">No variables yet. Create one with something like <code>x = 5</code>.</p></div>`;
  return`<div class="stack"><h3>Workspace</h3><div class="wsx"><table class="wstable"><thead><tr><th scope="col">Name</th><th scope="col">Value</th><th scope="col">Size</th><th scope="col">Class</th></tr></thead><tbody>${vars.map(([n,v])=>`<tr><td class="mono">${esc(n)}${pre&&pre.has(n)?` <span class="pill todo" title="Given to you by the problem">given</span>`:""}</td><td class="mono">${esc(MLAB.summary(v))}</td><td class="mono">${MLAB.sizeStr(v)}</td><td class="mono">${MLAB.cls(v)}</td></tr>`).join("")}</tbody></table></div></div>`;
}
const ERR_TIPS=[
  [/^Unrecognized function or variable/,"MATLAB doesn't know that name. Check the spelling and capitals, and make sure the variable is created on a line above the one that uses it."],
  [/^Invalid expression|Invalid text character/,"MATLAB couldn't read this line. Look for a missing operator (2x should be 2*x), a missing or extra bracket, or a stray symbol."],
  [/^Incorrect use of '=' operator/,"One = stores a value; two (==) compare. Conditions in if and while need ==."],
  [/^At least one END is missing/,"Every if, for, while, switch and function needs its own end. Indenting the inside of each block makes it easier to see which one is missing."],
  [/^Illegal use of reserved keyword "end"/,"There's an end with nothing to close. Check that each end matches an if, for, while, switch or function."],
  [/^Index exceeds|exceeds array bounds/,"You asked for a position past the end of the array. Check its size with numel or size, or use end for the last element."],
  [/Array indices must be positive integers/,"Indexes count from 1 and must be whole numbers. x(0), x(-1) and x(1.5) aren't allowed."],
  [/^Incorrect dimensions for matrix multiplication/,"* is matrix multiplication. To multiply element by element, use .* (and ./ and .^ for dividing and powers)."],
  [/^Incorrect dimensions for raising a matrix to a power/,"^ on an array means matrix power. To square each element, use .^"],
  [/^Arrays have incompatible sizes/,"Element-by-element maths needs arrays of the same size. Check both sizes with size(...). A row and a column don't match."],
  [/^Dimensions of arrays being concatenated/,"Everything joined side by side needs the same number of rows, and everything stacked needs the same number of columns."],
  [/^Unable to perform assignment because the (left and right sides|size of the left side)/,"The number of elements on the left of = doesn't match the number on the right."],
  [/^Too many output arguments/,"Something is being stored that doesn't return a value. disp and fprintf only print: they don't give anything back to store."],
  [/^Not enough input arguments/,"The function needs more inputs than it was given. Check what it expects with help, for example help round."],
  [/^Output argument/,"Your function finished without setting one of its outputs. Make sure every output gets a value, on every path through the function."],
  [/Brace indexing is not supported/,"Curly braces { } are only for cell arrays. For ordinary arrays use round brackets ( )."],
  [/Dot indexing is not supported/,"Only structures have fields like s.name."],
  [/not terminated properly/,"A quote was opened but not closed. Every ' or \" needs a partner on the same line."],
  [/Function definitions in a script must appear at the end/,"Move your function ... end blocks to the very bottom of the code."],
  [/^Operands to the (\|\||&&) operator/,"&& and || need single true/false values. For arrays use & and |, or wrap the condition in any(...) or all(...)."],
  [/^Undefined|^Conversion to/,"The types don't fit together. Check what kind of value each variable holds in the workspace (Class column)."],
];
function errHTML(err){
  const tip=(ERR_TIPS.find(([re])=>re.test(err.message))||[])[1];
  const where=err.line?(err.where&&err.where!=="anonymous function"?`Error in ${err.where} (line ${err.line})`:`Error on line ${err.line}`):"";
  return`<div class="errbox"><pre class="console err">${err.using?`Error using ${esc(err.using)}\n`:""}${esc(err.message)}${where?`\n\n${esc(where)}`:""}</pre>${tip?`<p class="small">${esc(tip)}</p>`:""}</div>`;
}
function timeoutHTML(){return`<div class="fb bad"><span class="verdict">Your code took too long</span><span>It ran for several seconds without finishing, so it was stopped. Usually that's a while loop whose condition never becomes false: check that something inside the loop changes it.</span></div>`}
function runOutputHTML(r,preVars){
  if(r.error&&r.error.timeout)return timeoutHTML();
  const out=r.out.replace(/\n{3,}/g,"\n\n").replace(/^\n+/,"").replace(/\s+$/,"");
  return`<div class="stack"><h3>Output</h3><pre class="console">${out?esc(out):'<span class="muted">(nothing was displayed)</span>'}</pre>${r.error?errHTML(r.error):""}</div>${figsHTML(r.I)}${workspaceHTML(r.I,preVars)}`;
}
function varsOf(pre){if(!pre)return new Set();try{const r=MLAB.runCode(pre);return new Set(r.I.base.vars.keys())}catch(e){return new Set()}}

/* ---------- problem workspace ---------- */
const draftKey=(id,review)=>"ml_code_"+id+(review?"_r":"");
function testLabel(t){
  if(t.label)return t.label;
  const parts=[];
  if(t.pre)parts.push(t.pre.replace(/\n/g," ").replace(/;\s*$/,""));
  if(t.eq&&t.eq.length)parts.push("checks "+t.eq.map(e=>e[2]||e[0]).join(", "));
  if(t.out!==undefined)parts.push("checks what's displayed");
  if(t.plot)parts.push("checks the plot");
  if(t.check&&!parts.length)parts.push("runs extra checks");
  return parts.join(" · ")||"Run your code";
}
function openProblem(id,opts={}){
  const p=PROBS[id];if(!p)return;
  const host=$("#v-problem");const U=unitOf(p.unit);const st=pstat(id);
  const review=!!opts.review;let code=review?(lsGet(draftKey(id,true))??p.starter??""):(lsGet(draftKey(id))??p.starter??"");
  const pre=p.pre!==undefined?p.pre:(p.tests[0].pre||"");
  const examples=p.tests.filter(t=>t.out!==undefined&&t.match===undefined).slice(0,2);
  host.innerHTML=`<div class="stack">
    <div class="row between"><button class="btn ghost chip" id="pback">← Back</button><span class="pill ${isSolved(id)?"ok":"todo"}" id="pstatus">${isSolved(id)?"solved":"not solved yet"}</span></div>
    <div class="card stack">
      <span class="tag">Unit ${U.n} · ${esc(U.title)}${review?" · from memory":""}</span>
      <h2>${esc(p.title)}</h2>
      ${review?`<p class="banner">Review: solve this again without looking. You've seen it before, so this is where it sticks.</p>`:""}
      <div class="brief measure">${fmtText(p.brief)}</div>
      ${pre?`<div class="stack small"><h3>Already in your workspace</h3><pre class="codeblock">${esc(pre)}</pre><p class="small muted">The checks also try other values, so use these variables rather than typing their values in.</p></div>`:""}
      ${examples.length?`<div class="stack small"><h3>Should display</h3>${examples.map(t=>`<pre class="codeblock">${t.pre&&t.pre!==pre?`<span class="muted">with ${esc(t.pre.replace(/\n/g," "))}</span>\n`:""}${esc(t.out)}</pre>`).join("")}</div>`:""}
    </div>
    <div class="card stack ws">
      <div class="row between"><h3>script.m</h3><span class="kbd">Ctrl/⌘ + Enter to check</span></div>
      <div id="editor"></div>
      <div class="row">
        <button class="btn" id="prun">Run</button>
        <button class="btn accent" id="pcheck">Check</button>
        <button class="btn ghost" id="phint">Hint</button>
        <button class="btn ghost" id="psol" hidden>Show solution</button>
        <button class="btn ghost" id="preset">Reset code</button>
      </div>
      <div id="hints" class="stack"></div>
      <div id="pout" class="stack" aria-live="polite"></div>
      <div id="psolbox"></div>
    </div>
    ${!review?`<p class="small muted center">Stuck for more than 20 minutes? Take a hint, then try again tomorrow. Struggling a bit is how it sticks.</p>`:""}
  </div>`;
  const ed=makeEditor(host.querySelector("#editor"),code,v=>{lsSet(draftKey(id,review),v)},()=>check());
  const preVars=varsOf(pre);
  let hintsShown=0,fails=0;const hintsBox=host.querySelector("#hints");const out=host.querySelector("#pout");
  const solBtn=host.querySelector("#psol");
  const updSol=()=>{solBtn.hidden=!(isSolved(id)&&!review||fails>=2||st.shown)};updSol();
  host.querySelector("#pback").onclick=()=>back();
  host.querySelector("#preset").onclick=e=>{const b=e.currentTarget;if(b.dataset.sure){ed.set(p.starter||"");lsDel(draftKey(id,review));b.textContent="Reset code";delete b.dataset.sure}else{b.dataset.sure="1";b.textContent="Sure? Click again";setTimeout(()=>{if(b.isConnected){b.textContent="Reset code";delete b.dataset.sure}},3000)}};
  const hintBtn=host.querySelector("#phint");
  const hintLabel=()=>{hintBtn.textContent=hintsShown<p.hints.length?`Hint ${hintsShown+1} of ${p.hints.length}`:"No more hints";hintBtn.disabled=hintsShown>=p.hints.length};hintLabel();
  hintBtn.onclick=()=>{if(hintsShown>=p.hints.length)return;hintsBox.insertAdjacentHTML("beforeend",`<p class="hint qin"><b>Hint ${hintsShown+1}.</b> ${inline(p.hints[hintsShown])}</p>`);hintsShown++;st.hints++;queueSave();hintLabel()};
  solBtn.onclick=()=>{
    if(!isSolved(id)&&!st.shown&&!solBtn.dataset.sure){solBtn.dataset.sure="1";solBtn.textContent="Sure? It'll come back for review";return}
    if(!isSolved(id)||review){st.shown=true;st.shownDay=todayKey();flagProblem(id);if(opts.onGiveUp)opts.onGiveUp()}
    host.querySelector("#psolbox").innerHTML=`<div class="stack qin"><h3>One way to solve it</h3><pre class="codeblock">${esc(p.solution)}</pre><p class="small muted">Yours doesn't have to match. If it passes the checks, it's right.</p></div>`;solBtn.hidden=true;
  };
  const busy=b=>host.querySelectorAll("#prun,#pcheck").forEach(x=>x.disabled=b);
  async function run(){
    busy(true);out.innerHTML=`<p class="small muted">Running…</p>`;
    try{const r=await later(()=>MLAB.runCode(ed.get(),{pre,inputs:p.tests[0].inputs}));out.innerHTML=runOutputHTML(r,preVars)}
    finally{busy(false)}
  }
  async function check(){
    if(host.querySelector("#pcheck").disabled)return;
    busy(true);out.innerHTML=`<p class="small muted">Checking ${p.tests.length} test${p.tests.length>1?"s":""}…</p>`;
    try{
      const codeNow=ed.get();
      const res=await later(()=>p.tests.map(t=>({t,r:MLAB.runTest(codeNow,t,p)})));
      st.checks++;
      if(res.some(x=>x.r.fails.some(f=>f.k==="timeout"))){fails++;out.innerHTML=timeoutHTML();updSol();queueSave();return}
      const passed=res.filter(x=>!x.r.fails.length).length;const all=passed===res.length;
      const firstBad=res.find(x=>x.r.fails.length);
      out.innerHTML=`<div class="fb ${all?"ok":"bad"}"><span class="verdict">${all?"All tests pass":`${passed} of ${res.length} tests pass`}</span>
        <ul class="tests">${res.map(x=>`<li class="${x.r.fails.length?"no":"yes"}"><span aria-hidden="true">${x.r.fails.length?"✗":"✓"}</span> ${esc(testLabel(x.t))}</li>`).join("")}</ul>
        ${firstBad?failHTML(firstBad,p,codeNow,preVars):""}</div>`;
      if(all){const first=recordSolve(id,review);
        host.querySelector("#pstatus").className="pill ok";host.querySelector("#pstatus").textContent="solved";
        if(review)lsDel(draftKey(id,true));
        out.querySelector(".fb").insertAdjacentHTML("beforeend",`<span>${first?"Solved. Nice work.":"Solved again."}</span>`);
        out.querySelector(".fb").classList.add("good");
        if(opts.onSolved)opts.onSolved();updSol();
        const nx=nextAfter(id);
        out.insertAdjacentHTML("beforeend",`<div class="row">${opts.fromDaily?`<button class="btn accent" id="pdone">Back to today's set</button>`:nx?`<button class="btn accent" id="pnext">Next problem: ${esc(PROBS[nx].title)}</button>`:""}</div>`);
        const pd=out.querySelector("#pdone");if(pd)pd.onclick=()=>back();
        const pn=out.querySelector("#pnext");if(pn)pn.onclick=()=>openProblem(nx,{from:opts.from});
        const lastPlot=res[res.length-1].r;if(lastPlot.I.figs.length)out.insertAdjacentHTML("beforeend",figsHTML(lastPlot.I));
      }else{fails++;st.fails++;updSol()}
      queueSave();
    }finally{busy(false)}
  }
  host.querySelector("#prun").onclick=run;host.querySelector("#pcheck").onclick=check;
  showView("problem");try{history.replaceState(null,"","#p/"+id)}catch(e){}
  window.scrollTo({top:0,behavior:"auto"});
  PROBLEM_CTX={id,opts};
}
let PROBLEM_CTX=null,LAST_VIEW="daily";
function nextAfter(id){const ids=Object.keys(PROBS);const i=ids.indexOf(id);for(let k=i+1;k<ids.length;k++)if(!isSolved(ids[k]))return ids[k];return null}
function failHTML(x,p,code,preVars){
  const {t,r}=x;const f=r.fails;let body="";
  for(const e of f){
    if(e.k==="out"){
      body+=`<div class="diff"><div><h3>Expected</h3><pre class="console">${e.want===null?'<span class="muted">(see the problem)</span>':esc(e.want)||'<span class="muted">(nothing)</span>'}</pre></div><div><h3>Your code displayed</h3><pre class="console">${esc(e.got)||'<span class="muted">(nothing)</span>'}</pre></div></div>`;
      if(e.want&&e.got&&e.want.toLowerCase()===e.got.toLowerCase())body+=`<p class="small">Close: only the capitals differ.</p>`;
      else if(e.want&&e.got&&e.want.replace(/\s+/g,"")===e.got.replace(/\s+/g,""))body+=`<p class="small">Close: only the spaces or line breaks differ.</p>`;
      else if(/^\w+ =$/m.test(e.got))body+=`<p class="small">Lines like <code>${esc(e.got.match(/^\w+ =$/m)[0])}</code> appear because a line has no semicolon. End lines with ; to hide their results.</p>`;
      else if(e.want&&e.got&&e.got.replace(/\n/g,"")===e.want.replace(/\n/g,""))body+=`<p class="small">Close: check your \\n new lines.</p>`;
    }
    else if(e.k==="crash")body+=errHTML(r.error);
    else body+=`<p>${esc(e.msg)}</p>`;
  }
  const given=[...preVars].filter(n=>new RegExp(`^\\s*${n}\\s*=\\s*(\\[[^\\]]*\\]|-?[\\d.]+|'[^']*'|"[^"]*"|\\{[^}]*\\})\\s*;?\\s*(%.*)?$`,"m").test(code));
  if(given.length)body+=`<p class="small hint">Your code sets <code>${esc(given[0])}</code> itself. It's already in the workspace and the checks give it different values, so delete that line and use it as it is.</p>`;
  return`<div class="stack small failbox"><b>First failing test: ${esc(testLabel(t))}</b>${body}</div>`;
}

/* ---------- quick-question runner ---------- */
function quickCorrect(q,v){
  if(q.v){
    try{const got=MLAB.evalFresh("["+v+"]",""),want=MLAB.evalFresh("["+q.a+"]","");return!MLAB.compareVals(got,want,q.v)}catch(e){return false}
  }
  return MLAB.normOut(v)===MLAB.normOut(q.a);
}
function quickRunner(host,ids,{title,onDone}){
  let i=0,right=0;
  function draw(){
    const q=QUICK[ids[i]];if(!q){onDone&&onDone(right,ids.length);return}
    const multi=!q.opts&&!q.v&&/\n/.test(q.a);
    const label=q.v?`Type the value of ${q.v}, like 5 or [1 2 3]`:multi?"Type exactly what it displays, one line per line":"Type exactly what it displays";
    host.innerHTML=`<div class="card ticket qin">
      <div class="meta"><span>${esc(title)} · ${i+1} / ${ids.length}</span><span>Unit ${q.unit}${S.mistakes.some(m=>m.kind==="q"&&m.key===q.id)?" · review":""}</span></div>
      <div class="progressbar"><i style="width:${i/ids.length*100}%"></i></div>
      <div class="q">${esc(q.q)}</div>
      ${q.code?`<pre class="codeblock">${esc(q.code)}</pre>`:""}
      ${q.opts?`<div class="opts" role="group" aria-label="Answers">${q.opts.map((o,k)=>`<button class="opt" data-k="${k}">${esc(o)}</button>`).join("")}</div>`
        :multi?`<label class="small muted" for="qans">${label}</label><textarea id="qans" rows="3" spellcheck="false" class="mono"></textarea>`
        :`<label class="small muted" for="qans">${label}</label><input type="text" id="qans" autocomplete="off" spellcheck="false" class="mono">`}
      ${q.opts?"":`<div class="row"><button class="btn" id="qsub">Check</button><button class="btn ghost" id="qskip">I don't know</button></div>`}
      <div id="qfb"></div></div>`;
    if(!q.opts){const inp=host.querySelector("#qans");inp.focus({preventScroll:true});
      inp.addEventListener("keydown",e=>{if(e.key==="Enter"&&(!multi||e.ctrlKey||e.metaKey)){e.preventDefault();answer(inp.value,false)}});
      host.querySelector("#qsub").onclick=()=>answer(inp.value,false);host.querySelector("#qskip").onclick=()=>answer("",true);}
    else host.querySelectorAll(".opt").forEach(b=>b.onclick=()=>answer(Number(b.dataset.k),false));
  }
  function answer(v,skipped){
    const q=QUICK[ids[i]];const card=host.querySelector(".ticket");if(card.dataset.done)return;
    let ok;
    if(q.opts){ok=v===q.a;host.querySelectorAll(".opt").forEach(b=>{const k=Number(b.dataset.k);b.disabled=true;if(k===q.a)b.classList.add("right");else if(k===v)b.classList.add("wrong")})}
    else{if(!skipped&&!String(v).trim())return;ok=!skipped&&quickCorrect(q,v);host.querySelectorAll("#qans,#qsub,#qskip").forEach(el=>el.disabled=true)}
    card.dataset.done="1";if(ok)right++;recordQuick(q,ok);
    card.classList.remove("qin");card.classList.add(ok?"good":"shake");
    const fb=host.querySelector("#qfb");
    fb.innerHTML=`<div class="fb ${ok?"ok":"bad"}"><span class="verdict">${ok?"Correct":"Not quite"}</span>
      ${q.v?`<span class="muted">The answer:</span><pre class="console">${esc(q.v)} = ${esc(q.a)}</pre>`:!q.opts?`<span class="muted">It displays:</span><pre class="console">${esc(q.a)}</pre>`:""}
      <span>${esc(q.why||"")}</span>${!ok&&!q.opts&&!q.v&&/^["'].*["']$/.test(String(v).trim())?`<span class="small">disp and fprintf don't show the quotes around text.</span>`:""}</div>
      <div class="row" style="margin-top:10px"><button class="btn accent" id="qnext">${i+1<ids.length?"Next":"Finish"}</button>${q.code?`<button class="btn ghost" id="qtry">Try it in the Playground</button>`:""}</div>`;
    const nb=fb.querySelector("#qnext");nb.focus({preventScroll:true});nb.onclick=()=>{i++;draw()};
    const tb=fb.querySelector("#qtry");if(tb)tb.onclick=()=>openPlayground(q.code);
  }
  draw();
}

/* ---------- views ---------- */
const VIEWS=["learn","daily","practice","play","profile"];
function streak(){let n=0;const d=new Date();if(!(S.days[todayKey()]?.daily))d.setDate(d.getDate()-1);while(S.days[d.toLocaleDateString("en-CA")]?.daily){n++;d.setDate(d.getDate()-1)}return n}
function renderStrip(){
  bump("#sStreak",streak());bump("#sSolved",Object.keys(S.solved).filter(id=>PROBS[id]).length);
  $("#sTotal").textContent=TOTAL();
}
function bump(sel,v){const el=$(sel);if(!el)return;if(el.textContent!==String(v)){el.textContent=v;el.classList.remove("bump");void el.offsetWidth;el.classList.add("bump")}}
function refLine(U){
  return U.ref?`<p class="small muted">Matches MATLAB Onramp: <a href="${ONRAMP_URL}" target="_blank" rel="noopener">${esc(U.ref)}</a>. Do this unit, then that part of Onramp (free with a MathWorks account).</p>`
    :`<p class="small muted">Goes beyond Onramp. The <a href="${DOCS_URL}" target="_blank" rel="noopener">MATLAB documentation</a> has more examples.</p>`;
}
function lessonHTML(U,open){
  return`<div class="lessonbody" ${open?"":"hidden"}>${U.sections.map((x,k)=>`<div class="lsec"><b>${esc(x.h)}</b>${fmtText(x.p)}${x.code?`<pre class="codeblock">${esc(x.code)}</pre><div><button class="btn ghost chip" data-try="${U.n}.${k}">Try it ▸</button></div>`:""}</div>`).join("")}
    <div class="lsec"><b>Remember</b><ul>${U.takeaways.map(t=>`<li>${inline(t)}</li>`).join("")}</ul></div></div>`;
}
function wireTry(host){host.querySelectorAll("[data-try]").forEach(b=>b.onclick=()=>{const[n,k]=b.dataset.try.split(".").map(Number);openPlayground(unitOf(n).sections[k].code)})}
function renderDaily(){
  const host=$("#v-daily");
  if(!DAY||DAY.date!==todayKey()){DAY=buildDay();save()}
  const U=currentUnit();const lessonId=U?"u"+U.n:null;const read=lessonId&&S.lessonsRead.includes(lessonId);
  const done=dayDone();
  const item=(label,sub,state,btn)=>`<li class="dayitem ${state}"><span class="tick" aria-hidden="true">${state==="done"?"✓":""}</span><span class="l"><span>${label}</span><span class="small muted">${sub}</span></span>${btn}</li>`;
  host.innerHTML=`${DAILY&&DAILY.message?`<div class="card"><p class="measure">${esc(DAILY.message)}</p></div>`:""}
    ${U?`<div class="card lesson">
      <div class="row between"><h3>${read?"Current unit":"Today's lesson"} · Unit ${U.n} of ${UNITS.length}</h3>${read?`<span class="pill ok">read</span>`:""}</div>
      <h2>${esc(U.title)}</h2>${refLine(U)}
      ${lessonHTML(U,!read)}
      <div class="row">${read?`<button class="btn ghost" id="ltoggle">Show lesson</button>`:`<button class="btn" id="lread">Got it</button>`}<span class="muted small">${unitSolved(U)} of ${U.problems.length} problems solved in this unit</span></div></div>`
      :`<div class="card lesson"><h3>Course complete</h3><h2>You've solved every problem.</h2><p class="muted measure">Time for MATLAB Onramp's final project and some real data. Daily sets now mix review problems from memory.</p></div>`}
    <div class="card stack">
      <h3>${new Date().toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long"})}</h3>
      <h2>${done?"Today's set is done. See you tomorrow.":"Today's set · about 30 minutes"}</h2>
      <p class="muted measure">Read the lesson, try its examples, then a quick warm-up and problems: new ones from where you are in the course, plus one you've seen before to solve from memory.</p>
      <ol class="daylist">
        ${item("Warm-up",`${DAY.quick.length} quick questions`,DAY.quickDone?"done":"",`<button class="btn ${DAY.quickDone?"ghost":"accent"} chip" id="dwarm">${DAY.quickDone?"Again":"Start"}</button>`)}
        ${DAY.problems.map((x,k)=>{const p=PROBS[x.id];return item(esc(p.title),`${x.review?"From memory · ":""}Unit ${p.unit} · ${esc(unitOf(p.unit).title)}`,x.done?"done":"",`<button class="btn ${x.done?"ghost":"accent"} chip" data-dp="${k}">${x.done?"Open":"Solve"}</button>`)}).join("")}
      </ol>
      <div class="row">${done?`<button class="btn ghost" id="dextra">Give me another problem</button>`:""}<span class="muted small">Streak: ${streak()} day${streak()===1?"":"s"}. A day counts once the warm-up is done and every problem is solved or its solution viewed.</span></div>
    </div>
    <div id="runhost"></div>`;
  wireTry(host);
  const lr=host.querySelector("#lread");if(lr)lr.onclick=()=>{S.lessonsRead=[...S.lessonsRead,lessonId];queueSave();renderDaily()};
  const lt=host.querySelector("#ltoggle");if(lt)lt.onclick=()=>{const b=host.querySelector(".lessonbody");b.hidden=!b.hidden;lt.textContent=b.hidden?"Show lesson":"Hide lesson"};
  host.querySelector("#dwarm").onclick=()=>{const rh=host.querySelector("#runhost");
    quickRunner(rh,DAY.quick,{title:"Warm-up",onDone:(r,n)=>{DAY.quickDone=true;const fin=markDayProgress();save();renderDaily();
      const rh2=$("#runhost");rh2.innerHTML=`<div class="card stack qin"><h3>Warm-up done</h3><div class="big tabular">${r}/${n}</div><p class="muted">${fin?"That's today's set finished.":"Now the problems."} Misses come back in later warm-ups until you get them right twice.</p></div>`}});
    rh.scrollIntoView({behavior:reduced()?"auto":"smooth",block:"start"})};
  host.querySelectorAll("[data-dp]").forEach(b=>b.onclick=()=>{const k=Number(b.dataset.dp);const x=DAY.problems[k];
    const fin=()=>{x.done=true;markDayProgress();save()};
    openProblem(x.id,{review:x.review,fromDaily:true,from:"daily",onSolved:fin,onGiveUp:fin})});
  const ex=host.querySelector("#dextra");if(ex)ex.onclick=()=>{const id=nextNew(1,DAY.problems.map(p=>p.id))[0]||pickReview(DAY.problems.map(p=>p.id))?.id;if(id)openProblem(id,{from:"daily",review:isSolved(id)})};
}
// The solution-viewed rule: a problem whose solution was revealed counts as done for the day.
function syncDayFromShown(){if(!DAY)return;for(const x of DAY.problems)if(!x.done&&S.prob[x.id]&&S.prob[x.id].shown&&S.prob[x.id].shownDay===todayKey())x.done=true}
function renderLearn(){
  const host=$("#v-learn");const cu=currentUnit();
  host.innerHTML=`<div class="card stack"><h3>The course</h3><h2>From your first line to real programs</h2>
    <p class="muted measure">${UNITS.length} units that start from nothing. The first ones follow the order of <a href="${ONRAMP_URL}" target="_blank" rel="noopener">MATLAB Onramp</a>, MathWorks' free 2-hour intro course, then carry on with text, loops, functions and data structures. Read a unit, try its examples, then solve its problems. A unit is done when every problem passes.</p>
    <p class="small muted measure">Your code runs on a MATLAB engine built into this site. It covers what this course needs, but it isn't the full MATLAB. For bigger projects use MATLAB Online or the desktop app (many universities give students a free licence).</p></div>
    <ol class="units">${UNITS.map(U=>{const d=unitDone(U),cur=cu&&cu.n===U.n,n=unitSolved(U);
      return`<li class="card unit ${d?"done":""} ${cur?"current":""}"><button class="unithead" data-u="${U.n}" aria-expanded="false">
        <span class="unum tabular">${U.n}</span><span class="utitle">${esc(U.title)}<span class="small muted" style="display:block;font-weight:400">${U.ref?"Onramp: "+esc(U.ref):"Beyond Onramp"}</span></span>
        <span class="pill ${d?"ok":cur?"mid":"todo"}">${d?"done":cur?"up next":n?`${n}/${U.problems.length}`:"not started"}</span></button>
        <div class="unitbody" hidden>${refLine(U)}${lessonHTML(U,true)}
          <div class="stack"><h3>Problems</h3><div class="list">${U.problems.map(p=>`<div><span class="l">${esc(p.title)}</span><span class="row" style="gap:8px"><span class="pill ${isSolved(p.id)?"ok":"todo"}">${isSolved(p.id)?"solved":"to do"}</span><button class="btn ghost chip" data-open="${p.id}">Open</button></span></div>`).join("")}</div></div>
          <div class="row"><button class="btn accent" data-quiz="${U.n}">Quick check: ${U.quick.length} questions</button></div><div class="uhost"></div></div></li>`}).join("")}</ol>`;
  wireTry(host);
  host.querySelectorAll(".unithead").forEach(b=>b.onclick=()=>{const body=b.nextElementSibling;const open=body.hidden;body.hidden=!open;b.setAttribute("aria-expanded",String(open));if(open)body.classList.add("qin")});
  host.querySelectorAll("[data-open]").forEach(b=>b.onclick=()=>openProblem(b.dataset.open,{from:"learn",review:false}));
  host.querySelectorAll("[data-quiz]").forEach(b=>b.onclick=()=>{const U=unitOf(Number(b.dataset.quiz));const uh=b.closest(".unitbody").querySelector(".uhost");
    quickRunner(uh,U.quick.map((_,i)=>U.n+"."+i),{title:`Unit ${U.n} quick check`,onDone:(r,n)=>{uh.innerHTML=`<div class="card stack qin"><h3>Unit ${U.n} quick check</h3><div class="big tabular">${r}/${n}</div><p class="muted">${r===n?"All correct.":"Misses will come back in your daily warm-ups."}</p></div>`}})});
}
function renderPractice(){
  const host=$("#v-practice");const solvedIds=Object.keys(S.solved).filter(id=>PROBS[id]);const cu=currentUnit();
  host.innerHTML=`<div class="card stack"><h3>Practice</h3><h2>Extra reps whenever you want them</h2>
      <p class="muted measure">Drill quick questions from one unit, or re-solve a problem from memory. Rewriting a solution from a blank page is one of the fastest ways to make it stick.</p>
      <div class="row"><button class="btn accent" id="memory" ${solvedIds.length?"":"disabled"}>Random problem from memory</button><button class="btn ghost" id="mixed">10 mixed quick questions</button></div>
      <div class="stack"><span class="small muted">Drill one unit:</span><div class="row">${UNITS.map(U=>`<button class="btn ghost chip" data-drill="${U.n}">${U.n}. ${esc(U.title.split(/[:,]/)[0])}</button>`).join("")}</div></div>
    </div><div id="prhost"></div>
    <div class="card stack"><h3>All problems · ${solvedIds.length} of ${TOTAL()} solved</h3>
      ${UNITS.map(U=>`<div class="stack" style="gap:6px"><span class="small"><b>Unit ${U.n}</b> <span class="muted">${esc(U.title)}</span></span><div class="row" style="gap:6px">${U.problems.map(p=>`<button class="btn ghost chip pchip ${isSolved(p.id)?"solved":""}" data-open="${p.id}">${isSolved(p.id)?"✓ ":""}${esc(p.title)}</button>`).join("")}</div></div>`).join("")}</div>`;
  const ph=host.querySelector("#prhost");
  host.querySelectorAll("[data-drill]").forEach(b=>b.onclick=()=>{const U=unitOf(Number(b.dataset.drill));quickRunner(ph,shuffle(U.quick.map((_,i)=>U.n+"."+i)),{title:`Unit ${U.n} drill`,onDone:(r,n)=>{ph.innerHTML=`<div class="card stack qin"><h3>Drill done</h3><div class="big tabular">${r}/${n}</div></div>`}});ph.scrollIntoView({behavior:reduced()?"auto":"smooth",block:"start"})});
  host.querySelector("#mixed").onclick=()=>{const upto=cu?cu.n:UNITS.length;const ids=shuffle(Object.keys(QUICK).filter(id=>QUICK[id].unit<=upto)).slice(0,10);quickRunner(ph,ids,{title:"Mixed",onDone:(r,n)=>{ph.innerHTML=`<div class="card stack qin"><h3>Mixed set done</h3><div class="big tabular">${r}/${n}</div></div>`}});ph.scrollIntoView({behavior:reduced()?"auto":"smooth",block:"start"})};
  host.querySelector("#memory").onclick=()=>{const id=shuffle(solvedIds)[0];if(id)openProblem(id,{from:"practice",review:true})};
  host.querySelectorAll("[data-open]").forEach(b=>b.onclick=()=>openProblem(b.dataset.open,{from:"practice",review:false}));
}
const PLAY_DEFAULT=`% The Playground: try anything here, then press Run.
% Variables appear in the workspace below, plots underneath the output.
x = linspace(0, 2*pi, 50);
y = sin(x);
plot(x, y, 'b-o')
title('My first plot')
`;
let PLAY_ED=null;
function renderPlay(){
  const host=$("#v-play");
  host.innerHTML=`<div class="card stack ws">
      <div class="row between"><h3>Playground</h3><span class="kbd">Ctrl/⌘ + Enter to run</span></div>
      <p class="small muted measure">A scratch space, like MATLAB's command window and editor in one. Nothing here is checked. Your code is kept in this browser.</p>
      <div id="playeditor"></div>
      <div class="row"><button class="btn accent" id="playrun">Run</button><button class="btn ghost" id="playclear">Clear code</button><button class="btn ghost" id="playexample">Example</button></div>
      <div id="playout" class="stack" aria-live="polite"></div>
    </div>`;
  const ed=makeEditor(host.querySelector("#playeditor"),lsGet("ml_play")??PLAY_DEFAULT,v=>lsSet("ml_play",v),()=>run());PLAY_ED=ed;
  const out=host.querySelector("#playout");
  async function run(){const b=host.querySelector("#playrun");b.disabled=true;out.innerHTML=`<p class="small muted">Running…</p>`;try{const r=await later(()=>MLAB.runCode(ed.get()));out.innerHTML=runOutputHTML(r,null)}finally{b.disabled=false}}
  host.querySelector("#playrun").onclick=run;
  host.querySelector("#playclear").onclick=()=>{ed.set("");lsSet("ml_play","");out.innerHTML="";ed.focus()};
  host.querySelector("#playexample").onclick=()=>{ed.set(PLAY_DEFAULT);lsSet("ml_play",PLAY_DEFAULT)};
  PLAY_RUN=run;
}
let PLAY_RUN=null;
function openPlayground(code){lsSet("ml_play",code);go("play");if(PLAY_RUN)PLAY_RUN()}
function renderProfile(){
  const host=$("#v-profile");const solved=Object.keys(S.solved).filter(id=>PROBS[id]).length;
  let qn=0,qc=0;for(const k in S.quick){qn+=S.quick[k].n;qc+=S.quick[k].c}
  const cells=[];const d=new Date();d.setDate(d.getDate()-34);
  for(let i=0;i<35;i++){const k=d.toLocaleDateString("en-CA");const v=S.days[k];const n=(v?.n||0)+3*(v?.solved||0);cells.push(`<i class="${n>=15?"l3":n>=6?"l2":n>0?"l1":""} ${k===todayKey()?"today":""}" title="${k}: ${v?.solved||0} problems, ${v?.n||0} questions"></i>`);d.setDate(d.getDate()+1)}
  const cu=currentUnit();
  const mq=S.mistakes.filter(m=>(m.kind==="q"?QUICK[m.key]:PROBS[m.key]));
  host.innerHTML=`<div class="grid">
      <div class="card skill"><h3>Problems solved</h3><span class="r tabular">${solved}<span class="muted" style="font-size:15px"> / ${TOTAL()}</span></span><div class="bar"><i style="width:${solved/TOTAL()*100}%"></i></div></div>
      <div class="card skill"><h3>Current unit</h3><span class="r">${cu?cu.n:"✓"}<span class="muted" style="font-size:15px"> / ${UNITS.length}</span></span><span class="small muted">${cu?esc(cu.title):"Course complete"}</span></div>
      <div class="card skill"><h3>Quick questions</h3><span class="r tabular">${qn?Math.round(qc/qn*100)+"%":"–"}</span><span class="small muted">${qn} answered</span></div>
      <div class="card skill"><h3>Streak</h3><span class="r tabular">${streak()}<span class="muted" style="font-size:15px"> days</span></span></div>
    </div>
    <div class="card stack"><h3>Units</h3><div class="list">${UNITS.map(U=>{const n=unitSolved(U);const qs=U.quick.map((_,i)=>S.quick[U.n+"."+i]).filter(Boolean);const a=qs.reduce((x,s)=>x+s.n,0),c=qs.reduce((x,s)=>x+s.c,0);
      return`<div><span class="l">${U.n}. ${esc(U.title)}<span class="bar" style="margin-top:6px;display:block"><i style="width:${n/U.problems.length*100}%"></i></span></span><span class="small muted tabular" style="text-align:right;white-space:nowrap">${n}/${U.problems.length} solved${a?`<br>${Math.round(c/a*100)}% quick`:""}</span></div>`}).join("")}</div></div>
    <div class="card stack"><h3>Last 5 weeks</h3><div class="heat">${cells.join("")}</div></div>
    <div class="card stack"><h3>Review queue · ${mq.length}</h3><div class="list">${mq.length?mq.slice(0,12).map(m=>m.kind==="q"?`<div style="flex-direction:column;align-items:stretch;gap:4px"><span>${esc(QUICK[m.key].q)}</span>${QUICK[m.key].code?`<pre class="codeblock">${esc(QUICK[m.key].code)}</pre>`:""}<span class="small muted">Unit ${QUICK[m.key].unit} quick question · ${m.fixes}/2 fixed</span></div>`:`<div><span class="l">${esc(PROBS[m.key].title)} <span class="small muted">· problem, solve it from memory</span></span><button class="btn ghost chip" data-rev="${m.key}">Solve</button></div>`).join(""):`<div><span class="muted">Nothing to review. Missed quick questions and problems whose solution you viewed show up here and come back in your daily set.</span></div>`}</div></div>
    <div class="card stack"><h3>Your data</h3>
      <p class="muted measure">Progress is saved in this browser only. Copy it to move to another device, or paste it into Claude and ask what to focus on.</p>
      <div class="row"><button class="btn" id="copyp">Copy progress</button><button class="btn ghost" id="impp">Import progress</button><button class="btn ghost" id="resetp">Reset</button></div>
      <div id="pmsg" class="small" aria-live="polite"></div>
      <div id="impbox" hidden class="stack"><label for="imptext" class="small">Paste copied progress</label><textarea id="imptext" rows="4"></textarea><div class="row"><button class="btn" id="impgo">Load it</button></div></div>
      <div id="resetbox" hidden class="row"><span class="small">This deletes all progress and saved code in this browser.</span><button class="btn danger" id="resetgo">Delete my progress</button></div></div>`;
  host.querySelectorAll("[data-rev]").forEach(b=>b.onclick=()=>openProblem(b.dataset.rev,{from:"profile",review:true}));
  const msg=t=>{host.querySelector("#pmsg").textContent=t};
  host.querySelector("#copyp").onclick=async()=>{const drafts={};for(const id in PROBS){const c=lsGet(draftKey(id));if(c&&c!==(PROBS[id].starter||""))drafts[id]=c}
    const txt=JSON.stringify({matlabLearn:1,state:S,drafts});
    try{await navigator.clipboard.writeText(txt);msg("Copied, including your saved code.")}catch(e){const b=host.querySelector("#impbox");b.hidden=false;host.querySelector("#imptext").value=txt;host.querySelector("#imptext").select();msg("Couldn't copy automatically. The text is selected below, so copy it from there.")}};
  host.querySelector("#impp").onclick=()=>{host.querySelector("#impbox").hidden=false;host.querySelector("#imptext").value="";host.querySelector("#imptext").focus()};
  host.querySelector("#impgo").onclick=()=>{try{const j=JSON.parse(host.querySelector("#imptext").value);if(!j.state||!j.matlabLearn)throw 0;mergeState(j.state);for(const id in j.drafts||{})lsSet(draftKey(id),j.drafts[id]);DAY=null;save();renderAll();go("profile");$("#pmsg").textContent="Progress loaded."}catch(e){msg("That doesn't look like copied MATLAB Learn progress.")}};
  host.querySelector("#resetp").onclick=()=>{host.querySelector("#resetbox").hidden=false};
  host.querySelector("#resetgo").onclick=()=>{S=blankState();DAY=null;for(const id in PROBS){lsDel(draftKey(id));lsDel(draftKey(id,true))}lsDel("ml_day");save();renderAll();go("profile");$("#pmsg").textContent="Progress reset."};
}
function moveIndicator(){const sel=document.querySelector('nav button[aria-selected="true"]');const ind=$("#navind");if(!sel||!ind){if(ind)ind.style.width="0";return}ind.style.width=sel.offsetWidth+"px";ind.style.transform=`translateX(${sel.offsetLeft-4}px)`}
function showView(v){
  document.querySelectorAll("nav button").forEach(b=>b.setAttribute("aria-selected",String(b.dataset.v===v)));
  [...VIEWS,"problem"].forEach(k=>{const el=$("#v-"+k);const show=k===v;if(show&&el.hidden){el.hidden=false;el.classList.remove("vin");void el.offsetWidth;el.classList.add("vin")}else if(!show)el.hidden=true});
  moveIndicator();
  if(v==="play"&&PLAY_ED)setTimeout(()=>PLAY_ED.refresh(),0);
}
function go(v,push=true){
  if(!VIEWS.includes(v))v="daily";LAST_VIEW=v;
  if(v==="daily"){syncDayFromShown();renderDaily()}if(v==="learn")renderLearn();if(v==="practice")renderPractice();if(v==="profile")renderProfile();if(v==="play")renderPlay();
  showView(v);if(push)try{history.replaceState(null,"","#"+v)}catch(e){}
}
function back(){go(PROBLEM_CTX&&PROBLEM_CTX.opts.from||LAST_VIEW)}
function route(){const h=(location.hash||"#daily").slice(1);
  if(h.startsWith("p/")&&PROBS[h.slice(2)])openProblem(h.slice(2),{from:LAST_VIEW,review:false});else go(h,false)}
function renderAll(){renderStrip();renderDaily();renderLearn();renderPractice();renderProfile()}
document.querySelectorAll("nav button").forEach(b=>b.onclick=()=>go(b.dataset.v));
window.addEventListener("resize",moveIndicator);
(async()=>{
  try{mergeState(JSON.parse(lsGet("ml_state")||"null"))}catch(e){}
  try{const d=JSON.parse(lsGet("ml_day")||"null");if(d&&d.date===todayKey())DAY=d}catch(e){}
  try{const r=await fetch("daily.json",{cache:"no-store"});if(r.ok){const j=await r.json();if(j&&j.id&&daysSince(j.id)<=1){DAILY=j;
    for(const p of j.problems||[])if(p&&p.id&&Array.isArray(p.tests)&&!PROBS[p.id]){const U=currentUnit()||UNITS[UNITS.length-1];PROBS[p.id]={hints:[],solution:"",starter:"",...p,unit:U.n}}}}}catch(e){}
  renderAll();route();window.addEventListener("hashchange",route);
  document.body.classList.add("ready");
})();
