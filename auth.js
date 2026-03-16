(function () {
  const STORAGE_KEY = 'savvyconnect-auth';
  const USERS = {
    'massimo@ticktockloans.com': { role: 'admin', name: 'Massimo' },
    'zoe@ticktockloans.com': { role: 'admin', name: 'Zoe' },
    'bernadette@ticktockloans.com': { role: 'agent', name: 'Bernadette' },
    'bianca@ticktockloans.com': { role: 'agent', name: 'Bianca' },
    'david@ticktockloans.com': { role: 'agent', name: 'David' }
  };

  function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
  }

  function getSession() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      const email = normalizeEmail(parsed.email);
      const user = USERS[email];
      if (!user) return null;
      return { email, role: user.role, name: user.name };
    } catch (error) {
      return null;
    }
  }

  function saveSession(email) {
    const normalized = normalizeEmail(email);
    const user = USERS[normalized];
    if (!user) return null;
    const session = { email: normalized };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    return { email: normalized, role: user.role, name: user.name };
  }

  function clearSession() {
    localStorage.removeItem(STORAGE_KEY);
  }

  function roleCanAccess(role, workspace) {
    if (workspace === 'agent') {
      return role === 'agent' || role === 'admin';
    }
    if (workspace === 'admin') {
      return role === 'admin';
    }
    return false;
  }

  function loginCardHtml(title, subtitle, errorMessage) {
    return `
      <div style="min-height:100vh;display:grid;place-items:center;padding:24px;background:radial-gradient(circle at top left, rgba(31, 93, 140, 0.18), transparent 30%),radial-gradient(circle at top right, rgba(143, 183, 216, 0.22), transparent 20%),linear-gradient(180deg, #eef4fa, #dbe8f3);font-family:'SF Pro Text','Inter',-apple-system,BlinkMacSystemFont,sans-serif;">
        <div style="width:min(460px,100%);background:rgba(248,251,254,0.88);border:1px solid rgba(22,34,53,0.12);border-radius:28px;box-shadow:0 28px 60px rgba(17,31,49,0.18);backdrop-filter:blur(18px);padding:32px;">
          <div style="display:inline-flex;align-items:center;padding:8px 14px;border-radius:999px;background:rgba(31,93,140,0.12);color:#1f5d8c;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">Work Email Login</div>
          <h1 style="margin:16px 0 8px;font-size:34px;line-height:1.05;color:#162235;font-family:'SF Pro Display','Inter',-apple-system,BlinkMacSystemFont,sans-serif;">${title}</h1>
          <p style="margin:0 0 22px;color:#48586a;line-height:1.65;">${subtitle}</p>
          ${errorMessage ? `<div style="margin-bottom:16px;padding:12px 14px;border-radius:16px;background:rgba(197,91,102,0.12);color:#8e3742;border:1px solid rgba(197,91,102,0.18);">${errorMessage}</div>` : ''}
          <form id="workspaceLoginForm" style="display:grid;gap:14px;">
            <label for="workspaceEmail" style="font-size:14px;font-weight:700;color:#48586a;">Email address</label>
            <input id="workspaceEmail" type="email" placeholder="name@ticktockloans.com" style="width:100%;padding:15px 18px;border:1px solid rgba(22,34,53,0.12);border-radius:16px;background:rgba(255,255,255,0.92);color:#162235;" required>
            <button type="submit" style="margin-top:8px;border:none;border-radius:999px;padding:14px 18px;background:linear-gradient(135deg,#1f5d8c,#4479a3);color:#f7f7f7;font-weight:700;cursor:pointer;box-shadow:0 14px 24px rgba(31,93,140,0.22);">Continue</button>
          </form>
        </div>
      </div>
    `;
  }

  function renderLogin(options, errorMessage) {
    document.body.innerHTML = loginCardHtml(options.title, options.subtitle, errorMessage || '');
    const form = document.getElementById('workspaceLoginForm');
    const emailInput = document.getElementById('workspaceEmail');
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      const session = saveSession(emailInput.value);
      if (!session) {
        renderLogin(options, 'That email is not approved for this workspace.');
        return;
      }
      if (!roleCanAccess(session.role, options.workspace)) {
        renderLogin(options, options.workspace === 'admin'
          ? 'This email does not have admin access.'
          : 'This email cannot access this workspace.');
        return;
      }
      window.location.reload();
    });
    emailInput.focus();
  }

  function injectSessionBar(session, workspaceLabel) {
    const shell = document.querySelector('.app-shell');
    if (!shell) return;
    const bar = document.createElement('div');
    bar.style.display = 'flex';
    bar.style.justifyContent = 'space-between';
    bar.style.alignItems = 'center';
    bar.style.gap = '12px';
    bar.style.flexWrap = 'wrap';
    bar.style.marginBottom = '4px';
    bar.innerHTML = `
      <div style="display:inline-flex;align-items:center;gap:10px;padding:10px 14px;border-radius:999px;background:rgba(214,229,241,0.72);border:1px solid rgba(22,34,53,0.1);color:#162235;font-size:14px;font-weight:600;">
        <span>${workspaceLabel}</span>
        <span style="color:#5c6b7c;">${session.name} · ${session.email} · ${session.role}</span>
      </div>
      <button id="workspaceLogoutBtn" type="button" style="border:none;border-radius:999px;padding:12px 16px;background:rgba(214,229,241,0.72);color:#162235;font-weight:700;cursor:pointer;border:1px solid rgba(22,34,53,0.1);">Log out</button>
    `;
    shell.prepend(bar);
    document.getElementById('workspaceLogoutBtn').addEventListener('click', function () {
      clearSession();
      window.location.reload();
    });
  }

  window.workspaceAuth = {
    initialize: function initialize(options) {
      const session = getSession();
      if (!session || !roleCanAccess(session.role, options.workspace)) {
        renderLogin(options, session ? 'Your account does not have access to this workspace.' : '');
        return null;
      }
      injectSessionBar(session, options.workspaceLabel || options.title);
      return session;
    },
    clearSession,
    getSession
  };
})();
