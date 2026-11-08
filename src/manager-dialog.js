import {normalizeManager,newId,HA_SHORTCUTS,shortcutAvailable,findShortcut,addShortcut,isExternalUrl,separatorWidth} from './manager-model.js';
import {clone,rgba} from './core.js';
import {managerStrings} from './manager-i18n.js';
const el=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n;};
export class ManagerDialog extends HTMLElement{
 constructor(){super();this.attachShadow({mode:'open'});}
 show({hass,record,entries,save,focusKey,focusGroup}){
  this.hass=hass;this.t=managerStrings(hass);this.draft=clone(normalizeManager(record));this.entries=entries;this.saveRecord=save;this.busy=false;this.render();
  this.modal.showModal();this.modal.addEventListener('cancel',e=>{e.preventDefault();if(!this.busy)this.remove();});
  const target=[...this.shadowRoot.querySelectorAll('.row[data-key]')].find(row=>row.dataset.key===focusKey);
  if(target){target.style.outline='2px solid var(--primary-color,#03a9f4)';target.scrollIntoView({block:'center'});target.querySelector('select')?.focus();}
  const groupRow=[...this.shadowRoot.querySelectorAll('.cards:first-of-type .row')][this.draft.groups.findIndex(g=>g.id===focusGroup)];
  if(groupRow){groupRow.scrollIntoView({block:'center'});groupRow.querySelector('input')?.focus();}
 }
 button(label,fn,icon){const b=el('button',icon||label);b.type='button';b.title=label;b.setAttribute('aria-label',label);b.onclick=fn;return b;}
 input(label,value,change,type='text'){
  const l=el('label'),n=el('input');l.append(el('span',label),n);n.type=type;
  if(type==='checkbox')n.checked=!!value;else n.value=value||'';
  n.oninput=()=>change(type==='checkbox'?n.checked:n.value);return l;
 }
 move(array,index,delta){if(index+delta<0||index+delta>=array.length)return;[array[index],array[index+delta]]=[array[index+delta],array[index]];this.renderBody();}
 syncGroupLabels(){
  for(const select of this.shadowRoot.querySelectorAll('select'))for(const option of select.options){const group=this.draft.groups.find(g=>g.id===option.value);if(group)option.textContent=group.name;}
 }
 separatorControl(group){
  const label=el('label',this.t.separator),slider=el('input'),value=el('output');slider.type='range';slider.min='0';slider.max='4';slider.step='1';slider.value=String(separatorWidth(group.separator));slider.setAttribute('aria-label',this.t.separator+' '+group.name);slider.style.cssText='width:90px;min-width:90px;padding:0';value.style.cssText='min-width:30px;font-variant-numeric:tabular-nums';
  const paint=()=>{value.textContent=Number(slider.value)===0?this.t.off:slider.value+' px';};slider.oninput=()=>{group.separator=Number(slider.value);paint();};paint();label.append(slider,value);return label;
 }
 groupColor(group){
  const button=this.button(this.t.groupColor+' '+group.name,()=>{
   const picker=document.createElement('ugso-sidebar-color-picker');document.body.append(picker);
   picker.show({label:group.name,color:group.color,hass:this.hass,onChange:color=>{group.color=color;paint();}});
  });
  button.style.cssText='width:36px;height:36px;min-width:36px;padding:5px;background-image:conic-gradient(#999 25%,#fff 0 50%,#999 0 75%,#fff 0);background-size:10px 10px';
  const swatch=el('span');swatch.style.cssText='display:block;width:100%;height:100%;border-radius:3px';button.replaceChildren(swatch);
  const paint=()=>{swatch.style.background=rgba(group.color)||'transparent';button.title=this.t.groupColor+': '+group.name;};paint();return button;
 }
 render(){
  const style=el('style');style.textContent=`:host{font:14px var(--ha-font-family,Arial,sans-serif);color:var(--primary-text-color,#222)}*{box-sizing:border-box}dialog{color:inherit;background:var(--card-background-color,#fff);border:1px solid var(--divider-color,#888);border-radius:16px;width:min(1050px,94vw);max-height:90dvh;padding:0}dialog::backdrop{background:#0008}header,footer{padding:16px 20px;display:flex;gap:8px;align-items:center;background:var(--secondary-background-color,#eee)}h2{font-size:20px;margin:0;flex:1}h3{margin:14px 0 8px}main{padding:0 20px 16px;overflow:auto;max-height:calc(90dvh - 150px)}p{line-height:1.5}.cards{display:grid;gap:8px}.row{border:1px solid var(--divider-color,#aaa);border-radius:8px;padding:10px;display:flex;gap:10px;align-items:center;flex-wrap:wrap}.row>strong{width:100%;overflow-wrap:anywhere}.row small{width:100%;opacity:.7}.row label{display:flex;gap:6px;align-items:center}.row label:has(input[type=text]){flex:1;min-width:160px}input,select,textarea{background:var(--primary-background-color,#fff);color:inherit;border:1px solid var(--divider-color,#888);border-radius:5px;padding:7px;font:inherit;min-width:0}input[type=text]{width:100%}button{font:inherit;border:1px solid var(--divider-color,#aaa);border-radius:7px;padding:8px 12px;min-height:36px;background:var(--secondary-background-color,#eee);color:inherit;cursor:pointer}button:hover{border-color:var(--primary-color,#03a9f4)}footer{justify-content:flex-end;flex-wrap:wrap}footer button{min-width:115px}.primary{background:var(--primary-color,#03a9f4);color:var(--text-primary-color,#fff)}textarea{width:100%;height:120px}.status{white-space:pre-wrap;overflow-wrap:anywhere}button:disabled{opacity:.5;cursor:wait}input[type=checkbox]{accent-color:var(--primary-color,#03a9f4)}@media(max-width:600px){main{padding:0 10px 10px}.row{gap:8px}.row label:has(input[type=text]){min-width:100%;}.row select{max-width:150px}header,footer{padding:12px}footer button{min-width:100px}}`;
  this.modal=el('dialog');this.modal.setAttribute('aria-label',this.t.title);
  const head=el('header');head.append(el('h2',this.t.title),this.button(this.t.cancel,()=>{if(!this.busy)this.remove();},'×'));
  const accent=el('style');accent.textContent='.sm-ha-shortcut-title{color:var(--sidebar-manager-shortcut-color,#fff2a6)}.sm-external-title{color:var(--sidebar-manager-external-color,#a8dcff)}.sm-ha-shortcuts{grid-template-columns:repeat(2,minmax(0,1fr))}.sm-ha-shortcuts>.row{min-width:0}.sm-ha-shortcuts small{overflow-wrap:anywhere}.sm-ha-shortcuts select{max-width:100%}@media(max-width:600px){.sm-ha-shortcuts{grid-template-columns:minmax(0,1fr)}}';
  this.main=el('main');this.foot=el('footer');this.modal.append(head,this.main,this.foot);this.shadowRoot.replaceChildren(style,accent,this.modal);this.renderBody();
 }
 renderBody(){
  const t=this.t;this.main.replaceChildren(el('p',t.intro));this.main.append(el('h3',t.groups));
  const groups=el('div');groups.className='cards';
  this.draft.groups.forEach((g,i)=>{const row=el('div');row.className='row';row.append(this.input(t.name,g.name,v=>{g.name=v;this.syncGroupLabels();}),this.input(t.icon,g.icon,v=>g.icon=v),this.groupColor(g),this.input(t.collapsed,g.collapsed,v=>g.collapsed=v,'checkbox'),this.input(t.bottom,g.bottom,v=>g.bottom=v,'checkbox'),this.separatorControl(g),this.button(t.up,()=>this.move(this.draft.groups,i,-1),'↑'),this.button(t.down,()=>this.move(this.draft.groups,i,1),'↓'),this.button(t.remove,()=>{this.draft.groups.splice(i,1);for(const item of Object.values(this.draft.items))if(item.group===g.id)item.group='';this.renderBody();},'×'));groups.append(row);});
  this.main.append(groups,this.button(t.addGroup,()=>{this.draft.groups.push({id:newId('group'),name:t.newGroup,icon:'mdi:folder-outline',collapsed:false,bottom:false});this.renderBody();}));
  const shortcutHeading=el('h3',t.haShortcuts);shortcutHeading.className='sm-ha-shortcut-title';this.main.append(shortcutHeading);
  const shortcuts=el('div');shortcuts.className='cards sm-ha-shortcuts';this.presetGroups||={};
  for(const preset of HA_SHORTCUTS){
   if(!shortcutAvailable(preset,this.hass?.config?.version))continue;
   const existing=findShortcut(this.draft,preset),row=el('div');row.className='row';row.dataset.shortcut=preset.id;
   const title=el('strong',t['shortcut_'+preset.id]);title.className='sm-ha-shortcut-title';row.append(title,el('small',preset.url));
   const label=el('label',t.group),select=el('select');select.setAttribute('aria-label',t.group+' '+t['shortcut_'+preset.id]);
   for(const g of [{id:'',name:t.none},...this.draft.groups]){const o=el('option',g.name);o.value=g.id;select.append(o);}
   select.value=existing?existing[1].group:this.presetGroups[preset.id]||'';
   select.onchange=()=>{this.presetGroups[preset.id]=select.value;if(existing)this.draft.items[existing[0]].group=select.value;};label.append(select);row.append(label);
   const add=this.button(existing?t.shortcutPresent:t.shortcutAdd,()=>{addShortcut(this.draft,preset,t['shortcut_'+preset.id],select.value);this.renderBody();});add.disabled=!!existing;row.append(add);shortcuts.append(row);
  }
  this.main.append(shortcuts,el('p',t.shortcutHint));
  this.main.append(el('h3',t.items));const items=el('div');items.className='cards';
  const keys=[...new Set([...this.draft.order,...this.entries.map(e=>e.key),...Object.keys(this.draft.items)])];
  keys.forEach((key,i)=>{
   const original=this.entries.find(e=>e.key===key),current=this.draft.items[key];
   const item=current||{title:'',icon:'',group:'',bottom:false,hidden:false};
   const edit=(k,v)=>{this.draft.items[key]||=item;this.draft.items[key][k]=v;};
   const row=el('div');row.className='row';row.dataset.key=key;const title=el('strong',original?.label||current?.title||key);title.className=item.url?(isExternalUrl(item.url)?'sm-external-title':'sm-ha-shortcut-title'):'';row.append(title);
   if(!original&&!current?.url)row.append(el('small',t.missing));
   row.append(this.input(t.label,item.title,v=>edit('title',v)),this.input(t.icon,item.icon,v=>edit('icon',v)));
   const label=el('label',t.group),select=el('select');select.setAttribute('aria-label',t.group);
   for(const g of [{id:'',name:t.none},...this.draft.groups]){const o=el('option',g.name);o.value=g.id;select.append(o);}select.value=item.group||'';select.onchange=()=>edit('group',select.value);label.append(select);row.append(label);
   row.append(this.input(t.bottom,item.bottom,v=>edit('bottom',v),'checkbox'),this.input(t.hidden,item.hidden,v=>edit('hidden',v),'checkbox'));
   row.append(this.button(t.up,()=>{this.draft.order=keys;this.move(this.draft.order,i,-1);},'↑'),this.button(t.down,()=>{this.draft.order=keys;this.move(this.draft.order,i,1);},'↓'));
   if(item.url!=null){
    const modeLabel=el('label',t.openMode),mode=el('select');mode.setAttribute('aria-label',t.openMode+' '+(item.title||key));
    const syncMode=()=>{const external=isExternalUrl(item.url),currentMode=item.openMode||'same';mode.replaceChildren();for(const [value,text]of [['tab',t.newTab],['iframe',t.iframe],...(currentMode==='same'?[['same',t.sameWindow]]:[])]){const option=el('option',text);option.value=value;mode.append(option);}mode.value=currentMode;mode.disabled=!external;title.className=external?'sm-external-title':'sm-ha-shortcut-title';};
    mode.onchange=()=>edit('openMode',mode.value);syncMode();modeLabel.append(mode);
    row.append(this.input(t.url,item.url,v=>{const previous=isExternalUrl(item.url);edit('url',v);if(isExternalUrl(v)&&!previous)edit('openMode','tab');syncMode();}),modeLabel,el('small',t.frameHint),this.button(t.remove,()=>{delete this.draft.items[key];this.draft.order=this.draft.order.filter(k=>k!==key);this.renderBody();},'×'));
   }
   items.append(row);
  });
  this.main.append(items,this.button(t.addLink,()=>{const key=newId('sm-link');this.draft.items[key]={title:t.newLink,icon:'mdi:link',url:'/home',openMode:'tab',group:'',bottom:false,hidden:false};this.renderBody();}));
  const details=el('details');details.append(el('summary',t.import));const area=el('textarea');area.placeholder=t.importHint;area.setAttribute('aria-label',t.importHint);details.append(area,this.button(t.restore,()=>{try{const parsed=JSON.parse(area.value);if(parsed.format!=='sidebar-manager'||parsed.version!==1)throw Error();this.draft=normalizeManager(parsed.layout);this.renderBody();}catch{this.status.textContent=t.invalid;}}));this.main.append(details,el('p',t.source));
  this.status=el('p');this.status.className='status';this.status.setAttribute('role','status');this.main.append(this.status);
  this.foot.replaceChildren(this.button(t.export,()=>{const blob=new Blob([JSON.stringify({format:'sidebar-manager',version:1,layout:normalizeManager(this.draft)},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob),a=el('a');a.href=url;a.download='sidebar-manager-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}),this.button(t.reset,()=>{this.draft=normalizeManager(null);this.renderBody();this.status.textContent=t.resetHint;}),this.button(t.cancel,()=>this.remove()));
  const save=this.button(t.save,async()=>{try{this.busy=true;for(const b of this.shadowRoot.querySelectorAll('button,input,select,textarea'))b.disabled=true;this.status.textContent=t.busy;await this.saveRecord(normalizeManager(this.draft));this.remove();}catch(e){this.status.textContent=e.message==='conflict'?t.conflict:e.message?.startsWith('invalid')?t.invalid:t.error;}finally{this.busy=false;for(const b of this.shadowRoot.querySelectorAll('button,input,select,textarea'))b.disabled=false;}});save.className='primary';this.foot.append(save);
 }
}
