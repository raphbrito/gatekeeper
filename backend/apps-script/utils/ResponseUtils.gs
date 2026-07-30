function jsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}

function success(message, data, status) {
  return { success: true, message: message, data: data || {}, status: status || 200 };
}

function failure(message, code, status) {
  return { success: false, message: message, error: { code: code }, status: status || 400 };
}

function toApiResponse(result) {
  // Apps Script ContentService cannot set an HTTP status; status is kept in the JSON contract.
  delete result.status;
  return jsonResponse(result);
}
