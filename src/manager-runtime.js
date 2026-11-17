import {clone,stable,rgba} from './core.js';
import {MANAGER_KEY,WEB_PANEL,normalizeManager,layoutEntries,saveManager,isExternalUrl} from './manager-model.js';
import {ManagerDialog} from './manager-dialog.js';
import {managerStrings} from './manager-i18n.js';
import {openProfiles} from './sidebar-profiles-dialog.js';
import {PROFILES_KEY,PREFERENCE_KEY,normalizeSidebar,makeBackup,readPreferences,profileChoices,savePreferences,trackGlobalProfile} from './sidebar-preferences.js';
import {attachNativeGroups,endNativeGroups,nativeGroupsDirty,nativeGroupsBusy} from './native-groups.js';
export {withNativeGroupsSave,nativeProfileDraft} from './native-groups.js';
let config=normalizeManager(null),hassRef,identity,off,epoch=0,loaded=false;
let profileRecord,profilePreference,appliedProfile,personalNative;
let globalNotice,profileRevision=0;
let profileSubscriptions=[];
const instances=new Set(),state=new WeakMap();
const editDialogs=new Set();
const collapsed=new Map();
const el=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n;};
async function request(hass,type,key,value){let timer;try{return await Promise.race([hass.connection.sendMessagePromise({type,key,...(type.startsWith('frontend/set_')?{value}:{})}),new Promise((_,reject)=>timer=setTimeout(()=>reject(Error('timeout')),12000))]);}finally{clearTimeout(timer);}}
const read=hass=>request(hass,'frontend/get_user_data',MANAGER_KEY).then(r=>r.value);
const readKey=(hass,key)=>request(hass,'frontend/get_user_data',key).then(r=>r.value);
const writeKey=(hass,key,value)=>request(hass,'frontend/set_user_data',key,value);
const legacySidebar=()=>normalizeSidebar({
 panelOrder:readLegacyList('sidebarPanelOrder'),hiddenPanels:readLegacyList('sidebarHiddenPanels')
});
function readLegacyList(key){try{return JSON.parse(localStorage.getItem(key));}catch{return [];}}
export function sharedColors(){return appliedProfile?.backup.colors;}
export function sharedLayout(hass){return hass?.user?.id===identity?.id?appliedProfile?.backup.layout:undefined;}
export function editorProfile(hass){
 return sharedLayout(hass)?{record:profileRecord,profile:appliedProfile,
  editable:!!hass.user.is_admin&&profileRecord.globalId===appliedProfile.id}:undefined;
}
export function profileReadOnly(hass){const target=editorProfile(hass);return !!target&&!target.editable;}
export function saveProfileEditor(hass,{record,profile},{layout,colors,sidebar}){
 return actions(hass).profiles.write(record,{...record,profiles:record.profiles.map(item=>item.id===profile.id
  ?{...item,backup:makeBackup(layout,colors,sidebar)}:item)});
}
function refreshProfile(acknowledge=false){
 const next=profileChoices(profileRecord,identity?.id,profilePreference);
 globalNotice=trackGlobalProfile(globalNotice,next.global,acknowledge);
 const active=next.global??(profilePreference===undefined?undefined:next.selected);
 if(stable(appliedProfile)!==stable(active))collapsed.clear();
 appliedProfile=active;
 refreshManager();
 window.dispatchEvent(new Event('ugso-sidebar-profile-changed'));
}
function receiveProfiles(value){profileRecord=value;profileRevision++;}
async function connectProfiles(hass,generation){
 const bindings=[
  ['system',PROFILES_KEY,receiveProfiles],
  ['user',PREFERENCE_KEY,value=>{profilePreference=value??null;}],
  ['user','sidebar',value=>{personalNative=normalizeSidebar({...legacySidebar(),...value});}],
 ];
 await Promise.allSettled(bindings.map(async ([scope,key,receive])=>{
  const apply=value=>{if(generation===epoch){receive(value);refreshProfile();}};
  let changed=false;
  const subscription=await hass.connection.subscribeMessage(event=>{changed=true;apply(event.value);},{type:'frontend/subscribe_'+scope+'_data',key});
  if(generation!==epoch){subscription();return;}
  profileSubscriptions.push(subscription);
  const result=await request(hass,'frontend/get_'+scope+'_data',key);
  if(!changed)apply(result.value);
 }));
}
function entries(sidebar){return [...sidebar.shadowRoot.querySelectorAll('[id^="sidebar-panel-"]:not([data-sm-link])')].map(row=>({key:row.id.slice(14),label:row.querySelector('.item-text')?.textContent||row.id}));}
export function refreshManager(){for(const sidebar of instances)if(sidebar.isConnected)applyLayout(sidebar);else instances.delete(sidebar);for(const dialog of editDialogs)if(dialog.isConnected)attachManagerButton(dialog);else editDialogs.delete(dialog);}
async function connect(hass){
 if(!hass?.user?.id||!hass?.connection)return;
 hassRef=hass;const id=hass.user.id;
 if(identity?.id===id&&identity.connection===hass.connection)return;
 identity={id,connection:hass.connection};const current=++epoch;off?.();loaded=false;config=normalizeManager(null);
 for(const unsubscribe of profileSubscriptions)unsubscribe();
 profileSubscriptions=[];profileRecord=profilePreference=appliedProfile=personalNative=undefined;
 globalNotice=undefined;
 collapsed.clear();refreshManager();
 void connectProfiles(hass,current);
 try{const value=normalizeManager(await read(hass));if(current!==epoch)return;config=value;loaded=true;refreshManager();const un=await hass.connection.subscribeMessage(e=>{if(current!==epoch)return;try{config=normalizeManager(e.value);loaded=true;collapsed.clear();refreshManager();}catch{console.warn('[Sidebar Manager] Unsupported stored layout; no automatic write.');}},{type:'frontend/subscribe_user_data',key:MANAGER_KEY});if(current===epoch)off=un;else un();}catch{console.warn('[Sidebar Manager] Layout unavailable; stored data left untouched.');}
}
function actions(hass){
 const owner=identity,currentEpoch=epoch;
 const verifyOwner=()=>{if(identity!==owner||epoch!==currentEpoch||owner?.id!==hass.user.id||owner.connection!==hass.connection)throw Error('conflict');};
 const readTransfer=()=>readPreferences(key=>readKey(hass,key),legacySidebar());
 return {verifyOwner,readTransfer,profiles:{
  load:async()=>{
   const [record,preference,users]=await Promise.all([
    request(hass,'frontend/get_system_data',PROFILES_KEY).then(result=>result.value),
    readKey(hass,PREFERENCE_KEY),
    hass.user.is_admin?hass.connection.sendMessagePromise({type:'config/auth/list'}):[],
   ]);
   return {record:record??{version:1,profiles:[]},...profileChoices(record,hass.user.id,preference),
    users:users.filter(user=>user.is_active&&!user.system_generated)};
  },
  write:async(base,next)=>{
   verifyOwner();
   if(!hass.user.is_admin)throw Error('conflict');
   const actual=(await request(hass,'frontend/get_system_data',PROFILES_KEY)).value??{version:1,profiles:[]};
   if(stable(base)!==stable(actual))throw Error('conflict');
   verifyOwner();
   await request(hass,'frontend/set_system_data',PROFILES_KEY,next);
   verifyOwner();
   receiveProfiles(next);refreshProfile();
  },
  prefer:async profileId=>{
   verifyOwner();
   const record=(await request(hass,'frontend/get_system_data',PROFILES_KEY)).value;
   const {assigned,global}=profileChoices(record,hass.user.id);
   if(global||(profileId!==null&&!assigned.some(profile=>profile.id===profileId)))throw Error('conflict');
   verifyOwner();await writeKey(hass,PREFERENCE_KEY,{profileId});verifyOwner();
   profilePreference={profileId};refreshProfile();
  },
 }};
}
export function openManager(sidebar,focusKey,focusGroup){
 if([...editDialogs].some(dialog=>dialog.isConnected&&(nativeGroupsDirty(dialog)||nativeGroupsBusy(dialog))))return;
 const hass=sidebar.hass;if(!loaded||hass.user.id!==identity?.id||profileReadOnly(hass))return;
 if(document.querySelector('ugso-sidebar-manager-dialog'))return;
 const target=editorProfile(hass);
 if(target?.editable){openTemplate(sidebar,target.record,target.profile,focusKey,focusGroup);return;}
 const base=clone(config),dialog=el('ugso-sidebar-manager-dialog');document.body.append(dialog);
 const {verifyOwner,readTransfer}=actions(hass);
 const backup=before=>localStorage.setItem('ugso-sidebar-manager-backup:'+hass.user.id,JSON.stringify({at:new Date().toISOString(),...before}));
 dialog.show({hass,record:base,entries:entries(sidebar),focusKey,focusGroup,readTransfer,
  save:async (draft,transfer,transferBase)=>{
  verifyOwner();if(editorProfile(hass))throw Error('conflict');
  if(transfer?.colors){
   await savePreferences({base:transferBase,draft:{...transfer,layout:draft},read:key=>readKey(hass,key),
    write:(key,value)=>{verifyOwner();return writeKey(hass,key,value);},backup});
  }else{
   await saveManager({base,draft,read:()=>read(hass),write:value=>{verifyOwner();return writeKey(hass,MANAGER_KEY,value);},backup:before=>backup({layout:before})});
  }
  config=clone(draft);collapsed.clear();refreshManager();
 }});
}
function openTemplate(sidebar,record,profile,focusKey,focusGroup){
 const hass=sidebar.hass;
 if(!hass.user.is_admin||document.querySelector('ugso-sidebar-manager-dialog'))return;
 const draft=el('ugso-sidebar-manager-dialog'),data=profile.backup;
 document.body.append(draft);
 draft.show({hass,title:profile.name,record:data.layout,entries:entries(sidebar),focusKey,focusGroup,
  readTransfer:async()=>({layout:data.layout,colors:data.colors,sidebar:data.sidebar,native:data.sidebar}),
  save:(layout,transfer)=>saveProfileEditor(hass,{record,profile},{layout,
   colors:transfer?.colors??data.colors,sidebar:transfer?.sidebar??data.sidebar})});
}
export function attachManager(sidebar,onLayout){
 instances.add(sidebar);connect(sidebar.hass);
 if(!state.has(sidebar)&&sidebar.shadowRoot){const s={headers:new Map(),separators:new Map(),custom:new Map()};state.set(sidebar,s);s.observer=new MutationObserver(()=>{if(s.pending)return;s.pending=true;queueMicrotask(()=>{s.pending=false;if(sidebar.isConnected)applyLayout(sidebar);});});s.observer.observe(sidebar.shadowRoot,{childList:true,subtree:true});}
 if(onLayout&&state.has(sidebar))state.get(sidebar).onLayout=onLayout;
 applyLayout(sidebar);
}
export function attachManagerButton(nativeDialog){
 editDialogs.add(nativeDialog);
 if(!nativeDialog._open)return;
 const content=nativeDialog.shadowRoot?.querySelector('.content');if(!content)return;
 let button=content.querySelector('[data-sm-open]');if(!button){button=el('button');button.dataset.smOpen='';button.type='button';button.style.cssText='margin:8px 0;padding:10px;border:1px solid var(--divider-color);border-radius:8px;background:var(--card-background-color);color:var(--primary-text-color);cursor:pointer';button.onclick=()=>{const sidebar=[...instances].find(s=>s.isConnected);if(sidebar)openManager(sidebar);};content.prepend(button);}
 const hass=nativeDialog.hass,t=managerStrings(hass),target=editorProfile(hass),locked=profileReadOnly(hass),global=profileChoices(profileRecord,hass.user.id).global;
 let profileRow=content.querySelector('[data-sm-profile-row]');
 if(!profileRow){
  profileRow=el('div');profileRow.dataset.smProfileRow='';
  const profilesButton=el('button');profilesButton.type='button';profilesButton.style.cssText=button.style.cssText;
  const hint=el('p');hint.style.cssText='margin:4px 0;color:var(--secondary-text-color)';
  const update=el('button');update.type='button';update.style.cssText=button.style.cssText;
  const updateHint=el('p');updateHint.style.cssText=hint.style.cssText;updateHint.setAttribute('role','status');
  update.onclick=async()=>{
   const currentHass=nativeDialog.hass,owner=identity,revision=profileRevision,strings=managerStrings(currentHass);
   update.disabled=true;updateHint.textContent='';
   try{
    const result=await request(currentHass,'frontend/get_system_data',PROFILES_KEY);
    if(owner!==identity)return;
    if(revision===profileRevision)receiveProfiles(result.value);
    refreshProfile(true);
    updateHint.textContent=strings.globalRefreshed;
   }catch{updateHint.textContent=strings.globalRefreshFailed;}
   finally{update.disabled=false;if(owner===identity)attachManagerButton(nativeDialog);}
  };
  profileRow.append(profilesButton,hint,update,updateHint);button.after(profileRow);
  profilesButton.onclick=()=>{
   const currentHass=nativeDialog.hass;
   const {profiles,readTransfer,verifyOwner}=actions(currentHass);
   openProfiles({hass:currentHass,t:managerStrings(currentHass),profiles,edit:(record,profile)=>{
    const sidebar=[...instances].find(s=>s.isConnected&&s.hass?.user?.id===currentHass.user.id);
    if(sidebar)openTemplate(sidebar,record,profile);
   },snapshot:async()=>{
    const data=await readTransfer();verifyOwner();return makeBackup(data.layout,data.colors,data.native);
   }});
  };
 }
 const [profilesButton,hint,update,updateHint]=profileRow.children;
 if(profilesButton.textContent!==t.profiles)profilesButton.textContent=t.profiles;
 profilesButton.hidden=!!global&&!hass.user.is_admin;
 profilesButton.disabled=!loaded||nativeGroupsDirty(nativeDialog)||nativeGroupsBusy(nativeDialog);
 const note=global?t.globalActive.replace('{name}',global.name):(locked?t.sharedReadOnly:'');
 if(hint.textContent!==note)hint.textContent=note;hint.hidden=!note;
 if(update.textContent!==t.refreshGlobal)update.textContent=t.refreshGlobal;
 update.hidden=!global;
 updateHint.hidden=!global;
 if(!global)updateHint.textContent='';
 else if(globalNotice?.pending&&!updateHint.textContent)updateHint.textContent=t.globalChanged;
 if(globalNotice?.pending&&updateHint.textContent===t.globalRefreshed)updateHint.textContent=t.globalChanged;
 if(loaded)attachNativeGroups(nativeDialog,{
  record:target?.profile.backup.layout??config,profile:target?.profile.id,
  sidebar:target?.profile.backup.sidebar,readOnly:locked,
  identity,getIdentity:()=>identity,read:()=>read(hass),
  write:value=>request(hass,'frontend/set_user_data',MANAGER_KEY,value),
  backup:async before=>localStorage.setItem('ugso-sidebar-manager-backup:'+hass.user.id,JSON.stringify({at:new Date().toISOString(),layout:before})),
  editGroup:id=>{const sidebar=[...instances].find(s=>s.isConnected);if(sidebar)openManager(sidebar,undefined,id);}
 });
 if(button.textContent!==t.open)button.textContent=t.open;button.disabled=locked||!loaded||nativeGroupsDirty(nativeDialog)||nativeGroupsBusy(nativeDialog);
 const root=nativeDialog.shadowRoot;
 let lockStyle=root.querySelector('[data-sm-profile-style]');
 if(!lockStyle){lockStyle=el('style');lockStyle.dataset.smProfileStyle='';lockStyle.textContent=':host([data-sm-profile-readonly]) ha-items-display-editor{pointer-events:none;opacity:.65} :host([data-sm-profile-readonly]) [slot=primaryAction]{pointer-events:none;opacity:.5} :host([data-sm-profile-active]) ha-icon-overflow-menu{display:none}';root.append(lockStyle);}
 nativeDialog.toggleAttribute('data-sm-profile-active',!!target);
 nativeDialog.toggleAttribute('data-sm-profile-readonly',locked);
 const editors=[...nativeDialog.shadowRoot.querySelectorAll('ha-items-display-editor')];
 for(const editor of editors)editor.inert=locked;
 for(const badge of editors.flatMap(e=>[...e.shadowRoot?.querySelectorAll('[data-sm-move]')||[]])){updateMoveBadge(badge,nativeDialog.hass);if(nativeGroupsDirty(nativeDialog)||nativeGroupsBusy(nativeDialog))badge.disabled=true;}
}
export function endManagerDialog(dialog){editDialogs.delete(dialog);endNativeGroups(dialog);}
function updateMoveBadge(button,hass){
 const layout=sharedLayout(hass)??config;
 const key=button.dataset.smMove,item=layout.items[key],group=layout.groups.find(g=>g.id===item?.group),t=managerStrings(hass),name=item?.url?(isExternalUrl(item.url)?t.externalLink:t.internalLink):(group?.name||t.none);
 if(button.textContent!==name)button.textContent=name;
 button.title=(item?.url?t.editLink:t.move)+': '+(group?.name||t.none);button.setAttribute('aria-label',(item?.url?t.editLink:t.move)+' '+button.dataset.smLabel+': '+name+'; '+(group?.name||t.none));button.disabled=!loaded||[...editDialogs].some(dialog=>dialog.isConnected&&(nativeGroupsDirty(dialog)||nativeGroupsBusy(dialog)));
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
 const active=appliedProfile?.backup;
 if(active||s.profileNative){
  const native=active?.sidebar??personalNative;
  if('_panelOrder' in sidebar&&'_hiddenPanels' in sidebar&&native){
   if(stable(sidebar._panelOrder)!==stable(native.panelOrder))sidebar._panelOrder=native.panelOrder;
   if(stable(sidebar._hiddenPanels)!==stable(native.hiddenPanels))sidebar._hiddenPanels=native.hiddenPanels;
  }
  if(active||native)s.profileNative=!!active;
 }
 const config=active?.layout??personalLayout();
 const slot=root.querySelector('slot[name=main-navigation]');if(!slot)return;
 if(!s.style){s.style=el('style');s.style.textContent=`slot[name=main-navigation]{display:flex;flex-direction:column;min-height:100%}[data-sm-group]{width:calc(100% - 8px);margin:7px 4px 2px;border:0;border-top:1px solid var(--divider-color);padding:10px 12px;text-align:start;font:inherit;font-weight:600;background:var(--secondary-background-color);color:var(--primary-text-color);cursor:pointer;border-radius:6px}[data-sm-bottom]{margin-top:auto!important}[data-sm-hidden]{display:none!important}[data-sm-label][hidden],[slot=start][hidden],.item-text[hidden]{display:none!important}.sm-entry{min-height:40px;padding:0 12px;display:flex;align-items:center;gap:20px;color:var(--sidebar-text-color);text-decoration:none}.sm-entry:hover{background:var(--secondary-background-color)}.sm-entry ha-icon{color:var(--sidebar-icon-color)}:host(:not([expanded])) [data-sm-group]{font-size:0;padding:8px} :host(:not([expanded])) [data-sm-group]::after{content:'⋯';font-size:18px}:host(:not([expanded])) .sm-entry .item-text{display:none}`;root.append(s.style);}
 if(!s.iconStyle){
  s.iconStyle=el('style');
  s.iconStyle.textContent=`
   [data-sm-group]{display:flex;align-items:center;gap:8px;border-top:0}
   :is([data-sm-group],.sm-entry) > ha-icon,[data-sm-icon]{
    --mdc-icon-size:var(--ha-space-6,24px);
    width:var(--ha-space-6,24px);
    height:var(--ha-space-6,24px);
    flex:none;
   }
   [data-sm-group] .sm-group-label{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1}
   :host(:not([expanded])) :is([data-sm-group],.sm-entry){
    box-sizing:border-box;
    flex:none;
    width:var(--ha-space-12,48px);
    min-height:var(--ha-space-10,40px);
    margin:0 var(--ha-space-1,4px) var(--ha-space-1,4px);
    padding:0;
    gap:0;
    justify-content:center;
   }
   :host(:not([expanded])) [data-sm-group] .sm-group-label,
   :host(:not([expanded])) [data-sm-group]::after{display:none}
  `;
  root.append(s.iconStyle);
 }
 for(const [id,node]of s.custom)if(!config.items[id]?.url){node.remove();s.custom.delete(id);}
 for(const [key,item]of Object.entries(config.items))if(item.url){let row=s.custom.get(key);if(!row){row=el('a');row.className='sm-entry';row.dataset.smLink='';row.id='sidebar-panel-'+key;row.append(el('ha-icon'),el('span'));row.firstElementChild.slot='start';row.lastElementChild.className='item-text';row.lastElementChild.slot='headline';slot.append(row);s.custom.set(key,row);}const external=isExternalUrl(item.url);row.href=external&&item.openMode==='iframe'?'/'+WEB_PANEL+'/'+encodeURIComponent(key):item.url;row.target=external&&item.openMode==='tab'?'_blank':'';row.rel=external&&item.openMode==='tab'?'noopener noreferrer':'';row.onclick=event=>{if(external&&item.openMode==='iframe'&&!sidebar.hass.panels?.[WEB_PANEL]){event.preventDefault();sidebar.dispatchEvent(new CustomEvent('hass-notification',{detail:{message:managerStrings(sidebar.hass).frameSetup},bubbles:true,composed:true}));}};row.firstElementChild.icon=item.icon||'mdi:link';if(row.lastElementChild.textContent!==item.title)row.lastElementChild.textContent=item.title;row.setAttribute('aria-label',item.title);}
 const available=entries(sidebar),layout=layoutEntries(config,available),keep=new Set();let order=0,bottomSeen=false;
 const rows=[...slot.querySelectorAll('[id^=sidebar-panel-]')];
 for(const row of rows){const key=row.id.slice(14);row.style.removeProperty('order');row.removeAttribute('data-sm-bottom');row.toggleAttribute('data-sm-hidden',!!config.items[key]?.hidden);if(!row.hasAttribute('data-sm-link'))override(row,config.items[key]);}
 for(const entry of layout){
  if(entry.kind==='group'){
   keep.add(entry.id);let head=s.headers.get(entry.id);if(!head){head=el('button');head.type='button';head.dataset.smGroup=entry.id;const icon=el('ha-icon'),label=el('span');label.className='sm-group-label';head.append(icon,label);head.onclick=()=>{const g=config.groups.find(g=>g.id===entry.id);collapsed.set(entry.id,!(collapsed.get(entry.id)??g?.collapsed));refreshManager();};slot.append(head);s.headers.set(entry.id,head);}
   const isCollapsed=collapsed.get(entry.id)??entry.collapsed;const title=(isCollapsed?'▸ ':'▾ ')+entry.name;if(head.lastElementChild.textContent!==title)head.lastElementChild.textContent=title;head.firstElementChild.icon=entry.icon;head.style.color=rgba(entry.color)||'';head.firstElementChild.style.color=rgba(entry.color)||'';head.title=entry.name;head.setAttribute('aria-label',entry.name);head.setAttribute('aria-expanded',String(!isCollapsed));head.style.order=String(order++);head.toggleAttribute('data-sm-bottom',entry.bottom&&!bottomSeen);if(entry.bottom)bottomSeen=true;
  }else if(entry.kind==='separator'){
   let line=s.separators.get(entry.id);if(!line){line=el('div');line.dataset.smSeparator=entry.id;line.setAttribute('role','separator');line.setAttribute('aria-orientation','horizontal');line.style.cssText='flex:none;margin:1px 12px;padding:0;border:0;min-height:0';slot.append(line);s.separators.set(entry.id,line);}line.style.height=entry.width+'px';line.style.backgroundColor=rgba(entry.color)||getComputedStyle(s.headers.get(entry.id).firstElementChild).color;line.style.order=String(order++);const group=config.groups.find(g=>g.id===entry.id);line.toggleAttribute('data-sm-hidden',!!(collapsed.get(entry.id)??group?.collapsed));
  }else{
   const row=rows.find(r=>r.id==='sidebar-panel-'+entry.key);if(!row)continue;row.style.order=String(order++);const g=config.groups.find(g=>g.id===entry.group);row.toggleAttribute('data-sm-hidden',!!entry.hidden||!!(g&&(collapsed.get(g.id)??g.collapsed)));const bottom=g?g.bottom:entry.bottom;row.toggleAttribute('data-sm-bottom',!!bottom&&!bottomSeen);if(bottom)bottomSeen=true;
  }
 }
 for(const [id,head]of s.headers)if(!keep.has(id)){head.remove();s.headers.delete(id);}
 for(const [id,line]of s.separators)if(!keep.has(id)||!config.groups.find(g=>g.id===id)?.separator){line.remove();s.separators.delete(id);}
 s.onLayout?.();
}
function personalLayout(){return config;}
