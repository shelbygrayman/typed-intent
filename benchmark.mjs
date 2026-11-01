import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import os from 'node:os';
import {hashTypedData} from 'viem';
import {inspect} from './inspect.mjs';
const [out,...extra]=process.argv.slice(2);if(!out||extra.length)throw Error('Usage: node benchmark.mjs OUTPUT.json');
const raw=await readFile(new URL('./fixtures/permit.json',import.meta.url),'utf8'),base=JSON.parse(raw);
const cases=Array.from({length:1000},(_,i)=>({...base,domain:{...base.domain,chainId:i%5+1},message:{...base.message,value:String(BigInt(i)*1000000000000000001n),nonce:String(i),deadline:String(2000000000+i)}}));
const types=Object.fromEntries(Object.entries(base.types).filter(([name])=>name!=='EIP712Domain'));
for(let i=0;i<100;i++)inspect(cases[i]);
const ms=[];for(const input of cases){const start=performance.now();const actual=inspect(input).digest;ms.push(performance.now()-start);const expected=hashTypedData({domain:input.domain,types,primaryType:input.primaryType,message:input.message});if(actual!==expected)throw Error('Differential mismatch');}
const percentile=q=>[...ms].sort((a,b)=>a-b)[Math.ceil(ms.length*q)-1];
const sha=x=>createHash('sha256').update(x).digest('hex');
const report={schema:'typed-intent.benchmark.v1',createdAt:new Date().toISOString(),node:process.version,platform:`${process.platform}-${process.arch}`,cpu:os.cpus()[0]?.model,sourceSha256:sha(await readFile(new URL('./inspect.mjs',import.meta.url))),fixtureSha256:sha(raw),libraryVersions:{ethers:'6.17.0',viem:'2.57.14'},cases:cases.length,matchingDigests:cases.length,warmup:100,medianMs:percentile(.5),p95Ms:percentile(.95),scope:'1000 generated ERC-2612-shaped fixtures; exact digest comparison with viem. Timings measure inspector only, not viem, UI, network or real signing. Synthetic data; same schema with systematically varied values. Not an audit or general correctness claim.'};
await writeFile(out,JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report,null,2));
