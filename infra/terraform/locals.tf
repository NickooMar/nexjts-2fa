locals {
  name = "${var.project}-${var.environment}"

  # One ECR repo + one ECS service per app.
  services = ["frontend", "main", "auth", "user", "email"]

  # Backend apps that other services reach by internal DNS (Cloud Map).
  # The frontend is reached only via the public ALB, so it is intentionally absent.
  discovery_services = ["main", "auth", "user", "email"]

  # Private DNS namespace, e.g. "homiq.local" -> "auth.homiq.local".
  namespace = "${var.project}.local"

  # Public base URL: a custom domain if provided, otherwise the ALB DNS name.
  # Used for NextAuth (AUTH_URL) and the backend FRONTEND_URL (CORS / email links).
  public_base_url = var.domain_name != "" ? "https://${var.domain_name}" : "http://${aws_lb.this.dns_name}"

  # Internal URL the Next.js server actions use to reach the gateway.
  internal_api_url = "http://main.${local.namespace}:3000"

  # SecureString parameters created as placeholders; real values are filled out of
  # band (console / CLI) and ignored by Terraform afterwards.
  ssm_secrets = [
    "JWT_SECRET",
    "MONGO_URI",
    "RESEND_API_KEY",
    "AUTH_SECRET",
    "AUTH_GOOGLE_ID",
    "AUTH_GOOGLE_SECRET",
    "AUTH_GITHUB_ID",
    "AUTH_GITHUB_SECRET",
  ]

  # Every backend service validates the FULL Joi env schema on boot (all fields
  # required), so each task gets the complete set or it crashes at startup.
  backend_base_env = {
    NODE_ENV              = "production"
    PORT                  = "3000"
    JWT_SECRET_EXPIRES_IN = "1d"
    FRONTEND_URL          = local.public_base_url
    RESEND_FROM_EMAIL     = var.resend_from_email

    # Connection targets for the gateway (overridden to 0.0.0.0 on each
    # microservice so it binds all interfaces — see *_env locals below).
    AUTH_SERVICE_HOST  = "auth.${local.namespace}"
    AUTH_SERVICE_PORT  = "3001"
    USER_SERVICE_HOST  = "user.${local.namespace}"
    USER_SERVICE_PORT  = "3002"
    EMAIL_SERVICE_HOST = "email.${local.namespace}"
    EMAIL_SERVICE_PORT = "3003"
  }

  # Per-service env. The microservice overrides its own *_SERVICE_HOST to 0.0.0.0
  # (bind address); the gateway keeps the DNS names (connect address).
  main_env  = local.backend_base_env
  auth_env  = merge(local.backend_base_env, { AUTH_SERVICE_HOST = "0.0.0.0" })
  user_env  = merge(local.backend_base_env, { USER_SERVICE_HOST = "0.0.0.0" })
  email_env = merge(local.backend_base_env, { EMAIL_SERVICE_HOST = "0.0.0.0" })

  frontend_env = {
    NODE_ENV    = "production"
    PORT        = "3000"
    HOSTNAME    = "0.0.0.0"
    ENVIRONMENT = var.environment

    # All backend calls happen in server actions over internal DNS.
    NEST_BACKEND_PUBLIC_API_URL = local.internal_api_url
    # Browser never calls the backend directly; kept only as a harmless fallback.
    NEXT_PUBLIC_API_URL = local.public_base_url

    # NextAuth v5 behind a proxy/ALB.
    AUTH_URL        = local.public_base_url
    AUTH_TRUST_HOST = "true"
  }

  backend_secrets = [
    { name = "JWT_SECRET", valueFrom = aws_ssm_parameter.this["JWT_SECRET"].arn },
    { name = "MONGO_URI", valueFrom = aws_ssm_parameter.this["MONGO_URI"].arn },
    { name = "RESEND_API_KEY", valueFrom = aws_ssm_parameter.this["RESEND_API_KEY"].arn },
  ]

  frontend_secrets = [
    { name = "AUTH_SECRET", valueFrom = aws_ssm_parameter.this["AUTH_SECRET"].arn },
    { name = "AUTH_GOOGLE_ID", valueFrom = aws_ssm_parameter.this["AUTH_GOOGLE_ID"].arn },
    { name = "AUTH_GOOGLE_SECRET", valueFrom = aws_ssm_parameter.this["AUTH_GOOGLE_SECRET"].arn },
    { name = "AUTH_GITHUB_ID", valueFrom = aws_ssm_parameter.this["AUTH_GITHUB_ID"].arn },
    { name = "AUTH_GITHUB_SECRET", valueFrom = aws_ssm_parameter.this["AUTH_GITHUB_SECRET"].arn },
  ]
}
