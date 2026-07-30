function getProfile(token) {
  var session = requireSession(token), user = getUserById(session.id_usuario);
  if (!user) throw apiError('Usuário não encontrado.', 'USER_NOT_FOUND', 404);
  return success('Perfil carregado.', { user: publicUser(user) });
}
function updateProfile(token, payload) {
  var session = requireSession(token), user = getUserById(session.id_usuario), changes = {};
  if (payload.nome !== undefined) { if (!String(payload.nome).trim()) throw apiError('Nome inválido.', 'INVALID_NAME', 400); changes.nome = String(payload.nome).trim(); }
  if (payload.sobrenome !== undefined) { if (!String(payload.sobrenome).trim()) throw apiError('Sobrenome inválido.', 'INVALID_LAST_NAME', 400); changes.sobrenome = String(payload.sobrenome).trim(); }
  if (!Object.keys(changes).length) throw apiError('Nenhum campo permitido foi informado.', 'NO_UPDATES', 400);
  updateRow(APP_CONFIG.SHEETS.USERS, user._row, changes); Object.keys(changes).forEach(function (key) { user[key] = changes[key]; });
  logEvent('PERFIL_ATUALIZADO', user.id_usuario, 'Dados do perfil atualizados.'); return success('Perfil atualizado.', { user: publicUser(user) });
}
function requestEmailChange(token, payload) {
  var session = requireSession(token), user = getUserById(session.id_usuario); requireFields(payload, ['email', 'senha']); validateEmail(payload.email);
  var email = normalizeEmail(payload.email); if (!verifyPassword(payload.senha, user.senha_hash)) throw apiError('Senha atual inválida.', 'INVALID_CREDENTIALS', 401);
  if (getUserByEmail(email)) throw apiError('Este e-mail já está cadastrado.', 'EMAIL_ALREADY_EXISTS', 409);
  var validation = createValidation(user, VALIDATION_TYPE.EMAIL_CHANGE, email); sendValidationEmail(validation, user); logEvent('ALTERACAO_EMAIL_SOLICITADA', user.id_usuario, 'Alteração de e-mail solicitada.');
  return success('Enviamos uma confirmação para o novo e-mail.');
}
function confirmEmailChange(token) {
  var validation = getUsableValidation(token, VALIDATION_TYPE.EMAIL_CHANGE), user = getUserById(validation.id_usuario);
  if (getUserByEmail(validation.valor)) throw apiError('Este e-mail não está mais disponível.', 'EMAIL_ALREADY_EXISTS', 409);
  updateRow(APP_CONFIG.SHEETS.USERS, user._row, { email: validation.valor }); consumeValidation(validation); logEvent('EMAIL_ALTERADO', user.id_usuario, 'E-mail alterado após confirmação.');
  return success('E-mail alterado com sucesso.');
}
function changePassword(token, payload) {
  var session = requireSession(token), user = getUserById(session.id_usuario); requireFields(payload, ['senhaAtual', 'novaSenha', 'confirmarSenha']); validatePassword(payload.novaSenha);
  if (!verifyPassword(payload.senhaAtual, user.senha_hash)) throw apiError('Senha atual inválida.', 'INVALID_CREDENTIALS', 401);
  if (payload.novaSenha !== payload.confirmarSenha) throw apiError('As senhas não coincidem.', 'PASSWORD_MISMATCH', 400);
  updateRow(APP_CONFIG.SHEETS.USERS, user._row, { senha_hash: hashPassword(payload.novaSenha) }); logEvent('SENHA_ALTERADA', user.id_usuario, 'Senha alterada pelo usuário.');
  return success('Senha alterada com sucesso.');
}
function forgotPassword(payload) {
  requireFields(payload, ['email']); var user = getUserByEmail(payload.email);
  // Do not reveal whether the address exists.
  if (!user || user.status !== USER_STATUS.ACTIVE) return success('Se o e-mail estiver cadastrado, você receberá as instruções.');
  var validation = createValidation(user, VALIDATION_TYPE.PASSWORD_RESET, ''); sendValidationEmail(validation, user); logEvent('RECUPERACAO_SENHA', user.id_usuario, 'Recuperação de senha solicitada.');
  return success('Se o e-mail estiver cadastrado, você receberá as instruções.');
}
function resetPassword(payload) {
  requireFields(payload, ['token', 'novaSenha', 'confirmarSenha']); validatePassword(payload.novaSenha);
  if (payload.novaSenha !== payload.confirmarSenha) throw apiError('As senhas não coincidem.', 'PASSWORD_MISMATCH', 400);
  var validation = getUsableValidation(payload.token, VALIDATION_TYPE.PASSWORD_RESET), user = getUserById(validation.id_usuario);
  updateRow(APP_CONFIG.SHEETS.USERS, user._row, { senha_hash: hashPassword(payload.novaSenha) }); consumeValidation(validation); logEvent('SENHA_ALTERADA', user.id_usuario, 'Senha redefinida por recuperação.');
  return success('Senha redefinida com sucesso.');
}
