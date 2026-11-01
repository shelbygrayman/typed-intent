import {TypedDataEncoder} from 'ethers';
const domainTypes={name:'string',version:'string',chainId:'uint256',verifyingContract:'address',salt:'bytes32'};
const permitFields=[['owner','address'],['spender','address'],['value','uint256'],['nonce','uint256'],['deadline','uint256']];
const object=x=>x!==null && typeof x==='object' && !Array.isArray(x);
function keysExactly(value, keys, label){
  if(!object(value))throw Error(`${label} must be an object`);
  const actual=Object.keys(value);
  if(actual.length!==keys.length || actual.some(k=>!keys.includes(k)))throw Error(`${label} fields do not match the declared type`);
}
function validateValues(value, type, types, path, depth=0){
  if(depth>32)throw Error('Message exceeds maximum depth');
  const array=type.match(/^(.*)\[([0-9]*)\]$/);
  if(array){if(!Array.isArray(value)||value.length>1000||(array[2] && value.length!==Number(array[2])))throw Error(`Invalid array at ${path}`);value.forEach((v,i)=>validateValues(v,array[1],types,`${path}[${i}]`,depth+1));return;}
  if(types[type]){const fields=types[type];keysExactly(value,fields.map(f=>f.name),path);for(const f of fields)validateValues(value[f.name],f.type,types,`${path}.${f.name}`,depth+1);return;}
  if(typeof value==='number' && !Number.isSafeInteger(value))throw Error(`Unsafe JSON number at ${path}; use a decimal string`);
  if(value===null || typeof value==='object')throw Error(`Invalid value at ${path}`);
}
export function inspect(payload){
  keysExactly(payload,['types','primaryType','domain','message'],'Payload');
  if(!object(payload.types)||!object(payload.domain)||typeof payload.primaryType!=='string')throw Error('Invalid typed data');
  const types=Object.fromEntries(Object.entries(payload.types).filter(([k])=>k!=='EIP712Domain'));
  if(!Object.keys(types).length || Object.keys(types).length>128)throw Error('Invalid type count');
  for(const [name,fields] of Object.entries(payload.types)){
    if(!Array.isArray(fields)||fields.length>128)throw Error(`Invalid fields for ${name}`);
    const seen=new Set();for(const field of fields){keysExactly(field,['name','type'],`Field in ${name}`);if(typeof field.name!=='string'||typeof field.type!=='string'||seen.has(field.name))throw Error(`Invalid field in ${name}`);seen.add(field.name);}
  }
  const domainKeys=Object.keys(payload.domain);
  if(domainKeys.some(k=>!Object.hasOwn(domainTypes,k)))throw Error('Unsupported domain field');
  const canonical=Object.keys(domainTypes).filter(k=>Object.hasOwn(payload.domain,k));
  if(payload.types.EIP712Domain){
    const declared=payload.types.EIP712Domain;
    if(declared.length!==canonical.length || declared.some((f,i)=>f.name!==canonical[i]||f.type!==domainTypes[canonical[i]]))throw Error('EIP712Domain declaration does not match domain values');
  }
  for(const key of domainKeys)if(typeof payload.domain[key]==='number'&&!Number.isSafeInteger(payload.domain[key]))throw Error(`Unsafe JSON number at domain.${key}; use a decimal string`);
  const encoder=TypedDataEncoder.from(types);
  if(encoder.primaryType!==payload.primaryType)throw Error('primaryType does not match declared types');
  validateValues(payload.message,payload.primaryType,types,'message');
  const domainHash=TypedDataEncoder.hashDomain(payload.domain),messageHash=encoder.hash(payload.message),digest=TypedDataEncoder.hash(payload.domain,types,payload.message);
  const fields=types[payload.primaryType];
  const permit=payload.primaryType==='Permit' && fields.length===permitFields.length && fields.every((f,i)=>f.name===permitFields[i][0]&&f.type===permitFields[i][1]);
  const notes=['A digest identifies this typed payload; it does not prove the contract is trustworthy, the request is safe, or a signature will succeed.','Domain fields are claims in the request; this tool does not verify chain state, contracts or signers.'];
  if(!Object.hasOwn(payload.domain,'chainId'))notes.push('Domain has no chainId.');
  if(!Object.hasOwn(payload.domain,'verifyingContract'))notes.push('Domain has no verifyingContract.');
  const interpretation=permit?{kind:'ERC-2612-shaped Permit',owner:payload.message.owner,spender:payload.message.spender,value:String(payload.message.value),nonce:String(payload.message.nonce),deadline:String(payload.message.deadline),unlimited:BigInt(payload.message.value)===(2n**256n-1n),notice:'The deadline is for submitting the permit, not necessarily an expiry of the resulting allowance. Shape alone does not verify contract behavior.'}:{kind:'Unclassified typed data',notice:'No protocol or safety conclusion inferred.'};
  return {schema:'typed-intent.inspection.v1',primaryType:payload.primaryType,domain:payload.domain,domainHash,messageHash,digest,interpretation,notes};
}
