import {clone,stable,rgba} from './core.js';
import {MANAGER_KEY,normalizeManager,layoutEntries,saveManager} from './manager-model.js';
import {ManagerDialog} from './manager-dialog.js';
import {managerStrings} from './manager-i18n.js';
import {attachNativeGroups,endNativeGroups,nativeGroupsDirty,nativeGroupsBusy} from './native-groups.js';
export {withNativeGroupsSave} from './native-groups.js';
let config=normalizeManager(null),hassRef,identity,off,epoch=0,loaded=false;
const instances=new Set(),state=new WeakMap();
const editDialogs=new Set();
const collapsed=new Map();
const el=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n;};
async function request(hass,type,key,value){let timer;try{return await Promise.race([hass.connection.sendMessagePromise({type,key,...(type==='frontend/set_user_data'?{value}:{})}),new Promise((_,reject)=>timer=setTimeout(()=>reject(Error('timeout')),12000))]);}finally{clearTimeout(timer);}}
const read=hass=>request(hass,'frontend/get_user_data',MANAGER_KEY).then(r=>r.value);
function entries(sidebar){return [...sidebar.shadowRoot.querySelectorAll('[id^="sidebar-panel-"]:not([data-sm-link])')].map(row=>({key:row.id.slice(14),label:row.querySelector('.item-text')?.textContent||row.id}));}
export function refreshManager(){for(const sidebar of instances)if(sidebar.isConnected)applyLayout(sidebar);else instances.delete(sidebar);for(const dialog of editDialogs)if(dialog.isConnected)attachManagerButton(dialog);else editDialogs.delete(dialog);}
async function connect(hass){
 if(!hass?.user?.id||!hass?.connection)return;
 hassRef=hass;const id=hass.user.id;
 if(identity?.id===id&&identity.connection===hass.connection)return;
 identity={id,connection:hass.connection};const current=++epoch;off?.();loaded=false;config=normalizeManager(null);collapsed.clear();refreshManager();
 try{const value=normalizeManager(await read(hass));if(current!==epoch)return;config=value;loaded=true;refreshManager();const un=await hass.connection.subscribeMessage(e=>{if(current!==epoch)return;try{config=normalizeManager(e.value);loaded=true;collapsed.clear();refreshManager();}catch{console.warn('[Sidebar Manager] Unsupported stored layout; no automatic write.');}},{type:'frontend/subscribe_user_data',key:MANAGER_KEY});if(current===epoch)off=un;else un();}catch{console.warn('[Sidebar Manager] Layout unavailable; stored data left untouched.');}
}
export function openManager(sidebar,focusKey,focusGroup){
 if([...editDialogs].some(dialog=>dialog.isConnected&&(nativeGroupsDirty(dialog)||nativeGroupsBusy(dialog))))return;
 const hass=sidebar.hass;if(!loaded||hass.user.id!==identity?.id)return;
 if(document.querySelector('ugso-sidebar-manager-dialog'))return;
 const base=clone(config),owner=identity,currentEpoch=epoch,dialog=el('ugso-sidebar-manager-dialog');document.body.append(dialog);
 dialog.show({hass,record:base,entries:entries(sidebar),focusKey,focusGroup,save:async draft=>{
  if(identity!==owner||epoch!==currentEpoch)throw Error('conflict');
  await saveManager({base,draft,read:()=>read(hass),write:value=>{if(identity!==owner)throw Error('conflict');return request(hass,'frontend/set_user_data',MANAGER_KEY,value);},backup:async before=>localStorage.setItem('ugso-sidebar-manager-backup:'+hass.user.id,JSON.stringify({at:new Date().toISOString(),layout:before}))});
  config=clone(draft);collapsed.clear();refreshManager();
 }});
}
export function attachManager(sidebar){
 instances.add(sidebar);connect(sidebar.hass);
 if(!state.has(sidebar)&&sidebar.shadowRoot){const s={headers:new Map(),custom:new Map()};state.set(sidebar,s);s.observer=new MutationObserver(()=>{if(s.pending)return;s.pending=true;queueMicrotask(()=>{s.pending=false;if(sidebar.isConnected)applyLayout(sidebar);});});s.observer.observe(sidebar.shadowRoot,{childList:true,subtree:true});}
 applyLayout(sidebar);
}
export function attachManagerButton(nativeDialog){
 editDialogs.add(nativeDialog);
 if(!nativeDialog._open)return;
 const content=nativeDialog.shadowRoot?.querySelector('.content');if(!content)return;
 let button=content.querySelector('[data-sm-open]');if(!button){button=el('button');button.dataset.smOpen='';button.type='button';button.style.cssText='margin:8px 0;padding:10px;border:1px solid var(--divider-color);border-radius:8px;background:var(--card-background-color);color:var(--primary-text-color);cursor:pointer';button.onclick=()=>{const sidebar=[...instances].find(s=>s.isConnected);if(sidebar)openManager(sidebar);};content.prepend(button);}
 if(loaded)attachNativeGroups(nativeDialog,{record:config,identity,getIdentity:()=>identity,read:()=>read(nativeDialog.hass),write:value=>request(nativeDialog.hass,'frontend/set_user_data',MANAGER_KEY,value),backup:async before=>localStorage.setItem('ugso-sidebar-manager-backup:'+nativeDialog.hass.user.id,JSON.stringify({at:new Date().toISOString(),layout:before})),editGroup:id=>{const sidebar=[...instances].find(s=>s.isConnected);if(sidebar)openManager(sidebar,undefined,id);}});
 const title=managerStrings(nativeDialog.hass).open;if(button.textContent!==title)button.textContent=title;button.disabled=!loaded||nativeGroupsDirty(nativeDialog)||nativeGroupsBusy(nativeDialog);
 const editor=nativeDialog.shadowRoot.querySelector('ha-items-display-editor');
 for(const badge of editor?.shadowRoot?.querySelectorAll('[data-sm-move]')||[]){updateMoveBadge(badge,nativeDialog.hass);if(nativeGroupsDirty(nativeDialog)||nativeGroupsBusy(nativeDialog))badge.disabled=true;}
}
export function endManagerDialog(dialog){editDialogs.delete(dialog);endNativeGroups(dialog);}
function updateMoveBadge(button,hass){
 const key=button.dataset.smMove,group=config.groups.find(g=>g.id===config.items[key]?.group),name=group?.name||managerStrings(hass).none;
 if(button.textContent!==name)button.textContent=name;
 button.title=managerStrings(hass).move+': '+name;button.setAttribute('aria-label',managerStrings(hass).move+' '+button.dataset.smLabel+': '+name);button.disabled=!loaded;
}
export function moveEntryButton(hass,key,label){
 const button=el('button');button.type='button';button.dataset.smMove=key;button.dataset.smLabel=label||key;
 button.style.cssText='box-sizing:border-box;width:105px;min-width:105px;max-width:105px;height:32px;padding:4px 7px;margin-inline:3px;border:1px solid var(--divider-color);border-radius:7px;background:var(--card-background-color);color:var(--secondary-text-color);font:12px var(--ha-font-family,Arial,sans-serif);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:pointer';
 updateMoveBadge(button,hass);
 button.onpointerdown=e=>e.stopPropagation();button.onkeydown=e=>e.stopPropagation();button.onclick=e=>{e.stopPropagation();const sidebar=[...instances].find(s=>s.isConnected);if(sidebar)openManager(sidebar,key);};return button;
}
function override(row,item){
 const label=row.querySelector('.item-text:not([data-sm-label])'),originalIcon=row.querySelector('[slot=start]:not([data-sm-icon])');
 let title=row.querySelector('[data-sm-label]'),icon=row.querySelector('[data-sm-icon]');
 if(item?.title){if(!title){title=el('span');title.dataset.smLabel='';title.className='item-text';title.slot='headline';row.append(title);}if(title.textContent!==item.title)title.textContent=item.title;if(label)label.hidden=true;}else{title?.remove();if(label)label.hidden=false;}
 if(item?.icon){if(!icon){icon=el('ha-icon');icon.dataset.smIcon='';icon.slot='start';row.prepend(icon);}if(icon.icon!==item.icon)icon.icon=item.icon;if(originalIcon)originalIcon.hidden=true;}else{icon?.remove();if(originalIcon)originalIcon.hidden=false;}
}
function applyLayout(sidebar){
 const root=sidebar.shadowRoot,s=state.get(sidebar);if(!root||!s)return;
 const slot=root.querySelector('slot[name=main-navigation]');if(!slot)return;
 if(!s.style){s.style=el('style');s.style.textContent=`slot[name=main-navigation]{display:flex;flex-direction:column;min-height:100%}[data-sm-group]{width:calc(100% - 8px);margin:7px 4px 2px;border:0;border-top:1px solid var(--divider-color);padding:10px 12px;text-align:start;font:inherit;font-weight:600;background:var(--secondary-background-color);color:var(--primary-text-color);cursor:pointer;border-radius:6px}[data-sm-bottom]{margin-top:auto!important}[data-sm-hidden]{display:none!important}[data-sm-label][hidden],[slot=start][hidden],.item-text[hidden]{display:none!important}.sm-entry{min-height:40px;padding:0 12px;display:flex;align-items:center;gap:20px;color:var(--sidebar-text-color);text-decoration:none}.sm-entry:hover{background:var(--secondary-background-color)}.sm-entry ha-icon{color:var(--sidebar-icon-color)}:host(:not([expanded])) [data-sm-group]{font-size:0;padding:8px} :host(:not([expanded])) [data-sm-group]::after{content:'⋯';font-size:18px}:host(:not([expanded])) .sm-entry .item-text{display:none}`;root.append(s.style);}
 if(!s.iconStyle){s.iconStyle=el('style');s.iconStyle.textContent='[data-sm-group]{display:flex;align-items:center;gap:8px}[data-sm-group] ha-icon{--mdc-icon-size:20px;flex:none}[data-sm-group] .sm-group-label{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1}:host(:not([expanded])) [data-sm-group] .sm-group-label{display:none}:host(:not([expanded])) [data-sm-group]::after{display:none}';root.append(s.iconStyle);}
 for(const [id,node]of s.custom)if(!config.items[id]?.url){node.remove();s.custom.delete(id);}
 for(const [key,item]of Object.entries(config.items))if(item.url){let row=s.custom.get(key);if(!row){row=el('a');row.className='sm-entry';row.dataset.smLink='';row.id='sidebar-panel-'+key;row.append(el('ha-icon'),el('span'));row.firstElementChild.slot='start';row.lastElementChild.className='item-text';row.lastElementChild.slot='headline';slot.append(row);s.custom.set(key,row);}row.href=item.url;row.firstElementChild.icon=item.icon||'mdi:link';if(row.lastElementChild.textContent!==item.title)row.lastElementChild.textContent=item.title;row.setAttribute('aria-label',item.title);}
 const available=entries(sidebar),layout=layoutEntries(config,available),keep=new Set();let order=0,bottomSeen=false;
 const rows=[...slot.querySelectorAll('[id^=sidebar-panel-]')];
 for(const row of rows){const key=row.id.slice(14);row.style.removeProperty('order');row.removeAttribute('data-sm-bottom');row.toggleAttribute('data-sm-hidden',!!config.items[key]?.hidden);if(!row.hasAttribute('data-sm-link'))override(row,config.items[key]);}
 for(const entry of layout){
  if(entry.kind==='group'){
   keep.add(entry.id);let head=s.headers.get(entry.id);if(!head){head=el('button');head.type='button';head.dataset.smGroup=entry.id;const icon=el('ha-icon'),label=el('span');label.className='sm-group-label';head.append(icon,label);head.onclick=()=>{const g=config.groups.find(g=>g.id===entry.id);collapsed.set(entry.id,!(collapsed.get(entry.id)??g?.collapsed));refreshManager();};slot.append(head);s.headers.set(entry.id,head);}
   const isCollapsed=collapsed.get(entry.id)??entry.collapsed;const title=(isCollapsed?'▸ ':'▾ ')+entry.name;if(head.lastElementChild.textContent!==title)head.lastElementChild.textContent=title;head.firstElementChild.icon=entry.icon;head.style.color=rgba(entry.color)||'';head.firstElementChild.style.color=rgba(entry.color)||'';head.title=entry.name;head.setAttribute('aria-label',entry.name);head.setAttribute('aria-expanded',String(!isCollapsed));head.style.order=String(order++);head.toggleAttribute('data-sm-bottom',entry.bottom&&!bottomSeen);if(entry.bottom)bottomSeen=true;
  }else{
   const row=rows.find(r=>r.id==='sidebar-panel-'+entry.key);if(!row)continue;row.style.order=String(order++);const g=config.groups.find(g=>g.id===entry.group);row.toggleAttribute('data-sm-hidden',!!entry.hidden||!!(g&&(collapsed.get(g.id)??g.collapsed)));const bottom=g?g.bottom:entry.bottom;row.toggleAttribute('data-sm-bottom',!!bottom&&!bottomSeen);if(bottom)bottomSeen=true;
  }
 }
 for(const [id,head]of s.headers)if(!keep.has(id)){head.remove();s.headers.delete(id);}
}
