const APP_CONFIG = {
  API_VERSION: 'v1',
  SPREADSHEET_ID_PROPERTY: 'GATEKEEPER_SPREADSHEET_ID',
  FRONTEND_URL_PROPERTY: 'GATEKEEPER_FRONTEND_URL',
  INVITE_ADMIN_EMAILS_PROPERTY: 'GATEKEEPER_INVITE_ADMIN_EMAILS',
  EMAIL_QUEUE_PROPERTY: 'GATEKEEPER_EMAIL_QUEUE',
  EMAIL_QUEUE_HANDLER: 'processEmailQueue',
  EMAIL_REMINDER_HANDLER: 'processRegistrationEmailReminders',
  SESSION_CACHE_TTL_SECONDS: 300,
  SESSION_TTL_MS: 60 * 60 * 1000,
  TOKEN_TTL_MS: {
    CONFIRMACAO_CADASTRO: 24 * 60 * 60 * 1000,
    ALTERACAO_EMAIL: 30 * 60 * 1000,
    RECUPERACAO_SENHA: 30 * 60 * 1000
  },
  SHEETS: {
    USERS: 'Usuarios', VALIDATIONS: 'Validacoes', SESSIONS: 'Sessoes', INVITES: 'Convites', LOGS: 'Logs'
  },
  HEADERS: {
    Usuarios: ['id_usuario', 'nome', 'sobrenome', 'email', 'email_confirmado_em', 'senha_hash', 'status', 'criado_em', 'ultimo_login_em'],
    Validacoes: ['id_validacao', 'id_usuario', 'tipo', 'valor', 'token', 'status', 'criado_em', 'expira_em', 'utilizado_em', 'lembrete_enviado_em'],
    Sessoes: ['id_sessao', 'id_usuario', 'token', 'status', 'criado_em', 'ultimo_acesso_em', 'expira_em', 'encerrado_em'],
    Convites: ['id_convite', 'email', 'token', 'status', 'criado_em', 'expira_em', 'utilizado_em', 'criado_por'],
    Logs: ['id_log', 'id_usuario', 'evento', 'descricao', 'criado_em']
  }
};

const USER_STATUS = { PENDING: 'PENDENTE', ACTIVE: 'ATIVO' };
const VALIDATION_STATUS = { PENDING: 'PENDENTE', USED: 'UTILIZADO', EXPIRED: 'EXPIRADO', REPLACED: 'SUBSTITUIDO' };
const SESSION_STATUS = { ACTIVE: 'ATIVA', EXPIRED: 'EXPIRADA', CLOSED: 'ENCERRADA' };
const VALIDATION_TYPE = { REGISTRATION: 'CONFIRMACAO_CADASTRO', EMAIL_CHANGE: 'ALTERACAO_EMAIL', PASSWORD_RESET: 'RECUPERACAO_SENHA' };
const INVITE_STATUS = { PENDING: 'PENDENTE', USED: 'UTILIZADO', EXPIRED: 'EXPIRADO', REPLACED: 'SUBSTITUIDO' };
var REQUEST_CONTEXT = null;
