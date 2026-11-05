import {clone,stable,rgba} from './core.js';
import {MANAGER_KEY,normalizeManager,saveManagerWithFollowup} from './manager-model.js';
import {managerStrings} from './manager-i18n.js';
const sessions=new WeakMap(),DIRTY_KEY=MANAGER_KEY+':menu-order';
// Only the extra editor sees these IDs. They never reach HA's stored panel list.
const groupKey=id=>'sm-group:'+id;
const customLinks=record=>{
 const rank=new Map(record.order.map((key,index)=>[key,index]));
 return Object.entries(record.items).filter(([,item])=>item.url).sort(([a],[b])=>(rank.get(a)??1e9)-(rank.get(b)??1e9));
};
const editorItems=(record,nativeItems)=>[
 ...nativeItems.filter(i=>!record.items[i.value]?.url).map(i=>({...i,smMixed:true})),
 ...customLinks(record).map(([key,item])=>({value:key,label:item.title||item.url,icon:item.icon||'mdi:link',smMixed:true,smLink:true}))
];
const el=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n;};
export const nativeGroupsDirty=dialog=>!!sessions.get(dialog)?.dirty;
export const nativeGroupsBusy=dialog=>!!sessions.get(dialog)?.saving;
export function endNativeGroups(dialog){const s=sessions.get(dialog);if(s){s.observer?.disconnect();s.native.style.display=s.display;s.section.remove();}sessions.delete(dialog);}
export function mixedMenuOrder(record,nativeOrder,items){
 const links=customLinks(record).map(([key])=>key),valid=new Set([...items.map(i=>i.value),...links]),groups=new Set(record.groups.map(g=>groupKey(g.id)));
 const fromToken=t=>t.startsWith('g:')?groupKey(t.slice(2)):t.startsWith('p:')?t.slice(2):'';
 const values=record.menuOrder.map(fromToken).filter(v=>valid.has(v)||groups.has(v));
 // Existing mixed anchors win; links without an anchor start at the end.
 const order=[...new Set([...values,...nativeOrder.filter(v=>valid.has(v)),...items.map(i=>i.value),...groups,...links])];
 const bottom=new Set([...record.groups.filter(g=>g.bottom).map(g=>groupKey(g.id)),...links.filter(key=>record.items[key].bottom&&!record.items[key].group)]);
 return [...order.filter(v=>!bottom.has(v)),...order.filter(v=>bottom.has(v))];
}
// Moving a folder before a normal menu block explicitly releases bottom pinning.
// Ignore grouped panel rows: they move with their folder in the actual sidebar.
export function releaseMovedBottomGroups(record,order){
 for(let i=order.length-1,normalAfter=false;i>=0;i--){
  const group=record.groups.find(g=>groupKey(g.id)===order[i]);
  if(group){if(group.bottom&&normalAfter)group.bottom=false;if(!group.bottom)normalAfter=true;}
  else{const item=record.items[order[i]];if(item?.url&&!item.group&&item.bottom&&normalAfter)item.bottom=false;if(!item?.group&&!item?.bottom)normalAfter=true;}
 }
}
function render(dialog,s){
 const t=managerStrings(dialog.hass),nativeItems=s.native.items||[];
 const signature=stable({groups:s.draft.groups,links:customLinks(s.draft),menu:s.order,items:nativeItems.map(i=>[i.value,i.label,i.iconPath,i.disableHiding,i.disableSorting]),hidden:s.hidden,dirty:s.dirty,saving:s.saving,lang:t.groupOrderHint});
 if(!s.renderer){s.renderer=item=>{
  const group=s.draft.groups.find(g=>groupKey(g.id)===item.value);
  if(!group)return s.native.actionsRenderer?.(item);
  const label=el('span',t.submenus);label.style.cssText='font:12px var(--ha-font-family,Arial);color:var(--secondary-text-color);margin-inline:8px';
  const button=el('button');button.type='button';button.title=t.groupColor;button.setAttribute('aria-label',t.groupColor+' '+group.name);
  button.dataset.smGroup=group.id;
  button.style.cssText='width:32px;min-width:32px;height:32px;padding:4px;border:1px solid var(--divider-color);border-radius:7px;background-image:conic-gradient(#999 25%,#fff 0 50%,#999 0 75%,#fff 0);background-size:8px 8px;cursor:pointer';
  const fill=el('span');fill.style.cssText='display:block;width:100%;height:100%;border-radius:3px';fill.style.background=rgba(group.color)||'transparent';button.append(fill);button.disabled=s.dirty||s.saving;
  button.onpointerdown=e=>e.stopPropagation();button.onkeydown=e=>e.stopPropagation();button.onclick=e=>{e.stopPropagation();if(!s.dirty&&!s.saving)s.options.editGroup(group.id);};return [label,button];
 };s.editor.actionsRenderer=s.renderer;}
 if(s.actionSource!==s.native.actionsRenderer){s.actionSource=s.native.actionsRenderer;s.editor.requestUpdate?.();}
 if(s.signature!==signature){
  s.signature=signature;s.hint.textContent=s.dirty?t.saveOrderFirst:t.groupOrderHint;
  s.editor.items=[...editorItems(s.draft,nativeItems),...s.draft.groups.map(g=>({value:groupKey(g.id),label:g.name,icon:g.icon,disableHiding:true}))];
  s.editor.value={order:s.order,hidden:[...s.hidden]};
 }
 s.editor.hass=dialog.hass;s.editor.inert=!!s.saving;
 for(const row of s.editor.shadowRoot?.querySelectorAll('ha-md-list-item,ha-list-item-button')||[]){
  const g=s.draft.groups.find(g=>g.id===row.querySelector('[data-sm-group]')?.dataset.smGroup);if(!g)continue;
  for(const n of row.querySelectorAll('[slot=headline],.icon'))n.style.color=rgba(g.color)||'';
 }
}
function changed(dialog,s,event){
 event.stopPropagation();if(s.saving)return;
 const value=event.detail?.value;if(!value||!Array.isArray(value.order)||!Array.isArray(value.hidden))return;
 const linkKeys=new Set(customLinks(s.draft).map(([key])=>key)),nativeKeys=new Set((s.native.items||[]).map(i=>i.value).filter(key=>!linkKeys.has(key))),groupIds=new Map(s.draft.groups.map(g=>[groupKey(g.id),g.id]));
 const priorNativeOrder=s.order.filter(v=>nativeKeys.has(v)),priorPanelOrder=s.order.filter(v=>nativeKeys.has(v)||linkKeys.has(v)),priorHidden=s.hidden.filter(v=>nativeKeys.has(v));
 const order=[...new Set(value.order.filter(v=>nativeKeys.has(v)||linkKeys.has(v)||groupIds.has(v)))];
 const tokens=order.map(v=>groupIds.has(v)?'g:'+groupIds.get(v):'p:'+v);
 const unseen=s.draft.menuOrder.filter(v=>!tokens.includes(v));
 if(stable(order)!==stable(s.order))releaseMovedBottomGroups(s.draft,order);
 s.order=order;s.draft.menuOrder=[...tokens,...unseen];
 // Link visibility belongs to the Manager record, never HA's panel preferences.
 for(const key of linkKeys)s.draft.items[key].hidden=value.hidden.includes(key);
 const panelOrder=order.filter(key=>nativeKeys.has(key)||linkKeys.has(key));
 // A link can also move relative to native members of the same folder.
 // Folder-only moves retain the pre-existing entry order and missing anchors.
 if(linkKeys.size&&stable(panelOrder)!==stable(priorPanelOrder)){
  s.draft.order=[...panelOrder,...s.draft.order.filter(key=>!panelOrder.includes(key))];
 }
 s.dirty=stable(s.draft)!==stable(s.base);
 dialog._dirtyStateContext.setState(s.dirty,DIRTY_KEY);
 const nativeValue={order:order.filter(v=>nativeKeys.has(v)),hidden:value.hidden.filter(v=>nativeKeys.has(v))};
 s.hidden=[...nativeValue.hidden,...[...linkKeys].filter(key=>s.draft.items[key].hidden)];
 // HA may store an empty order to mean its computed default. A folder-only
 // move must not replace that with an explicit native order or alter defaults.
 if(stable(nativeValue)!==stable({order:priorNativeOrder,hidden:priorHidden})){
  s.native.dispatchEvent(new CustomEvent('value-changed',{detail:{value:nativeValue},bubbles:true,composed:true}));
 }
 s.signature=null;render(dialog,s);dialog.requestUpdate?.();
}
export function attachNativeGroups(dialog,options){
 const content=dialog.shadowRoot?.querySelector('.content'),native=content?.querySelector('ha-items-display-editor');
 if(!content||!native||!dialog._open)return;
 let s=sessions.get(dialog);const record=normalizeManager(options.record);
 if(!s){
  const section=el('section');section.className='sm-native-groups';const hint=el('p');hint.style.cssText='font-size:12px;color:var(--secondary-text-color);line-height:1.4;margin:6px 0';
  const editor=el('ha-items-display-editor');section.append(hint,editor);native.after(section);
  s={section,hint,editor,native,display:native.style.display,base:clone(record),draft:clone(record),dirty:false,saving:false,identity:options.identity,options};
  s.order=mixedMenuOrder(record,dialog._order||[],native.items||[]);s.hidden=[...(native.value?.hidden||dialog._hidden||[]),...customLinks(record).filter(([,item])=>item.hidden).map(([key])=>key)];native.style.display='none';sessions.set(dialog,s);
  dialog._dirtyStateContext.setState(false,DIRTY_KEY);editor.addEventListener('value-changed',e=>changed(dialog,s,e));
  s.observer=new MutationObserver(()=>render(dialog,s));if(editor.shadowRoot)s.observer.observe(editor.shadowRoot,{childList:true,subtree:true});
 }
 if(!s.dirty&&!s.saving){s.base=clone(record);s.draft=clone(record);s.identity=options.identity;s.order=mixedMenuOrder(record,dialog._order||[],native.items||[]);s.hidden=[...(native.value?.hidden||dialog._hidden||[]),...customLinks(record).filter(([,item])=>item.hidden).map(([key])=>key)];}
 s.options=options;render(dialog,s);
}
export async function withNativeGroupsSave(dialog,followup){
 const s=sessions.get(dialog);if(!s)return followup();
 if(s.saving)throw Error('busy');
 const options=s.options,owner=s.identity;
 const check=()=>{if(options.getIdentity()!==owner||dialog.hass.user.id!==owner.id)throw Error('conflict');};
 check();s.saving=true;render(dialog,s);dialog.requestUpdate?.();
 try{
  if(!s.dirty)return await followup();
  return await saveManagerWithFollowup({base:s.base,draft:s.draft,read:async()=>{check();return options.read();},write:async value=>{check();await options.write(value);},backup:async before=>{check();await options.backup(before);}},followup);
 }finally{s.saving=false;render(dialog,s);dialog.requestUpdate?.();}
}
