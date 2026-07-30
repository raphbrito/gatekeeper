function getSpreadsheet() {
  var id = PropertiesService.getScriptProperties().getProperty(APP_CONFIG.SPREADSHEET_ID_PROPERTY);
  if (!id) throw apiError('Banco de dados não configurado.', 'CONFIGURATION_ERROR', 500);
  return SpreadsheetApp.openById(id);
}

function initializeDatabase() {
  var spreadsheet = getSpreadsheet();
  Object.keys(APP_CONFIG.HEADERS).forEach(function (name) {
    var sheet = spreadsheet.getSheetByName(name) || spreadsheet.insertSheet(name);
    var headers = APP_CONFIG.HEADERS[name];
    if (sheet.getLastRow() === 0) sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  });
}

function configureGatekeeper(spreadsheetId, frontendUrl) {
  PropertiesService.getScriptProperties().setProperties({
    GATEKEEPER_SPREADSHEET_ID: spreadsheetId,
    GATEKEEPER_FRONTEND_URL: frontendUrl.replace(/\/$/, '')
  });
  initializeDatabase();
}
