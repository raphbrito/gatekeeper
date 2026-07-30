function createValidation(user, type, value) {
  expirePendingValidations(user.id_usuario, type, VALIDATION_STATUS.REPLACED);
  var now = new Date();
  var validation = {
    id_validacao: generateId(), id_usuario: user.id_usuario, tipo: type, valor: value || '', token: generateRandomToken(),
    status: VALIDATION_STATUS.PENDING, criado_em: now, expira_em: new Date(now.getTime() + APP_CONFIG.TOKEN_TTL_MS[type]), utilizado_em: ''
  };
  insertRow(APP_CONFIG.SHEETS.VALIDATIONS, validation);
  return validation;
}
function expirePendingValidations(userId, type, targetStatus) {
  sheetRows(APP_CONFIG.SHEETS.VALIDATIONS).filter(function (v) { return v.id_usuario === userId && v.tipo === type && v.status === VALIDATION_STATUS.PENDING; }).forEach(function (v) {
    updateRow(APP_CONFIG.SHEETS.VALIDATIONS, v._row, { status: targetStatus || VALIDATION_STATUS.EXPIRED });
  });
}
function getUsableValidation(token, type) {
  var validation = findRow(APP_CONFIG.SHEETS.VALIDATIONS, function (v) { return v.token === token && v.tipo === type; });
  if (!validation || validation.status !== VALIDATION_STATUS.PENDING) throw apiError('Token inválido ou já utilizado.', 'INVALID_TOKEN', 400);
  if (new Date(validation.expira_em).getTime() <= Date.now()) {
    updateRow(APP_CONFIG.SHEETS.VALIDATIONS, validation._row, { status: VALIDATION_STATUS.EXPIRED });
    throw apiError('Token expirado.', 'EXPIRED_TOKEN', 400);
  }
  return validation;
}
function consumeValidation(validation) { updateRow(APP_CONFIG.SHEETS.VALIDATIONS, validation._row, { status: VALIDATION_STATUS.USED, utilizado_em: new Date() }); }
