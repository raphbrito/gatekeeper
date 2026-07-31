function routeRequest(method, route, payload, token) {
  var routes = {
    'POST:register': function () { return register(payload); },
    'POST:create-registration-invite': function () { return createRegistrationInvite(payload, token); },
    'POST:accept-registration-invite': function () { return acceptRegistrationInvite(payload); },
    'POST:login': function () { return login(payload); },
    'POST:confirm-registration': function () { return confirmRegistration(payload.token); },
    'GET:verify-email': function () { return confirmRegistration(payload.token); },
    'POST:resend-verification-email': function () { return resendVerification(payload); },
    'GET:profile': function () { return getProfile(token); },
    'PATCH:profile': function () { return updateProfile(token, payload); },
    'POST:change-email': function () { return requestEmailChange(token, payload); },
    'POST:confirm-email': function () { return confirmEmailChange(payload.token); },
    'POST:change-password': function () { return changePassword(token, payload); },
    'POST:forgot-password': function () { return forgotPassword(payload); },
    'POST:reset-password': function () { return resetPassword(payload); },
    'POST:logout': function () { closeSession(token); return success('Logout realizado.'); }
  };
  var normalizedRoute = route.replace(/^\//, '');
  var handler = routes[method + ':' + normalizedRoute];
  if (!handler) throw apiError('Rota não encontrada.', 'NOT_FOUND', 404);
  var result = handler();
  // A sessão só é renovada depois que a operação protegida termina com sucesso.
  if (['profile', 'change-email', 'change-password'].indexOf(normalizedRoute) !== -1) {
    renewSession(findRow(APP_CONFIG.SHEETS.SESSIONS, function (session) { return session.token === token; }));
  }
  return result;
}
