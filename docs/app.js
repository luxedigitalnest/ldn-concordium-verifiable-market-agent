import {INDEXER,ALLOWED_NETWORKS,SAMPLE_TESTNET_TOKEN,parseToken,sha256,evaluateRegistryEvidence,makeReport} from './trust.js';
const $=id=>document.getElementById(id);
const state={trust:null,agent:null,health:null,sample:null,network:'testnet',token:SAMPLE_TESTNET_TOKEN};
function say(id,message){$(id).textContent=String(message)}
function toSafe(s){return String(s??'').slice(0,400);}
async function fetchJson(url,signal){const response=await fetch(url,{signal,cache:'no-store'});if(!response.ok)throw Error('HTTP '+response.status+' from '+new URL(url).hostname);return response.json();}
async function checkRegistry(){
 $('verify').disabled=true;
 $('report').disabled=true;
 state.trust=null;state.agent=null;
 say('verdict','Checking official Concordium Agent Registry Indexer and downloaded card bytes…');
 $('verdict').dataset.status='pending';
 $('reportOutput').hidden=true;
 const controller=new AbortController();
 const cancel=setTimeout(()=>controller.abort(),12000);
 try {
  const network=$('network').value;
  if(!ALLOWED_NETWORKS.includes(network))throw Error('Invalid network');
  const token=parseToken($('token').value);
  const [indexed,health]=await Promise.all([
   fetchJson(INDEXER+'/agents/'+token+'?network='+network,controller.signal),
   fetchJson(INDEXER+'/status',controller.signal)
  ]);
  if(indexed.network!==network || indexed.agent?.token_id!==token)throw Error('Indexer returned an unexpected network/token');
  const agent=indexed.agent;
  if(!agent?.agent_uri||!/^https:\/\//i.test(agent.agent_uri))throw Error('Agent Card URL missing or unsafe');
  const cardResponse=await fetch(agent.agent_uri,{signal:controller.signal,cache:'no-store'});
  if(!cardResponse.ok)throw Error('Agent Card fetch returned HTTP '+cardResponse.status);
  const raw=await cardResponse.arrayBuffer();
  if(raw.byteLength===0 || raw.byteLength>128_000)throw Error('Agent Card is empty or too large for safe verifier');
  const cardHash=await sha256(raw);
  const decision=evaluateRegistryEvidence({network,record:agent,health,cardHash});
  state.agent=agent;state.health=health;state.trust=decision;state.network=network;state.token=token;
  say('chain',network.toUpperCase());
  say('agentName','Registry #'+token+' · '+(agent.status||'Unknown'));
  say('owner',agent.owner_account||'Not available');
  say('registeredAt',agent.registered_at||'Not available');
  say('chainHeight',String(health.networks?.[network]?.chain_height??'Not available'));
  say('lag',String(health.networks?.[network]?.lag_blocks??'Unknown')+' blocks');
  say('synced',health.networks?.[network]?.last_synced_at||'Unknown');
  say('cardUrl',agent.agent_uri);$('cardUrl').href=agent.agent_uri;
  say('expectedHash',agent.metadata_hash_hex||'Missing');
  say('actualHash',cardHash);
  const v=decision.accepted;
  $('verdict').dataset.status=v?'pass':'fail';
  say('verdict',v?
   'VERIFIED: Active CIS-8004 indexer record, recent testnet sync and an exact SHA-256 match for the fetched Agent Card. This does NOT establish verified human identity or our ownership of this agent.':
   'NOT VERIFIED: '+decision.failures.join(' · '));
  $('details').hidden=false;
  $('report').disabled=!v;
 }catch(e){
  $('verdict').dataset.status='fail';
  say('verdict','NOT VERIFIED: '+toSafe(e.message||e)+'. Fail closed: market report generation disabled.');
  $('details').hidden=true;
 }finally{clearTimeout(cancel);$('verify').disabled=false;}
}
async function generateReport(){
 if(!state.trust?.accepted){say('brief','Not generated: no verified agent card');return;}
 $('report').disabled=true;
 try{
  state.sample=state.sample||await fetchJson('./market-sample.json');
  const metrics=makeReport({trust:state.trust,assets:state.sample.assets,source:state.sample.source,observedAt:state.sample.observedAt});
  say('brief','Historical CMC sample · '+new Date(metrics.observedAt).toUTCString()+
   '\nCoins excluding listed stablecoins: '+metrics.sampleCount+
   '\n24h up / down / unchanged: '+metrics.rising+' / '+metrics.declining+' / '+metrics.unchanged+
   '\nMedian 24h change: '+metrics.medianChange24h.toFixed(2)+'%'+
   '\nUp-share of sample: '+(metrics.sampleUpShare*100).toFixed(1)+'%'+
   '\nProvenance: '+metrics.source+
   '\nTrust policy: live Concordium '+state.network+' agent #'+state.token+' checked before generating.'+
   '\nIMPORTANT: historical replay only; no current pricing, identity assertion, trading suggestion or forecast.');
  $('reportOutput').hidden=false;
 }catch(e){say('brief','Report unavailable: '+toSafe(e.message));$('reportOutput').hidden=false;}
 finally{$('report').disabled=false;}
}
$('verify').addEventListener('click',checkRegistry);
$('report').addEventListener('click',generateReport);
$('token').value=String(SAMPLE_TESTNET_TOKEN);
$('network').value='testnet';
checkRegistry();
