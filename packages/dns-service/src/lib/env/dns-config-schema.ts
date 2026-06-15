import { punycodeFqdnSchema } from '@namefi-astra/registrars/data/validations';
import { z } from 'zod';

/**
 * Production nameserver hostnames for Namefi's authoritative DNS. Shared so
 * `apps/backend`'s production config and this package agree on a single value.
 */
export const DNS_NAMESERVERS_PROD = [
  'ns3.namefi.io.',
  'ns4.namefi.io.',
] as const;

/**
 * Config slice the DNS resolution engine reads. Owned here so the standalone
 * `ns-json-api` app and `apps/backend` validate the exact same definitions
 * (backend spreads `dnsConfigSchema.shape` into its own config schema).
 */
export const dnsConfigSchema = z.object({
  /**
   * The nameservers that NameFI will use for its own domains.
   */
  NAMEFI_ASTRA_NAMESERVERS: punycodeFqdnSchema
    .array()
    .default(() =>
      ['ns3.namefi.dev.', 'ns4.namefi.dev.'].map((value) =>
        punycodeFqdnSchema.parse(value),
      ),
    ),

  /**
   * Real DNS zone used to relay records for unofficial TLDs
   * (see `NAMEFI_UNOFFICIAL_TLDS`). A query for
   * `<name>.<unofficialTld>.<NAMEFI_UNOFFICIAL_TLDS_RELAY_ZONE>` resolves
   * to the same records stored under the logical `<name>.<unofficialTld>`
   * zone. Normalized form: lowercase, no trailing dot.
   */
  NAMEFI_UNOFFICIAL_TLDS_RELAY_ZONE: z.string().default('gtld.namefi.dev'),

  // #region Caddy DNS-JWT park gate
  /**
   * Fixed DNS label under which the signed park-gate JWT is published, i.e.
   * the token for `example.com` lives at `<label>.example.com` TXT. Must
   * match the `dns_label` configured in the Caddy plugin.
   */
  NAMEFI_PARK_GATE_LABEL: z.string().default('_namefi-gate'),
  /**
   * Lifetime of the gate JWT (`exp = iat + this`). The acceptance window
   * the Caddy plugin enforces. Defaults to 24h; combined with a 12h cache
   * TTL this guarantees a ~12h current/previous overlap during rotation.
   */
  NAMEFI_PARK_GATE_TOKEN_TTL_SECONDS: z
    .number()
    .int()
    .positive()
    .default(60 * 60 * 24),
  /**
   * How long an issued gate JWT is cached in Redis before it is re-signed.
   * Doubles as the rotation cadence; keep it <= the DNS record TTL ceiling.
   */
  NAMEFI_PARK_GATE_CACHE_TTL_SECONDS: z
    .number()
    .int()
    .positive()
    .default(60 * 60 * 12),
  /**
   * TTL advertised on the served gate TXT record. Kept well under the 12h
   * ceiling so resolvers refresh promptly after a rotation.
   */
  NAMEFI_PARK_GATE_RECORD_TTL_SECONDS: z
    .number()
    .int()
    .positive()
    .default(60 * 60),
  /**
   * Route patterns the gate authorizes for a parked host. Parked domains
   * serve a single parking page across all paths, so the default is `/*`.
   */
  NAMEFI_PARK_GATE_ROUTES: z.string().array().default(['/*']),
  /**
   * Optional `kid` JWT header, surfaced so the Caddy plugin can select the
   * right verification key during a key rotation.
   */
  NAMEFI_PARK_GATE_KEY_ID: z.string().optional(),
  // #endregion
});

/**
 * DNS-owned secret slice. The park-gate JWT signing key (EC P-256, PKCS#8).
 * Accepts a raw PEM or a base64-encoded PEM; when unset the park gate is
 * disabled and no gate TXT records are issued or served.
 */
export const dnsSecretsSchema = z.object({
  NAMEFI_PARK_GATE_SIGNING_PRIVATE_KEY: z
    .string()
    .optional()
    .transform((val, ctx) => {
      if (!val) return null;
      const normalized = val.includes('BEGIN')
        ? val
        : Buffer.from(val, 'base64').toString('utf-8');
      if (
        !normalized.includes('-----BEGIN') ||
        !normalized.includes('PRIVATE KEY-----')
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'NAMEFI_PARK_GATE_SIGNING_PRIVATE_KEY must be a PEM private key (raw or base64-encoded PEM)',
        });
        return z.NEVER;
      }
      return normalized;
    }),
});

/**
 * Park-gate rotation invariants (PRD §4.3): the Redis cache window and the
 * advertised record TTL must both stay within the token lifetime and the 12h
 * ceiling, otherwise a resolver can serve a token past its `exp`. Exported as a
 * standalone refinement so both this package's env and apps/backend's merged
 * config schema apply the identical cross-field check (dnsConfigSchema stays a
 * plain object so its `.shape` can be spread).
 */
export function refineParkGateTtls(
  cfg: z.infer<typeof dnsConfigSchema>,
  ctx: z.RefinementCtx,
): void {
  const TwelveHours = 60 * 60 * 12;
  const ceilingChecks = [
    'NAMEFI_PARK_GATE_CACHE_TTL_SECONDS',
    'NAMEFI_PARK_GATE_RECORD_TTL_SECONDS',
  ] as const;
  for (const key of ceilingChecks) {
    if (cfg[key] > TwelveHours) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [key],
        message: `${key} must be <= 43200 (12h)`,
      });
    }
    if (cfg[key] > cfg.NAMEFI_PARK_GATE_TOKEN_TTL_SECONDS) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [key],
        message: `${key} must be <= NAMEFI_PARK_GATE_TOKEN_TTL_SECONDS`,
      });
    }
  }
}
