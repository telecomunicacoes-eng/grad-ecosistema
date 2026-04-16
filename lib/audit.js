// ═══════════════════════════════════════
// GRAD Ecossistema — AUDITORIA
// Log automático de todas as ações
// ═══════════════════════════════════════

const Audit = {
  async log(acao, tabela, registroId, dadosAntes = null, dadosDepois = null) {
    try {
      await db.from('audit_logs').insert({
        usuario_id:    Auth.user?.id || null,
        acao,
        tabela,
        registro_id:   registroId || null,
        dados_antes:   dadosAntes,
        dados_depois:  dadosDepois,
      });
    } catch (err) {
      // Auditoria nunca bloqueia a operação principal
      console.warn('[Audit]', err.message);
    }
  },

  // Helpers semânticos
  criou:   (tabela, id, dados)         => Audit.log('criou',   tabela, id, null,  dados),
  editou:  (tabela, id, antes, depois) => Audit.log('editou',  tabela, id, antes, depois),
  deletou: (tabela, id, dados)         => Audit.log('deletou', tabela, id, dados, null),
  acessou: (tabela, id)                => Audit.log('acessou', tabela, id),
};
