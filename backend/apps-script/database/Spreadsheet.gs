function getSpreadsheet() {
  if (REQUEST_CONTEXT && REQUEST_CONTEXT.spreadsheet) return REQUEST_CONTEXT.spreadsheet;
  var id = PropertiesService.getScriptProperties().getProperty(APP_CONFIG.SPREADSHEET_ID_PROPERTY);
  if (!id) throw apiError('Banco de dados não configurado.', 'CONFIGURATION_ERROR', 500);
  var spreadsheet = SpreadsheetApp.openById(id);
  if (REQUEST_CONTEXT) REQUEST_CONTEXT.spreadsheet = spreadsheet;
  return spreadsheet;
}

function beginRequestContext() {
  REQUEST_CONTEXT = { spreadsheet: null, rows: {} };
}

function initializeDatabase() {
  var spreadsheet = getSpreadsheet();
  Object.keys(APP_CONFIG.HEADERS).forEach(function (name) {
    var sheet = spreadsheet.getSheetByName(name) || spreadsheet.insertSheet(name);
    var headers = APP_CONFIG.HEADERS[name];
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      return;
    }
    var existingHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    headers.forEach(function (header) {
      if (existingHeaders.indexOf(header) === -1) {
        sheet.getRange(1, existingHeaders.length + 1).setValue(header);
        existingHeaders.push(header);
      }
    });
  });
}

function configureGatekeeper(spreadsheetId, frontendUrl) {
  var properties = PropertiesService.getScriptProperties();
  spreadsheetId = spreadsheetId || properties.getProperty(APP_CONFIG.SPREADSHEET_ID_PROPERTY);
  frontendUrl = frontendUrl || properties.getProperty(APP_CONFIG.FRONTEND_URL_PROPERTY);
  if (!spreadsheetId || !frontendUrl) throw new Error('Informe o ID da planilha e a URL do frontend na primeira configuração.');
  properties.setProperties({
    GATEKEEPER_SPREADSHEET_ID: spreadsheetId,
    GATEKEEPER_FRONTEND_URL: frontendUrl.replace(/\/$/, '')
  });
  initializeDatabase();
  ensureConfirmationReminderTrigger();
}

function upgradeGatekeeper() {
  var properties = PropertiesService.getScriptProperties();
  var spreadsheetId = properties.getProperty(APP_CONFIG.SPREADSHEET_ID_PROPERTY);
  var frontendUrl = properties.getProperty(APP_CONFIG.FRONTEND_URL_PROPERTY);
  if (!spreadsheetId || !frontendUrl) throw new Error('A instalação ainda não foi configurada. Execute configureGatekeeper(ID_DA_PLANILHA, URL_DO_FRONTEND) pelo editor de código.');
  configureGatekeeper(spreadsheetId, frontendUrl);
}

function configureInviteAdmins(emails) {
  var normalized = String(emails || '').split(',').map(normalizeEmail).filter(function (email) { return !!email; });
  if (!normalized.length) throw new Error('Informe ao menos um e-mail administrador.');
  PropertiesService.getScriptProperties().setProperty(APP_CONFIG.INVITE_ADMIN_EMAILS_PROPERTY, normalized.join(','));
}
