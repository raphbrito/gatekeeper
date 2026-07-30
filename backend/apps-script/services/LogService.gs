function logEvent(event, userId, description) {
  insertRow(APP_CONFIG.SHEETS.LOGS, {
    id_log: generateId(), id_usuario: userId || '', evento: event, descricao: description || '', criado_em: new Date()
  });
}
