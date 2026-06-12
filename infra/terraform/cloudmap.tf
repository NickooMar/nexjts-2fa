# Private DNS namespace so the gateway can resolve auth/user/email by name, and
# the frontend can resolve the gateway — replacing docker-compose's container DNS.
resource "aws_service_discovery_private_dns_namespace" "this" {
  name        = local.namespace
  description = "${local.name} internal service discovery"
  vpc         = aws_vpc.this.id
}

resource "aws_service_discovery_service" "this" {
  for_each = toset(local.discovery_services)

  name = each.key

  dns_config {
    namespace_id   = aws_service_discovery_private_dns_namespace.this.id
    routing_policy = "MULTIVALUE"

    dns_records {
      ttl  = 10
      type = "A"
    }
  }

  # ECS updates instance health; record is created when a task registers.
  health_check_custom_config {
    failure_threshold = 1
  }
}
