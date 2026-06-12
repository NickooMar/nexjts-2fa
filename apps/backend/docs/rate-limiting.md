# Rate limiting & abuse protection

All protection lives in the public HTTP gateway (`apps/main`) — the
auth/user/email services are TCP microservices on the private network and are
only reachable through it. Module: `apps/main/src/security/`.

## Threat model → mechanism

| Threat | Mechanism |
| --- | --- |
| Volumetric floods / scrapers | Global **per-IP ceiling** (300 req/min, one bucket across all routes) with a short block once exceeded |
| Unfair API usage by a single account (incl. behind NAT/proxies) | **Per-identity limit** (120 req/min per route) keyed by the *verified* JWT `sub`, falling back to client IP for anonymous traffic |
| Credential stuffing / password brute force | Tight `signin` throttle **plus** failed-attempt lockouts per account (5/15 min) and per IP (20/15 min) with **progressive backoff** — each repeated lockout doubles (5 min → 10 → 20 … capped at 24 h). Locked requests are rejected before any bcrypt work or microservice hop. |
| Email-verification code guessing (6-digit code) | `verify-email` throttle + per-token lockout after 5 bad codes |
| Invitation-code guessing | `join` throttle + per-user lockout after repeated invalid codes |
| User enumeration | `check-email` capped at 10/min per IP |
| CPU / mail-bomb abuse (signup runs bcrypt cost 15 + sends email) | `signup` capped at 5/hour per IP |
| Expensive provisioning (`POST /organizations` creates a tenant DB) | 5/hour per user |
| Scripted clients / bots | Request fingerprinting (IP + UA + accept headers), suspicion scoring fed by header heuristics and 429s; flagged clients can be forced through **CAPTCHA** (Turnstile/reCAPTCHA, opt-in) on signin/signup |

Notable keying detail: a JWT is only used as a rate-limit key after its
signature verifies. An unverified `sub` would let an attacker mint random
identities to escape IP limits.

## Why these pieces

- **`@nestjs/throttler`** provides the guard plumbing (named throttlers,
  per-route overrides, headers); we supply a **custom Redis storage**
  (`redis-throttler.storage.ts`) that runs a Lua script so
  check-increment-block is atomic — correct under concurrency across many
  gateway replicas. Without Redis it falls back to the library's in-memory
  storage (single instance only; an error is logged in production).
- **Fail-open by default** (`RATE_LIMIT_FAIL_OPEN=true`): if Redis is down we
  prefer serving traffic unthrottled over a self-inflicted outage. Flip to
  `false` for fail-closed.
- **Proxy awareness**: `main.ts` sets Express `trust proxy` from
  `TRUST_PROXY` (number of trusted hops; ALB = 1, nginx in front of ALB = 2),
  so `req.ip` resolves the real client from `X-Forwarded-For` and spoofed
  XFF headers from clients are ignored.
- **Health checks** (`GET /api/health`) are never throttled.

## Responses

Exceeded limits and lockouts return **429** with a `Retry-After` header,
`X-RateLimit-*` headers, and a standardized body:

```json
{
  "statusCode": 429,
  "error": "Too Many Requests",
  "code": "rate_limit_exceeded",        // or "temporarily_locked"
  "message": "Rate limit exceeded. Try again in 42s.",
  "retryAfterSeconds": 42
}
```

CAPTCHA enforcement returns **403** with `code: "captcha_required"` (client
should render the challenge and retry with an `x-captcha-token` header) or
`code: "captcha_invalid"`.

## Configuration (environment)

Everything is resolved from env **at request time** — tune limits per
deployment without code changes (see `.env.example` for the full list).

| Variable | Default | Meaning |
| --- | --- | --- |
| `REDIS_URL` | – | Centralized store; **required for multi-replica deployments** |
| `TRUST_PROXY` | `1` | Proxy hops in front of the gateway |
| `RATE_LIMIT_ENABLED` | `true` | Master switch |
| `RATE_LIMIT_FAIL_OPEN` | `true` | Behavior when Redis is unreachable |
| `RATE_LIMIT_IP_LIMIT` / `_TTL_SECONDS` / `_BLOCK_SECONDS` | 300 / 60 / 60 | Global per-IP ceiling |
| `RATE_LIMIT_IDENTITY_LIMIT` / `_TTL_SECONDS` / `_BLOCK_SECONDS` | 120 / 60 / 60 | Per-user (or per-IP) route budget |
| `RATE_LIMIT_<POLICY>_{LIMIT,TTL_SECONDS,BLOCK_SECONDS}` | see `throttle-policies.ts` | Per-endpoint: `SIGNIN`, `SIGNUP`, `CHECK_EMAIL`, `REFRESH`, `VERIFY_EMAIL`, `CREATE_ORG`, `INVITATION`, `JOIN_ORG`, `SWITCH_ORG` |
| `LOCKOUT_<SCOPE>_{MAX_ATTEMPTS,WINDOW_SECONDS,BASE_LOCK_SECONDS,MAX_LOCK_SECONDS}` | see `security.config.ts` | Brute-force scopes: `LOGIN_ACCOUNT`, `LOGIN_IP`, `VERIFY_EMAIL`, `INVITE_JOIN` |
| `BOT_DETECTION_ENABLED`, `BOT_UA_PATTERNS`, `BOT_FLAG_THRESHOLD` | on / built-in list / 10 | Suspicion engine |
| `CAPTCHA_ENABLED`, `CAPTCHA_MODE`, `CAPTCHA_PROVIDER`, `CAPTCHA_SECRET` | off / `flagged` / `turnstile` | CAPTCHA on signin/signup; `flagged` challenges only suspicious clients, `always` challenges everyone |

## Monitoring

Every violation emits a structured JSON log line under the `Security` logger
(`rate_limit_exceeded`, `account_locked`, `ip_locked`, `login_failure`,
`suspicious_client_flagged`, `captcha_*`) — pipe these into CloudWatch metric
filters and alert on spikes. Daily counters are also kept in Redis
(`metrics:security:<event>:<yyyy-mm-dd>`, 7-day TTL); identifiers in keys and
logs are hashed, never raw emails/tokens.

## Operational recommendations

- **Production store**: ElastiCache Redis (or Valkey) in the same VPC; the
  terraform stack does not provision it yet. Single small node is plenty —
  the keyspace is tiny and everything has TTLs.
- **Defense in depth**: these limits protect the application layer. Put AWS
  WAF (or CloudFront) in front of the ALB for L3/L4 volumetric DDoS — no
  application-level limiter can absorb that class of attack.
- **Tuning**: start with the defaults, watch `rate_limit_exceeded` logs for a
  week, and raise/lower per-policy envs (no deploy needed beyond a task
  restart). When adding a new public endpoint, give it a policy in
  `throttle-policies.ts` if it is auth-adjacent or expensive; otherwise the
  global throttlers cover it.
- **Future hardening** (out of scope here): restrict CORS from `*` to
  `FRONTEND_URL`, add `ValidationPipe({ whitelist: true })`, and consider
  per-API-key tiers if a public API program ever ships (the identity tracker
  in `gateway-throttler.guard.ts` is the place to add `key:` trackers).

## Tests

`apps/main/src/security/*.spec.ts` — storage atomicity/expiry/blocking and
cross-replica sharing (two storages, one Redis), progressive lockout math,
and full HTTP integration (429 shape, header-based IP keying behind a proxy,
per-user vs per-IP buckets, forged-JWT downgrade, health-check exemption,
kill switch). Run with `npm test` in `apps/backend`.
