resource "aws_ecs_cluster" "this" {
  name = local.name

  setting {
    name  = "containerInsights"
    value = "disabled" # enable for richer metrics (costs extra)
  }
}

# ---------------------------------------------------------------------------
# Task definitions
# ---------------------------------------------------------------------------

# Gateway (main): HTTP :3000, fans out to the TCP microservices.
resource "aws_ecs_task_definition" "main" {
  family                   = "${local.name}-main"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.gateway_cpu
  memory                   = var.gateway_memory
  execution_role_arn       = aws_iam_role.task_execution.arn
  task_role_arn            = aws_iam_role.task.arn

  container_definitions = jsonencode([{
    name         = "main"
    image        = "${aws_ecr_repository.this["main"].repository_url}:${var.image_tag}"
    essential    = true
    portMappings = [{ containerPort = 3000, protocol = "tcp" }]
    environment  = [for k, v in local.main_env : { name = k, value = v }]
    secrets      = local.backend_secrets
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.this["main"].name
        "awslogs-region"        = var.region
        "awslogs-stream-prefix" = "main"
      }
    }
  }])
}

resource "aws_ecs_task_definition" "auth" {
  family                   = "${local.name}-auth"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.backend_cpu
  memory                   = var.backend_memory
  execution_role_arn       = aws_iam_role.task_execution.arn
  task_role_arn            = aws_iam_role.task.arn

  container_definitions = jsonencode([{
    name         = "auth"
    image        = "${aws_ecr_repository.this["auth"].repository_url}:${var.image_tag}"
    essential    = true
    portMappings = [{ containerPort = 3001, protocol = "tcp" }]
    environment  = [for k, v in local.auth_env : { name = k, value = v }]
    secrets      = local.backend_secrets
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.this["auth"].name
        "awslogs-region"        = var.region
        "awslogs-stream-prefix" = "auth"
      }
    }
  }])
}

resource "aws_ecs_task_definition" "user" {
  family                   = "${local.name}-user"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.backend_cpu
  memory                   = var.backend_memory
  execution_role_arn       = aws_iam_role.task_execution.arn
  task_role_arn            = aws_iam_role.task.arn

  container_definitions = jsonencode([{
    name         = "user"
    image        = "${aws_ecr_repository.this["user"].repository_url}:${var.image_tag}"
    essential    = true
    portMappings = [{ containerPort = 3002, protocol = "tcp" }]
    environment  = [for k, v in local.user_env : { name = k, value = v }]
    secrets      = local.backend_secrets
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.this["user"].name
        "awslogs-region"        = var.region
        "awslogs-stream-prefix" = "user"
      }
    }
  }])
}

resource "aws_ecs_task_definition" "email" {
  family                   = "${local.name}-email"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.backend_cpu
  memory                   = var.backend_memory
  execution_role_arn       = aws_iam_role.task_execution.arn
  task_role_arn            = aws_iam_role.task.arn

  container_definitions = jsonencode([{
    name         = "email"
    image        = "${aws_ecr_repository.this["email"].repository_url}:${var.image_tag}"
    essential    = true
    portMappings = [{ containerPort = 3003, protocol = "tcp" }]
    environment  = [for k, v in local.email_env : { name = k, value = v }]
    secrets      = local.backend_secrets
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.this["email"].name
        "awslogs-region"        = var.region
        "awslogs-stream-prefix" = "email"
      }
    }
  }])
}

resource "aws_ecs_task_definition" "frontend" {
  family                   = "${local.name}-frontend"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.frontend_cpu
  memory                   = var.frontend_memory
  execution_role_arn       = aws_iam_role.task_execution.arn
  task_role_arn            = aws_iam_role.task.arn

  container_definitions = jsonencode([{
    name         = "frontend"
    image        = "${aws_ecr_repository.this["frontend"].repository_url}:${var.image_tag}"
    essential    = true
    portMappings = [{ containerPort = 3000, protocol = "tcp" }]
    environment  = [for k, v in local.frontend_env : { name = k, value = v }]
    secrets      = local.frontend_secrets
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.this["frontend"].name
        "awslogs-region"        = var.region
        "awslogs-stream-prefix" = "frontend"
      }
    }
  }])
}

# ---------------------------------------------------------------------------
# Services
# ---------------------------------------------------------------------------

# Frontend: public via ALB, no service discovery.
resource "aws_ecs_service" "frontend" {
  name            = "frontend"
  cluster         = aws_ecs_cluster.this.id
  task_definition = aws_ecs_task_definition.frontend.arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.frontend.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.frontend.arn
    container_name   = "frontend"
    container_port   = 3000
  }

  depends_on = [aws_lb_listener.http]
}

# Gateway: private, registered in Cloud Map as main.<namespace>.
resource "aws_ecs_service" "main" {
  name            = "main"
  cluster         = aws_ecs_cluster.this.id
  task_definition = aws_ecs_task_definition.main.arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.gateway.id]
    assign_public_ip = false
  }

  service_registries {
    registry_arn = aws_service_discovery_service.this["main"].arn
  }
}

resource "aws_ecs_service" "auth" {
  name            = "auth"
  cluster         = aws_ecs_cluster.this.id
  task_definition = aws_ecs_task_definition.auth.arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.backend.id]
    assign_public_ip = false
  }

  service_registries {
    registry_arn = aws_service_discovery_service.this["auth"].arn
  }
}

resource "aws_ecs_service" "user" {
  name            = "user"
  cluster         = aws_ecs_cluster.this.id
  task_definition = aws_ecs_task_definition.user.arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.backend.id]
    assign_public_ip = false
  }

  service_registries {
    registry_arn = aws_service_discovery_service.this["user"].arn
  }
}

resource "aws_ecs_service" "email" {
  name            = "email"
  cluster         = aws_ecs_cluster.this.id
  task_definition = aws_ecs_task_definition.email.arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.backend.id]
    assign_public_ip = false
  }

  service_registries {
    registry_arn = aws_service_discovery_service.this["email"].arn
  }
}
