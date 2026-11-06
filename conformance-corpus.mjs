import {readFileSync} from 'node:fs';
const address='0x1111111111111111111111111111111111111111';
export function corpus(){
  const valid=[];
  const add=(family,i,types,message,primaryType='Sample')=>valid.push({id:`${family}/${i}`,family,input:{types,primaryType,domain:{name:'Conformance',version:'1',chainId:i%5+1,verifyingContract:address},message}});
  for(let i=0;i<100;i++){
    const scalar=(family,type,value)=>add(family,i,{Sample:[{name:'value',type}]},{value});
    scalar('unsigned','uint256',[0n,1n,2n**256n-1n,BigInt(i)*1000000000000000001n][i%4].toString());
    scalar('signed','int256',[-(2n**255n),2n**255n-1n,0n,-BigInt(i)][i%4].toString());
    scalar('boolean','bool',i%2===0);
    scalar('unicode','string',['','hello','é','e\u0301','🌳 संगीत 日本語'][i%5]+String(i));
    scalar('dynamic-bytes','bytes','0x'+'ab'.repeat(i%33));
    scalar('fixed-bytes','bytes32','0x'+i.toString(16).padStart(64,'0'));
    scalar('dynamic-array','uint256[]',Array.from({length:i%8},(_,j)=>String(i+j)));
    scalar('fixed-array','int128[2]',[String(-i),String(i)]);
    add('nested-struct',i,{Sample:[{name:'person',type:'Person'},{name:'memo',type:'string'}],Person:[{name:'wallet',type:'address'},{name:'score',type:'uint64'}]},{person:{wallet:address,score:String(i)},memo:`sample ${i}`});
    scalar('nested-array','uint32[][]',[[String(i)],[],['0','4294967295']]);
  }
  for(const name of ['mail','permit'])valid.push({id:`fixture/${name}`,family:name,input:JSON.parse(readFileSync(new URL(`./fixtures/${name}.json`,import.meta.url),'utf8'))});
  const base=valid.find(x=>x.family==='permit').input;
  const mutations=[
    ['extra-field',p=>p.message.extra='uncommitted'],
    ['missing-field',p=>delete p.message.owner],
    ['primary-type',p=>p.primaryType='Unknown'],
    ['unsafe-number',p=>p.message.value=Number.MAX_SAFE_INTEGER+1],
    ['bad-address',p=>p.message.spender='invalid'],
    ['uint-overflow',p=>p.message.value=(2n**256n).toString()],
    ['negative-uint',p=>p.message.value='-1'],
    ['domain-extra',p=>p.domain.unsupported='x'],
    ['domain-declaration',p=>p.types.EIP712Domain=[{name:'name',type:'bytes32'}]],
    ['duplicate-type-field',p=>p.types.Permit.push({...p.types.Permit[0]})]
  ];
  const invalid=mutations.map(([id,mutate])=>{const input=structuredClone(base);mutate(input);return {id:`invalid/${id}`,input};});
  const fixed=structuredClone(valid.find(x=>x.family==='fixed-array').input);fixed.message.value=['1'];invalid.push({id:'invalid/fixed-array-length',input:fixed});
  const transformations=[
    {id:'message-change',relation:'different',input:{...structuredClone(base),message:{...base.message,nonce:String(BigInt(base.message.nonce)+1n)}}},
    {id:'chain-change',relation:'different',input:{...structuredClone(base),domain:{...base.domain,chainId:10}}},
    {id:'key-order',relation:'same',input:{...structuredClone(base),message:Object.fromEntries(Object.entries(base.message).reverse())}}
  ];
  return {valid,invalid,metamorphic:{base,transformations}};
}
