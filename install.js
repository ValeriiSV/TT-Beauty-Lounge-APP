
let installPrompt=null;
const installButton=document.getElementById('installApp');
const installGuide=document.getElementById('installGuide');
const installSteps=document.getElementById('installSteps');

const ua=navigator.userAgent||'';
const isIOS=/iPad|iPhone|iPod/.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const isStandalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;

function closeInstallGuide(){installGuide.hidden=true}
function markInstalled(){
  installButton.hidden=true;
  installButton.disabled=true;
  installButton.dataset.installed='true';
}
function showInstallGuide(){
  const t=window.ttI18n.t;
  if(isIOS){
    installSteps.innerHTML=`
      <div class="ios-install-visual">
        <div class="ios-step"><span class="ios-step-icon">1</span><div><b>${t('iosStep1Title')}</b><p>${t('iosStep1Text')}</p></div></div>
        <div class="ios-step"><span class="ios-share-icon" aria-hidden="true">⇧</span><div><b>${t('iosStep2Title')}</b><p>${t('iosStep2Text')}</p></div></div>
        <div class="ios-step"><span class="ios-home-icon" aria-hidden="true">＋</span><div><b>${t('iosStep3Title')}</b><p>${t('iosStep3Text')}</p></div></div>
      </div>
      <p class="ios-install-note">${t('iosInstallNote')}</p>`;
  }else{
    installSteps.innerHTML=window.ttI18n.t('androidInstall');
  }
  installGuide.hidden=false;
}

window.addEventListener('beforeinstallprompt',event=>{
  event.preventDefault();
  installPrompt=event;
  if(!isStandalone())installButton.hidden=false;
});

window.addEventListener('appinstalled',()=>{
  installPrompt=null;
  markInstalled();
  closeInstallGuide();
});

installButton.onclick=async()=>{
  if(isStandalone()){markInstalled();return}
  if(installPrompt){
    const prompt=installPrompt;
    installPrompt=null;
    await prompt.prompt();
    const choice=await prompt.userChoice.catch(()=>null);
    if(choice?.outcome==='accepted')markInstalled();
    return;
  }
  // iOS/iPadOS does not expose a browser API that can add a PWA
  // to the Home Screen automatically. We therefore open the shortest
  // possible system-guided flow.
  showInstallGuide();
};

document.getElementById('closeInstall').onclick=closeInstallGuide;
document.getElementById('understoodInstall').onclick=closeInstallGuide;
installGuide.onclick=event=>{if(event.target===installGuide)closeInstallGuide()};

if(isStandalone())markInstalled();
else installButton.hidden=false;
