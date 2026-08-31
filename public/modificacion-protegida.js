const SUPABASE_URL = 'https://layqqdkatatutmexoqrl.supabase.co';
const SUPABASE_KEY = 'sb_publishable_mob6Bya5CJ5AyzBNJd_TvA_VFIGyWc8';
const USUARIO = 'lurami86@gmail.com';

let editUnlocked = false;

function getControls() {
  return [...document.querySelectorAll('input, select, textarea')].filter(el => {
    if (el.type === 'button' || el.type === 'submit' || el.type === 'checkbox' || el.type === 'radio') return false;
    return !el.closest('.nube-actions');
  });
}

function setLocked(locked) {
  getControls().forEach(el => {
    if (locked) {
      if (el.dataset.modOriginalReadonly == null) el.dataset.modOriginalReadonly = el.readOnly ? '1' : '0';
      el.readOnly = true;
      if (el.tagName === 'SELECT') el.disabled = true;
    } else {
      el.readOnly = el.dataset.modOriginalReadonly === '1';
      if (el.tagName === 'SELECT') el.disabled = false;
    }
  });
}

async function authorize() {
  const password = window.prompt(`AUTORIZACIÓN DE MODIFICACIÓN\n\nUsuario: ${USUARIO}\n\nIngrese su contraseña:`);
  if (password === null) return false;
  if (!password) { window.alert('Debe ingresar la contraseña.'); return false; }

  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: USUARIO, password })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.access_token) throw new Error(data.error_description || data.msg || 'Usuario o contraseña incorrectos.');

  sessionStorage.setItem('rg_access_token', data.access_token);
  if (data.refresh_token) sessionStorage.setItem('rg_refresh_token', data.refresh_token);
  editUnlocked = true;
  setLocked(false);
  return true;
}

function patchFetch() {
  if (window.__rgProtectedFetch) return;
  window.__rgProtectedFetch = true;
  const originalFetch = window.fetch.bind(window);
  window.fetch = (input, init = {}) => {
    const url = typeof input === 'string' ? input : input?.url || '';
    const token = sessionStorage.getItem('rg_access_token');
    if (token && url.startsWith(`${SUPABASE_URL}/rest/v1/`)) {
      const headers = new Headers(init.headers || (input instanceof Request ? input.headers : undefined));
      headers.set('Authorization', `Bearer ${token}`);
      return originalFetch(input, { ...init, headers });
    }
    return originalFetch(input, init);
  };
}

function addButton() {
  const actions = document.querySelector('.nube-actions');
  if (!actions || document.querySelector('.modificar-expediente-btn')) return;

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'btn btn-secondary modificar-expediente-btn no-print';
  button.textContent = 'Modificar / Actualizar';
  button.addEventListener('click', async () => {
    if (editUnlocked) {
      editUnlocked = false;
      setLocked(true);
      button.textContent = 'Modificar / Actualizar';
      return;
    }
    button.disabled = true;
    try {
      const ok = await authorize();
      if (ok) {
        button.textContent = 'Bloquear modificación';
        window.alert('Modificación autorizada. Puede cambiar los datos y guardar el mismo expediente.');
      }
    } catch (error) {
      window.alert(`No fue posible autorizar la modificación. ${error.message}`);
    } finally {
      button.disabled = false;
    }
  });
  actions.appendChild(button);
}

function wrapPersistenceButtons() {
  const actions = document.querySelector('.nube-actions');
  if (!actions || actions.dataset.modWrapped) return;
  const buttons = [...actions.querySelectorAll('button')];
  const consultar = buttons.find(b => b.textContent.includes('Consultar por CI / RUC'));
  const guardar = buttons.find(b => b.textContent.includes('Guardar formulario'));

  if (consultar && consultar.onclick) {
    const original = consultar.onclick;
    consultar.onclick = async function (...args) {
      const previousAlert = window.alert;
      let success = false;
      window.alert = function (message) {
        if (String(message).includes('Expediente cargado correctamente')) success = true;
        return previousAlert(message);
      };
      try { return await original.apply(this, args); }
      finally {
        window.alert = previousAlert;
        if (success && !editUnlocked) setLocked(true);
      }
    };
  }

  if (guardar && guardar.onclick) {
    const original = guardar.onclick;
    guardar.onclick = async function (...args) {
      let success = false;
      const previousAlert = window.alert;
      window.alert = function (message) {
        if (String(message).includes('Expediente guardado correctamente')) success = true;
        return previousAlert(message);
      };
      try { return await original.apply(this, args); }
      finally {
        window.alert = previousAlert;
        if (success) {
          editUnlocked = false;
          setLocked(true);
          const mod = document.querySelector('.modificar-expediente-btn');
          if (mod) mod.textContent = 'Modificar / Actualizar';
        }
      }
    };
  }
  actions.dataset.modWrapped = '1';
}

function start() {
  patchFetch();
  const observer = new MutationObserver(() => { addButton(); wrapPersistenceButtons(); });
  observer.observe(document.body, { childList: true, subtree: true });
  addButton();
  wrapPersistenceButtons();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
else start();
