// Checks the curriculum against the interpreter: every solution passes its tests, every starter fails,
// every quick-question answer is what the code really gives, and every lesson example runs.
// Usage: node tools/selftest.js [daily.json]
const fs=require("fs"),path=require("path");
const M=require(path.join(__dirname,"../assets/mlab.js"));
const src=fs.readFileSync(path.join(__dirname,"../assets/curriculum.js"),"utf8")+"\nmodule.exports={UNITS};";
const mod=new module.constructor();mod._compile(src,"curriculum.js");
const {UNITS}=mod.exports;
let bad=0;const ids=new Set();
const say=(where,msg)=>{bad++;console.log(`✗ ${where}: ${msg}`)};
function checkProblem(p,where){
  if(ids.has(p.id))say(where,"duplicate id");ids.add(p.id);
  for(const k of ["id","title","brief","tests","hints","solution"])if(p[k]===undefined)say(where,`missing ${k}`);
  p.tests.forEach((t,i)=>{
    const r=M.runTest(p.solution,t,p);
    if(r.fails.length)say(`${where} test ${i+1}`,`solution fails: ${JSON.stringify(r.fails.map(f=>f.msg||f.k))} ${r.error?r.error.message:""} out=${JSON.stringify(r.out)}`);
  });
  const starter=p.starter||"";
  const anyFail=p.tests.some(t=>M.runTest(starter,t,p).fails.length);
  if(!anyFail)say(where,"starter code already passes");
}
for(const U of UNITS){
  for(const p of U.problems)checkProblem(p,`unit ${U.n} ${p.id}`);
  U.quick.forEach((q,i)=>{
    const where=`unit ${U.n} quick ${i+1}`;
    if(q.opts){if(!(q.a>=0&&q.a<q.opts.length))say(where,"answer index out of range");return}
    const r=M.runCode(q.code||"",{seed:1});
    if(r.error){say(where,"code errors: "+r.error.message);return}
    if(q.v){
      const got=r.I.base.vars.get(q.v);if(!got){say(where,`no variable ${q.v}`);return}
      let want;try{want=M.evalFresh("["+q.a+"]","")}catch(e){say(where,"answer doesn't parse: "+q.a);return}
      const m=M.compareVals(got,want,q.v);if(m)say(where,m);
    }else if(M.normOut(r.out)!==M.normOut(q.a))say(where,`displays ${JSON.stringify(r.out)}, answer says ${JSON.stringify(q.a)}`);
  });
  U.sections.forEach((s,i)=>{if(!s.code)return;const r=M.runCode(s.code,{seed:1});if(r.error)say(`unit ${U.n} lesson "${s.h}"`,"example errors: "+r.error.message)});
}
if(process.argv[2]){
  const d=JSON.parse(fs.readFileSync(process.argv[2],"utf8"));
  for(const p of d.problems||[])checkProblem(p,`daily ${p.id}`);
}
console.log(`${UNITS.length} units, ${ids.size} problems, ${UNITS.reduce((a,U)=>a+U.quick.length,0)} quick questions. ${bad?bad+" problem(s) found.":"All good."}`);
process.exit(bad?1:0);
