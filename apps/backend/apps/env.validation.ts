import * as Joi from 'joi';

export enum Environment {
  Test = 'test',
  Production = 'production',
  Development = 'development',
}

export const validationSchema = Joi.object({
  // Application
  PORT: Joi.number().default(3000).required(),
  NODE_ENV: Joi.string()
    .valid(...Object.values(Environment))
    .default(Environment.Development)
    .required(),

  // JWT
  JWT_SECRET: Joi.string().required(),
  JWT_SECRET_EXPIRES_IN: Joi.string().default('1d').required(),

  // Auth Service
  AUTH_SERVICE_HOST: Joi.string().default('localhost').required(),
  AUTH_SERVICE_PORT: Joi.number().default(3001).required(),

  // User Service
  USER_SERVICE_HOST: Joi.string().default('localhost').required(),
  USER_SERVICE_PORT: Joi.number().default(3002).required(),

  // Email Service
  EMAIL_SERVICE_HOST: Joi.string().default('localhost').required(),
  EMAIL_SERVICE_PORT: Joi.number().default(3003).required(),

  // Billing Service
  BILLING_SERVICE_HOST: Joi.string().default('localhost'),
  BILLING_SERVICE_PORT: Joi.number().default(3004),
  // Active payment provider; new providers plug in via PaymentProvider
  // implementations without touching billing domain logic.
  BILLING_PAYMENT_PROVIDER: Joi.string()
    .valid('mock', 'stripe', 'mercadopago')
    .default('mock'),
  // HMAC secret for the mock provider's webhook signatures (real providers
  // bring their own verification scheme).
  BILLING_WEBHOOK_SECRET: Joi.string().default('dev-billing-webhook-secret'),
  // Plan (slug) new organizations are subscribed to automatically.
  BILLING_DEFAULT_PLAN: Joi.string().default('free'),
  // If the billing service is unreachable, limit checks pass (availability
  // over enforcement) — mirrors RATE_LIMIT_FAIL_OPEN.
  BILLING_ENFORCEMENT_FAIL_OPEN: Joi.boolean().default(true),
  // Days an unpaid (past_due) subscription keeps service before suspension.
  BILLING_PAST_DUE_GRACE_DAYS: Joi.number().integer().min(0).default(7),

  // Frontend
  FRONTEND_URL: Joi.string().default('http://localhost:4000').required(),

  // Mongoose
  MONGO_URI: Joi.string().required(),

  // Resend
  RESEND_API_KEY: Joi.string().required(),
  RESEND_FROM_EMAIL: Joi.string().required().email(),

  // Security / rate limiting (gateway only — all optional with safe defaults)
  REDIS_URL: Joi.string().uri().optional(),
  TRUST_PROXY: Joi.string().default('1'),
  RATE_LIMIT_ENABLED: Joi.boolean().default(true),
  RATE_LIMIT_FAIL_OPEN: Joi.boolean().default(true),

  // Global ceilings
  RATE_LIMIT_IP_LIMIT: Joi.number().integer().min(1).default(300),
  RATE_LIMIT_IP_TTL_SECONDS: Joi.number().integer().min(1).default(60),
  RATE_LIMIT_IP_BLOCK_SECONDS: Joi.number().integer().min(1).default(60),
  RATE_LIMIT_IDENTITY_LIMIT: Joi.number().integer().min(1).default(120),
  RATE_LIMIT_IDENTITY_TTL_SECONDS: Joi.number().integer().min(1).default(60),
  RATE_LIMIT_IDENTITY_BLOCK_SECONDS: Joi.number().integer().min(1).default(60),

  // Per-endpoint policies: RATE_LIMIT_<POLICY>_{LIMIT,TTL_SECONDS,BLOCK_SECONDS}
  // for SIGNIN, SIGNUP, CHECK_EMAIL, REFRESH, VERIFY_EMAIL, CREATE_ORG,
  // INVITATION, JOIN_ORG, SWITCH_ORG — defaults in throttle-policies.ts.

  // Brute-force lockouts: LOCKOUT_<SCOPE>_{MAX_ATTEMPTS,WINDOW_SECONDS,
  // BASE_LOCK_SECONDS,MAX_LOCK_SECONDS} for LOGIN_ACCOUNT, LOGIN_IP,
  // VERIFY_EMAIL, INVITE_JOIN — defaults in security.config.ts.

  // Object storage (S3 in production, MinIO locally — same S3 API).
  // Defaults target the docker-compose MinIO instance so local dev is
  // zero-config; production sets STORAGE_PROVIDER=s3 (+ IAM or static keys).
  STORAGE_PROVIDER: Joi.string().valid('s3', 'minio').default('minio'),
  STORAGE_BUCKET: Joi.string().default('property-manager-media'),
  STORAGE_REGION: Joi.string().default('us-east-1'),
  STORAGE_ACCESS_KEY_ID: Joi.string().allow('').optional(),
  STORAGE_SECRET_ACCESS_KEY: Joi.string().allow('').optional(),
  STORAGE_ENDPOINT: Joi.string().uri().optional(),
  STORAGE_PUBLIC_ENDPOINT: Joi.string().uri().optional(),
  STORAGE_FORCE_PATH_STYLE: Joi.boolean().optional(),
  STORAGE_URL_MODE: Joi.string().valid('signed', 'public').default('signed'),
  STORAGE_SIGNED_URL_TTL_SECONDS: Joi.number().integer().min(60).default(900),

  // Bot detection / CAPTCHA
  BOT_DETECTION_ENABLED: Joi.boolean().default(true),
  BOT_FLAG_THRESHOLD: Joi.number().integer().min(1).default(10),
  CAPTCHA_ENABLED: Joi.boolean().default(false),
  CAPTCHA_MODE: Joi.string().valid('flagged', 'always').default('flagged'),
  CAPTCHA_PROVIDER: Joi.string()
    .valid('turnstile', 'recaptcha')
    .default('turnstile'),
  CAPTCHA_SECRET: Joi.string().when('CAPTCHA_ENABLED', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
});
