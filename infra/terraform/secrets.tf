# Placeholder SecureString parameters. Terraform creates them once; you fill the
# real values out of band (console or CLI) and Terraform never reads/overwrites
# them again (ignore_changes on value). Set a real value with, e.g.:
#
#   aws ssm put-parameter --overwrite --type SecureString \
#     --name /homiq/dev/MONGO_URI \
#     --value 'mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true&w=majority'
resource "aws_ssm_parameter" "this" {
  for_each = toset(local.ssm_secrets)

  name  = "/${var.project}/${var.environment}/${each.key}"
  type  = "SecureString"
  value = "CHANGE_ME"

  lifecycle {
    ignore_changes = [value]
  }
}
