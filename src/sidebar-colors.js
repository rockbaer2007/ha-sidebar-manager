import { VERSION, STORE_KEY, supportedVersion, normalizeRecord, normalizeColor, rgba, stable, clone, saveColorDraft } from "./core.js";
import { SidebarColorPicker, strings } from "./color-picker.js";
import {attachManager,attachManagerButton,moveEntryButton,endManagerDialog,withNativeGroupsSave} from './manager-runtime.js';
import {ManagerDialog} from './manager-dialog.js';
import {registerWebPanel} from './web-panel.js';

const FLAG = Symbol.for("ugso.sidebar.manager.loaded");
const sessions = new WeakMap();
const styled = new Map();
const controllers = new Set();
let activeSession = null;
let currentHass = null;
let currentConnection = null;
let currentUser = null;
let saved = normalizeRecord(null);
let unsubscribe;
let epoch = 0;

function findAll(root, selector) {
  const result = [...root.querySelectorAll(selector)];
  for (const node of root.querySelectorAll("*")) if (node.shadowRoot) result.push(...findAll(node.shadowRoot, selector));
  return result;
}
function warn(hass) { console.warn(`[Sidebar Colors ${VERSION}] ${strings(hass).incompatible}`); }
function request(dialog) { dialog.requestUpdate?.(); }
function message(session, text, error = false) {
  session.message = text; session.messageError = error;
  if (!session.dialog?.shadowRoot) return;
  let box = session.dialog.shadowRoot.querySelector(".ugso-color-status");
  if (!box) {
    box = document.createElement("div"); box.className="ugso-color-status"; box.setAttribute("role","status");
    box.style.cssText="font-size:12px;padding:4px 24px 8px;overflow-wrap:anywhere";
    const content=session.dialog.shadowRoot.querySelector(".content"); content?.prepend(box);
  }
  box.textContent=text; box.style.color=error?"var(--error-color,#db4437)":"var(--secondary-text-color,#888)";
}
function isSupported(hass) { return supportedVersion(hass?.config?.version); }
async function ws(hass, msg) {
  let timer;
  try {
    return await Promise.race([
      hass.connection.sendMessagePromise(msg),
      new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error("timeout")),12000);})
    ]);
  } finally { clearTimeout(timer); }
}
async function readRecord(hass, key=STORE_KEY) {
  return (await ws(hass,{type:"frontend/get_user_data",key})).value;
}
function writeRecord(hass,value) { return ws(hass,{type:"frontend/set_user_data",key:STORE_KEY,value}); }

function cssColor(node, value) {
  if (value) {
    if (!styled.has(node)) styled.set(node,{value:node.style.getPropertyValue("color"),priority:node.style.getPropertyPriority("color")});
    if (node.style.getPropertyValue("color")!==value || node.style.getPropertyPriority("color")!=="important") node.style.setProperty("color",value,"important");
  } else if (styled.has(node)) {
    const original=styled.get(node); styled.delete(node);
    if(original.value)node.style.setProperty("color",original.value,original.priority);
    else node.style.removeProperty("color");
  }
}
function applyRecord(sidebar, record) {
  if(!sidebar.shadowRoot)return;
  for(const row of sidebar.shadowRoot.querySelectorAll("[id^=sidebar-panel-]")) {
    const key=row.id.slice("sidebar-panel-".length);
    const value=rgba(record.colors[key]);
    for(const node of row.querySelectorAll("ha-icon[slot=start],ha-svg-icon[slot=start],.item-text,[slot=headline]"))cssColor(node,value);
  }
  for(const node of styled.keys())if(!node.isConnected)styled.delete(node);
}
function refresh() {
  const record=activeSession?.loaded?activeSession.draft:saved;
  for(const sidebar of controllers) {
    if(!sidebar.isConnected){controllers.delete(sidebar);continue;}
    applyRecord(sidebar,record);
  }
  if(activeSession)syncRows(activeSession);
}

async function useConnection(hass) {
  if(!hass?.connection || !hass.user?.id || !isSupported(hass))return;
  currentHass=hass;
  if(currentConnection===hass.connection && currentUser===hass.user.id)return;
  const generation=++epoch;
  unsubscribe?.();unsubscribe=undefined;
  currentConnection=hass.connection;currentUser=hass.user.id;saved=normalizeRecord(null);
  activeSession=null;refresh();
  try {
    const result=await readRecord(hass);
    if(generation!==epoch)return;
    saved=normalizeRecord(result);refresh();
    const off=await hass.connection.subscribeMessage(event=>{
      if(generation!==epoch)return;
      try{saved=normalizeRecord(event.value);refresh();}catch{warn(hass);}
    },{type:"frontend/subscribe_user_data",key:STORE_KEY});
    if(generation!==epoch)off();else unsubscribe=off;
  }catch{console.warn(`[Sidebar Colors ${VERSION}] ${strings(hass).unavailable}`);}
}

