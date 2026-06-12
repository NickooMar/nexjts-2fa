data "aws_iam_policy_document" "ecs_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

# Execution role: ECS agent uses it to pull images, read secrets, write logs.
resource "aws_iam_role" "task_execution" {
  name               = "${local.name}-task-execution"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume.json
}

resource "aws_iam_role_policy_attachment" "task_execution" {
  role       = aws_iam_role.task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Permission to read the SSM SecureString parameters referenced by `secrets`.
data "aws_iam_policy_document" "task_secrets" {
  statement {
    sid       = "ReadSsmParameters"
    actions   = ["ssm:GetParameters", "ssm:GetParameter"]
    resources = [for p in aws_ssm_parameter.this : p.arn]
  }

  # SecureString uses the AWS-managed SSM key; scope decrypt to the SSM service.
  statement {
    sid       = "DecryptSsm"
    actions   = ["kms:Decrypt"]
    resources = ["*"]
    condition {
      test     = "StringEquals"
      variable = "kms:ViaService"
      values   = ["ssm.${var.region}.amazonaws.com"]
    }
  }
}

resource "aws_iam_role_policy" "task_secrets" {
  name   = "${local.name}-task-secrets"
  role   = aws_iam_role.task_execution.id
  policy = data.aws_iam_policy_document.task_secrets.json
}

# Task role: the running app's identity. No AWS API calls today, but having a
# distinct role makes adding S3/SES/etc. later a one-line change.
resource "aws_iam_role" "task" {
  name               = "${local.name}-task"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume.json
}
