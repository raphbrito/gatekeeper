function sendValidationEmail(validation, user, isReminder) {
  var baseUrl = PropertiesService.getScriptProperties().getProperty(APP_CONFIG.FRONTEND_URL_PROPERTY);
  if (!baseUrl) throw apiError('URL do frontend não configurada.', 'CONFIGURATION_ERROR', 500);
  var isRegistration = validation.tipo === VALIDATION_TYPE.REGISTRATION;
  var page = isRegistration ? 'verify-email.html' : validation.tipo === VALIDATION_TYPE.PASSWORD_RESET ? 'redefinir-senha.html' : 'confirm-email.html';
  var link = baseUrl + '/' + page + '?token=' + encodeURIComponent(validation.token);
  var subject = isReminder ? 'Lembrete: confirme seu cadastro no Gatekeeper' : isRegistration ? 'Confirme seu cadastro no Gatekeeper' : validation.tipo === VALIDATION_TYPE.PASSWORD_RESET ? 'Redefinição de senha' : 'Confirme seu novo e-mail';
  var reminderText = isReminder ? '<p>Seu cadastro ainda está aguardando a confirmação do e-mail.</p>' : '';
  MailApp.sendEmail({ to: validation.valor || user.email, subject: subject, htmlBody: '<p>Olá, ' + user.nome + '.</p>' + reminderText + '<p><a href="' + link + '">Clique aqui para continuar</a>.</p><p>Este link expira em ' + validation.expira_em + '.</p>' });
}

function sendRegistrationInviteEmail(invite) {
  var baseUrl = PropertiesService.getScriptProperties().getProperty(APP_CONFIG.FRONTEND_URL_PROPERTY);
  if (!baseUrl) throw apiError('URL do frontend nao configurada.', 'CONFIGURATION_ERROR', 500);
  var link = baseUrl + '/aceitar-convite.html?token=' + encodeURIComponent(invite.token);
  MailApp.sendEmail({
    to: invite.email,
    subject: 'Convite para criar seu acesso no Gatekeeper',
    htmlBody: '<p>Voce recebeu um convite para criar seu acesso.</p>' +
      '<p><a href="' + link + '">Criar minha senha</a></p>' +
      '<p>Este link pode ser usado uma unica vez e expira em ' + invite.expira_em + '.</p>'
  });
}

function enqueueValidationEmail(validation) {
  var lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    var properties = PropertiesService.getScriptProperties();
    var queue = JSON.parse(properties.getProperty(APP_CONFIG.EMAIL_QUEUE_PROPERTY) || '[]');
    if (queue.indexOf(validation.id_validacao) === -1) queue.push(validation.id_validacao);
    properties.setProperty(APP_CONFIG.EMAIL_QUEUE_PROPERTY, JSON.stringify(queue));
    var hasTrigger = ScriptApp.getProjectTriggers().some(function (trigger) { return trigger.getHandlerFunction() === APP_CONFIG.EMAIL_QUEUE_HANDLER; });
    if (!hasTrigger) ScriptApp.newTrigger(APP_CONFIG.EMAIL_QUEUE_HANDLER).timeBased().after(1000).create();
  } finally {
    lock.releaseLock();
  }
}

function ensureConfirmationReminderTrigger() {
  var hasTrigger = ScriptApp.getProjectTriggers().some(function (trigger) { return trigger.getHandlerFunction() === APP_CONFIG.EMAIL_REMINDER_HANDLER; });
  if (!hasTrigger) ScriptApp.newTrigger(APP_CONFIG.EMAIL_REMINDER_HANDLER).timeBased().everyHours(1).create();
}

function processRegistrationEmailReminders() {
  beginRequestContext();
  var now = Date.now();
  var reminderAfterMs = APP_CONFIG.TOKEN_TTL_MS[VALIDATION_TYPE.REGISTRATION] / 2;
  sheetRows(APP_CONFIG.SHEETS.VALIDATIONS).filter(function (validation) {
    var createdAt = new Date(validation.criado_em).getTime();
    var expiresAt = new Date(validation.expira_em).getTime();
    return validation.tipo === VALIDATION_TYPE.REGISTRATION &&
      validation.status === VALIDATION_STATUS.PENDING &&
      !validation.lembrete_enviado_em &&
      createdAt + reminderAfterMs <= now && expiresAt > now;
  }).forEach(function (validation) {
    try {
      var user = getUserById(validation.id_usuario);
      if (!user || user.status !== USER_STATUS.PENDING) return;
      sendValidationEmail(validation, user, true);
      updateRow(APP_CONFIG.SHEETS.VALIDATIONS, validation._row, { lembrete_enviado_em: new Date() });
      logEvent('LEMBRETE_CONFIRMACAO_ENVIADO', user.id_usuario, 'Lembrete de confirmação de cadastro enviado.');
    } catch (error) {
      logEvent('LEMBRETE_CONFIRMACAO_FALHOU', '', 'Falha ao enviar lembrete: ' + error.message);
    }
  });
}

function processEmailQueue() {
  beginRequestContext();
  var lock = LockService.getScriptLock();
  lock.waitLock(5000);
  var queue;
  try {
    var properties = PropertiesService.getScriptProperties();
    queue = JSON.parse(properties.getProperty(APP_CONFIG.EMAIL_QUEUE_PROPERTY) || '[]');
    properties.deleteProperty(APP_CONFIG.EMAIL_QUEUE_PROPERTY);
    ScriptApp.getProjectTriggers().filter(function (trigger) { return trigger.getHandlerFunction() === APP_CONFIG.EMAIL_QUEUE_HANDLER; }).forEach(function (trigger) { ScriptApp.deleteTrigger(trigger); });
  } finally {
    lock.releaseLock();
  }
  queue.forEach(function (validationId) {
    try {
      var validation = findRow(APP_CONFIG.SHEETS.VALIDATIONS, function (item) { return item.id_validacao === validationId; });
      if (!validation || validation.status !== VALIDATION_STATUS.PENDING || new Date(validation.expira_em).getTime() <= Date.now()) return;
      var user = getUserById(validation.id_usuario);
      if (!user) return;
      sendValidationEmail(validation, user);
      logEvent('EMAIL_ENVIADO', user.id_usuario, 'E-mail de validação enviado.');
    } catch (error) {
      logEvent('EMAIL_FALHOU', '', 'Falha ao processar fila: ' + error.message);
    }
  });
}
