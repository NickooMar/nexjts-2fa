# Deploying to AWS (dev)

Infrastructure-as-code for a development deployment of the Homiq monorepo on AWS,
backed by MongoDB Atlas.

## Architecture

```
                         Internet
                            │
                    ┌───────┴────────┐
                    │  Public ALB    │  :80 (+:443 if a cert is set)
                    └───────┬────────┘
        ┌───────────────────┴─────────────────────────┐
        │ VPC (2 AZs)                                  │
        │  Public subnets:  ALB, NAT GW                │
        │  Private subnets (Fargate):                  │
        │                                              │
        │   frontend ──server actions──► main (gateway)│
        │   (public)        (private)        │         │
        │                                    ├─► auth   │  (TCP, private,
        │                                    ├─► user   │   Cloud Map DNS)
        │                                    └─► email  │
        └───────────────────┬──────────────────────────┘
                             │ NAT EIP (allowlisted in Atlas)
                             ▼
                    MongoDB Atlas cluster
```

Why this shape:

- **Only the frontend is public.** All backend calls happen inside Next.js
  **server actions** over internal DNS, so the gateway + microservices stay
  private (`src/lib/api.ts` is imported only by `src/app/actions/*`).
- **auth/user/email talk raw TCP** (`Transport.TCP`), so they use **Cloud Map**
  private DNS (`auth.homiq.local:3001`, …) instead of a load balancer — the AWS
  equivalent of docker-compose's container DNS.
- **Every backend service validates the full env schema on boot** (all fields
  `required()`), so each task gets `MONGO_URI`, `JWT_SECRET`, `RESEND_API_KEY`,
  `RESEND_FROM_EMAIL`, etc. or it crashes. The task definitions reflect that.
- **`*_SERVICE_HOST` is dual-purpose:** it's the *bind* address on the service
  itself (`0.0.0.0`) and the *connect* address on the gateway (`auth.homiq.local`).

## Files

```
infra/terraform/        VPC, ECR, Cloud Map, IAM, SSM, ECS, ALB, logs
infra/scripts/          build-and-push.sh (manual / first-deploy image push)
.github/workflows/      deploy.yml (build → push → redeploy on push to main)
```

## Prerequisites

