// SPDX-License-Identifier: Apache-2.0
// LDN Market Trust Gate — actual public CIS-8004 registry + hash verification.
// No wallet connection; never treats an indexed record as full cryptographic identity proof.
export const INDEXER='https://agent-registry-indexer.concordium.com';
export const DEFAULT_NETWORK='testnet';
export const ALLOWED_NETWORKS=Object.freeze(['testnet','mainnet']);
export const SAMPLE_TESTNET_TOKEN=1375; // externally owned public sample; NOT LDN's own registration.

export function parseToken(input) {
  const text=String(input).trim();
  if(!/^(0|[1-9]\d{0,14})$/.test(text)) throw new Error('Enter a nonnegative numeric CIS-8004 token ID');
  const n=Number(text);
  if(!Number.isSafeInteger(n))throw new Error('Token ID exceeds safe JavaScript integer');
  return n;
}
export function safeAgentCardUrl(value){
  if(typeof value!=='string')throw Error('Agent Card URI must be a string');
  let uri;
  try{uri=new URL(value);}catch{throw Error('Malformed Agent Card URI');}
  if(uri.protocol!=='https:'||uri.username||uri.password||!uri.hostname||uri.hash)throw Error('Agent Card URI must use HTTPS without credentials or fragment');
  return uri.href;
}
export function registrySelectionIsCurrent({trust,network,token,selectedNetwork,selectedToken,now=Date.now()}){
  if(trust?.accepted!==true||network!==selectedNetwork||!Number.isFinite(now)||!Number.isFinite(trust.expiresAt)||now>=trust.expiresAt)return false;
  try{return token===parseToken(selectedToken);}catch{return false;}
}
export function normalizeHexHash(hash){
  if(typeof hash!=='string'|| !/^(0x)?[0-9a-fA-F]{64}$/.test(hash)) throw new Error('Missing or malformed 32-byte registry metadata hash');
  return hash.toLowerCase().replace(/^0x/,'');
}
export async function sha256(buffer){
  if(!(buffer instanceof ArrayBuffer) && !ArrayBuffer.isView(buffer))throw new Error('Invalid hash input');
  const bytes=buffer instanceof ArrayBuffer?buffer:buffer.buffer.slice(buffer.byteOffset,buffer.byteOffset+buffer.byteLength);
  if(!globalThis.crypto?.subtle)throw new Error('Cryptographic SHA-256 API unavailable');
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(v=>v.toString(16).padStart(2,'0')).join('');
}
export function evaluateRegistryEvidence({network,record,health,cardHash,now=Date.now(),maxIndexerLag=32,maxStaleMs=15*60*1000}){
  const failures=[],warnings=[];
  if(!ALLOWED_NETWORKS.includes(network))failures.push('Unknown network');
  if(!record||record.network!==network)failures.push('Wrong or missing registry record for selected network');
  if(record?.status!=='Active')failures.push('Agent status is not Active');
  try{if(normalizeHexHash(record?.metadata_hash_hex)!==normalizeHexHash(cardHash))failures.push('Fetched Agent Card hash does not match registry commitment');}
  catch(e){failures.push(e.message);}
  try{safeAgentCardUrl(record?.agent_uri);}catch(e){failures.push(e.message);}
  if(typeof record?.owner_account!=='string'||!/^[1-9A-HJ-NP-Za-km-z]{48,52}$/.test(record.owner_account))failures.push('No structurally usable Concordium owner account evidence');
  const chain=health?.networks?.[network];
  if(!chain||!Number.isInteger(chain.lag_blocks)||chain.lag_blocks<0||chain.lag_blocks>maxIndexerLag)failures.push('Indexer is unavailable or too far behind the chain');
  const checked=Date.parse(chain?.last_synced_at||'');
  if(!Number.isFinite(now)||!Number.isFinite(checked)||checked>now+60_000||now-checked>=maxStaleMs)failures.push('Indexer sync evidence is stale or unexpectedly future-dated');
  if(!record?.agent_wallet)warnings.push('No public agent wallet registered (not required for core identity check)');
  return {accepted:failures.length===0,failures,warnings,expiresAt:failures.length===0?Math.min(now,checked)+maxStaleMs:null,trustLevel:failures.length===0?'registry-record-and-card-integrity-verified':'not-verified'};
}
export function marketBreadth(assets){
  if(!Array.isArray(assets)||assets.length===0)throw new Error('No source assets supplied');
  const STABLE=new Set(['USDT','USDC','DAI','FDUSD','TUSD','USDE','PYUSD']);
  const nonStable=assets.filter(a=>a && typeof a.symbol==='string' && !STABLE.has(a.symbol.toUpperCase()));
  const changes=nonStable.map(a=>a.change24h).filter(x=>typeof x==='number' && Number.isFinite(x) && x>-1000 && x<10000);
  if(!changes.length)throw new Error('No valid non-stable percentage changes');
  const rising=changes.filter(x=>x>0).length;
  const declining=changes.filter(x=>x<0).length;
  const sorted=[...changes].sort((a,b)=>a-b);
  const midpoint=Math.floor(sorted.length/2);
  const median=sorted.length%2?sorted[midpoint]:(sorted[midpoint-1]+sorted[midpoint])/2;
  return {sampleCount:sorted.length,rising,declining,unchanged:sorted.length-rising-declining,medianChange24h:median,sampleUpShare:rising/sorted.length};
}
export function makeReport({trust,assets,source,observedAt}){
 if(trust?.accepted!==true)throw new Error('Fail closed: market report requires a verified agent registry record + matching Agent Card hash');
 const metrics=marketBreadth(assets);
 if(!source||!Number.isFinite(Date.parse(observedAt)))throw new Error('Missing provenance or observation timestamp');
 return {...metrics,source,observedAt,disclaimer:'Illustrative source-attributed top-N sample, not a forecast, trading advice or claim that this verifier owns the sampled agent.'};
}
