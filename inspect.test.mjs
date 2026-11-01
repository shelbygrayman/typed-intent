import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {hashTypedData} from 'viem';
import {inspect} from './inspect.mjs';
const get=name=>JSON.parse(readFileSync(new URL(`./fixtures/${name}.json`,import.meta.url),'utf8'));
test('matches the canonical EIP-712 Mail digest and components',()=>{
  const r=inspect(get('mail'));
  assert.equal(r.domainHash,'0xf2cee375fa42b42143804025fc449deafd50cc031ca257e0b194a650a912090f');
  assert.equal(r.messageHash,'0xc52c0ee5d84264471806290a3f2c4cecfc5490626bf912d01f240d7a274b371e');
  assert.equal(r.digest,'0xbe609aee343fb3c4b28e1df9e632fca64fcfaede20f02e86244efddf30957bd2');
});
test('agrees with viem on independent nested and permit examples',()=>{
  for(const name of ['mail','permit']){
    const x=get(name),types=Object.fromEntries(Object.entries(x.types).filter(([k])=>k!=='EIP712Domain'));
    assert.equal(inspect(x).digest,hashTypedData({domain:x.domain,types,primaryType:x.primaryType,message:x.message}));
  }
});
test('permit recognizes exact shape and raw maximum amount without claiming safety',()=>{
  const p=get('permit'),r=inspect(p);assert.equal(r.interpretation.unlimited,true);assert.match(r.interpretation.notice,/not necessarily an expiry/);p.message.value='0';assert.equal(inspect(p).interpretation.unlimited,false);
});
test('rejects domain declarations that misrepresent signed data',()=>{const p=get('mail');p.types.EIP712Domain.pop();assert.throws(()=>inspect(p),/declaration/);});
test('rejects extra or missing nested fields and incorrect primary type',()=>{const p=get('mail');p.message.from.extra='hidden';assert.throws(()=>inspect(p),/fields/);delete p.message.from.extra;delete p.message.to.wallet;assert.throws(()=>inspect(p),/fields/);const q=get('mail');q.primaryType='Person';assert.throws(()=>inspect(q),/primaryType/);});
test('rejects unsafe numeric values instead of silently rounding',()=>{const p=get('permit');p.message.value=Number.MAX_SAFE_INTEGER+1;assert.throws(()=>inspect(p),/Unsafe JSON number/);});
test('domain changes change the digest',()=>{const p=get('permit'),a=inspect(p).digest;p.domain.chainId=10;assert.notEqual(inspect(p).digest,a);});
test('invalid values do not acquire a digest',()=>{const p=get('permit');p.message.spender='not an address';assert.throws(()=>inspect(p));});
test('fixed and dynamic arrays agree with viem and reject wrong length',()=>{
  const p={types:{Batch:[{name:'ids',type:'uint256[2]'},{name:'targets',type:'address[]'}]},primaryType:'Batch',domain:{chainId:1},message:{ids:['1','2'],targets:['0x1111111111111111111111111111111111111111','0x2222222222222222222222222222222222222222']}};
  assert.equal(inspect(p).digest,hashTypedData(p));p.message.ids=['1'];assert.throws(()=>inspect(p),/Invalid array/);
});
