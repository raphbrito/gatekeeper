function requireFields(payload, fields) {
  fields.forEach(function (field) {
    if (payload[field] === undefined || payload[field] === null || String(payload[field]).trim() === '') {
      throw apiError('O campo ' + field + ' é obrigatório.', 'REQUIRED_FIELD', 400);
    }
  });
}

function normalizeEmail(email) { return String(email || '').trim().toLowerCase(); }
function validateEmail(email) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email))) throw apiError('E-mail inválido.', 'INVALID_EMAIL', 400);
}
function validatePassword(password) {
  if (typeof password !== 'string' || password.length < 8) throw apiError('A senha deve ter ao menos 8 caracteres.', 'WEAK_PASSWORD', 400);
}
function apiError(message, code, status) { return { isApiError: true, message: message, code: code, status: status || 400 }; }
