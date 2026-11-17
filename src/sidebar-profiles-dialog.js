const el=(tag,text)=>{const node=document.createElement(tag);if(text)node.textContent=text;return node;};
const button=(label,action)=>{
 const node=el('button',label);node.type='button';node.onclick=action;return node;
};

export function openProfiles({hass,t,profiles,snapshot,edit}){
 if(document.querySelector('[data-sm-profiles-popup]'))return;
 const host=el('div');host.dataset.smProfilesPopup='';
 const root=host.attachShadow({mode:'open'}),modal=el('dialog'),heading=el('h2',t.profiles),body=el('main'),status=el('p');
 modal.setAttribute('aria-label',t.profiles);status.setAttribute('role','status');
 const style=el('style');style.textContent=`
  dialog{box-sizing:border-box;width:min(520px,94vw);max-height:88dvh;overflow:auto;padding:18px;
   border:1px solid var(--divider-color,#888);border-radius:12px;background:var(--card-background-color,#fff);
   color:var(--primary-text-color,#222);font:14px var(--ha-font-family,Arial,sans-serif)}
  dialog::backdrop{background:#0008}h2{margin:0 0 12px}fieldset,details{margin:10px 0;border:1px solid var(--divider-color,#888);border-radius:7px;padding:10px}
  summary{cursor:pointer}label{display:flex;gap:8px;align-items:center;margin:7px 0}input,select,button{font:inherit;color:inherit;accent-color:var(--primary-color,#03a9f4)}
  button,select,input[type=text]{background:var(--secondary-background-color,#eee);border:1px solid var(--divider-color,#888);border-radius:7px;padding:7px}
  button{cursor:pointer}footer,.actions{display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap}p, label{overflow-wrap:anywhere}input[type=text]{min-width:0;flex:1}`;
 const footer=el('footer');
 footer.append(button(t.closeProfiles,()=>modal.close()));
 modal.append(heading,body,status,footer);root.append(style,modal);document.body.append(host);
 modal.addEventListener('close',()=>host.remove(),{once:true});
 const load=async()=>{
  body.textContent=t.loadingProfiles;
  try{
   const data=await profiles.load();if(!host.isConnected)return;
   if(data.global&&!hass.user.is_admin){modal.close();return;}
   body.replaceChildren();
   if(data.global)body.append(el('p',t.globalActive.replace('{name}',data.global.name)));
   else{
    const choices=el('fieldset');choices.append(el('legend',t.activeProfile));
    for(const entry of [{id:null,name:t.ownProfile},...data.assigned]){
     const radio=el('input');radio.type='radio';radio.name='sidebar-profile';radio.checked=(data.selected?.id??null)===entry.id;
     const label=el('label');label.append(radio,el('span',entry.name));choices.append(label);
     radio.onchange=()=>void run(()=>profiles.prefer(entry.id));
    }
    body.append(choices);
   }
   if(hass.user.is_admin)renderAdmin(body,t,profiles,snapshot,data,run,profile=>{modal.close();edit(data.record,profile);});
  }catch{body.textContent=t.profilesUnavailable;}
 };
 const run=async task=>{
  body.inert=true;
  try{await task();await load();status.textContent=t.saved;}
  catch(error){status.textContent=error.message==='conflict'?t.conflict:t.error;}
  finally{body.inert=false;}
 };
 modal.showModal();void load();
}

function renderAdmin(body,t,profiles,snapshot,{record,users,templates},run,edit){
 if(record.version!==1||!Array.isArray(record.profiles))throw Error('invalid_profiles');
 const details=el('details');details.dataset.smAdmin='';details.append(el('summary',t.manageProfiles),el('p',t.shareProfilesHint));
 const list=el('select');list.setAttribute('aria-label',t.profiles);
 list.add(new Option(t.newProfile,''));
 for(const profile of record.profiles)list.add(new Option(profile.name,profile.id));
 const name=el('input');name.type='text';name.maxLength=80;name.required=true;name.setAttribute('aria-label',t.profileName);
 const nameLabel=el('label',t.profileName);nameLabel.append(name);
 const checkbox=label=>{
  const input=el('input');input.type='checkbox';
  const wrapper=el('label');wrapper.append(input,el('span',label));return {input,wrapper};
 };
 const global=checkbox(t.enforceProfile),replace=checkbox(t.replaceProfile);
 const audience=el('fieldset');audience.append(el('legend',t.profileUsers));
 const selections=new Map(users.map(user=>{
  const choice=checkbox(user.name);audience.append(choice.wrapper);return [user.id,choice.input];
 }));
 const actions=el('div'),confirmation=el('div');actions.className='actions';
 const selected=()=>record.profiles.find(profile=>profile.id===list.value);
 const sync=()=>{
  const profile=selected();
  name.value=profile?.name??'';global.input.checked=!!profile&&record.globalId===profile.id;
  replace.input.checked=false;replace.wrapper.hidden=!profile;replace.wrapper.style.display=profile?'':'none';
  for(const [id,box] of selections)box.checked=profile?.users?.includes(id)??false;
  remove.disabled=!profile;editButton.disabled=!templates.some(template=>template.id===profile?.id);confirmation.replaceChildren();
 };
 const save=button(t.save,()=>{
  if(!name.value.trim()){name.value='';name.reportValidity();return;}
  void run(async()=>{
   const profile=selected();
   const id=profile?.id??Array.from(crypto.getRandomValues(new Uint32Array(4)),n=>n.toString(16).padStart(8,'0')).join('');
   const backup=!profile||replace.input.checked?await snapshot():profile.backup;
   const assigned=[...selections].filter(([,box])=>box.checked).map(([user])=>user);
   const next={id,name:name.value.trim(),users:assigned,everyone:!!profile?.everyone,auto:profile?profile.auto!==false:false,backup};
   const globalId=global.input.checked?id:(record.globalId===id?null:record.globalId??null);
   await profiles.write(record,{...record,globalId,profiles:profile?record.profiles.map(item=>item.id===id?next:item):[...record.profiles,next]});
  });
 });
 const remove=button(t.removeProfile,()=>{
  const profile=selected();if(!profile)return;
  confirmation.replaceChildren(el('p',t.removeProfileConfirm.replace('{name}',profile.name)),
   button(t.cancel,()=>confirmation.replaceChildren()),
   button(t.removeProfile,()=>void run(()=>profiles.write(record,{...record,
    globalId:record.globalId===profile.id?null:record.globalId??null,profiles:record.profiles.filter(item=>item.id!==profile.id)}))));
 });
 const editButton=button(t.editProfile,()=>edit(templates.find(template=>template.id===list.value)));
 list.onchange=sync;actions.append(save,editButton,remove);
 details.append(list,nameLabel,audience,global.wrapper,replace.wrapper,actions,confirmation);body.append(details);sync();
}
