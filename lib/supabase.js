// ═══════════════════════════════════════
// GRAD Ecossistema — SUPABASE CLIENT
// ═══════════════════════════════════════

const SUPABASE_URL = 'https://fjlwmqixqewkwweekhcz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_0TeYa3IR4XWMvhdcfjk8MA_SrhoOaiZ';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── dbQuery: query com timeout de 15s e erro visível ───────────────────────
// Se o banco demorar mais de 15s (ex: Supabase free dormindo), o erro aparece
// na tela com mensagem clara em vez de spinner eterno.
async function dbQuery(fn) {
  const _timeout = new Promise((_, reject) =>
    setTimeout(() =>
      reject(new Error('O banco demorou demais para responder. Clique em "Tentar novamente".')),
      15000
    )
  );
  try {
    const result = await Promise.race([fn(db), _timeout]);
    if (result.error) throw result.error;
    return result.data;
  } catch (err) {
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
