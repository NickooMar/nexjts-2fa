output "app_url" {
  description = "Public URL for the app."
  value       = local.public_base_url
}

output "alb_dns_name" {
  description = "ALB DNS name (point a CNAME/ALIAS here for a custom domain)."
  value       = aws_lb.this.dns_name
}

output "nat_eip" {
  description = "Static egress IP — add this to the MongoDB Atlas IP access list."
  value       = aws_eip.nat.public_ip
}

output "ecr_repository_urls" {
  description = "ECR repo URLs to push images to (used by CI)."
  value       = { for k, r in aws_ecr_repository.this : k => r.repository_url }
}

output "ecs_cluster_name" {
  description = "ECS cluster name (used by CI for force-new-deployment)."
  value       = aws_ecs_cluster.this.name
}

output "ssm_parameter_names" {
  description = "SSM parameters to populate with real secret values before the app will boot."
  value       = [for p in aws_ssm_parameter.this : p.name]
}
