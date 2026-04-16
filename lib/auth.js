// ═══════════════════════════════════════
// GRAD Ecossistema — AUTH
// ═══════════════════════════════════════

const Auth = {
  user: null,
  perfil: null,

  async init() {
    const { data: { session } } = await db.auth.getSession();
    if (session?.user) {
      await Auth._carregarPerfil(session.user);
      App.show();
    } else {
      document.getElementById('login-screen').style.display = 'flex';
    }

    // Escuta mudanças de sessão
    db.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await Auth._carregarPerfil(session.user);
        App.show();
      } else if (event === 'SIGNED_OUT') {
        Auth.user = null;
        Auth.perfil = null;
        document.getElementById('app').style.display = 'none';
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
      // Usuário ainda não tem perfil — GRAD por padrão
      Auth.perfil = { nome: user.email, perfil: 'grad', risp_id: null };
    }

    // Atualiza topbar
    const el = document.getElementById('topbar-user');
    if (el) el.textContent = Auth.perfil?.nome || user.email;

    // Aplica visibilidade por perfil
    Auth._aplicarPermissoes();
  },

  _aplicarPermissoes() {
    if (!Auth.perfil) return;
    const isGrad = Auth.perfil.perfil === 'grad';
    // Elementos com perm-grad só aparecem pra GRAD
    document.querySelectorAll('.perm-grad').forEach(el => {
      el.style.display = isGrad ? '' : 'none';
    });
  },

  async login() {
    const email    = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const errEl    = document.getElementById('login-error');

    if (!email || !password) {
      errEl.textContent = 'Preencha e-mail e senha.';
      errEl.style.display = 'block';
      return;
    }

    errEl.style.display = 'none';
    const btn = document.querySelector('#login-screen .btn-primary');
    btn.textContent = 'Entrando...';
    btn.disabled = true;

    const { error } = await db.auth.signInWithPassword({ email, password });

    if (error) {
      errEl.textContent = 'E-mail ou senha inválidos.';
      errEl.style.display = 'block';
      btn.textContent = 'Entrar';
      btn.disabled = false;
    }
  },

  async logout() {
    await db.auth.signOut();
  },

  isGrad() {
    return Auth.perfil?.perfil === 'grad';
  },

  getRispId() {
    return Auth.perfil?.risp_id || null;
  }
};
