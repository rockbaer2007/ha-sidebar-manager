import {clone, stable,normalizeColor} from './core.js';
export const MANAGER_KEY='ugso_sidebar_manager_v1';
// randomUUID is restricted to secure contexts; HA is also used over LAN HTTP.
export function newId(prefix){return prefix+'-'+Array.from(crypto.getRandomValues(new Uint32Array(4)),v=>v.toString(16).padStart(8,'0')).join('');}
const text=v=>typeof v==='string'?v.trim().slice(0,160):'';
const safeKey=v=>typeof v==='string'&&v.length>0&&v.length<=256&&!['__proto__','constructor','prototype'].includes(v);
export function safeUrl(value){
  if(typeof value!=='string'||value.length>2048||/[\u0000-\u0020\\]/.test(value))return null;
  if(value.startsWith('/')&&!value.startsWith('//'))return value;
  try{const u=new URL(value);return ['https:','http:'].includes(u.protocol)&&!u.username&&!u.password?u.href:null;}catch{return null;}
}
export function normalizeManager(raw){
  if(raw!=null&&(raw.version!==1||!Array.isArray(raw.groups)||!raw.items||Array.isArray(raw.items)||typeof raw.items!=='object'))throw Error('unsupported_record');
  const groups=[],seen=new Set(),items=Object.create(null);
  for(const g of raw?.groups||[]){if(!safeKey(g.id)||!text(g.name)||seen.has(g.id))throw Error('invalid_group');seen.add(g.id);groups.push({id:g.id,name:text(g.name),icon:/^mdi:[a-z0-9-]+$/.test(g.icon||'')?g.icon:'mdi:folder-outline',color:normalizeColor(g.color),collapsed:!!g.collapsed,bottom:!!g.bottom});}
  for(const [key,v]of Object.entries(raw?.items||{})){
    if(!safeKey(key)||!v||typeof v!=='object')throw Error('invalid_item');
    const item={title:text(v.title),icon:/^mdi:[a-z0-9-]+$/.test(v.icon||'')?v.icon:'',group:seen.has(v.group)?v.group:'',bottom:!!v.bottom,hidden:!!v.hidden};
    if(v.url!=null){item.url=safeUrl(v.url);if(!item.url)throw Error('invalid_url');if(!key.startsWith('sm-link-'))throw Error('invalid_item');}
    items[key]=item;
  }
  const order=[...new Set((raw?.order||[]).filter(safeKey))];
  return {version:1,groups,items,order};
}
// A disappearing HA panel is never removed from the stored configuration.
export function layoutEntries(record,available){
  const r=normalizeManager(record),rank=new Map(r.order.map((k,i)=>[k,i]));
  const entries=available.map((e,i)=>({...e,...r.items[e.key],key:e.key,rank:rank.has(e.key)?rank.get(e.key):r.order.length+i}));
  for(const [key,item]of Object.entries(r.items))if(item.url&&!entries.some(e=>e.key===key))entries.push({...item,key,rank:rank.get(key)??1e6});
  entries.sort((a,b)=>a.rank-b.rank);
  const result=[];
  for(const bottom of [false,true]){
    for(const group of [null,...r.groups]){
      const members=entries.filter(e=>(e.group||'')===(group?.id||'')&&((group?group.bottom:!!e.bottom)===bottom)&&!e.hidden);
      if(!members.length)continue;
      if(group)result.push({kind:'group',...group});
      for(const item of members)result.push({kind:'item',...item,collapsed:!!group?.collapsed});
    }
  }
  return result;
}
export async function saveManager({base,draft,read,write,backup}){
  const value=normalizeManager(draft),before=await read();
  if(stable(normalizeManager(before))!==stable(base))throw Error('conflict');
  if(stable(value)===stable(base))return;
  await backup(clone(before));
  const next={...(before||{}),...value};
  try{await write(next);}catch{if(stable(await read())!==stable(next))throw Error('save_uncertain');}
  if(stable(await read())!==stable(next))throw Error('save_uncertain');
}
// Keep a layout write reversible until the colors/native HA save has succeeded.
// Never compensate over a newer write from another browser.
export async function saveManagerWithFollowup(options,followup){
  let before,written;
  await saveManager({...options,backup:async value=>{before=clone(value);await options.backup(value);},write:async value=>{written=clone(value);await options.write(value);}});
  try{return await followup();}catch(error){
    if(written!==undefined){
      if(stable(await options.read())!==stable(written))throw Error('rollback_conflict');
      try{await options.write(before);}catch{if(stable(await options.read())!==stable(before))throw Error('rollback_uncertain');}
    }
    throw error;
  }
}
