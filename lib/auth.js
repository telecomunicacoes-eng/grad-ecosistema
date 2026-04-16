// ═══════════════════════════════════════
// GRAD Ecossistema — AUTH
// Níveis: admin · operador · visitante
// ═══════════════════════════════════════

const Auth = {
  user:   null,
  perfil: null,

  // ── Inicialização ────────────────────
  async init() {
    const { data: { session } } = await db.auth.getSession();
    if (session?.user) {
      await Auth._carregarPerfil(session.user);
      App.show();
    } else {
      document.getElementById('login-screen').style.display = 'flex';
    }

    db.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await Auth._carregarPerfil(session.user);
        App.show();
      } else if (event === 'SIGNED_OUT') {
        Auth.user   = null;
        Auth.perfil = null;
        document.getElementById('app').style.display          = 'none';
        document.getElementById('login-screen').style.display = 'flex';
      }
    });
  },

  async _carregarPerfil(user) {
    Auth.user = user;
    try {
      const { data } = await db
        .from('usuarios')
        .select('*')
        .eq('email', user.email)
        .single();
      Auth.perfil = data;
    } catch {
      // Sem perfil cadastrado → visitante por padrão
      Auth.perfil = { nome: user.email, perfil: 'visitante', risp_id: null };
    }

    // Atualiza topbar: nome + badge de nível
    const el = document.getElementById('topbar-user');
    if (el) {
      const badgeCor = { admin: '#3b82f6', operador: '#22c55e', visitante: '#6b7280' };
      const nivel    = Auth.perfil?.perfil || 'visitante';
      el.innerHTML   = `
        ${Auth.perfil?.nome || user.email}
        <span style="
          display:inline-block;margin-left:8px;padding:1px 8px;
          border-radius:20px;font-size:10px;font-weight:700;
          background:${badgeCor[nivel]||'#6b7280'};color:#fff;
          text-transform:uppercase;letter-spacing:.5px
        ">${nivel}</span>`;
    }

    Auth._aplicarPermissoes();
  },

  // ── Controle de permissões ────────────
  // Lógica de visibilidade por nível:
  //   perm-edit  → admin + operador (não visitante)
  //   perm-admin → somente admin
  _aplicarPermissoes() {
    if (!Auth.perfil) return;
    const nivel = Auth.perfil.perfil || 'visitante';

    const podeEditar = nivel === 'admin' || nivel === 'operador';
    const ehAdmin    = nivel === 'admin';

    document.querySelectorAll('.perm-edit').forEach(el => {
      el.style.display = podeEditar ? '' : 'none';
    });
    document.querySelectorAll('.perm-admin').forEach(el => {
      el.style.display = ehAdmin ? '' : 'none';
    });

    // Retrocompatibilidade: perm-grad = perm-edit (admin+operador)
    document.querySelectorAll('.perm-grad').forEach(el => {
      el.style.display = podeEditar ? '' : 'none';
    });
  },

  // ── Login / Logout ───────────────────
  async login() {
    const email    = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const errEl    = document.getElementById('login-error');

    if (!email || !password) {
      errEl.textContent    = 'Preencha e-mail e senha.';
      errEl.style.display  = 'block';
      return;
    }

    errEl.style.display = 'none';
    const btn = document.querySelector('#login-screen .btn-primary');
    btn.textContent = 'Entrando...';
    btn.disabled    = true;

    const { error } = await db.auth.signInWithPassword({ email, password });

    if (error) {
      errEl.textContent   = 'E-mail ou senha inválidos.';
      errEl.style.display = 'block';
      btn.textContent     = 'Entrar';
      btn.disabled        = false;
    }
  },

  async logout() {
    await db.auth.signOut();
  },

  // ── Helpers de nível ─────────────────
  getNivel()      { return Auth.perfil?.perfil || 'visitante'; },
  isAdmin()       { return Auth.getNivel() === 'admin'; },
  isOperador()    { return Auth.getNivel() === 'operador'; },
  isVisitante()   { return Auth.getNivel() === 'visitante'; },
  canEdit()       { return Auth.isAdmin() || Auth.isOperador(); },

  // Retrocompatibilidade
  isGrad()        { return Auth.canEdit(); },
  getRispId()     { return Auth.perfil?.risp_id || null; },
};
