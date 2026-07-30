function sheetRows(sheetName) {
  var sheet = getSpreadsheet().getSheetByName(sheetName);
  if (!sheet) throw apiError('Aba não encontrada.', 'DATABASE_ERROR', 500);
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  var headers = values[0];
  return values.slice(1).map(function (row, index) {
    var item = { _row: index + 2 };
    headers.forEach(function (header, col) { item[header] = row[col]; });
    return item;
  });
}

function findRow(sheetName, predicate) { return sheetRows(sheetName).find(predicate) || null; }
function insertRow(sheetName, item) {
  var sheet = getSpreadsheet().getSheetByName(sheetName);
  var headers = APP_CONFIG.HEADERS[sheetName];
  sheet.appendRow(headers.map(function (header) { return item[header] === undefined ? '' : item[header]; }));
  return item;
}
function updateRow(sheetName, rowNumber, changes) {
  var sheet = getSpreadsheet().getSheetByName(sheetName), headers = APP_CONFIG.HEADERS[sheetName];
  Object.keys(changes).forEach(function (key) {
    var col = headers.indexOf(key);
    if (col !== -1) sheet.getRange(rowNumber, col + 1).setValue(changes[key]);
  });
}
