// ═══════════════════════════════════════
// GRAD Ecossistema — SUPABASE CLIENT
// ═══════════════════════════════════════

const SUPABASE_URL = 'https://fjlwmqixqewkwweekhcz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_0TeYa3IR4XWMvhdcfjk8MA_SrhoOaiZ';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── dbQuery: timeout 20s + retry automático ────────────────────────────────
// Se o banco demorar (Supabase free dormindo), tenta novamente 1x
// automaticamente antes de mostrar erro ao usuário.
async function dbQuery(fn, _retries = 1) {
  const makeTimeout = () => new Promise((_, reject) =>
    setTimeout(() =>
      reject(new Error('O banco demorou demais para responder. Clique em "Tentar novamente".')),
      20000
    )
  );
  try {
    const result = await Promise.race([fn(db), makeTimeout()]);
    if (result.error) throw result.error;
    return result.data;
  } catch (err) {
    // Retry automático se for timeout (banco estava dormindo)
    if (_retries > 0 && err.message.includes('demorou')) {
      console.warn(`[DB] Timeout — aguardando banco acordar e tentando novamente...`);
      await new Promise(r => setTimeout(r, 4000));
      return dbQuery(fn, _retries - 1);
    }
    console.error('[DB]', err.message);
    Toast.show(err.message || 'Erro ao acessar o banco de dados', 'error');
    throw err;
  }
}

// ── dbPing: acorda o Supabase sem bloquear a UI ────────────────────────────
// Chamado logo após o login. Se o banco estiver "dormindo" (free tier),
// esta query leve o acorda enquanto o usuário ainda vê o dashboard inicial.
function dbPing() {
  const t0 = Date.now();
  db.from('risps').select('id').limit(1)
    .then(() => console.log(`[DB] Banco pronto em ${Date.now() - t0}ms`))
    .catch(e  => console.warn('[DB] Ping falhou:', e.message));
}

// ── dbActivityKeepAlive: mantém o banco acordado enquanto há uso ───────────
// Monitora atividade do usuário (mouse, teclado, toque, scroll).
// Se houve atividade nos últimos 5 minutos → pinga o banco a cada 4 minutos.
// Para automaticamente quando a aba fica oculta (usuário saiu ou minimizou).
// Retoma quando o usuário volta à aba.
(function dbActivityKeepAlive() {
  let lastActivity = Date.now();
  let timer        = null;

  // Registrar qualquer atividade do usuário
  ['mousemove', 'click', 'keydown', 'scroll', 'touchstart'].forEach(ev =>
    document.addEventListener(ev, () => { lastActivity = Date.now(); }, { passive: true })
  );

  // Parar quando aba fica oculta, retomar quando volta
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      clearInterval(timer);
      timer = null;
      console.log('[DB] Keep-alive pausado — aba oculta');
    } else {
      lastActivity = Date.now(); // ao voltar conta como ativo
      iniciar();
    }
  });

  function iniciar() {
    if (timer) return;
    timer = setInterval(() => {
      const inativo = Date.now() - lastActivity;
      if (inativo < 5 * 60 * 1000) {
        // Usuário ativo nos últimos 5 min → pinga o banco
        db.from('risps').select('id').limit(1)
          .then(() => console.log('[DB] Keep-alive ✓'))
          .catch(() => {});
      } else {
        console.log('[DB] Keep-alive aguardando — usuário inativo há ' + Math.round(inativo/60000) + 'min');
      }
    }, 4 * 60 * 1000); // a cada 4 minutos
  }

  // Inicia assim que o script carrega
  iniciar();
})();
