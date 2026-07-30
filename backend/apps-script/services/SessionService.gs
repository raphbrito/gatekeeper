function createSession(userId) {
  var now = new Date();
  var session = { id_sessao: generateId(), id_usuario: userId, token: generateRandomToken(), status: SESSION_STATUS.ACTIVE, criado_em: now, ultimo_acesso_em: now, expira_em: new Date(now.getTime() + APP_CONFIG.SESSION_TTL_MS), encerrado_em: '' };
  insertRow(APP_CONFIG.SHEETS.SESSIONS, session);
  return session;
}
function requireSession(token) {
  if (!token) throw apiError('Autenticação obrigatória.', 'UNAUTHORIZED', 401);
  var session = findRow(APP_CONFIG.SHEETS.SESSIONS, function (s) { return s.token === token; });
  if (!session || session.status !== SESSION_STATUS.ACTIVE) throw apiError('Sessão inválida.', 'UNAUTHORIZED', 401);
  if (new Date(session.expira_em).getTime() <= Date.now()) {
    updateRow(APP_CONFIG.SHEETS.SESSIONS, session._row, { status: SESSION_STATUS.EXPIRED });
    logEvent('SESSAO_EXPIRADA', session.id_usuario, 'Sessão expirada por inatividade.');
    throw apiError('Sessão expirada.', 'SESSION_EXPIRED', 401);
  }
  return session;
}
function renewSession(session) {
  var now = new Date();
  updateRow(APP_CONFIG.SHEETS.SESSIONS, session._row, { ultimo_acesso_em: now, expira_em: new Date(now.getTime() + APP_CONFIG.SESSION_TTL_MS) });
}
function closeSession(token) {
  var session = requireSession(token);
  updateRow(APP_CONFIG.SHEETS.SESSIONS, session._row, { status: SESSION_STATUS.CLOSED, encerrado_em: new Date() });
  logEvent('LOGOUT', session.id_usuario, 'Logout realizado.');
}