function markDirty(session) {
  session.dialog._dirtyStateContext.setState(clone(session.draft.colors),STORE_KEY);
  request(session.dialog);refresh();
}
function makeButton(session,item) {
  const key=item.value;
  const cacheKey=(item.smMixed?'mixed:':'')+key;
  let button=session.buttons.get(cacheKey);
  if(!button) {
    button=document.createElement("button");button.type="button";
    button.className="ugso-sidebar-color";button.dataset.panel=key;
    button.style.cssText="box-sizing:border-box;width:32px;height:32px;min-width:32px;padding:4px;border:1px solid var(--divider-color,#777);border-radius:7px;background:var(--card-background-color,#222);cursor:pointer;display:inline-flex;align-items:center;justify-content:center;margin-inline:2px 4px;vertical-align:middle";
    const swatch=document.createElement("span");
    swatch.style.cssText="display:block;width:20px;height:20px;border-radius:4px;overflow:hidden;background-color:#fff;background-image:conic-gradient(#999 25%,transparent 0 50%,#999 0 75%,transparent 0);background-size:8px 8px;pointer-events:none";
    const fill=document.createElement("span");fill.style.cssText="display:block;width:100%;height:100%";
    swatch.append(fill);button.append(swatch);
    button.addEventListener("pointerdown",e=>e.stopPropagation());
    button.addEventListener("keydown",e=>e.stopPropagation());
    button.addEventListener("click",e=>{
      e.stopPropagation();if(session.saving || !session.loaded)return;
      session.picker?.finish();
      const picker=document.createElement("ugso-sidebar-color-picker");
      session.picker=picker;document.body.append(picker);
      picker.show({label:item.label,color:session.draft.colors[key],hass:session.dialog.hass,onChange:color=>{
        if(session.saving)return;
        const valid=normalizeColor(color);
        if(valid)session.draft.colors[key]=valid;else delete session.draft.colors[key];
        markDirty(session);
      }});
    });
    session.buttons.set(cacheKey,button);
  }
  button.setAttribute("aria-label",`${strings(session.dialog.hass).edit} ${item.label}`);
  button.title=button.getAttribute("aria-label");button.disabled=!!session.saving;
  const c=session.draft.colors[key];
  button.firstElementChild.firstElementChild.style.background=rgba(c)||"transparent";
  button.dataset.theme=c?"false":"true";
  return button;
}
function syncRows(session) {
  attachManagerButton(session.dialog);
  const editor=session.dialog.shadowRoot?.querySelector("ha-items-display-editor");
  if(!editor || !session.loaded)return;
  if(editor!==session.editor) {
    session.observer?.disconnect();
    session.editor=editor;session.previousRenderer=editor.actionsRenderer;
    editor.actionsRenderer=item=>{
      const field=makeButton(session,item);
      const move=moveEntryButton(session.dialog.hass,item.value,item.label);
      return session.previousRenderer?[session.previousRenderer(item),move,field]:[move,field];
    };
    if(editor.shadowRoot){
      session.observer=new MutationObserver(()=>syncRows(session));
      session.observer.observe(editor.shadowRoot,{childList:true,subtree:true});
    }
  }
  const displayEditors=[...session.dialog.shadowRoot.querySelectorAll('ha-items-display-editor')];
  for(const display of displayEditors)if(display.shadowRoot)session.observer?.observe(display.shadowRoot,{childList:true,subtree:true});
  for(const item of displayEditors.flatMap(e=>e.items||[]))if(!item.value.startsWith('sm-group:'))makeButton(session,item);
  for(const row of displayEditors.flatMap(e=>[...e.shadowRoot?.querySelectorAll("ha-md-list-item")||[]])) {
    if(row.querySelector('[data-sm-group]'))continue;
    const panel=row.querySelector('[data-panel]')?.dataset.panel||row.value;
    const c=rgba(session.draft.colors[panel]);
    for(const target of row.querySelectorAll("[slot=headline],.icon"))cssColor(target,c);
  }
}

