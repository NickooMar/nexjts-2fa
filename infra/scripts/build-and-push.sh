#!/usr/bin/env bash
# Build and push all five images to ECR. Use for the first deploy (before CI is
# wired) or any manual push. GitHub Actions does the same thing on push to main.
#
# Usage:
#   AWS_REGION=us-east-1 \
#   ECR_REGISTRY=123456789012.dkr.ecr.us-east-1.amazonaws.com \
#   NEXT_PUBLIC_API_URL=http://homiq-dev-alb-xxxx.us-east-1.elb.amazonaws.com \
#   infra/scripts/build-and-push.sh
set -euo pipefail

: "${AWS_REGION:?set AWS_REGION}"
: "${ECR_REGISTRY:?set ECR_REGISTRY (account.dkr.ecr.region.amazonaws.com)}"
NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-}"
TAG="${TAG:-latest}"

# Run from the repo root regardless of where the script is called from.
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

echo ">> Logging in to ECR ($ECR_REGISTRY)"
aws ecr get-login-password --region "$AWS_REGION" \
  | docker login --username AWS --password-stdin "$ECR_REGISTRY"

build_push() {
  local name="$1" context="$2" dockerfile="$3"; shift 3
  echo ">> Building $name"
  docker build "$@" -t "$ECR_REGISTRY/homiq/$name:$TAG" -f "$dockerfile" "$context"
  docker push "$ECR_REGISTRY/homiq/$name:$TAG"
}

build_push frontend apps/frontend          apps/frontend/Dockerfile          --build-arg "NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL"
build_push main     apps/backend           apps/backend/apps/main/Dockerfile
build_push auth     apps/backend           apps/backend/apps/auth/Dockerfile
build_push user     apps/backend           apps/backend/apps/user/Dockerfile
build_push email    apps/backend           apps/backend/apps/email/Dockerfile

echo ">> Done. Force a redeploy with:"
echo "   for s in frontend main auth user email; do aws ecs update-service --cluster homiq-dev --service \$s --force-new-deployment --no-cli-pager >/dev/null; done"
