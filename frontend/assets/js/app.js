function showMessage(element, message, isError = false) { element.textContent = message; element.className = `message ${isError ? 'error' : 'success'}`; }
function queryToken() { return new URLSearchParams(location.search).get('token'); }
function redirectIfLoggedIn() { if (Session.get()) location.replace('perfil.html'); }
