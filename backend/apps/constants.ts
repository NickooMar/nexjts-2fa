export const Clients = {
  MAIN_CLIENT: 'MAIN_CLIENT',
  AUTH_CLIENT: 'AUTH_CLIENT',
  USER_CLIENT: 'USER_CLIENT',
} as const;

export const Services = {
  MAIN_SERVICE: 'MAIN_SERVICE',
  AUTH_SERVICE: 'AUTH_SERVICE',
  USER_SERVICE: 'USER_SERVICE',
} as const;

export const Repositories = {
  USER_REPOSITORY: 'USER_REPOSITORY',
} as const;

export const MongoDatabases = {
  MAIN_DATABASE: 'TEST_2FA ',
} as const;

export const AuthPatterns = {
  SIGNIN: 'signin',
} as const;
