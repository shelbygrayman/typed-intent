import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import os from 'node:os';
import {performance} from 'node:perf_hooks';
import {pathToFileURL} from 'node:url';
import {hashTypedData} from 'viem';
import {inspect} from './inspect.mjs';
import {corpus} from './conformance-corpus.mjs';
export const percentile=(values,q)=>values.length?[...values].sort((a,b)=>a-b)[Math.ceil(values.length*q)-1]:null;
const compare=p=>hashTypedData({...p,types:Object.fromEntries(Object.entries(p.types).filter(([k])=>k!=='EIP712Domain'))});
const attempt=fn=>{try{return {value:fn()};}catch(e){return {error:String(e.message)};}};
export function evaluate(data,{inspector=inspect,comparator=compare}={}){
  const rows=[];
  for(const c of data.valid){
    const actual=attempt(()=>inspector(c.input).digest),expected=attempt(()=>comparator(c.input));
    const official=c.id==='fixture/mail'?'0xbe609aee343fb3c4b28e1df9e632fca64fcfaede20f02e86244efddf30957bd2':null;
    rows.push({...c,kind:'valid',actual,expected,pass:!actual.error&&!expected.error&&actual.value===expected.value&&(!official||actual.value===official)});
  }
  for(const c of data.invalid){const actual=attempt(()=>inspector(c.input).digest);rows.push({...c,kind:'invalid',actual,pass:typeof actual.error==='string'});}
  const base=attempt(()=>inspector(data.metamorphic.base).digest);
  for(const c of data.metamorphic.transformations){const actual=attempt(()=>inspector(c.input).digest);rows.push({...c,kind:'metamorphic',base,actual,pass:!base.error&&!actual.error&&(c.relation==='same'?base.value===actual.value:base.value!==actual.value)});}
  return rows;
}
const sha=x=>createHash('sha256').update(x).digest('hex');
const git=args=>{try{return execFileSync('git',args,{cwd:new URL('.',import.meta.url),encoding:'utf8'}).trim();}catch{return null;}};
export async function run(out){
  const data=corpus(),rows=evaluate(data);
  // Only time accepted, matching inputs; all failures remain in the correctness denominator.
  const eligible=rows.filter(r=>r.kind==='valid'&&r.pass);
  for(let i=0;i<100&&eligible.length;i++){const p=eligible[i%eligible.length].input;inspect(p);compare(p);}
  const rounds=[];
  for(let repeat=0;repeat<3;repeat++){
    const samples=[];
    for(let i=0;i<eligible.length;i++){
      const input=eligible[i].input,times={};
      for(const name of (i+repeat)%2?['viem','inspector']:['inspector','viem']){const start=performance.now();if(name==='viem')compare(input);else inspect(input);times[name]=performance.now()-start;}
      samples.push({id:eligible[i].id,...times});
    }
    rounds.push({repeat,samples,summary:Object.fromEntries(['inspector','viem'].map(name=>[name,{p50Ms:percentile(samples.map(s=>s[name]),.5),p95Ms:percentile(samples.map(s=>s[name]),.95)}]))});
  }
  const sources={};for(const name of ['inspect.mjs','conformance.mjs','conformance-corpus.mjs','CONFORMANCE.md','package-lock.json'])sources[name]=sha(await readFile(new URL(name,import.meta.url)));
  const pkg=JSON.parse(await readFile(new URL('package.json',import.meta.url),'utf8'));
  const report={schema:'typed-intent.conformance.v1',createdAt:new Date().toISOString(),environment:{node:process.version,os:os.release(),platform:process.platform,arch:process.arch,cpu:os.cpus()[0]?.model},git:{head:git(['rev-parse','HEAD']),status:git(['status','--porcelain'])},libraries:{...pkg.dependencies,...pkg.devDependencies},sources,corpusSha256:sha(JSON.stringify(data)),summary:Object.fromEntries(['valid','invalid','metamorphic'].map(kind=>{const group=rows.filter(r=>r.kind===kind);return [kind,{total:group.length,passed:group.filter(r=>r.pass).length,failed:group.filter(r=>!r.pass).length}];})),rows,metamorphicBase:data.metamorphic.base,timing:{warmupPerImplementation:100,repeats:3,eligibleCases:eligible.length,rounds,scope:'Warm in-process timings; inspector includes validation and interpretation, viem only hashes. No UI, process startup, parsing, network, or speed-superiority claim.'},limitations:'Synthetic fixed corpus; shared bugs remain possible. Not exhaustive conformance, audit, safety verification, or browser performance.'};
  await writeFile(out,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({output:out,summary:report.summary,timing:rounds.map(r=>r.summary)},null,2));
  return rows.every(r=>r.pass);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const [out,...extra]=process.argv.slice(2);
  if(!out||extra.length){console.error('Usage: node conformance.mjs OUTPUT.json');process.exitCode=1;}
  else try{if(!await run(out))process.exitCode=1;}catch(e){console.error(e.message);process.exitCode=1;}
}
