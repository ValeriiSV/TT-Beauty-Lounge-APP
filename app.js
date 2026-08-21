const API='https://azfacbrdujwadnsoasnz.supabase.co',KEY='sb_publishable_AwJd2SUhBwiL3OMaGGhkQw_j2kycR6X',ADMIN='valerkasvetlicenco@icloud.com',BOT='TTbeautylounge_bot';let token=sessionStorage.getItem('tt_app_token'),items=[],reviews=[],view='manual',adminBusy=false,adminRefreshTimer;const photoCache=new Map(),$=id=>document.getElementById(id),esc=s=>{const d=document.createElement('div');d.textContent=s??'';return d.innerHTML},headers=()=>({apikey:KEY,Authorization:`Bearer ${token}`,'Content-Type':'application/json'});function localDate(d=new Date()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}function showOnly(id){['welcome','client','login','adminApp','account'].forEach(x=>$(x).hidden=x!==id);scrollTo(0,0)}function progress(n){document.querySelectorAll('.progress span').forEach((x,i)=>x.classList.toggle('active',i<n))}
function formatDuration(minutes){const n=Number(minutes)||0;if(n<60)return `${n} min`;const h=Math.floor(n/60),m=n%60;return `${h} h${m?` ${m} min`:''}`}
function manualFormHtml(){
  const t=window.ttI18n.t;
  const serviceOptions=$('service')?.innerHTML||'';
  const hairOptions=$('clientHairLength')?.innerHTML||'';
  return `<section id="manualBookingForm" class="panel manual-booking-panel">
    <div class="form-intro"><i>+</i><div><h2 data-i18n="manualBookingTitle">${esc(t('manualBookingTitle'))}</h2><p data-i18n="manualBookingLead">${esc(t('manualBookingLead'))}</p></div></div>
    <div class="manual-grid">
      <label><span data-i18n="manualClientName">${esc(t('manualClientName'))}</span><input id="manualName" required autocomplete="name"></label>
      <label><span data-i18n="manualPhone">${esc(t('manualPhone'))}</span><input id="manualPhone" type="tel" required autocomplete="tel"><small data-i18n="manualPhoneHint">${esc(t('manualPhoneHint'))}</small></label>
      <label class="wide"><span data-i18n="manualService">${esc(t('manualService'))}</span><select id="manualService" required>${serviceOptions}</select></label>
      <label><span data-i18n="manualHairLength">${esc(t('manualHairLength'))}</span><select id="manualHairLength" required>${hairOptions}</select></label>
      <label><span data-i18n="manualPrice">${esc(t('manualPrice'))}</span><input id="manualPrice" type="number" min="1" step="1" required placeholder="850"><small data-i18n="manualPriceHint">${esc(t('manualPriceHint'))}</small></label>
      <label class="wide"><span data-i18n="manualDate">${esc(t('manualDate'))}</span><input id="manualDate" type="date" required min="${localDate()}"></label>
      <div class="wide"><label data-i18n="manualAvailableTimes">${esc(t('manualAvailableTimes'))}</label><div id="manualSlots" class="slots manual-slots"><p data-i18n="manualChooseServiceDate">${esc(t('manualChooseServiceDate'))}</p></div><input id="manualTime" type="hidden"><p id="manualAvailability" class="msg"></p></div>
    </div>
    <button class="full" id="manualCreateBtn" type="button" data-i18n="manualCreate">${esc(t('manualCreate'))}</button>
  </section>`;
}
async function loadManualSlots(){
  const t=window.ttI18n.t,service=$('manualService')?.value,date=$('manualDate')?.value;
  if(!$('manualSlots'))return;
  $('manualTime').value='';
  $('manualAvailability').textContent='';
  $('manualSlots').innerHTML=`<p>${esc(t('manualChooseServiceDate'))}</p>`;
  if(!service||!date)return;
  $('manualSlots').innerHTML=`<p>${esc(t('manualLoadingSlots'))}</p>`;
  try{
    const r=await fetch(`${API}/rest/v1/rpc/available_appointment_slots`,{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify({p_date:date,p_service:service})});
    if(!r.ok)throw Error(t('slotsError'));
    const slots=await r.json();
    const duration=Number($('manualService').selectedOptions[0]?.dataset.duration||0);
    if(!slots.length){$('manualSlots').innerHTML=`<p>${esc(t('manualNoSlots'))}</p>`;return}
    $('manualSlots').innerHTML=slots.map(s=>`<button type="button" data-manual-time="${esc(String(s.slot_time).slice(0,5))}">${esc(s.label)}</button>`).join('');
    $('manualAvailability').textContent=`${slots.length} ${t('freeSlots')} · ${t('duration')} ${formatDuration(duration)}`;
  }catch(error){$('manualSlots').innerHTML=`<p>${esc(t('cannotCheck'))}</p>`;$('manualAvailability').textContent=error.message}
}
async function createManualAppointment(){
  const t=window.ttI18n.t;
  const name=$('manualName')?.value.trim(),phone=$('manualPhone')?.value.trim(),service=$('manualService')?.value,hair=$('manualHairLength')?.value,price=Number($('manualPrice')?.value||0),date=$('manualDate')?.value,time=$('manualTime')?.value;
  if(!name||!phone||!service||!hair||!price||!date||!time){$('status').textContent=t('manualFillAll');return}
  const button=$('manualCreateBtn');adminBusy=true;button.disabled=true;button.textContent=t('manualCreating');$('status').textContent=t('manualCreating');
  try{
    const r=await fetch(`${API}/rest/v1/rpc/admin_create_phone_appointment`,{method:'POST',headers:headers(),body:JSON.stringify({p_name:name,p_phone:phone,p_service:service,p_date:date,p_time:time,p_hair_length:hair,p_quoted_price:price})});
    const result=await r.json().catch(()=>({}));
    if(!r.ok)throw Error(String(result.message||result.error||'Programarea nu a putut fi creată.'));
    await load(true);
    $('status').textContent=t('manualCreated');
    $('date').value=date;
    view='calendar';
    document.querySelectorAll('.admin-nav button').forEach(x=>x.classList.toggle('active',x.dataset.view==='calendar'));
    $('date').closest('.toolbar').style.display='grid';
    render();
  }finally{
    adminBusy=false;
    if(button){button.disabled=false;button.textContent=t('manualCreate')}
  }
}

