function doGet(event) { return handleRequest('GET', event); }
function doPost(event) { return handleRequest('POST', event); }

function handleRequest(method, event) {
  beginRequestContext();
  try {
    var params = (event && event.parameter) || {}, body = {};
    if (event && event.postData && event.postData.contents) body = JSON.parse(event.postData.contents);
    var payload = Object.assign({}, params, body);
    var route = payload.route || (event && event.pathInfo) || '';
    var requestedMethod = String(payload._method || method).toUpperCase();
    var token = payload.token || ((event && event.headers && (event.headers.Authorization || event.headers.authorization)) || '').replace(/^Bearer\s+/i, '');
    return toApiResponse(routeRequest(requestedMethod, route, payload, token));
  } catch (error) {
    if (error && error.isApiError) return toApiResponse(failure(error.message, error.code, error.status));
    console.error(error && error.stack ? error.stack : error);
    return toApiResponse(failure('Não foi possível concluir a operação.', 'INTERNAL_ERROR', 500));
  }
}
