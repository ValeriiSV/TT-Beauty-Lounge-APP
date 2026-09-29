
(function(){
  function avatarMarkup(){
    return '<div class="tt-auth-brand"><b>TT</b><span>Beauty Lounge</span></div>'+
      '<span class="tt-auth-spark s1"></span><span class="tt-auth-spark s2"></span><span class="tt-auth-spark s3"></span>'+
      '<div class="tt-auth-avatar-wrap" aria-hidden="true">'+
      '<svg class="tt-auth-avatar" viewBox="0 0 240 420" role="img" aria-label="Personaj decorativ TT Beauty">'+
      '<ellipse cx="120" cy="395" rx="52" ry="9" fill="rgba(0,0,0,.12)"/>'+
      '<g class="tt-leg-left"><rect x="93" y="255" width="24" height="112" rx="12" fill="#2f2927"/><path d="M91 361h34c3 0 6 2 7 5l4 12H86l5-17z" fill="#211915"/></g>'+
      '<g class="tt-leg-right"><rect x="124" y="255" width="24" height="112" rx="12" fill="#3b3330"/><path d="M121 361h35c4 0 7 2 8 6l3 11h-51l5-17z" fill="#211915"/></g>'+
      '<path d="M78 142c7-31 25-47 42-47 22 0 40 18 44 49l8 118c-33 19-72 19-104 0l10-120z" fill="#f6e9dc"/>'+
      '<path d="M82 151c15 15 62 15 78-2l10 82H70l12-80z" fill="#b76d73" opacity=".95"/>'+
      '<g class="tt-arm-left"><rect x="55" y="151" width="22" height="112" rx="11" fill="#f0c9b1"/><circle cx="65" cy="263" r="11" fill="#f0c9b1"/></g>'+
      '<g class="tt-arm-right"><rect x="163" y="151" width="22" height="112" rx="11" fill="#f0c9b1"/><circle cx="174" cy="263" r="11" fill="#f0c9b1"/></g>'+
      '<circle cx="121" cy="76" r="43" fill="#f0c9b1"/>'+
      '<path d="M82 74c0-39 25-59 49-54 24 5 37 29 31 62-10-18-28-27-49-27-12 0-22 7-31 19z" fill="#4b2f2b"/>'+
      '<path d="M82 74c-3 33 11 51 25 61-24-4-39-24-36-48 1-11 5-19 11-25v12z" fill="#4b2f2b"/>'+
      '<circle cx="106" cy="80" r="3.5" fill="#3a2926"/><circle cx="137" cy="80" r="3.5" fill="#3a2926"/>'+
      '<path d="M111 101c8 6 16 6 23 0" fill="none" stroke="#a65e60" stroke-width="3" stroke-linecap="round"/>'+
      '<path d="M97 70c6-5 12-6 18-3M130 67c6-2 12 0 16 4" fill="none" stroke="#4b2f2b" stroke-width="3" stroke-linecap="round"/>'+
      '<circle cx="121" cy="139" r="8" fill="#c9a05e"/>'+
      '</svg></div><div class="tt-auth-case" aria-hidden="true"></div>';
  }
  function enhance(target, host){
    if(!target || target.dataset.ttCinematic==="1") return;
    target.dataset.ttCinematic="1";
    (host||target).classList.add("tt-auth-cinematic");
    var panel=document.createElement("div");
    panel.className="tt-auth-panel";
    while(target.firstChild) panel.appendChild(target.firstChild);
    var scene=document.createElement("div");
    scene.className="tt-auth-scene";
    scene.innerHTML=avatarMarkup();
    var layout=document.createElement("div");
    layout.className="tt-auth-layout";
    layout.appendChild(scene);
    layout.appendChild(panel);
    target.appendChild(layout);
    function replay(){
      var root=host||target;
      root.classList.add("tt-auth-replay");
      root.classList.remove("tt-auth-run");
      void root.offsetWidth;
      root.classList.add("tt-auth-run");
      setTimeout(function(){root.classList.remove("tt-auth-replay","tt-auth-run")},1900);
    }
    panel.addEventListener("click",function(e){
      if(e.target.closest("[data-auth-mode], [data-auth]")) setTimeout(replay,30);
    });
  }
  function boot(){
    var siteLoggedOut=document.getElementById("clientAuthLoggedOut");
    var siteCard=document.getElementById("clientAuthCard");
    if(siteLoggedOut) enhance(siteLoggedOut,siteCard);
    var appAuth=document.getElementById("clientAuth");
    if(appAuth && !siteLoggedOut) enhance(appAuth,appAuth);
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot);
  else boot();
  setTimeout(boot,300);
})();
