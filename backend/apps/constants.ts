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
  SIGNIN: 'SIGNIN',
  SIGNUP: 'SIGNUP',
} as const;

export const UserPatterns = {
  FIND_BY_EMAIL: 'FIND_BY_EMAIL',
  CREATE: 'CREATE',
} as const;

export const EmailPatterns = {
  SEND_VERIFICATION_EMAIL: 'SEND_VERIFICATION_EMAIL',
} as const;
