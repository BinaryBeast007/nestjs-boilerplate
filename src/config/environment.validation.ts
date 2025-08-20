import Joi from 'joi';

export const validationSchema = Joi.object({
  PORT: Joi.number().default(3000),
  DATABASE_HOST: Joi.string().required(),
  DATABASE_PORT: Joi.number().default(5432),
  DATABASE_USER: Joi.string().required(),
  DATABASE_PASSWORD: Joi.string().required().allow(''),
  DATABASE_NAME: Joi.string().required(),
  DATABASE_SYNC: Joi.boolean().default(false),
  DATABASE_AUTOLOAD: Joi.boolean().default(true),
  JWT_ACCESS_SECRET: Joi.string().required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
  EMAIL_HOST: Joi.string().required(),
  EMAIL_PORT: Joi.number().default(587),
  EMAIL_USER: Joi.string().required(),
  EMAIL_PASS: Joi.string().required().allow(''),
  EMAIL_FROM: Joi.string().required(),
  FRONTEND_URL: Joi.string().uri().default('http://localhost:3001'),
});
