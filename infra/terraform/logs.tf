resource "aws_cloudwatch_log_group" "this" {
  for_each = toset(local.services)

  name              = "/ecs/${local.name}/${each.key}"
  retention_in_days = 14
}
