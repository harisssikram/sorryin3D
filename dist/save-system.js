export const SAVE_KEY='my-beby-midnight-v1';
const ids=value=>Array.isArray(value)?[...new Set(value.filter(i=>Number.isInteger(i)&&i>=0&&i<10))]:[];
const position=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.z)&&Math.abs(p.x)<25&&Math.abs(p.z)<25?{x:p.x,z:p.z}:null;
export function validateSave(value){
 if(!value||typeof value!=='object'||!Array.isArray(value.collected)||!Array.isArray(value.finished))return null;
 const collected=ids(value.collected),finished=ids(value.finished).filter(i=>collected.includes(i));
 const attempts={};if(value.challenges?.version===14)for(let i=0;i<10;i++){const a=value.challenges.attempts?.[i];if(a&&typeof a==='object'&&!Array.isArray(a)&&JSON.stringify(a).length<5000)attempts[i]=JSON.parse(JSON.stringify(a));}
 return {version:2,collected,finished,elapsed:Number.isFinite(value.elapsed)?Math.max(0,Math.min(1e7,value.elapsed)):0,position:position(value.position),heading:Number.isFinite(value.heading)?value.heading:0.7,clue:Number.isInteger(value.clue)&&value.clue>=0&&value.clue<10?value.clue:0,challenges:{version:14,attempts},companion:value.companion===true,waiting:value.waiting===true,haris:position(value.haris)};
}
export function createSaveStore(storage){
 const parse=text=>{try{return validateSave(JSON.parse(text));}catch{return null;}};
 return {
  load(){try{const primary=parse(storage.getItem(SAVE_KEY));if(primary)return {data:primary,recovered:false};const backup=parse(storage.getItem(SAVE_KEY+'-backup'));return {data:backup,recovered:!!backup};}catch{return {data:null,recovered:false};}},
  save(data){try{const checked=validateSave(data);if(!checked)return false;const old=storage.getItem(SAVE_KEY);if(parse(old))try{storage.setItem(SAVE_KEY+'-backup',old);}catch{/* Keep saving the current game even if a backup will not fit. */}storage.setItem(SAVE_KEY,JSON.stringify(checked));return true;}catch{return false;}},
 };
}
export function normalizeSettings(value={}){if(!value||typeof value!=='object')value={};return {music:value.music!==false,volume:Number.isFinite(value.volume)?Math.max(0,Math.min(100,value.volume)):45,reduced:typeof value.reduced==='boolean'?value.reduced:null,quality:['balanced','detailed'].includes(value.quality)?value.quality:'balanced'};}
