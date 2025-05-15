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

  // Frontend
  FRONTEND_URL: Joi.string().default('http://localhost:4000').required(),

  // Mongoose
  MONGO_URI: Joi.string().required(),

  // Resend
  RESEND_API_KEY: Joi.string().required(),
  RESEND_FROM_EMAIL: Joi.string().required().email(),
});
