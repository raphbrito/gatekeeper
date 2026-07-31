function createSession(userId) {
  var now = new Date();
  var session = { id_sessao: generateId(), id_usuario: userId, token: generateRandomToken(), status: SESSION_STATUS.ACTIVE, criado_em: now, ultimo_acesso_em: now, expira_em: new Date(now.getTime() + APP_CONFIG.SESSION_TTL_MS), encerrado_em: '' };
  insertRow(APP_CONFIG.SHEETS.SESSIONS, session);
  return session;
}
function sessionCacheKey(token) { return 'session:' + token; }
function cacheSession(session) { CacheService.getScriptCache().put(sessionCacheKey(session.token), JSON.stringify(session), APP_CONFIG.SESSION_CACHE_TTL_SECONDS); }
function clearSessionCache(token) { CacheService.getScriptCache().remove(sessionCacheKey(token)); }
function requireSession(token) {
  if (!token) throw apiError('Autenticação obrigatória.', 'UNAUTHORIZED', 401);
  var cached = CacheService.getScriptCache().get(sessionCacheKey(token));
  var session = cached ? JSON.parse(cached) : findRow(APP_CONFIG.SHEETS.SESSIONS, function (s) { return s.token === token; });
  if (session && !cached) cacheSession(session);
  if (!session || session.status !== SESSION_STATUS.ACTIVE) throw apiError('Sessão inválida.', 'UNAUTHORIZED', 401);
  if (new Date(session.expira_em).getTime() <= Date.now()) {
    updateRow(APP_CONFIG.SHEETS.SESSIONS, session._row, { status: SESSION_STATUS.EXPIRED });
    clearSessionCache(token);
    logEvent('SESSAO_EXPIRADA', session.id_usuario, 'Sessão expirada por inatividade.');
    throw apiError('Sessão expirada.', 'SESSION_EXPIRED', 401);
  }
  return session;
}
function renewSession(session) {
  var now = new Date();
  updateRow(APP_CONFIG.SHEETS.SESSIONS, session._row, { ultimo_acesso_em: now, expira_em: new Date(now.getTime() + APP_CONFIG.SESSION_TTL_MS) });
  session.ultimo_acesso_em = now;
  session.expira_em = new Date(now.getTime() + APP_CONFIG.SESSION_TTL_MS);
  cacheSession(session);
}
function closeSession(token) {
  var session = requireSession(token);
  updateRow(APP_CONFIG.SHEETS.SESSIONS, session._row, { status: SESSION_STATUS.CLOSED, encerrado_em: new Date() });
  clearSessionCache(token);
  logEvent('LOGOUT', session.id_usuario, 'Logout realizado.');
}
