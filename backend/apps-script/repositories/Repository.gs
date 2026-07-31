function sheetRows(sheetName) {
  if (REQUEST_CONTEXT && REQUEST_CONTEXT.rows[sheetName]) return REQUEST_CONTEXT.rows[sheetName];
  var sheet = getSpreadsheet().getSheetByName(sheetName);
  if (!sheet) throw apiError('Aba não encontrada.', 'DATABASE_ERROR', 500);
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  var headers = values[0];
  var rows = values.slice(1).map(function (row, index) {
    var item = { _row: index + 2 };
    headers.forEach(function (header, col) { item[header] = row[col]; });
    return item;
  });
  if (REQUEST_CONTEXT) REQUEST_CONTEXT.rows[sheetName] = rows;
  return rows;
}

function findRow(sheetName, predicate) { return sheetRows(sheetName).find(predicate) || null; }
function insertRow(sheetName, item) {
  var sheet = getSpreadsheet().getSheetByName(sheetName);
  var headers = APP_CONFIG.HEADERS[sheetName];
  sheet.appendRow(headers.map(function (header) { return item[header] === undefined ? '' : item[header]; }));
  if (REQUEST_CONTEXT) delete REQUEST_CONTEXT.rows[sheetName];
  return item;
}
function updateRow(sheetName, rowNumber, changes) {
  var sheet = getSpreadsheet().getSheetByName(sheetName), headers = APP_CONFIG.HEADERS[sheetName];
  var record = sheetRows(sheetName).find(function (item) { return item._row === rowNumber; });
  if (!record) throw apiError('Registro não encontrado.', 'DATABASE_ERROR', 500);
  Object.keys(changes).forEach(function (key) { if (headers.indexOf(key) !== -1) record[key] = changes[key]; });
  sheet.getRange(rowNumber, 1, 1, headers.length).setValues([headers.map(function (header) { return record[header] === undefined ? '' : record[header]; })]);
}
function deleteRow(sheetName, rowNumber) {
  getSpreadsheet().getSheetByName(sheetName).deleteRow(rowNumber);
  if (REQUEST_CONTEXT) delete REQUEST_CONTEXT.rows[sheetName];
}
