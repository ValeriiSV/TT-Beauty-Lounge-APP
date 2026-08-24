(() => {
  const API = 'https://azfacbrdujwadnsoasnz.supabase.co';
  const KEY = 'sb_publishable_AwJd2SUhBwiL3OMaGGhkQw_j2kycR6X';
  const ADMIN_EMAIL = 'valerkasvetlicenco@icloud.com';
  const redirectUrl = 'https://ttbeautylounge-app.pages.dev/';

  const byId = id => document.getElementById(id);
  const recoveryParams = new URLSearchParams(location.hash.replace(/^#/, ''));
  const recoveryToken = recoveryParams.get('access_token');
  const isRecovery = recoveryParams.get('type') === 'recovery' && !!recoveryToken;

  function setMessage(element, text) {
    if (element) element.textContent = text;
  }

  async function sendRecovery(email, messageElement) {
    if (!email) {
      setMessage(messageElement, 'Introdu adresa de email.');
      return;
    }
    setMessage(messageElement, 'Se trimite emailul de resetare…');
    const response = await fetch(`${API}/auth/v1/recover?redirect_to=${encodeURIComponent(redirectUrl)}`, {
      method: 'POST',
      headers: { apikey: KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(messageElement, data.msg || data.error_description || 'Emailul de resetare nu a putut fi trimis.');
      return;
    }
    setMessage(messageElement, 'Ți-am trimis un email. Deschide linkul nou din mesaj pentru a seta o parolă nouă.');
  }

  function showResetPassword() {
    const overlay = document.createElement('div');
    overlay.id = 'passwordRecoveryOverlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#211915;display:flex;align-items:center;justify-content:center;padding:20px;';
    overlay.innerHTML = `
      <div style="width:min(440px,100%);background:#fff;border-radius:22px;padding:28px;box-shadow:0 20px 70px rgba(0,0,0,.35);font-family:inherit;color:#211915">
        <div style="font-size:38px;font-weight:700;margin-bottom:8px">TT</div>
        <h2 style="margin:0 0 8px">Setează parola nouă</h2>
        <p style="margin:0 0 20px;opacity:.72">Introdu parola nouă pentru contul tău TT Beauty Lounge.</p>
        <form id="passwordRecoveryForm">
          <label style="display:block;margin-bottom:12px">Parolă nouă
            <input id="newRecoveryPassword" type="password" minlength="6" required autocomplete="new-password" style="display:block;width:100%;box-sizing:border-box;margin-top:6px;padding:12px;border:1px solid #d8d0cb;border-radius:12px">
          </label>
          <label style="display:block;margin-bottom:16px">Repetă parola
            <input id="confirmRecoveryPassword" type="password" minlength="6" required autocomplete="new-password" style="display:block;width:100%;box-sizing:border-box;margin-top:6px;padding:12px;border:1px solid #d8d0cb;border-radius:12px">
          </label>
          <button type="submit" style="width:100%;padding:13px;border:0;border-radius:12px;background:#211915;color:white;font-weight:700">Salvează parola</button>
          <p id="passwordRecoveryMessage" style="margin:14px 0 0;min-height:20px"></p>
        </form>
      </div>`;
    document.body.appendChild(overlay);

    byId('passwordRecoveryForm').addEventListener('submit', async event => {
      event.preventDefault();
      const password = byId('newRecoveryPassword').value;
      const confirm = byId('confirmRecoveryPassword').value;
      const message = byId('passwordRecoveryMessage');
      if (password.length < 6) { message.textContent = 'Parola trebuie să aibă cel puțin 6 caractere.'; return; }
      if (password !== confirm) { message.textContent = 'Parolele nu coincid.'; return; }
      message.textContent = 'Se salvează parola…';
      const response = await fetch(`${API}/auth/v1/user`, {
        method: 'PUT',
        headers: { apikey: KEY, Authorization: `Bearer ${recoveryToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        message.textContent = data.msg || data.error_description || 'Parola nu a putut fi schimbată.';
        return;
      }
      history.replaceState(null, '', `${location.pathname}${location.search}`);
      sessionStorage.removeItem('tt_app_token');
      localStorage.removeItem('tt_client_session');
      message.textContent = 'Parola a fost schimbată. Poți intra acum cu parola nouă.';
      setTimeout(() => location.replace(redirectUrl), 1400);
    });
  }

  function injectAdminRecovery() {
    const form = byId('loginForm');
    const emailInput = byId('email');
    const message = byId('loginMsg');
    if (!form || !emailInput || byId('adminForgotPassword')) return;
    const button = document.createElement('button');
    button.id = 'adminForgotPassword';
    button.type = 'button';
    button.className = 'ghost';
    button.textContent = 'Am uitat parola';
    button.style.marginTop = '10px';
    form.querySelector('button[type="submit"], button:not([type])')?.insertAdjacentElement('afterend', button);
    button.addEventListener('click', () => {
      const email = emailInput.value.trim().toLowerCase();
      if (email !== ADMIN_EMAIL) {
        setMessage(message, email ? 'Acest email nu are acces de administrator.' : 'Introdu emailul de administrator.');
        return;
      }
      sendRecovery(email, message);
    });
  }

  function injectClientRecovery() {
    const form = byId('clientAuthForm');
    const emailInput = byId('accountEmail');
    const message = byId('accountMsg') || byId('clientAuthMessage');
    if (!form || !emailInput || byId('clientForgotPassword')) return;
    const button = document.createElement('button');
    button.id = 'clientForgotPassword';
    button.type = 'button';
    button.className = 'ghost';
    button.textContent = 'Am uitat parola';
    button.style.marginTop = '10px';
    form.querySelector('button[type="submit"], #accountSubmit, #clientAuthSubmit')?.insertAdjacentElement('afterend', button);
    button.addEventListener('click', () => sendRecovery(emailInput.value.trim().toLowerCase(), message));

    const updateVisibility = () => {
      const loginTab = document.querySelector('[data-auth="login"], [data-auth-mode="login"]');
      if (loginTab) button.hidden = !loginTab.classList.contains('active');
    };
    document.querySelector('.auth-tabs')?.addEventListener('click', () => setTimeout(updateVisibility, 0));
    updateVisibility();
  }

  if (isRecovery) {
    showResetPassword();
  } else {
    injectAdminRecovery();
    injectClientRecovery();
    setTimeout(() => { injectAdminRecovery(); injectClientRecovery(); }, 250);
  }
})();
