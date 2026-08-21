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
