# Gatekeeper Apps Script

1. Crie uma planilha Google vazia e um projeto Apps Script vinculado a ela.
2. Copie os arquivos desta pasta para o projeto (ou use `clasp`).
3. Na primeira instalação, execute `configureGatekeeper('ID_DA_PLANILHA', 'URL_DO_FRONTEND')` pelo editor de código. Isso cria ou atualiza as abas `Usuarios`, `Validacoes`, `Sessoes` e `Logs`, e instala o gatilho horário do lembrete de confirmação. Para atualizar uma instalação já configurada pelo botão **Executar**, selecione e execute `upgradeGatekeeper`.
4. Implante como aplicativo da web, executado por você e acessível por qualquer pessoa, e copie a URL `/exec` para `frontend/assets/js/config.js`.

O frontend chama a URL com `?route=<endpoint>`. No Apps Script, métodos como `GET /profile` e `PATCH /profile` são transportados como POST com `_method`, pois web apps do Apps Script só oferecem `doGet` e `doPost`. Assim, o token da sessão não é colocado na URL.
