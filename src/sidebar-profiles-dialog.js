const el=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n;};

export function renderProfiles(dialog){
 const {t,profiles,hass}=dialog;
 const details=el('details'),body=el('div');
 details.append(el('summary',t.profiles),body);
 details.addEventListener('toggle',async()=>{
  if(!details.open)return;
  body.textContent=t.busy;
  try{
   const data=await profiles.load();
   if(!details.isConnected||!details.open)return;
   body.replaceChildren();
   const run=async task=>{
    body.inert=true;
    try{await task();if(details.isConnected){status.textContent=t.saved;details.open=false;}}
    catch(error){status.textContent=error.message==='conflict'?t.conflict:t.error;}
    finally{body.inert=false;}
   };
   const status=el('p');status.setAttribute('role','status');
   if(data.assigned){
    body.append(el('p',t.assignedProfile+': '+data.assigned.name),
     dialog.button(data.personal?t.followProfile:t.personalProfile,()=>run(()=>profiles.prefer(!data.personal))),
     dialog.button(t.copyProfile,()=>run(async()=>{await dialog.stageTransfer(data.assigned.backupFile);dialog.usePersonalOnSave=true;})));
   }else body.append(el('p',t.noProfile));
   if(hass.user.is_admin)renderAdmin(dialog,body,data,run);
   body.append(status);
  }catch{body.textContent=t.profilesUnavailable;}
 });
 return details;
}

function renderAdmin(dialog,body,{record,users},run){
 const {t,profiles}=dialog;
 if(record.version!==1||!Array.isArray(record.profiles))throw Error('invalid_profiles');
 const list=el('select');
 list.setAttribute('aria-label',t.profiles);
 list.add(new Option(t.newProfile,''));
 for(const profile of record.profiles)list.add(new Option(profile.name,profile.id));
 const name=el('input');
 name.maxLength=80;
 const nameLabel=el('label',t.profileName);
 nameLabel.append(name);
 const everyone=el('input');
 everyone.type='checkbox';
 const everyoneLabel=el('label',t.profileEveryone);
 everyoneLabel.append(everyone);
 const audience=el('fieldset');
 audience.append(el('legend',t.profileUsers));
 const selections=new Map();
 for(const user of users){
  const box=el('input'),label=el('label',user.name);
  box.type='checkbox';label.append(box);audience.append(label);selections.set(user.id,box);
 }
 const selectProfile=()=>{
  const selected=record.profiles.find(profile=>profile.id===list.value);
  name.value=selected?.name??'';
  everyone.checked=!!selected?.everyone;
  for(const [id,box] of selections)box.checked=selected?.users?.includes(id)??false;
  remove.disabled=!selected;
 };
 list.onchange=selectProfile;
 const publish=async()=>{
  const title=name.value.trim();
  if(!title){name.reportValidity();return;}
  const assigned=[...selections].filter(([,box])=>box.checked).map(([id])=>id);
  const id=list.value||Array.from(crypto.getRandomValues(new Uint32Array(4)),n=>n.toString(16).padStart(8,'0')).join('');
  const backup=await dialog.transferSnapshot();
  const others=record.profiles.filter(profile=>profile.id!==id).map(profile=>({...profile,
   everyone:!!profile.everyone&&!everyone.checked,users:(profile.users??[]).filter(user=>!assigned.includes(user)),
  }));
  await profiles.write(record,{version:1,profiles:[...others,{id,name:title,everyone:everyone.checked,users:assigned,backup}]});
 };
 name.required=true;
 const remove=dialog.button(t.removeProfile,()=>{
  if(list.value&&window.confirm(t.removeProfileConfirm.replace('{name}',list.selectedOptions[0].textContent))){
   void run(()=>profiles.write(record,{version:1,profiles:record.profiles.filter(profile=>profile.id!==list.value)}));
  }
 });
 remove.disabled=true;
 body.append(el('hr'),el('p',t.profileShareHint),list,nameLabel,everyoneLabel,audience,
  dialog.button(t.publishProfile,()=>{if(name.reportValidity())void run(publish);}),remove);
}
