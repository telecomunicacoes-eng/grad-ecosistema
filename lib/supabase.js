// ═══════════════════════════════════════
// GRAD Ecossistema — SUPABASE CLIENT
// ═══════════════════════════════════════

const SUPABASE_URL = 'https://fjlwmqixqewkwweekhcz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_0TeYa3IR4XWMvhdcfjk8MA_SrhoOaiZ';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

// Helper: query com tratamento de erro padrão
async function dbQuery(fn) {
  try {
    const result = await fn(db);
    if (result.error) throw result.error;
    return result.data;
  } catch (err) {
    console.error('[DB Error]', err.message);
    Toast.show(err.message || 'Erro ao acessar o banco de dados', 'error');
    throw err;
  }
}
