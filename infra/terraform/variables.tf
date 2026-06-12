variable "project" {
  description = "Project slug, used to prefix resource names and the Cloud Map namespace."
  type        = string
  default     = "homiq"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)."
  type        = string
  default     = "dev"
}

variable "region" {
  description = "AWS region to deploy into."
  type        = string
  default     = "us-east-1"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC."
  type        = string
  default     = "10.0.0.0/16"
}

variable "az_count" {
  description = "Number of Availability Zones to spread subnets across."
  type        = number
  default     = 2
}

variable "image_tag" {
  description = "Container image tag the task definitions reference. CI pushes :latest and force-redeploys."
  type        = string
  default     = "latest"
}

variable "desired_count" {
  description = "Number of tasks per ECS service."
  type        = number
  default     = 1
}

# --- Fargate task sizing (valid CPU/memory combos only) ---
variable "backend_cpu" {
  type    = number
  default = 256
}

variable "backend_memory" {
  type    = number
  default = 512
}

variable "gateway_cpu" {
  type    = number
  default = 256
}

variable "gateway_memory" {
  type    = number
  default = 512
}

variable "frontend_cpu" {
  type    = number
  default = 256
}

variable "frontend_memory" {
  type    = number
  default = 512
}

# --- App config ---
variable "resend_from_email" {
  description = "Verified Resend sender address (must be a real verified domain/address)."
  type        = string
  default     = "no-reply@example.com"
}

variable "domain_name" {
  description = "Optional custom domain for the frontend. When empty, the ALB DNS name is used."
  type        = string
  default     = ""
}

variable "certificate_arn" {
  description = "Optional ACM certificate ARN. When set, an HTTPS (:443) listener is added to the ALB."
  type        = string
  default     = ""
}
