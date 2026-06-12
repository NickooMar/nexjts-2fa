import { Throttle } from '@nestjs/throttler';
import { envInt, seconds } from './security.config';

interface PolicyDefaults {
  limit: number;
  ttlSeconds: number;
  blockSeconds?: number;
}

/**
 * Build a `@Throttle` override for the per-identity throttler whose numbers
 * resolve from `RATE_LIMIT_<NAME>_{LIMIT,TTL_SECONDS,BLOCK_SECONDS}` at
 * request time — limits are tuned via environment, not code.
 */
const policy = (name: string, defaults: PolicyDefaults) =>
  Throttle({
    identity: {
      limit: () => envInt(`RATE_LIMIT_${name}_LIMIT`, defaults.limit),
      ttl: () =>
        seconds(envInt(`RATE_LIMIT_${name}_TTL_SECONDS`, defaults.ttlSeconds)),
      blockDuration: () =>
        seconds(
          envInt(
            `RATE_LIMIT_${name}_BLOCK_SECONDS`,
            defaults.blockSeconds ?? defaults.ttlSeconds,
          ),
        ),
    },
  });

/* ------------------------------- auth ---------------------------------- */

/** Credential stuffing: a human retries a password a handful of times. */
export const SigninThrottle = () =>
  policy('SIGNIN', { limit: 5, ttlSeconds: 60, blockSeconds: 300 });

/** bcrypt(cost 15) + outbound email per call — CPU and mail-bomb vector. */
export const SignupThrottle = () =>
  policy('SIGNUP', { limit: 5, ttlSeconds: 3600, blockSeconds: 3600 });

/** Account-enumeration oracle; keep it usable for typo-checking only. */
export const CheckEmailThrottle = () =>
  policy('CHECK_EMAIL', { limit: 10, ttlSeconds: 60, blockSeconds: 300 });

/** Legitimate clients refresh once per token lifetime, not per second. */
export const RefreshThrottle = () =>
  policy('REFRESH', { limit: 10, ttlSeconds: 60, blockSeconds: 300 });

/** 6-digit code endpoints; LoginProtectionService adds per-token lockout. */
export const VerifyEmailThrottle = () =>
  policy('VERIFY_EMAIL', { limit: 10, ttlSeconds: 60, blockSeconds: 600 });

/* --------------------------- expensive ops ------------------------------ */

/** Provisions a tenant database + memberships — the costliest call we have. */
export const CreateOrganizationThrottle = () =>
  policy('CREATE_ORG', { limit: 5, ttlSeconds: 3600, blockSeconds: 3600 });

/** Invitation codes are bearer credentials; cap minting and redemption. */
export const InvitationThrottle = () =>
  policy('INVITATION', { limit: 20, ttlSeconds: 3600 });

export const JoinOrganizationThrottle = () =>
  policy('JOIN_ORG', { limit: 10, ttlSeconds: 3600, blockSeconds: 1800 });

export const SwitchOrganizationThrottle = () =>
  policy('SWITCH_ORG', { limit: 30, ttlSeconds: 60 });
