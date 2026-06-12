/**
 * Resolve the real client IP. `main.ts` configures Express `trust proxy`
 * (TRUST_PROXY env) so `req.ip` already walks X-Forwarded-For past the
 * ALB/nginx hops we trust; everything here is just defensive fallback.
 */
export function getClientIp(req: Record<string, any>): string {
  if (typeof req.ip === 'string' && req.ip.length > 0) {
    return normalizeIp(req.ip);
  }
  const remote = req.socket?.remoteAddress || req.connection?.remoteAddress;
  return remote ? normalizeIp(remote) : 'unknown';
}

/** Strip the IPv6 prefix Node puts on IPv4 addresses (::ffff:1.2.3.4). */
const normalizeIp = (ip: string): string =>
  ip.startsWith('::ffff:') ? ip.slice(7) : ip;

/**
 * Parse the TRUST_PROXY env into what Express expects:
 *  - "1", "2", ...        → trust that many hops (ALB = 1, nginx+ALB = 2)
 *  - "true" / "false"     → trust all / none (true is unsafe outside dev)
 *  - anything else        → passed through (CIDR list, "loopback", ...)
 */
export function parseTrustProxy(
  raw: string | undefined,
): boolean | number | string {
  if (raw === undefined || raw === '') return 1;
  if (/^\d+$/.test(raw)) return parseInt(raw, 10);
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  return raw;
}
