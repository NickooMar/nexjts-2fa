export const Clients = {
  MAIN_CLIENT: 'MAIN_CLIENT',
  AUTH_CLIENT: 'AUTH_CLIENT',
  USER_CLIENT: 'USER_CLIENT',
  EMAIL_CLIENT: 'EMAIL_CLIENT',
} as const;

export const Services = {
  MAIN_SERVICE: 'MAIN_SERVICE',
  AUTH_SERVICE: 'AUTH_SERVICE',
  USER_SERVICE: 'USER_SERVICE',
  EMAIL_SERVICE: 'EMAIL_SERVICE',
} as const;

export const Repositories = {
  USER_REPOSITORY: 'USER_REPOSITORY',
} as const;

export const MongoDatabases = {
  MAIN_DATABASE: 'TEST_2FA ',
} as const;

export const AuthPatterns = {
  SIGNIN: 'AUTH_SIGNIN',
  SIGNUP: 'AUTH_SIGNUP',
  VERIFY_EMAIL: 'AUTH_VERIFY_EMAIL',
  FIND_USER_BY_EMAIL: 'AUTH_FIND_USER_BY_EMAIL',
  VERIFY_EMAIL_VERIFICATION_TOKEN: 'AUTH_VERIFY_EMAIL_VERIFICATION_TOKEN',
} as const;

export const UserPatterns = {
  CREATE: 'USER_CREATE',
  UPDATE: 'USER_UPDATE',
  FIND_BY_ID: 'USER_FIND_BY_ID',
  FIND_BY_EMAIL: 'USER_FIND_BY_EMAIL',
} as const;

export const EmailPatterns = {
  SEND_VERIFICATION_EMAIL: 'EMAIL_SEND_VERIFICATION_EMAIL',
} as const;

export const EmailProviders = {
  RESEND: 'RESEND',
} as const;
