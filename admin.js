// admin.js - central auth helper for frontend
(function(){
  // Base URL for API — can be overridden by setting window.__API_BASE before this script runs.
  // Default to same hostname as the page (keeps cookies same-site and avoids localhost/127.0.0.1 mismatches).
  const API_BASE = window.__API_BASE || `${location.protocol}//${location.hostname}:8000`;

  // simple logger for debugging in dev
  function dbg(...args){ if (window.__DEBUG_ADMIN) console.debug('[admin]', ...args); }

  async function refreshAuth(){
    try{
      dbg('refreshAuth ->', API_BASE + '/auth/status');
  const headers = {};
  const stored = localStorage.getItem('access_token');
  if (stored) headers['Authorization'] = 'Bearer ' + stored;
  const res = await fetch(`${API_BASE}/auth/status`, { credentials: 'include', headers });
      dbg('refresh status res', res.status, res.statusText);
      try {
        const data = await res.json().catch(()=>null);
        dbg('refresh status body', data);
        if (!data) {
          window.__loggedIn = false;
          window.__userEmail = null;
        } else {
          window.__loggedIn = !!data.logged;
          window.__userEmail = data.email || null;
        }
      } catch (ex) {
        dbg('refresh parse error', ex);
        window.__loggedIn = false; window.__userEmail = null;
      }
    }catch(e){ window.__loggedIn = false; window.__userEmail = null; }

    // hide/show elements that require auth
    document.querySelectorAll('.requires-auth').forEach(el => {
      el.style.display = window.__loggedIn ? '' : 'none';
    });
    // hide/show login/logout buttons
    document.querySelectorAll('.login-btn').forEach(el => {
      el.style.display = window.__loggedIn ? 'none' : '';
    });
    document.querySelectorAll('.logout-btn').forEach(el => {
      el.style.display = window.__loggedIn ? '' : 'none';
    });

    // dispatch event with detail so pages can react
    window.dispatchEvent(new CustomEvent('auth-changed', { detail: { logged: !!window.__loggedIn, email: window.__userEmail } }));
    return window.__loggedIn;
  }

  async function logout(){
    try{
      dbg('logout ->', API_BASE + '/auth/logout');
      await fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' });
    }catch(e){ dbg('logout error', e); }
    await refreshAuth();
    try{ localStorage.removeItem('access_token'); }catch(e){}
  }

  // expose API
  window.admin = {
    refreshAuth,
    logout
  };

  // run on load (non-blocking)
  setTimeout(()=>{ refreshAuth().catch(()=>{}); }, 0);
})();
