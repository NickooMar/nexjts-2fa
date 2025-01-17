import { plainToInstance } from 'class-transformer';
import {
  Max,
  Min,
  IsEnum,
  IsString,
  IsNumber,
  validateSync,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
  Provision = 'provision',
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment;

  @IsNumber()
  @Min(0)
  @Max(65535)
  PORT: number;

  @IsString()
  JWT_SECRET: string;

  @IsString()
  JWT_SECRET_EXPIRES_IN: string;

  @IsString()
  AUTH_SERVICE_HOST: string;

  @IsNumber()
  @Min(0)
  @Max(65535)
  AUTH_SERVICE_PORT: number;

  @IsString()
  USER_SERVICE_HOST: string;

  @IsNumber()
  @Min(0)
  @Max(65535)
  USER_SERVICE_PORT: number;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}
