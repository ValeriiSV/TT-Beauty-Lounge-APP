(()=>{
  const API='https://azfacbrdujwadnsoasnz.supabase.co';
  const KEY='sb_publishable_AwJd2SUhBwiL3OMaGGhkQw_j2kycR6X';
  const getToken=()=>sessionStorage.getItem('tt_app_token');
  const headers=()=>({apikey:KEY,Authorization:`Bearer ${getToken()}`,'Content-Type':'application/json'});

  async function deleteAppointment(id,name){
    if(!id)return;
    const ok=confirm(`Ștergi definitiv programarea${name?` pentru ${name}`:''}?\n\nAcțiunea nu poate fi anulată.`);
    if(!ok)return;
    const status=document.getElementById('status');
    if(status)status.textContent='Se șterge programarea…';
    const r=await fetch(`${API}/rest/v1/appointments?id=eq.${encodeURIComponent(id)}`,{method:'DELETE',headers:headers()});
    if(!r.ok){
      const msg=await r.text().catch(()=>"");
      if(status)status.textContent='Programarea nu a putut fi ștearsă.';
      throw new Error(msg||'delete_failed');
    }
    try{if(typeof load==='function')await load(true);}catch{}
    try{if(typeof render==='function')render();}catch{}
    if(status)status.textContent='Programarea a fost ștearsă definitiv.';
  }

  function enhanceCardHtml(original){
    return function(a){
      const html=original(a);
      if(!a?.id)return html;
      const btn=`<button class="reject tt-delete-booking" data-delete-appointment="${String(a.id).replace(/"/g,'&quot;')}" data-delete-name="${String(a.name||'').replace(/"/g,'&quot;')}">Șterge</button>`;
      if(html.includes('</div></article>')&&html.includes('class="actions"')){
        return html.replace(/<\/div><\/article>$/,`${btn}</div></article>`);
      }
      return html.replace('</article>',`<div class="actions tt-delete-actions">${btn}</div></article>`);
    }
  }

  try{
    if(typeof card==='function'&&!card.__ttDeleteWrapped){
      const wrapped=enhanceCardHtml(card);
      wrapped.__ttDeleteWrapped=true;
      card=wrapped;
    }
  }catch(e){console.warn('TT delete wrapper',e)}

  document.addEventListener('click',async e=>{
    const b=e.target.closest('[data-delete-appointment]');
    if(!b)return;
    e.preventDefault();e.stopPropagation();
    b.disabled=true;
    try{await deleteAppointment(b.dataset.deleteAppointment,b.dataset.deleteName);}catch(err){console.error(err);alert('Nu am putut șterge programarea. Încearcă din nou.');}finally{b.disabled=false;}
  },true);

  const refresh=()=>{try{if(typeof render==='function'&&!document.getElementById('adminApp')?.hidden)render();}catch{}};
  setTimeout(refresh,250);
  window.TTAdminDeleteAppointment=deleteAppointment;
})();
