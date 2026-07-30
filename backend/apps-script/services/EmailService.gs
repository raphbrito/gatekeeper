function sendValidationEmail(validation, user) {
  var baseUrl = PropertiesService.getScriptProperties().getProperty(APP_CONFIG.FRONTEND_URL_PROPERTY);
  if (!baseUrl) throw apiError('URL do frontend não configurada.', 'CONFIGURATION_ERROR', 500);
  var isRegistration = validation.tipo === VALIDATION_TYPE.REGISTRATION;
  var page = isRegistration ? 'verify-email.html' : validation.tipo === VALIDATION_TYPE.PASSWORD_RESET ? 'redefinir-senha.html' : 'confirm-email.html';
  var link = baseUrl + '/' + page + '?token=' + encodeURIComponent(validation.token);
  var subject = isRegistration ? 'Confirme seu cadastro no Gatekeeper' : validation.tipo === VALIDATION_TYPE.PASSWORD_RESET ? 'Redefinição de senha' : 'Confirme seu novo e-mail';
  MailApp.sendEmail({ to: validation.valor || user.email, subject: subject, htmlBody: '<p>Olá, ' + user.nome + '.</p><p><a href="' + link + '">Clique aqui para continuar</a>.</p><p>Este link expira em ' + validation.expira_em + '.</p>' });
}
