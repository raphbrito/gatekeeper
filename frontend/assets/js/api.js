const Api = {
  async request(route, method = 'POST', data = {}, authenticated = false) {
    if (!window.GATEKEEPER_API_URL || window.GATEKEEPER_API_URL.includes('COLE_AQUI')) throw new Error('Configure a URL da API em assets/js/config.js.');
    const url = new URL(window.GATEKEEPER_API_URL);
    url.searchParams.set('route', route);
    const payload = { ...data, route };
    if (authenticated) payload.token = Session.get();
    // Apps Script exposes doGet/doPost only. Methods other than POST travel in the body
    // so the session token never appears in a URL.
    const response = await fetch(url.toString(), { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(method === 'POST' ? payload : { ...payload, _method: method }) });
    const result = await response.json().catch(() => { throw new Error('Resposta inválida da API.'); });
    if (!result.success) { if (result.error && ['UNAUTHORIZED', 'SESSION_EXPIRED'].includes(result.error.code)) Session.clear(); throw new Error(result.message); }
    return result;
  }
};
