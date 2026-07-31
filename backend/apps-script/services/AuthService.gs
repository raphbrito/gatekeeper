function publicUser(user) { return { id: user.id_usuario, name: user.nome, lastName: user.sobrenome, email: user.email, status: user.status }; }
function getUserByEmail(email) { return findRow(APP_CONFIG.SHEETS.USERS, function (u) { return String(u.email).toLowerCase() === normalizeEmail(email); }); }
function getUserById(userId) { return findRow(APP_CONFIG.SHEETS.USERS, function (u) { return u.id_usuario === userId; }); }

function inviteAdminEmails() {
  return String(PropertiesService.getScriptProperties().getProperty(APP_CONFIG.INVITE_ADMIN_EMAILS_PROPERTY) || '')
    .split(',').map(normalizeEmail).filter(function (email) { return !!email; });
}

function requireInviteAdmin(token) {
  var session = requireSession(token), user = getUserById(session.id_usuario);
  if (!user || inviteAdminEmails().indexOf(normalizeEmail(user.email)) === -1) {
    throw apiError('Voce nao tem permissao para enviar convites.', 'FORBIDDEN', 403);
  }
  return user;
}

function createRegistrationInvite(payload, token) {
  requireFields(payload, ['email']); validateEmail(payload.email);
  var admin = requireInviteAdmin(token), email = normalizeEmail(payload.email), now = new Date();
  if (getUserByEmail(email)) throw apiError('Este e-mail ja possui uma conta.', 'EMAIL_ALREADY_EXISTS', 409);
  sheetRows(APP_CONFIG.SHEETS.INVITES).filter(function (invite) {
    return invite.email === email && invite.status === INVITE_STATUS.PENDING;
  }).forEach(function (invite) { updateRow(APP_CONFIG.SHEETS.INVITES, invite._row, { status: INVITE_STATUS.REPLACED }); });
  var invite = {
    id_convite: generateId(), email: email, token: generateRandomToken(), status: INVITE_STATUS.PENDING,
    criado_em: now, expira_em: new Date(now.getTime() + APP_CONFIG.TOKEN_TTL_MS[VALIDATION_TYPE.REGISTRATION]),
    utilizado_em: '', criado_por: admin.id_usuario
  };
  insertRow(APP_CONFIG.SHEETS.INVITES, invite);
  sendRegistrationInviteEmail(invite);
  logEvent('CONVITE_CADASTRO_ENVIADO', admin.id_usuario, 'Convite enviado para ' + email + '.');
  return success('Convite enviado para ' + email + '.');
}

function getUsableRegistrationInvite(token) {
  var invite = findRow(APP_CONFIG.SHEETS.INVITES, function (item) { return item.token === token; });
  if (!invite || invite.status !== INVITE_STATUS.PENDING) throw apiError('Convite invalido ou ja utilizado.', 'INVALID_INVITE', 400);
  if (new Date(invite.expira_em).getTime() <= Date.now()) {
    updateRow(APP_CONFIG.SHEETS.INVITES, invite._row, { status: INVITE_STATUS.EXPIRED });
    throw apiError('Convite expirado.', 'EXPIRED_INVITE', 400);
  }
  return invite;
}

function acceptRegistrationInvite(payload) {
  requireFields(payload, ['token', 'nome', 'sobrenome', 'senha', 'confirmarSenha']); validatePassword(payload.senha);
  if (payload.senha !== payload.confirmarSenha) throw apiError('As senhas nao coincidem.', 'PASSWORD_MISMATCH', 400);
  var invite = getUsableRegistrationInvite(payload.token);
  if (getUserByEmail(invite.email)) throw apiError('Este e-mail ja possui uma conta.', 'EMAIL_ALREADY_EXISTS', 409);
  var now = new Date(), user = {
    id_usuario: generateId(), nome: String(payload.nome).trim(), sobrenome: String(payload.sobrenome).trim(),
    email: invite.email, email_confirmado_em: now, senha_hash: hashPassword(payload.senha), status: USER_STATUS.ACTIVE,
    criado_em: now, ultimo_login_em: ''
  };
  insertRow(APP_CONFIG.SHEETS.USERS, user);
  updateRow(APP_CONFIG.SHEETS.INVITES, invite._row, { status: INVITE_STATUS.USED, utilizado_em: now });
  logEvent('CADASTRO_POR_CONVITE', user.id_usuario, 'Conta criada por convite.');
  return success('Cadastro concluido. Voce ja pode entrar.', { user: publicUser(user) }, 201);
}

function register(payload) {
  requireFields(payload, ['nome', 'sobrenome', 'email', 'senha', 'confirmarSenha']); validateEmail(payload.email); validatePassword(payload.senha);
  if (payload.senha !== payload.confirmarSenha) throw apiError('As senhas não coincidem.', 'PASSWORD_MISMATCH', 400);
  if (getUserByEmail(payload.email)) throw apiError('Este e-mail já está cadastrado.', 'EMAIL_ALREADY_EXISTS', 409);
  var now = new Date(), user = { id_usuario: generateId(), nome: String(payload.nome).trim(), sobrenome: String(payload.sobrenome).trim(), email: normalizeEmail(payload.email), email_confirmado_em: '', senha_hash: hashPassword(payload.senha), status: USER_STATUS.PENDING, criado_em: now, ultimo_login_em: '' };
  insertRow(APP_CONFIG.SHEETS.USERS, user);
  var validation = createValidation(user, VALIDATION_TYPE.REGISTRATION, user.email);
  logEvent('CADASTRO_REALIZADO', user.id_usuario, 'Usuário cadastrado.');
  enqueueValidationEmail(validation); logEvent('EMAIL_ENFILEIRADO', user.id_usuario, 'Confirmação aguardando envio.');
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
  var validation = createValidation(user, VALIDATION_TYPE.REGISTRATION, user.email); enqueueValidationEmail(validation); logEvent('TOKEN_REENVIADO', user.id_usuario, 'Confirmação reenviada.');
  return success('Um novo e-mail de confirmação foi enviado.');
}
function login(payload) {
  requireFields(payload, ['email', 'senha']); var user = getUserByEmail(payload.email);
  if (!user || !verifyPassword(payload.senha, user.senha_hash)) { if (user) logEvent('LOGIN_FALHOU', user.id_usuario, 'Credenciais inválidas.'); throw apiError('E-mail ou senha inválidos.', 'INVALID_CREDENTIALS', 401); }
  if (user.status !== USER_STATUS.ACTIVE) throw apiError('Confirme seu e-mail antes de entrar.', 'EMAIL_NOT_CONFIRMED', 403);
  var session = createSession(user.id_usuario); updateRow(APP_CONFIG.SHEETS.USERS, user._row, { ultimo_login_em: new Date() }); logEvent('LOGIN', user.id_usuario, 'Login realizado.');
  return success('Login realizado com sucesso.', { token: session.token, user: publicUser(user) });
}
