/**
 * Central place for every security/rate-limiting knob. All values are read
 * from the environment at request time (the throttler accepts resolvable
 * functions), so limits can be tuned per deployment without code changes.
 */

export const envInt = (key: string, fallback: number): number => {
  const raw = process.env[key];
  if (raw === undefined || raw === '') return fallback;
  const parsed = parseInt(raw, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export const envBool = (key: string, fallback: boolean): boolean => {
  const raw = process.env[key];
  if (raw === undefined || raw === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(raw.toLowerCase());
};

export const envStr = (key: string, fallback: string): string =>
  process.env[key] || fallback;

export const seconds = (s: number): number => s * 1000;

/** True unless rate limiting is explicitly disabled (tests, local debugging). */
export const rateLimitingEnabled = (): boolean =>
  envBool('RATE_LIMIT_ENABLED', true);

/**
 * When Redis is unreachable, "fail open" lets traffic through (availability
 * over strictness) while logging loudly. Set to false to reject instead.
 */
export const rateLimitFailOpen = (): boolean =>
  envBool('RATE_LIMIT_FAIL_OPEN', true);

/** Window/limit pair for a named policy, overridable via environment. */
export interface AttemptPolicy {
  /** Failures tolerated inside the window before locking. */
  maxAttempts: number;
  /** Rolling window for counting failures (seconds). */
  windowSeconds: number;
  /** First lockout duration; doubles on every subsequent lockout. */
  baseLockSeconds: number;
  /** Upper bound for the progressive lockout. */
  maxLockSeconds: number;
}

export type AttemptScope =
  | 'login-account'
  | 'login-ip'
  | 'verify-email'
  | 'invite-join';

const ATTEMPT_DEFAULTS: Record<AttemptScope, AttemptPolicy> = {
  // Credential stuffing / password brute force, keyed by account email.
  'login-account': {
    maxAttempts: 5,
    windowSeconds: 900,
    baseLockSeconds: 300,
    maxLockSeconds: 86400,
  },
  // Same attack spread over many accounts from one address.
  'login-ip': {
    maxAttempts: 20,
    windowSeconds: 900,
    baseLockSeconds: 900,
    maxLockSeconds: 86400,
  },
  // 6-digit email verification codes are guessable; keyed by token.
  'verify-email': {
    maxAttempts: 5,
    windowSeconds: 900,
    baseLockSeconds: 300,
    maxLockSeconds: 3600,
  },
  // Invitation codes grant org membership; keyed by user id.
  'invite-join': {
    maxAttempts: 10,
    windowSeconds: 3600,
    baseLockSeconds: 600,
    maxLockSeconds: 86400,
  },
};

const scopeEnvPrefix = (scope: AttemptScope): string =>
  `LOCKOUT_${scope.toUpperCase().replace(/-/g, '_')}`;

export const attemptPolicy = (scope: AttemptScope): AttemptPolicy => {
  const prefix = scopeEnvPrefix(scope);
  const defaults = ATTEMPT_DEFAULTS[scope];
  return {
    maxAttempts: envInt(`${prefix}_MAX_ATTEMPTS`, defaults.maxAttempts),
    windowSeconds: envInt(`${prefix}_WINDOW_SECONDS`, defaults.windowSeconds),
    baseLockSeconds: envInt(
      `${prefix}_BASE_LOCK_SECONDS`,
      defaults.baseLockSeconds,
    ),
    maxLockSeconds: envInt(
      `${prefix}_MAX_LOCK_SECONDS`,
      defaults.maxLockSeconds,
    ),
  };
};

/** Bot / suspicious traffic detection. */
export const botDetectionConfig = () => ({
  enabled: envBool('BOT_DETECTION_ENABLED', true),
  // Patterns that mark a client as scripted. Extend via env (pipe-separated).
  uaPatterns: envStr(
    'BOT_UA_PATTERNS',
    'curl|wget|python-requests|python-urllib|httpclient|scrapy|go-http-client|libwww|phantomjs|headless',
  ),
  // Suspicion points accumulated inside the window before flagging.
  flagThreshold: envInt('BOT_FLAG_THRESHOLD', 10),
  windowSeconds: envInt('BOT_WINDOW_SECONDS', 600),
  flagTtlSeconds: envInt('BOT_FLAG_TTL_SECONDS', 3600),
});

/** Optional CAPTCHA for high-risk endpoints (disabled by default). */
export const captchaConfig = () => ({
  enabled: envBool('CAPTCHA_ENABLED', false),
  // 'flagged' challenges only suspicious clients; 'always' challenges everyone.
  mode: envStr('CAPTCHA_MODE', 'flagged') as 'flagged' | 'always',
  provider: envStr('CAPTCHA_PROVIDER', 'turnstile') as
    | 'turnstile'
    | 'recaptcha',
  secret: envStr('CAPTCHA_SECRET', ''),
  verifyUrl: envStr('CAPTCHA_VERIFY_URL', ''),
  timeoutMs: envInt('CAPTCHA_TIMEOUT_MS', 3000),
});

export const CAPTCHA_VERIFY_URLS: Record<string, string> = {
  turnstile: 'https://challenges.cloudflare.com/turnstile/v0/siteverify',
  recaptcha: 'https://www.google.com/recaptcha/api/siteverify',
};