- AWS account + credentials (`aws configure` / SSO)
- [Terraform](https://developer.hashicorp.com/terraform/install) ≥ 1.6
- Docker
- A [MongoDB Atlas](https://cloud.mongodb.com) account
- A [Resend](https://resend.com) API key + verified sender

---

## Step 1 — Provision infrastructure

```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars   # edit region, resend_from_email
terraform init
terraform apply
```

The backend tasks will crash-loop at first — that's expected, the `:latest`
images don't exist yet. Grab the outputs:

```bash
terraform output            # app_url, nat_eip, ecr_repository_urls, ecs_cluster_name, ssm_parameter_names
```

## Step 2 — MongoDB Atlas

1. Create a project + cluster (M0 free tier is fine to start).
2. **Database Access** → add a user with the **`readWriteAnyDatabase`** built-in
   role. This is required: the app creates a `tenant_<slug>` database per tenant
   at runtime via `useDb()`, so a single-database-scoped user breaks tenant
   creation.
3. **Network Access** → add the `nat_eip` value from Step 1 (one stable egress IP).
4. Copy the `mongodb+srv://…` connection string.

## Step 3 — Fill secrets

Terraform created placeholder SSM parameters (`terraform output ssm_parameter_names`).
Set the real values — these are read by ECS at task start and never stored in
Terraform state:

```bash
aws ssm put-parameter --overwrite --type SecureString --name /homiq/dev/MONGO_URI \
  --value 'mongodb+srv://USER:PASS@cluster.mongodb.net/?retryWrites=true&w=majority'
aws ssm put-parameter --overwrite --type SecureString --name /homiq/dev/JWT_SECRET \
  --value "$(openssl rand -hex 32)"
aws ssm put-parameter --overwrite --type SecureString --name /homiq/dev/RESEND_API_KEY \
  --value 're_xxxxxxxx'
aws ssm put-parameter --overwrite --type SecureString --name /homiq/dev/AUTH_SECRET \
  --value "$(openssl rand -hex 32)"

# OAuth is optional — leave as CHANGE_ME if unused (see note below).
# aws ssm put-parameter --overwrite --type SecureString --name /homiq/dev/AUTH_GOOGLE_ID --value '...'
# ...AUTH_GOOGLE_SECRET, AUTH_GITHUB_ID, AUTH_GITHUB_SECRET
```

## Step 4 — Build & push images (first deploy)

```bash
cd <repo root>
AWS_REGION=us-east-1 \
ECR_REGISTRY=$(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com \
NEXT_PUBLIC_API_URL=$(cd infra/terraform && terraform output -raw app_url) \
infra/scripts/build-and-push.sh
```

Then force the services to pick up the images:

```bash
for s in frontend main auth user email; do
  aws ecs update-service --cluster homiq-dev --service "$s" --force-new-deployment --no-cli-pager >/dev/null
done
```

Open the `app_url`. Tail logs with `aws logs tail /ecs/homiq-dev/main --follow`.

---

## Step 5 — Wire CI/CD (GitHub Actions)

`.github/workflows/deploy.yml` builds all 5 images, pushes to ECR, and forces a
redeploy on every push to `main`.

**Create a GitHub OIDC deploy role** (no long-lived keys). One-time:

```bash
# 1. OIDC provider (skip if it already exists in the account)
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1

# 2. Role trusted by THIS repo (edit OWNER/REPO), with ECR + ECS deploy perms.
#    Attach: AmazonEC2ContainerRegistryPowerUser  + an inline policy allowing
#    ecs:UpdateService, ecs:DescribeServices on the cluster.
```

Trust policy (`OWNER/REPO` = your GitHub repo):

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Federated": "arn:aws:iam::<ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com" },
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {
      "StringEquals": { "token.actions.githubusercontent.com:aud": "sts.amazonaws.com" },
      "StringLike": { "token.actions.githubusercontent.com:sub": "repo:OWNER/REPO:ref:refs/heads/main" }
    }
  }]
}
```

Then in the repo (**Settings → Secrets and variables → Actions**):

| Kind     | Name                  | Value                                            |
| -------- | --------------------- | ------------------------------------------------ |
| Secret   | `AWS_ROLE_ARN`        | ARN of the role above                            |
| Variable | `AWS_REGION`          | e.g. `us-east-1`                                  |
| Variable | `ECR_REGISTRY`        | `<account>.dkr.ecr.<region>.amazonaws.com`       |
| Variable | `ECS_CLUSTER`         | `terraform output -raw ecs_cluster_name`         |
| Variable | `NEXT_PUBLIC_API_URL` | `terraform output -raw app_url`                  |

Push to `main` and the pipeline takes over.

---

## Notes & gotchas

- **HTTPS / OAuth:** the default is plain HTTP on the ALB DNS name. Google/GitHub
  OAuth callbacks reject non-`localhost` HTTP, so social login won't work until
  you set `domain_name` + `certificate_arn` (adds a 443 listener + HTTP→HTTPS
  redirect) and register the callback URLs with the providers. Email/password
  auth works over HTTP.
- **Health checks:** the TCP microservices have no HTTP health endpoint; ECS
  task state + Cloud Map custom health drive readiness. Consider adding a real
  `/health` route to the gateway and tightening the ALB check later.
- **Cost (~$70–110/mo, 24/7):** NAT GW ≈ $32, ALB ≈ $18, 5 Fargate tasks ≈ $25,
  Atlas M0 free. To pause spend, `terraform apply -var desired_count=0` (or
  `terraform destroy`). The NAT gateway is the main idle cost.
- **Updating app config (env vars):** edit the Terraform locals and
  `terraform apply` — it creates a new task def revision and rolls the service.
  CI only swaps the image (`:latest` + force redeploy), so the two don't fight.
```
