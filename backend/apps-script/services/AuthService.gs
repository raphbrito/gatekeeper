function publicUser(user) { return { id: user.id_usuario, name: user.nome, lastName: user.sobrenome, email: user.email, status: user.status }; }
function getUserByEmail(email) { return findRow(APP_CONFIG.SHEETS.USERS, function (u) { return String(u.email).toLowerCase() === normalizeEmail(email); }); }
function getUserById(userId) { return findRow(APP_CONFIG.SHEETS.USERS, function (u) { return u.id_usuario === userId; }); }

function register(payload) {
  requireFields(payload, ['nome', 'sobrenome', 'email', 'senha', 'confirmarSenha']); validateEmail(payload.email); validatePassword(payload.senha);
  if (payload.senha !== payload.confirmarSenha) throw apiError('As senhas não coincidem.', 'PASSWORD_MISMATCH', 400);
  if (getUserByEmail(payload.email)) throw apiError('Este e-mail já está cadastrado.', 'EMAIL_ALREADY_EXISTS', 409);
  var now = new Date(), user = { id_usuario: generateId(), nome: String(payload.nome).trim(), sobrenome: String(payload.sobrenome).trim(), email: normalizeEmail(payload.email), email_confirmado_em: '', senha_hash: hashPassword(payload.senha), status: USER_STATUS.PENDING, criado_em: now, ultimo_login_em: '' };
  insertRow(APP_CONFIG.SHEETS.USERS, user);
  var validation = createValidation(user, VALIDATION_TYPE.REGISTRATION, user.email);
  logEvent('CADASTRO_REALIZADO', user.id_usuario, 'Usuário cadastrado.');
  try { sendValidationEmail(validation, user); } catch (error) { logEvent('EMAIL_FALHOU', user.id_usuario, 'Falha ao enviar confirmação: ' + error.message); }
  return success('Cadastro realizado. Confirme seu e-mail para acessar.', { user: publicUser(user) }, 201);
}
function confirmRegistration(token) {
  var validation = getUsableValidation(token, VALIDATION_TYPE.REGISTRATION), user = getUserById(validation.id_usuario);
  if (!user || user.status !== USER_STATUS.PENDING) throw apiError('Conta não disponível para confirmação.', 'INVALID_USER_STATE', 409);
  updateRow(APP_CONFIG.SHEETS.USERS, user._row, { status: USER_STATUS.ACTIVE, email_confirmado_em: new Date() }); consumeValidation(validation);
  logEvent('CADASTRO_CONFIRMADO', user.id_usuario, 'E-mail confirmado.'); return success('Cadastro confirmado. Você já pode entrar.');
}
function resendVerification(payload) {
  requireFields(payload, ['email']); var user = getUserByEmail(payload.email);
  if (!user) throw apiError('Não foi possível reenviar a confirmação.', 'USER_NOT_FOUND', 404);
  if (user.status !== USER_STATUS.PENDING) throw apiError('Esta conta já está confirmada.', 'USER_ALREADY_ACTIVE', 409);
  var validation = createValidation(user, VALIDATION_TYPE.REGISTRATION, user.email); sendValidationEmail(validation, user); logEvent('TOKEN_REENVIADO', user.id_usuario, 'Confirmação reenviada.');
  return success('Um novo e-mail de confirmação foi enviado.');
}
function login(payload) {
  requireFields(payload, ['email', 'senha']); var user = getUserByEmail(payload.email);
  if (!user || !verifyPassword(payload.senha, user.senha_hash)) { if (user) logEvent('LOGIN_FALHOU', user.id_usuario, 'Credenciais inválidas.'); throw apiError('E-mail ou senha inválidos.', 'INVALID_CREDENTIALS', 401); }
  if (user.status !== USER_STATUS.ACTIVE) throw apiError('Confirme seu e-mail antes de entrar.', 'EMAIL_NOT_CONFIRMED', 403);
  var session = createSession(user.id_usuario); updateRow(APP_CONFIG.SHEETS.USERS, user._row, { ultimo_login_em: new Date() }); logEvent('LOGIN', user.id_usuario, 'Login realizado.');
  return success('Login realizado com sucesso.', { token: session.token, user: publicUser(user) });
}
