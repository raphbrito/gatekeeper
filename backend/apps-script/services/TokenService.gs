function generateRandomToken() {
  return [Utilities.getUuid(), Utilities.getUuid(), Utilities.getUuid()].join('').replace(/-/g, '');
}
function generateId() { return Utilities.getUuid(); }

function hashValue(value) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, value, Utilities.Charset.UTF_8);
  return bytes.map(function (byte) { var n = byte < 0 ? byte + 256 : byte; return ('0' + n.toString(16)).slice(-2); }).join('');
}
