function hashPassword(password) {
  var salt = generateRandomToken();
  return salt + ':' + hashValue(salt + ':' + password);
}
function verifyPassword(password, storedHash) {
  var parts = String(storedHash || '').split(':');
  if (parts.length !== 2) return false;
  var expected = hashValue(parts[0] + ':' + password), actual = parts[1];
  if (expected.length !== actual.length) return false;
  var mismatch = 0;
  for (var i = 0; i < expected.length; i++) mismatch |= expected.charCodeAt(i) ^ actual.charCodeAt(i);
  return mismatch === 0;
}
