// ═══════════════════════════════════════
// GRAD Ecossistema — FIREBASE CLIENT
// Substitui supabase.js — Firestore + Auth
// Mantém API compatível: dbQuery, db.from(), db.auth.*
// ═══════════════════════════════════════

const FIREBASE_CONFIG = {
  apiKey:            'AIzaSyBZSERiYncVn6Mxp2253EFyZ1NjOx7ZrsM',
  authDomain:        'grad-ecosistema.firebaseapp.com',
  projectId:         'grad-ecosistema',
  storageBucket:     'grad-ecosistema.firebasestorage.app',
  messagingSenderId: '472543843717',
  appId:             '1:472543843717:web:580a80ad592b1a5309a0ec',
  measurementId:     'G-LXBC4W92HE'
};

firebase.initializeApp(FIREBASE_CONFIG);
const fdb   = firebase.firestore();
const fauth = firebase.auth();

// ── Firestore Query Builder ────────────────────────────────────────────────
// Emula a API encadeável do Supabase para manter todos os módulos intactos.
// Suporta: .select() .eq() .neq() .in() .order() .limit() .single()
//          .insert() .update() .upsert() .delete()
// Suporta joins inline: select('*,risp:risps(id,nome)')
class FsQuery {
  constructor(coll) {
    this._coll     = coll;
    this._eqF      = [];   // [{field, value}]
    this._neqF     = [];
    this._inF      = [];   // [{field, values}]
    this._limitN   = null;
    this._orderF   = null;
    this._orderAsc = true;
    this._single   = false;
    this._selectStr = '*';
    this._op       = 'select';
    this._payload  = null;
  }

  // ── Encadeamento ──────────────────────────────────────────────────────────
  select(str)    { this._selectStr = str || '*'; return this; }
  eq(f, v)       { this._eqF.push({ field: f, value: v }); return this; }
  neq(f, v)      { this._neqF.push({ field: f, value: v }); return this; }
  in(f, vs)      { this._inF.push({ field: f, values: vs }); return this; }
  limit(n)       { this._limitN = n; return this; }
  single()       { this._single = true; return this; }
  order(f, opts) { this._orderF = f; this._orderAsc = opts?.ascending !== false; return this; }

  insert(data)   { this._op = 'insert'; this._payload = Array.isArray(data) ? data : [data]; return this; }
  update(data)   { this._op = 'update'; this._payload = data; return this; }
  upsert(data)   { this._op = 'upsert'; this._payload = Array.isArray(data) ? data : [data]; return this; }
  delete()       { this._op = 'delete'; return this; }

  // Torna a instância "thenable" → funciona com await diretamente
  then(res, rej) { return this._run().then(res, rej); }
  catch(rej)     { return this._run().catch(rej); }

  // ── Execução ──────────────────────────────────────────────────────────────
  async _run() {
    try {
      switch (this._op) {
        case 'insert': return await this._doInsert();
        case 'update': return await this._doUpdate();
        case 'upsert': return await this._doUpsert();
        case 'delete': return await this._doDelete();
        default:       return await this._doSelect();
      }
    } catch (e) {
      console.error('[FS]', this._coll, this._op, e.message);
      return { data: null, error: e };
    }
  }

  // ── INSERT ────────────────────────────────────────────────────────────────
  async _doInsert() {
    const results = [];
    for (const item of this._payload) {
      const { id, ...rest } = item;
      let docId;
      if (id) {
        await fdb.collection(this._coll).doc(String(id)).set(rest);
        docId = String(id);
      } else {
        const ref = await fdb.collection(this._coll).add(rest);
        docId = ref.id;
      }
      results.push({ id: docId, ...rest });
    }
    return { data: results, error: null };
  }

  // ── UPDATE ────────────────────────────────────────────────────────────────
  async _doUpdate() {
    const idF = this._eqF.find(f => f.field === 'id');
    if (!idF) throw new Error('update() requer .eq("id", ...)');
    const clean = Object.fromEntries(
      Object.entries(this._payload).filter(([, v]) => v !== undefined)
    );
    await fdb.collection(this._coll).doc(String(idF.value)).update(clean);
    return { data: [{ id: idF.value, ...this._payload }], error: null };
  }

  // ── UPSERT ───────────────────────────────────────────────────────────────
  async _doUpsert() {
    const results = [];
    for (const item of this._payload) {
      const { id, ...rest } = item;
      if (id) {
        await fdb.collection(this._coll).doc(String(id)).set(rest, { merge: true });
        results.push({ id: String(id), ...rest });
      } else {
        const ref = await fdb.collection(this._coll).add(rest);
        results.push({ id: ref.id, ...rest });
      }
    }
    return { data: results, error: null };
  }

  // ── DELETE ────────────────────────────────────────────────────────────────
  async _doDelete() {
    const idF = this._eqF.find(f => f.field === 'id');
    if (idF) {
      await fdb.collection(this._coll).doc(String(idF.value)).delete();
    } else {
      const snap = await this._buildQuery().get();
      if (!snap.empty) {
        const batch = fdb.batch();
        snap.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
      }
    }
    return { data: [], error: null };
  }

