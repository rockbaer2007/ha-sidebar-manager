import {clone,stable,rgba} from './core.js';
import {MANAGER_KEY,normalizeManager,saveManagerWithFollowup} from './manager-model.js';
import {managerStrings} from './manager-i18n.js';
const sessions=new WeakMap(),DIRTY_KEY=MANAGER_KEY+':group-order';
const el=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n;};
export const nativeGroupsDirty=dialog=>!!sessions.get(dialog)?.dirty;
export const nativeGroupsBusy=dialog=>!!sessions.get(dialog)?.saving;
export function endNativeGroups(dialog){const s=sessions.get(dialog);s?.section.remove();sessions.delete(dialog);}
function move(dialog,s,id,target){
 if(s.saving)return;
 const from=s.draft.groups.findIndex(g=>g.id===id);if(from<0||target<0||target>=s.draft.groups.length||from===target)return;
 s.draft.groups.splice(target,0,s.draft.groups.splice(from,1)[0]);
 s.dirty=stable(s.base.groups.map(g=>g.id))!==stable(s.draft.groups.map(g=>g.id));
 dialog._dirtyStateContext.setState(s.dirty,DIRTY_KEY);s.signature=null;render(dialog,s);dialog.requestUpdate?.();
}
function render(dialog,s){
 const t=managerStrings(dialog.hass),signature=stable({groups:s.draft.groups,dirty:s.dirty,saving:s.saving,title:t.submenus});
 if(s.signature===signature)return;s.signature=signature;
 const style=el('style');style.textContent='.sm-native-groups{border-top:1px solid var(--divider-color);margin-top:14px;padding-top:10px}.sm-native-groups h3{font-size:14px;margin:4px 0}.sm-native-groups p{font-size:12px;color:var(--secondary-text-color);line-height:1.4}.sm-native-group-row{display:flex;align-items:center;gap:7px;min-height:46px;border-radius:6px}.sm-native-group-row>span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.sm-native-group-row ha-icon{--mdc-icon-size:24px;margin-inline:8px 4px;flex:none}.sm-native-group-row button{box-sizing:border-box;width:30px;min-width:30px;height:30px;padding:3px;color:var(--secondary-text-color);border:1px solid var(--divider-color);border-radius:6px;background:var(--card-background-color);font:inherit;cursor:pointer}.sm-native-group-row button:disabled{opacity:.35;cursor:default}.sm-native-group-row .grip{cursor:grab;touch-action:none;font-size:20px}.sm-native-group-row .swatch{width:32px;min-width:32px;background-image:conic-gradient(#999 25%,#fff 0 50%,#999 0 75%,#fff 0);background-size:10px 10px}.swatch span{display:block;width:100%;height:100%;border-radius:3px}';
 const list=el('div');list.setAttribute('role','list');list.setAttribute('aria-label',t.submenus);
 s.draft.groups.forEach((group,index)=>{
  const row=el('div');row.className='sm-native-group-row';row.dataset.smGroupRow=group.id;row.setAttribute('role','listitem');
  const icon=el('ha-icon');icon.icon=group.icon;icon.style.color=rgba(group.color)||'';
  const name=el('span',group.name);name.title=group.name;name.style.color=rgba(group.color)||'';
  const button=(text,title,fn)=>{const b=el('button',text);b.type='button';b.title=title;b.setAttribute('aria-label',title+' '+group.name);b.onclick=fn;return b;};
  const swatch=button('',t.groupColor,()=>{if(!s.dirty&&!s.saving)s.options.editGroup(group.id);});swatch.className='swatch';swatch.disabled=s.dirty;const fill=el('span');fill.style.background=rgba(group.color)||'transparent';swatch.append(fill);
  const up=button('↑',t.up,()=>move(dialog,s,group.id,index-1)),down=button('↓',t.down,()=>move(dialog,s,group.id,index+1));up.disabled=index===0;down.disabled=index===s.draft.groups.length-1;
  const grip=button('≡',t.moveGroup,()=>{});grip.className='grip';grip.onkeydown=e=>{if(!['ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();move(dialog,s,group.id,index+(e.key==='ArrowUp'?-1:1));[...s.section.querySelectorAll('[data-sm-group-row]')].find(r=>r.dataset.smGroupRow===group.id)?.querySelector('.grip')?.focus();};
  grip.onpointerdown=e=>{if(s.saving||e.button!==0)return;e.preventDefault();grip.setPointerCapture?.(e.pointerId);s.drag={id:group.id,target:index};};
  grip.onpointermove=e=>{if(!s.drag)return;const hit=[...list.children].find(row=>{const r=row.getBoundingClientRect();return e.clientX>=r.left&&e.clientX<r.right&&e.clientY>=r.top&&e.clientY<r.bottom;});if(!hit)return;s.drag.target=s.draft.groups.findIndex(g=>g.id===hit.dataset.smGroupRow);for(const r of list.children)r.style.outline=r===hit?'1px solid var(--primary-color)':'';};
  grip.onpointerup=()=>{const drag=s.drag;s.drag=null;for(const r of list.children)r.style.outline='';if(drag)move(dialog,s,drag.id,drag.target);};grip.onpointercancel=()=>{s.drag=null;for(const r of list.children)r.style.outline='';};
  row.append(icon,name,swatch,up,down,grip);list.append(row);
 });
 s.section.className='sm-native-groups';s.section.replaceChildren(style,el('h3',t.submenus),el('p',s.dirty?t.saveOrderFirst:t.groupOrderHint),list);s.section.inert=!!s.saving;
}
export function attachNativeGroups(dialog,options){
 const content=dialog.shadowRoot?.querySelector('.content');if(!content||!dialog._open)return;
 let s=sessions.get(dialog);const record=normalizeManager(options.record);
 if(!s){const section=el('section');content.append(section);s={section,base:clone(record),draft:clone(record),dirty:false,saving:false,identity:options.identity,options};sessions.set(dialog,s);dialog._dirtyStateContext.setState(false,DIRTY_KEY);}
 if(!s.dirty&&!s.saving){s.base=clone(record);s.draft=clone(record);s.identity=options.identity;}
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
