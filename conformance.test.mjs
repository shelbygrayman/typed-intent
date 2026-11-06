import {test} from 'node:test';
import assert from 'node:assert/strict';
import {corpus} from './conformance-corpus.mjs';
import {evaluate,percentile} from './conformance.mjs';
test('corpus is deterministic, uniquely identified, and includes each planned family',()=>{
  const a=corpus();assert.deepEqual(a,corpus());assert.equal(a.valid.length,1002);assert.equal(new Set(a.valid.map(r=>r.id)).size,1002);
  assert.equal(new Set(a.valid.map(r=>r.family)).size,12);
});
test('harness preserves wrong digests and comparator errors as failures',()=>{
  const data=corpus();data.valid=data.valid.slice(0,2);data.invalid=[];data.metamorphic.transformations=[];
  const rows=evaluate(data,{inspector:()=>({digest:'wrong'}),comparator:()=>{throw Error('oracle failed');}});
  assert.equal(rows.length,2);assert.ok(rows.every(r=>!r.pass));assert.equal(rows[0].expected.error,'oracle failed');
  const mismatch=evaluate(data,{inspector:()=>({digest:'wrong'}),comparator:()=> 'expected'});
  assert.ok(mismatch.every(r=>!r.pass));assert.equal(mismatch[0].actual.value,'wrong');assert.equal(mismatch[0].expected.value,'expected');
});
test('harness detects false acceptance and a constant-digest implementation',()=>{
  const data=corpus();data.valid=[];
  const rows=evaluate(data,{inspector:()=>({digest:'constant'})});
  assert.ok(rows.filter(r=>r.kind==='invalid').every(r=>!r.pass));
  assert.ok(rows.filter(r=>r.relation==='different').every(r=>!r.pass));
});
test('percentiles are nearest-rank and do not mutate samples',()=>{const a=[4,1,3,2];assert.equal(percentile(a,.5),2);assert.equal(percentile(a,.95),4);assert.deepEqual(a,[4,1,3,2]);assert.equal(percentile([],.5),null);});