  // ── SELECT ────────────────────────────────────────────────────────────────
  async _doSelect() {
    const idF         = this._eqF.find(f => f.field === 'id');
    const outrosEqF   = this._eqF.filter(f => f.field !== 'id');

    // Busca direta por documento (ID único, sem outros filtros)
    if (idF && !outrosEqF.length && !this._inF.length && !this._neqF.length) {
      const snap = await fdb.collection(this._coll).doc(String(idF.value)).get();
      if (!snap.exists) return { data: this._single ? null : [], error: null };
      const doc      = { id: snap.id, ...snap.data() };
      const enriched = await this._enrich([doc]);
      return { data: this._single ? enriched[0] : enriched, error: null };
    }

    // Query com filtros
    const snap = await this._buildQuery().get();
    let docs   = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Ordenação client-side (evita necessidade de índices compostos no Firestore)
    if (this._orderF) {
      docs.sort((a, b) => {
        const va = a[this._orderF] ?? '', vb = b[this._orderF] ?? '';
        const cmp = va < vb ? -1 : va > vb ? 1 : 0;
        return this._orderAsc ? cmp : -cmp;
      });
    }

    // Limit após ordenação
    if (this._limitN) docs = docs.slice(0, this._limitN);

    docs = await this._enrich(docs);
    return { data: this._single ? (docs[0] ?? null) : docs, error: null };
  }

  // ── Construção da query Firestore ─────────────────────────────────────────
  _buildQuery() {
    let q = fdb.collection(this._coll);
    for (const { field, value } of this._eqF) {
      if (field === 'id') continue;
      q = q.where(field, '==', value);
    }
    for (const { field, value } of this._neqF) {
      q = q.where(field, '!=', value);
    }
    for (const { field, values } of this._inF) {
      if (values?.length) q = q.where(field, 'in', values);
    }
    // Limit no Firestore (sem ordenação client-side)
    if (this._limitN && !this._orderF) q = q.limit(this._limitN);
    return q;
  }

  // ── Enriquecimento com joins ──────────────────────────────────────────────
  // Detecta padrão: select('*,risp:risps(id,nome),site:sites(id,nome)')
  // Busca a coleção relacionada uma vez, armazena em cache e embute nos docs.
  async _enrich(docs) {
    if (!this._selectStr.includes(':')) return docs;
    const pattern = /(\w+):(\w+)\(([^)]+)\)/g;
    let m;
    while ((m = pattern.exec(this._selectStr)) !== null) {
      const alias  = m[1];
      const coll   = m[2];
      const fields = m[3].split(',').map(f => f.trim());
      const idField = alias + '_id';

      const ids = [...new Set(docs.map(d => d[idField]).filter(Boolean))];
      if (!ids.length) continue;

      if (!FsQuery._cache[coll]) {
        const snap = await fdb.collection(coll).get();
        FsQuery._cache[coll] = {};
        snap.docs.forEach(d => { FsQuery._cache[coll][d.id] = { id: d.id, ...d.data() }; });
      }

      docs = docs.map(d => {
        const rel = FsQuery._cache[coll]?.[d[idField]];
        return {
          ...d,
          [alias]: rel
            ? Object.fromEntries(fields.map(f => [f, rel[f]]))
            : null
        };
      });
    }
    return docs;
  }
}

// Cache compartilhado (invalida após 5 min para manter dados frescos)
FsQuery._cache = {};
setInterval(() => { FsQuery._cache = {}; }, 5 * 60 * 1000);

// ── db proxy — mesma interface do Supabase ────────────────────────────────
// auth.js e todos os módulos usam `db.from(...)` e `db.auth.*` sem alteração.
const db = {
  from: (coll) => new FsQuery(coll),

  auth: {
    // Aguarda inicialização do Firebase Auth antes de retornar sessão
    async getSession() {
      await new Promise(res => {
        const unsub = fauth.onAuthStateChanged(u => { unsub(); res(u); });
      });
      const user = fauth.currentUser;
      return { data: { session: user ? { user } : null } };
    },

    onAuthStateChange(callback) {
      fauth.onAuthStateChanged(user => {
        if (user) callback('SIGNED_IN', { user });
        else callback('SIGNED_OUT', null);
      });
    },

    async signInWithPassword({ email, password }) {
      try {
        await fauth.signInWithEmailAndPassword(email, password);
        return { error: null };
      } catch (e) {
        return { error: { message: 'E-mail ou senha inválidos.' } };
      }
    },

    async signOut() {
      FsQuery._cache = {}; // Limpa cache ao sair
      await fauth.signOut();
    }
  }
};

// ── dbQuery: wrapper com tratamento de erro ────────────────────────────────
async function dbQuery(fn) {
  try {
    const result = await fn(db);
    if (result?.error) throw result.error;
    return result?.data ?? result;
  } catch (err) {
    console.error('[FS]', err.message);
    if (typeof Toast !== 'undefined') {
      Toast.show(err.message || 'Erro ao acessar o banco de dados', 'error');
    }
    throw err;
  }
}

// ── dbPing: verifica conexão com Firestore ────────────────────────────────
function dbPing() {
  const t0 = Date.now();
  fdb.collection('risps').limit(1).get()
    .then(() => console.log(`[FS] Firebase pronto em ${Date.now() - t0}ms`))
    .catch(e  => console.warn('[FS] Ping falhou:', e.message));
}

console.log('[FS] Firebase inicializado — projeto: grad-ecosistema');