async function beginDialog(dialog) {
  endDialog(dialog);
  const hass=dialog.hass;
  if(!isSupported(hass) || typeof dialog._dirtyStateContext?.setState!=="function") {warn(hass);return;}
  const session={dialog,hass,userId:hass.user.id,buttons:new Map(),loaded:false,saving:false,
    nativeBase:{order:clone(dialog._order),hidden:clone(dialog._hidden)}};
  sessions.set(dialog,session);activeSession=session;
  try {
    const [raw,native]=await Promise.all([readRecord(hass),readRecord(hass,"sidebar")]);
    if(sessions.get(dialog)!==session || !dialog._open)return;
    session.rawBase=clone(raw);session.nativeStored=clone(native);
    session.base=normalizeRecord(raw);session.draft=clone(session.base);session.loaded=true;
    saved=clone(session.base);
    dialog._dirtyStateContext.setState(clone(session.base.colors),STORE_KEY);
    message(session,strings(hass).saved);
    request(dialog);syncRows(session);refresh();
  }catch{message(session,strings(hass).unavailable,true);}
}
function endDialog(dialog) {
  endManagerDialog(dialog);
  const session=sessions.get(dialog);
  if(!session)return;
  session.picker?.finish();session.observer?.disconnect();
  if(session.editor)session.editor.actionsRenderer=session.previousRenderer;
  sessions.delete(dialog);
  if(activeSession===session)activeSession=null;
  refresh();
}
async function saveDialog(dialog, original, args, originalClose) {
  const session=sessions.get(dialog);
  if(!session)return original.apply(dialog,args);
  if(session.saving)return;
  if(!session.loaded){message(session,strings(dialog.hass).unavailable,true);return;}
  if(dialog.hass.user.id!==session.userId || dialog.hass.connection!==session.hass.connection){
    message(session,strings(dialog.hass).conflict,true);return;
  }
  const hass=session.hass;
  session.saving=true;session.picker?.finish();syncRows(session);
  // Freeze native eye/drag controls too: edits made during an outstanding color
  // write must not be silently discarded when a colors-only save completes.
  if(session.editor)session.editor.inert=true;
  message(session,strings(dialog.hass).busy);
  try {
    const nativeChanged=!!dialog._migrateToUserData || stable(session.nativeBase)!==stable({order:dialog._order,hidden:dialog._hidden});
    if(nativeChanged && stable(await readRecord(hass,"sidebar"))!==stable(session.nativeStored))throw new Error("conflict");
    await withNativeGroupsSave(dialog,()=>saveColorDraft({base:session.base,draft:session.draft,
      read:()=>readRecord(hass),write:value=>writeRecord(hass,value),nativeChanged,
      backup:async before=>{
        // Backup contains only sidebar preferences, never tokens or other user data.
        const key=`ugso-sidebar-colors-backup:${session.userId}`;
        localStorage.setItem(key,JSON.stringify({at:new Date().toISOString(),colors:before,sidebar:session.nativeStored}));
      },
      nativeSave:async()=>{
        if(dialog.hass.user.id!==session.userId || dialog.hass.connection!==hass.connection)throw new Error("conflict");
        await original.apply(dialog,args);
        if(dialog._error || dialog.isDirtyState)throw new Error("native_save_failed");
      }}));
    saved=clone(session.draft);dialog._markDirtyStateClean();
    session.saving=false;endDialog(dialog);originalClose.call(dialog);
  }catch(error){
    message(session,error.message==="conflict"?strings(dialog.hass).conflict:strings(dialog.hass).error,true);
  }finally{session.saving=false;if(session.editor)session.editor.inert=false;syncRows(session);request(dialog);}
}

function patchDialog(Type) {
  const proto=Type.prototype;
  const getData=proto._getData, save=proto._save, close=proto.closeDialog, closed=proto._dialogClosed;
  if([getData,save,close,closed].some(fn=>typeof fn!=="function")){warn(currentHass);return;}
  proto._getData=async function(...args){await getData.apply(this,args);if(this._open && this._order && this._hidden)await beginDialog(this);};
  proto._save=function(...args){return saveDialog(this,save,args,close);};
  proto.closeDialog=function(...args){if(sessions.get(this)?.saving)return;endDialog(this);return close.apply(this,args);};
  proto._dialogClosed=function(...args){endDialog(this);return closed.apply(this,args);};
  const update=proto.updated;
  proto.updated=function(...args){update?.apply(this,args);const session=sessions.get(this);if(session?.loaded)queueMicrotask(()=>syncRows(session));};
  for(const dialog of findAll(document,"dialog-edit-sidebar"))if(dialog._open)beginDialog(dialog);
}

if(!window[FLAG]) {
  window[FLAG]=true;
  registerWebPanel();
  if(!customElements.get("ugso-sidebar-color-picker"))customElements.define("ugso-sidebar-color-picker",SidebarColorPicker);
  customElements.whenDefined("ha-sidebar").then(()=>{
    const Type=customElements.get("ha-sidebar"), original=Type.prototype.updated;
    Type.prototype.updated=function(...args){
      original?.apply(this,args);
      if(!isSupported(this.hass))return;
      controllers.add(this);useConnection(this.hass);attachManager(this,()=>applyRecord(this,activeSession?.loaded?activeSession.draft:saved));
      queueMicrotask(()=>applyRecord(this,activeSession?.loaded?activeSession.draft:saved));
    };
    for(const sidebar of findAll(document,"ha-sidebar")){controllers.add(sidebar);useConnection(sidebar.hass);attachManager(sidebar,()=>applyRecord(sidebar,activeSession?.loaded?activeSession.draft:saved));sidebar.requestUpdate?.();}
  });
  customElements.whenDefined("dialog-edit-sidebar").then(()=>patchDialog(customElements.get("dialog-edit-sidebar")));
  if(!customElements.get('ugso-sidebar-manager-dialog'))customElements.define('ugso-sidebar-manager-dialog',ManagerDialog);
  console.info(`[Sidebar Manager ${VERSION}] Home Assistant >= 2026.10.3`);
}