async function loadSlots(){const t=window.ttI18n.t,service=$('service').value,date=$('clientDate').value;$('clientTime').value='';$('slots').innerHTML=`<p>${t('chooseServiceDate')}</p>`;$('availability').textContent='';progress(service?2:1);if(!service||!date)return;$('slots').innerHTML=`<p>${t('checking')}</p>`;try{const r=await fetch(`${API}/rest/v1/rpc/available_appointment_slots`,{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify({p_date:date,p_service:service})});if(!r.ok)throw Error(t('slotsError'));const slots=await r.json(),duration=Number($('service').selectedOptions[0].dataset.duration);if(!slots.length){$('slots').innerHTML=`<p>${t('noSlots')}</p>`;$('availability').textContent=t('chooseOtherDay');return}$('slots').innerHTML=slots.map(s=>`<button type="button" data-time="${esc(String(s.slot_time).slice(0,5))}">${esc(s.label)}</button>`).join('');$('availability').textContent=`${slots.length} ${t('freeSlots')} · ${t('duration')} ${duration>=60?Math.floor(duration/60)+' h ':''}${duration%60?duration%60+' min':''}`}catch(e){$('slots').innerHTML=`<p>${t('cannotCheck')}</p>`;$('availability').textContent=e.message}}
$('openClient').hidden=true;$('openClient').onclick=()=>window.ttClientToken?showOnly('client'):document.getElementById('openAccount').click();$('openAdmin').onclick=()=>token?showAdmin():showOnly('login');document.querySelectorAll('[data-home]').forEach(b=>b.onclick=()=>showOnly('welcome'));$('clientDate').min=localDate();$('service').onchange=loadSlots;$('clientDate').onchange=loadSlots;$('slots').onclick=e=>{const b=e.target.closest('[data-time]');if(!b)return;$('clientTime').value=b.dataset.time;document.querySelectorAll('#slots button').forEach(x=>x.classList.toggle('selected',x===b));progress(3)};
async function uploadClientPhoto(file,code){if(!window.ttClientToken||!window.ttClientUser)throw Error(window.ttI18n.t('loginRequired'));if(!file||file.size>8*1024*1024||!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error(window.ttI18n.t('invalidPhoto'));const ext=file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg',path=`${window.ttClientUser.id}/${code}.${ext}`,safe=path.split('/').map(encodeURIComponent).join('/'),r=await fetch(`${API}/storage/v1/object/booking-photos/${safe}`,{method:'POST',headers:{apikey:KEY,Authorization:`Bearer ${window.ttClientToken}`,'Content-Type':file.type,'x-upsert':'false'},body:file});if(!r.ok)throw Error(window.ttI18n.t('photoUploadError'));return path}
$('bookingForm').onsubmit=async e=>{e.preventDefault();const t=window.ttI18n.t;if(!window.ttClientToken){document.getElementById('openAccount').click();return}if(!$('clientTime').value){$('bookingMsg').textContent=t('chooseTime');return}const btn=$('bookButton'),code=crypto.randomUUID().replaceAll('-','').slice(0,24);btn.disabled=true;btn.textContent=t('uploadingPhoto');try{const path=await uploadClientPhoto($('clientHairPhoto').files[0],code);btn.textContent=t('sending');const r=await fetch(`${API}/rest/v1/rpc/create_appointment_with_photo`,{method:'POST',headers:{apikey:KEY,Authorization:`Bearer ${window.ttClientToken}`,'Content-Type':'application/json'},body:JSON.stringify({p_name:$('clientName').value.trim(),p_phone:$('clientPhone').value.trim(),p_service:$('service').value,p_date:$('clientDate').value,p_time:$('clientTime').value,p_note:$('clientNote').value.trim()||null,p_booking_code:code,p_hair_length:$('clientHairLength').value,p_hair_photo_path:path})});if(!r.ok){const d=await r.json().catch(()=>({}));throw Error(d.message?.includes('slot_unavailable')?t('slotTaken'):t('bookingError'))}$('bookingForm').reset();$('slots').innerHTML=`<p>${t('chooseServiceDate')}</p>`;$('clientTime').value='';progress(1);const channel=window.ttClientUser?.user_metadata?.notification_channel==='telegram'?'telegram':'email';if(channel==='telegram'){const telegramUrl=`https://t.me/${BOT}?start=${encodeURIComponent(code)}`,telegramText=window.ttI18n.language==='ru'?'Заявка отправлена. Откройте Telegram и нажмите Start, чтобы получать уведомления.':'Cererea a fost trimisă. Deschide Telegram și apasă Start pentru a primi notificările.';$('bookingMsg').innerHTML=`${esc(telegramText)} <a href="${telegramUrl}" rel="noopener">Telegram</a>`;setTimeout(()=>{location.href=telegramUrl},900)}else $('bookingMsg').textContent=t('sentToDashboard');window.ttReloadClientBookings?.()}catch(err){$('bookingMsg').textContent=err.message;await loadSlots()}finally{btn.disabled=false;btn.textContent=t('sendRequest')}};
async function photoUrl(path){if(!path)return'';if(photoCache.has(path))return photoCache.get(path);const safe=String(path).split('/').map(encodeURIComponent).join('/'),r=await fetch(`${API}/storage/v1/object/sign/booking-photos/${safe}`,{method:'POST',headers:headers(),body:JSON.stringify({expiresIn:3600})});if(!r.ok)return'';const d=await r.json(),url=d.signedURL?`${API}/storage/v1${d.signedURL}`:'';photoCache.set(path,url);return url}

function money(v){return `${Number(v||0).toFixed(0)} MDL`}
function crmClientAppointments(clientId){return items.filter(a=>a.client_profile_id===clientId).sort((a,b)=>`${b.preferred_date} ${b.preferred_time}`.localeCompare(`${a.preferred_date} ${a.preferred_time}`))}
function crmStats(c){
  const rows=crmClientAppointments(c.id),completed=rows.filter(a=>a.visit_status==='completed');
  const total=completed.reduce((s,a)=>s+Number(a.quoted_price||0),0);
  const now=localDate();
  const next=rows.filter(a=>a.status==='approved'&&(a.visit_status||'scheduled')==='scheduled'&&a.preferred_date>=now).sort((a,b)=>`${a.preferred_date} ${a.preferred_time}`.localeCompare(`${b.preferred_date} ${b.preferred_time}`))[0];
  const last=completed.sort((a,b)=>b.preferred_date.localeCompare(a.preferred_date))[0];
  const counts={};completed.forEach(a=>counts[a.service]=(counts[a.service]||0)+1);
  const favorite=Object.entries(counts).sort((a,b)=>b[1]-a[1])[0]?.[0]||'—';
  return {rows,completed,total,avg:completed.length?total/completed.length:0,next,last,favorite,noShow:rows.filter(a=>a.visit_status==='no_show').length,cancel:rows.filter(a=>a.visit_status==='cancelled'||a.status==='rejected').length};
}
async function loadCrmClients(){
  const r=await fetch(`${API}/rest/v1/clients?select=*&order=updated_at.desc`,{headers:headers()});
  if(!r.ok)throw Error(window.ttI18n.t('crmLoadError'));
  crmClients=await r.json();
}
async function loadCrmDetail(id){
  crmSelected=crmClients.find(c=>c.id===id)||null;
  if(!crmSelected)return;
  const [n,r,p]=await Promise.all([
    fetch(`${API}/rest/v1/client_notes?client_id=eq.${encodeURIComponent(id)}&select=*&order=created_at.desc`,{headers:headers()}),
    fetch(`${API}/rest/v1/client_service_records?client_id=eq.${encodeURIComponent(id)}&select=*&order=created_at.desc`,{headers:headers()}),
    fetch(`${API}/rest/v1/client_photos?client_id=eq.${encodeURIComponent(id)}&select=*&order=created_at.desc`,{headers:headers()})
  ]);
  crmNotes=n.ok?await n.json():[];crmRecords=r.ok?await r.json():[];crmPhotos=p.ok?await p.json():[];
  crmPhotos=await Promise.all(crmPhotos.map(async x=>({...x,url:await photoUrl(x.storage_path)})));
}
function crmClientCard(c){
  const s=crmStats(c);
  return `<article class="crm-client-card" data-crm-client="${esc(c.id)}"><h3>${esc(c.full_name)} ${c.vip?'⭐':''}</h3><div class="crm-phone">${esc(c.phone||'—')}</div><div class="crm-chips"><span class="crm-chip">${s.completed.length} ${esc(window.ttI18n.t('crmVisits').toLowerCase())}</span><span class="crm-chip">${esc(money(s.total))}</span>${c.vip?`<span class="crm-chip vip">VIP</span>`:''}${s.next?`<span class="crm-chip">${esc(s.next.preferred_date)} · ${esc(String(s.next.preferred_time).slice(0,5))}</span>`:''}</div></article>`;
}
function crmListHtml(){
  const t=window.ttI18n.t;
  return `<div class="crm-head"><div><h2>${esc(t('crmTitle'))}</h2><p>${esc(t('crmLead'))}</p></div><input id="crmSearch" class="crm-search" type="search" placeholder="${esc(t('crmSearch'))}"></div><div id="crmClientList" class="crm-list">${crmClients.length?crmClients.map(crmClientCard).join(''):`<div class="empty">${esc(t('crmNoClients'))}</div>`}</div>`;
}
function crmHistoryHtml(c){
  const t=window.ttI18n.t,rows=crmClientAppointments(c.id);
  if(!rows.length)return `<div class="crm-empty">${esc(t('crmNoHistory'))}</div>`;
  return rows.map(a=>{const status=a.visit_status||'scheduled';const label=status==='completed'?t('crmCompleted'):status==='no_show'?t('crmNoShowStatus'):status==='cancelled'?t('crmCancelled'):t('crmScheduled');return `<div class="crm-history-row"><div class="top"><span>${esc(a.preferred_date)} · ${esc(String(a.preferred_time).slice(0,5))}</span><span>${esc(label)}</span></div><div class="sub">${esc(a.service)} · ${esc(formatDuration(a.duration_minutes||60))} · ${esc(a.quoted_price?money(a.quoted_price):'—')}</div><div class="crm-history-actions">${status!=='completed'?`<button data-visit-status="${esc(a.id)}" data-status="completed">${esc(t('crmMarkCompleted'))}</button>`:''}${status!=='no_show'?`<button data-visit-status="${esc(a.id)}" data-status="no_show">${esc(t('crmMarkNoShow'))}</button>`:''}${status!=='cancelled'?`<button class="reject" data-visit-status="${esc(a.id)}" data-status="cancelled">${esc(t('crmMarkCancelled'))}</button>`:''}</div></div>`}).join('');
}
function crmNotesHtml(){
  const t=window.ttI18n.t;
  return `<div class="crm-box"><h3>${esc(t('crmAddNote'))}</h3><textarea id="crmNewNote" rows="3" placeholder="${esc(t('crmNotePlaceholder'))}"></textarea><button type="button" id="crmAddNoteBtn">${esc(t('crmAdd'))}</button></div><div class="crm-box">${crmNotes.length?crmNotes.map(n=>`<div class="crm-note">${esc(n.note)}<small>${esc(new Date(n.created_at).toLocaleString())}</small></div>`).join(''):`<div class="crm-empty">${esc(t('crmNoNotes'))}</div>`}</div>`;
}
function crmPhotosHtml(){
  const t=window.ttI18n.t;
  const gallery=crmPhotos.length?`<div class="crm-photo-grid">${crmPhotos.map(p=>`<a class="crm-photo" href="${esc(p.url||'#')}" target="_blank"><img src="${esc(p.url||'')}" alt=""><span>${esc(p.photo_type==='before'?t('crmBefore'):p.photo_type==='after'?t('crmAfter'):t('crmOther'))}${p.caption?` · ${esc(p.caption)}`:''}</span></a>`).join('')}</div>`:`<div class="crm-empty">${esc(t('crmNoPhotos'))}</div>`;
  return `<div class="crm-box"><div class="crm-upload-line"><label>${esc(t('crmPhotos'))}<select id="crmPhotoType"><option value="before">${esc(t('crmBefore'))}</option><option value="after">${esc(t('crmAfter'))}</option><option value="other">${esc(t('crmOther'))}</option></select></label><label>Descriere<input id="crmPhotoCaption"></label><label>Fișier<input id="crmPhotoFile" type="file" accept="image/jpeg,image/png,image/webp"></label><button type="button" id="crmUploadPhotoBtn">${esc(t('crmUploadPhoto'))}</button></div></div><div class="crm-box">${gallery}</div>`;
}
function crmRecordsHtml(){
  const t=window.ttI18n.t;
  const records=crmRecords.length?crmRecords.map(r=>`<div class="crm-tech-record"><b>${esc(r.service)}</b><div class="sub">${r.technique?`${esc(t('crmTechnique'))}: ${esc(r.technique)}<br>`:''}${r.color_formula?`${esc(t('crmFormula'))}: ${esc(r.color_formula)}<br>`:''}${r.oxidant?`${esc(t('crmOxidant'))}: ${esc(r.oxidant)}<br>`:''}${r.products?`${esc(t('crmProducts'))}: ${esc(r.products)}<br>`:''}${r.result_note?`${esc(t('crmResult'))}: ${esc(r.result_note)}`:''}</div></div>`).join(''):`<div class="crm-empty">${esc(t('crmNoRecords'))}</div>`;
  const serviceOptions=$('service')?.innerHTML||'';
  return `<div class="crm-box"><div class="crm-form-grid"><label class="wide">Serviciu<select id="crmRecordService">${serviceOptions}</select></label><label>${esc(t('crmTechnique'))}<input id="crmRecordTechnique"></label><label>${esc(t('crmFormula'))}<input id="crmRecordFormula"></label><label>${esc(t('crmOxidant'))}<input id="crmRecordOxidant"></label><label>${esc(t('crmProducts'))}<input id="crmRecordProducts"></label><label class="wide">${esc(t('crmResult'))}<textarea id="crmRecordResult" rows="2"></textarea></label></div><button type="button" id="crmAddRecordBtn">${esc(t('crmAddRecord'))}</button></div><div class="crm-box">${records}</div>`;
}
function crmProfileHtml(c){
  const t=window.ttI18n.t,s=crmStats(c);
  const tabBody=crmTab==='notes'?crmNotesHtml():crmTab==='photos'?crmPhotosHtml():crmTab==='records'?crmRecordsHtml():`<div class="crm-box">${crmHistoryHtml(c)}</div>`;
  return `<div class="crm-profile-top"><div><button type="button" data-crm-back>← ${esc(t('crmBack'))}</button><h2>${esc(c.full_name)} ${c.vip?'⭐':''}</h2><div class="detail"><a href="tel:${esc(c.phone||'')}">${esc(c.phone||'—')}</a>${c.email?` · ${esc(c.email)}`:''}</div></div><div class="crm-profile-actions"><button type="button" data-crm-new-booking="${esc(c.id)}">${esc(t('crmNewBooking'))}</button><button type="button" data-crm-rebook="${esc(c.id)}">${esc(t('crmRebook'))}</button></div></div>
  <div class="crm-stats"><div class="crm-stat"><b>${s.completed.length}</b><span>${esc(t('crmVisits'))}</span></div><div class="crm-stat"><b>${esc(money(s.total))}</b><span>${esc(t('crmSpent'))}</span></div><div class="crm-stat"><b>${esc(money(s.avg))}</b><span>${esc(t('crmAverage'))}</span></div><div class="crm-stat"><b>${s.noShow}</b><span>${esc(t('crmNoShow'))}</span></div><div class="crm-stat"><b>${s.cancel}</b><span>${esc(t('crmCancellations'))}</span></div><div class="crm-stat"><b>${esc(s.favorite)}</b><span>${esc(t('crmFavorite'))}</span></div><div class="crm-stat"><b>${s.last?esc(s.last.preferred_date):'—'}</b><span>${esc(t('crmLastVisit'))}</span></div><div class="crm-stat"><b>${s.next?`${esc(s.next.preferred_date)} ${esc(String(s.next.preferred_time).slice(0,5))}`:'—'}</b><span>${esc(t('crmNextVisit'))}</span></div></div>
  <div class="crm-layout"><div>
    <div class="crm-box"><h3>Profil</h3><div class="crm-form-grid"><label class="wide">Nume<input id="crmFullName" value="${esc(c.full_name||'')}"></label><label>${esc(t('crmPhone'))}<input id="crmPhone" value="${esc(c.phone||'')}"></label><label>${esc(t('crmEmail'))}<input id="crmEmail" type="email" value="${esc(c.email||'')}"></label><label>${esc(t('crmBirthday'))}<input id="crmBirthday" type="date" value="${esc(c.birthday||'')}"></label><label>${esc(t('crmNotifications'))}<select id="crmNotifications"><option value="phone" ${c.notification_preference==='phone'?'selected':''}>${esc(t('crmNotificationPhone'))}</option><option value="telegram" ${c.notification_preference==='telegram'?'selected':''}>${esc(t('crmNotificationTelegram'))}</option><option value="email" ${c.notification_preference==='email'?'selected':''}>${esc(t('crmNotificationEmail'))}</option></select></label><label>${esc(t('crmPoints'))}<input id="crmPoints" type="number" min="0" value="${Number(c.loyalty_points||0)}"></label><label style="display:flex;align-items:center;gap:8px;margin-top:24px"><input id="crmVip" type="checkbox" ${c.vip?'checked':''} style="width:auto"> ${esc(t('crmVip'))}</label><label class="wide">${esc(t('crmInternalNote'))}<textarea id="crmInternalNote" rows="3">${esc(c.internal_note||'')}</textarea></label></div><button type="button" id="crmSaveProfileBtn">${esc(t('crmSaveProfile'))}</button></div>
  </div><div><div class="crm-tabs"><button data-crm-tab="history" class="${crmTab==='history'?'active':''}">${esc(t('crmHistory'))}</button><button data-crm-tab="notes" class="${crmTab==='notes'?'active':''}">${esc(t('crmNotes'))}</button><button data-crm-tab="photos" class="${crmTab==='photos'?'active':''}">${esc(t('crmPhotos'))}</button><button data-crm-tab="records" class="${crmTab==='records'?'active':''}">${esc(t('crmColorHistory'))}</button></div>${tabBody}</div></div>`;
}
async function saveCrmProfile(){
  const t=window.ttI18n.t;if(!crmSelected)return;
  const body={full_name:$('crmFullName').value.trim(),phone:$('crmPhone').value.trim()||null,phone_normalized:$('crmPhone').value.replace(/\D/g,'')||null,email:$('crmEmail').value.trim()||null,birthday:$('crmBirthday').value||null,notification_preference:$('crmNotifications').value,loyalty_points:Number($('crmPoints').value||0),vip:$('crmVip').checked,internal_note:$('crmInternalNote').value.trim()||null,updated_at:new Date().toISOString()};
  const r=await fetch(`${API}/rest/v1/clients?id=eq.${encodeURIComponent(crmSelected.id)}`,{method:'PATCH',headers:{...headers(),Prefer:'return=representation'},body:JSON.stringify(body)});
  if(!r.ok)throw Error(await r.text());
  const rows=await r.json();crmSelected=rows[0];crmClients=crmClients.map(c=>c.id===crmSelected.id?crmSelected:c);$('status').textContent=t('crmProfileSaved');render();
}
async function addCrmNote(){
  if(!crmSelected)return;const note=$('crmNewNote').value.trim();if(!note)return;
  const r=await fetch(`${API}/rest/v1/client_notes`,{method:'POST',headers:{...headers(),Prefer:'return=representation'},body:JSON.stringify({client_id:crmSelected.id,note})});
  if(!r.ok)throw Error(await r.text());await loadCrmDetail(crmSelected.id);render();
}
async function addCrmRecord(){
  if(!crmSelected)return;const service=$('crmRecordService').value;if(!service)return;
  const body={client_id:crmSelected.id,service,technique:$('crmRecordTechnique').value.trim()||null,color_formula:$('crmRecordFormula').value.trim()||null,oxidant:$('crmRecordOxidant').value.trim()||null,products:$('crmRecordProducts').value.trim()||null,result_note:$('crmRecordResult').value.trim()||null};
  const r=await fetch(`${API}/rest/v1/client_service_records`,{method:'POST',headers:{...headers(),Prefer:'return=representation'},body:JSON.stringify(body)});
  if(!r.ok)throw Error(await r.text());await loadCrmDetail(crmSelected.id);render();
}
async function uploadCrmPhoto(){
  const t=window.ttI18n.t;if(!crmSelected)return;
  const file=$('crmPhotoFile').files[0];if(!file||file.size>8*1024*1024||!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error(t('crmPhotoError'));
  const ext=file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg',path=`crm/${crmSelected.id}/${crypto.randomUUID()}.${ext}`,safe=path.split('/').map(encodeURIComponent).join('/');
  const up=await fetch(`${API}/storage/v1/object/booking-photos/${safe}`,{method:'POST',headers:{apikey:KEY,Authorization:`Bearer ${token}`,'Content-Type':file.type,'x-upsert':'false'},body:file});
  if(!up.ok)throw Error(t('crmPhotoError'));
  const r=await fetch(`${API}/rest/v1/client_photos`,{method:'POST',headers:{...headers(),Prefer:'return=representation'},body:JSON.stringify({client_id:crmSelected.id,photo_type:$('crmPhotoType').value,storage_path:path,caption:$('crmPhotoCaption').value.trim()||null})});
  if(!r.ok)throw Error(await r.text());photoCache.delete(path);await loadCrmDetail(crmSelected.id);render();
}
async function updateVisitStatus(id,status){
  const body={visit_status:status,completed_at:status==='completed'?new Date().toISOString():null};
  const r=await fetch(`${API}/rest/v1/appointments?id=eq.${encodeURIComponent(id)}`,{method:'PATCH',headers:{...headers(),Prefer:'return=representation'},body:JSON.stringify(body)});
  if(!r.ok)throw Error(await r.text());
  const rows=await r.json();if(rows[0])items=items.map(a=>a.id===id?{...a,...rows[0]}:a);
  $('status').textContent=window.ttI18n.t('crmAppointmentUpdated');render();
}
function prefillManualFromClient(c,last=null){
  view='manual';document.querySelectorAll('.admin-nav button').forEach(x=>x.classList.toggle('active',x.dataset.view==='manual'));$('date').closest('.toolbar').style.display='none';render();
  setTimeout(()=>{if($('manualName'))$('manualName').value=c.full_name||'';if($('manualPhone'))$('manualPhone').value=c.phone||'';if(last&&$('manualService')){$('manualService').value=last.service||'';$('manualHairLength').value=last.hair_length||'';$('manualPrice').value=last.quoted_price||''}},0);
}

function card(a){const pending=a.status==='pending',price=a.quoted_price?`${Number(a.quoted_price).toFixed(0)} MDL`:'Preț nestabilit',notification=a.notification_channel==='telegram'?'Telegram':a.notification_channel==='phone'?'Telefon':'Email',photo=a.hair_photo_url?`<a href="${esc(a.hair_photo_url)}" target="_blank"><img class="booking-photo" src="${esc(a.hair_photo_url)}" alt="Fotografia părului"></a>`:'<p class="detail">Fotografie indisponibilă</p>';return `<article class="card"><div class="time">${esc(String(a.preferred_time).slice(0,5))}</div><span class="status ${esc(a.status)}">${a.status==='approved'?'Confirmată':a.status==='rejected'?'Refuzată':'În așteptare'}</span><h2>${esc(a.name)}</h2><div class="detail">${esc(a.service)} · ${formatDuration(a.duration_minutes||60)}<br>Email: ${esc(a.client_email||'Nespecificat')}<br><a href="tel:${esc(a.phone)}">${esc(a.phone)}</a><br>Notificare: ${notification}<br>Lungimea părului: ${esc(a.hair_length||'Nespecificată')}<br>Preț: ${esc(price)}${a.note?`<br>${esc(a.note)}`:''}</div>${photo}${pending?`<label class="price-label">Preț estimat (MDL)<input type="number" min="1" step="1" data-price-for="${esc(a.id)}" value="${a.quoted_price??''}" placeholder="Ex.: 850"></label><div class="actions"><button data-id="${esc(a.id)}" data-action="approved">Salvează și aprobă</button><button class="reject" data-id="${esc(a.id)}" data-action="rejected">Refuză</button></div>`:''}</article>`}
function reviewCard(r){return `<article class="card"><div class="time">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</div><h2>${esc(r.name)}</h2><p class="detail">${esc(r.message)}</p>${r.status==='pending'?`<div class="actions"><button data-review="${esc(r.id)}" data-review-action="approve">Publică</button><button class="reject" data-review="${esc(r.id)}" data-review-action="delete">Șterge</button></div>`:'<span class="status approved">Publicată</span>'}</article>`}
function render(){
  if(view==='clients'){
    $('content').innerHTML=crmSelected?crmProfileHtml(crmSelected):crmListHtml();
    $('badge').textContent=items.filter(x=>x.status==='pending').length;
    $('reviewsBadge').textContent=reviews.filter(x=>x.status==='pending').length;
    window.ttI18n.apply();
    return;
  }
  if(view==='manual'){
    $('content').innerHTML=manualFormHtml();
    $('badge').textContent=items.filter(x=>x.status==='pending').length;
    $('reviewsBadge').textContent=reviews.filter(x=>x.status==='pending').length;
    window.ttI18n.apply();
    return;
  }
  if(view==='reviews'){
    const pending=reviews.filter(x=>x.status==='pending'),approved=reviews.filter(x=>x.status==='approved');
    $('content').innerHTML=`<h2>Recenzii în așteptare</h2>${pending.length?`<div class="cards">${pending.map(reviewCard).join('')}</div>`:'<div class="empty">Nu există recenzii în așteptare.</div>'}<h2>Recenzii publicate</h2>${approved.length?`<div class="cards">${approved.map(reviewCard).join('')}</div>`:'<div class="empty">Nu există recenzii publicate.</div>'}`;
    $('reviewsBadge').textContent=pending.length;
    $('badge').textContent=items.filter(x=>x.status==='pending').length;
    return;
  }
  const date=$('date').value;
  let rows=view==='pending'?items.filter(x=>x.status==='pending'):items.filter(x=>x.preferred_date===date&&x.status!=='rejected');
  rows.sort((a,b)=>String(a.preferred_time).localeCompare(String(b.preferred_time)));
  $('content').innerHTML=rows.length?`<div class="cards">${rows.map(card).join('')}</div>`:'<div class="empty">Nu există programări aici.</div>';
  $('badge').textContent=items.filter(x=>x.status==='pending').length;
  $('reviewsBadge').textContent=reviews.filter(x=>x.status==='pending').length;
}
async function load(silent=false){if(!silent)$('status').textContent='Se încarcă…';const [a,r]=await Promise.all([fetch(`${API}/rest/v1/appointments?select=*&order=preferred_date.asc,preferred_time.asc`,{headers:headers()}),fetch(`${API}/rest/v1/reviews?select=*&order=created_at.desc`,{headers:headers()})]);if(!a.ok||!r.ok)throw Error('Nu am putut încărca panoul.');items=await a.json();reviews=await r.json();items=await Promise.all(items.map(async x=>({...x,hair_photo_url:await photoUrl(x.hair_photo_path)})));if(!silent)$('status').textContent='';if(!(silent&&view==='manual'))render();else{$('badge').textContent=items.filter(x=>x.status==='pending').length;$('reviewsBadge').textContent=reviews.filter(x=>x.status==='pending').length}}
async function decide(id,action,price=null){adminBusy=true;try{$('status').textContent=action==='approved'?'Se aprobă și se trimite notificarea…':'Se refuză și se trimite notificarea…';const r=await fetch(`${API}/functions/v1/handle-appointment`,{method:'POST',headers:headers(),body:JSON.stringify({booking_id:id,action,quoted_price:price})}),d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.error||'Acțiunea nu a reușit.');await load(true);$('status').textContent=d.warning||(action==='approved'?'Programarea a fost aprobată și clienta a fost notificată.':'Programarea a fost refuzată și clienta a fost notificată.')}finally{adminBusy=false}}
async function decideReview(id,action){adminBusy=true;try{const r=action==='approve'?await fetch(`${API}/rest/v1/reviews?id=eq.${encodeURIComponent(id)}`,{method:'PATCH',headers:headers(),body:JSON.stringify({status:'approved',approved_at:new Date().toISOString()})}):await fetch(`${API}/rest/v1/reviews?id=eq.${encodeURIComponent(id)}`,{method:'DELETE',headers:headers()});if(!r.ok)throw Error('Recenzia nu a putut fi actualizată.');await load()}finally{adminBusy=false}}
function showAdmin(){showOnly('adminApp');$('date').value=localDate();view='manual';document.querySelectorAll('.admin-nav button').forEach(x=>x.classList.toggle('active',x.dataset.view==='manual'));$('date').closest('.toolbar').style.display='none';load().catch(e=>$('status').textContent=e.message);clearInterval(adminRefreshTimer);adminRefreshTimer=setInterval(()=>{const editing=document.activeElement?.matches?.('[data-price-for],#manualPrice,#manualName,#manualPhone,#manualService,#manualHairLength,#manualDate');if(view!=='manual'&&!editing&&!adminBusy&&!document.hidden)load(true).catch(()=>{})},30000)}
async function exportSelectedDayPdf(){const date=$('date').value,rows=items.filter(x=>x.preferred_date===date&&x.status!=='rejected').sort((a,b)=>String(a.preferred_time).localeCompare(String(b.preferred_time))),button=$('downloadPdf');if(!rows.length){$('status').textContent='Nu există programări pentru ziua selectată.';return}if(!window.TTPdf){$('status').textContent='Modulul PDF nu este disponibil. Reîncarcă aplicația.';return}adminBusy=true;button.disabled=true;button.textContent='Se pregătește PDF-ul…';$('status').textContent='Se încarcă fotografiile și se creează PDF-ul…';try{await window.TTPdf.downloadDailyAppointments(date,rows);$('status').textContent='PDF-ul a fost pregătit.'}catch(error){if(error?.name==='AbortError')$('status').textContent='Salvarea PDF-ului a fost anulată.';else $('status').textContent=error?.message||'PDF-ul nu a putut fi creat.'}finally{adminBusy=false;button.disabled=false;button.textContent='Descarcă PDF cu fotografii'}}
$('loginForm').onsubmit=async e=>{e.preventDefault();const email=$('email').value.trim().toLowerCase();if(email!==ADMIN){$('loginMsg').textContent='Acest email nu are acces.';return}const r=await fetch(`${API}/auth/v1/token?grant_type=password`,{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify({email,password:$('password').value})}),d=await r.json();if(!r.ok){$('loginMsg').textContent='Email sau parolă incorectă.';return}token=d.access_token;sessionStorage.setItem('tt_app_token',token);showAdmin()};document.querySelector('.admin-nav').onclick=async e=>{const b=e.target.closest('[data-view]');if(!b)return;view=b.dataset.view;document.querySelectorAll('.admin-nav button').forEach(x=>x.classList.toggle('active',x===b));$('date').closest('.toolbar').style.display=view==='calendar'?'grid':'none';if(view==='clients'){crmSelected=null;crmTab='history';try{await loadCrmClients()}catch(error){$('status').textContent=error.message}}render()};$('date').onchange=render;$('downloadPdf').onclick=exportSelectedDayPdf;$('prev').onclick=()=>{const d=new Date($('date').value+'T12:00:00');d.setDate(d.getDate()-1);$('date').value=localDate(d);render()};$('next').onclick=()=>{const d=new Date($('date').value+'T12:00:00');d.setDate(d.getDate()+1);$('date').value=localDate(d);render()};$('content').onclick=e=>{
const clientCard=e.target.closest('[data-crm-client]');
if(clientCard){loadCrmDetail(clientCard.dataset.crmClient).then(()=>{crmTab='history';render()}).catch(error=>{$('status').textContent=error.message});return}
if(e.target.closest('[data-crm-back]')){crmSelected=null;crmTab='history';render();return}
const tab=e.target.closest('[data-crm-tab]');if(tab){crmTab=tab.dataset.crmTab;render();return}
if(e.target.closest('#crmSaveProfileBtn')){saveCrmProfile().catch(error=>{$('status').textContent=error.message});return}
if(e.target.closest('#crmAddNoteBtn')){addCrmNote().catch(error=>{$('status').textContent=error.message});return}
if(e.target.closest('#crmAddRecordBtn')){addCrmRecord().catch(error=>{$('status').textContent=error.message});return}
if(e.target.closest('#crmUploadPhotoBtn')){uploadCrmPhoto().catch(error=>{$('status').textContent=error.message});return}
const visit=e.target.closest('[data-visit-status]');if(visit){updateVisitStatus(visit.dataset.visitStatus,visit.dataset.status).catch(error=>{$('status').textContent=error.message});return}
const nb=e.target.closest('[data-crm-new-booking]');if(nb&&crmSelected){prefillManualFromClient(crmSelected);return}
const rb=e.target.closest('[data-crm-rebook]');if(rb&&crmSelected){const last=crmClientAppointments(crmSelected.id)[0]||null;prefillManualFromClient(crmSelected,last);return}

  const manualTime=e.target.closest('[data-manual-time]');
  if(manualTime){
    e.preventDefault();
    e.stopImmediatePropagation?.();
    e.stopPropagation();
    const selected=manualTime.dataset.manualTime;
    $('manualTime').value=selected;
    document.querySelectorAll('#manualSlots button').forEach(x=>x.classList.toggle('selected',x===manualTime));
    $('manualAvailability').textContent=`Ora selectată: ${selected}`;
    return false;
  }

  const manualCreate=e.target.closest('#manualCreateBtn');
  if(manualCreate){
    e.preventDefault();
    e.stopImmediatePropagation?.();
    e.stopPropagation();
    createManualAppointment().catch(error=>{$('status').textContent=error.message});
    return false;
  }

  const booking=e.target.closest('[data-id]'),review=e.target.closest('[data-review]');
  if(booking){
    const id=booking.dataset.id,action=booking.dataset.action,input=document.querySelector(`[data-price-for="${id}"]`),price=input?.value?Number(input.value):null;
    if(action==='approved'&&(!price||price<1)){$('status').textContent='Introdu prețul înainte de aprobare.';input?.focus();return}
    decide(id,action,price).catch(x=>$('status').textContent=x.message)
  }
  if(review)decideReview(review.dataset.review,review.dataset.reviewAction).catch(x=>$('status').textContent=x.message)
};$('content').onchange=e=>{if(e.target?.id==='manualService'||e.target?.id==='manualDate')loadManualSlots()};
$('content').onpointerdown=e=>{
  const manualTime=e.target.closest?.('[data-manual-time]');
  if(!manualTime)return;
  e.preventDefault();
  const selected=manualTime.dataset.manualTime;
  if($('manualTime'))$('manualTime').value=selected;
  document.querySelectorAll('#manualSlots button').forEach(x=>x.classList.toggle('selected',x===manualTime));
  if($('manualAvailability'))$('manualAvailability').textContent=`Ora selectată: ${selected}`;
};
$('content').oninput=e=>{if(e.target?.id==='crmSearch'){const q=e.target.value.trim().toLowerCase();document.querySelectorAll('[data-crm-client]').forEach(card=>{const c=crmClients.find(x=>x.id===card.dataset.crmClient),hay=`${c?.full_name||''} ${c?.phone||''}`.toLowerCase();card.style.display=!q||hay.includes(q)?'':'none'})}};
$('logout').onclick=()=>{clearInterval(adminRefreshTimer);sessionStorage.removeItem('tt_app_token');token=null;showOnly('welcome')};if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js');
