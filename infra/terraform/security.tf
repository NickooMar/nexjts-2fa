# Public ALB — the only internet-facing entry point.
resource "aws_security_group" "alb" {
  name_prefix = "${local.name}-alb-"
  description = "Public ALB ingress"
  vpc_id      = aws_vpc.this.id

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags       = { Name = "${local.name}-alb-sg" }
  lifecycle { create_before_destroy = true }
}

# Frontend tasks — reachable only from the ALB.
resource "aws_security_group" "frontend" {
  name_prefix = "${local.name}-frontend-"
  description = "Next.js frontend tasks"
  vpc_id      = aws_vpc.this.id

  ingress {
    description     = "ALB to frontend"
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags       = { Name = "${local.name}-frontend-sg" }
  lifecycle { create_before_destroy = true }
}

# Gateway (main) — private. Reached only by frontend server actions over Cloud Map DNS.
resource "aws_security_group" "gateway" {
  name_prefix = "${local.name}-gateway-"
  description = "NestJS HTTP gateway (main)"
  vpc_id      = aws_vpc.this.id

  ingress {
    description     = "Frontend server actions to gateway"
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.frontend.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags       = { Name = "${local.name}-gateway-sg" }
  lifecycle { create_before_destroy = true }
}

# TCP microservices (auth/user/email) — reachable only from the gateway.
resource "aws_security_group" "backend" {
  name_prefix = "${local.name}-backend-"
  description = "NestJS TCP microservices (auth/user/email)"
  vpc_id      = aws_vpc.this.id

  ingress {
    description     = "Gateway to TCP microservices"
    from_port       = 3001
    to_port         = 3003
    protocol        = "tcp"
    security_groups = [aws_security_group.gateway.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags       = { Name = "${local.name}-backend-sg" }
  lifecycle { create_before_destroy = true }
}
