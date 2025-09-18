### ADR: PBN Issuance – Reservations vs Gifts

Status: Accepted

#### Context
- **Global exclusivity**: Only one active hold should block a domain (exact or parent) across the system.
- **Functional differences**:
  - **Gifts**: support exactDomainName OR parentDomain; expirable; require email notification; convert to free-claim for recipient; recipient exception in availability.
  - **Internal reservations**: exactDomainName only; non‑expirable; email optional; free-claim optional; block everyone.
- **Operational goals**: Simple availability checks, minimal cross-table coordination, ORM friendliness (Drizzle), and clear auditability.

#### Options Considered

### Option A — Single table with discriminator (`kind: 'GIFT' | 'INTERNAL'`)
- One table (pbn_issuance_reservations) with strong constraints to encode behavior.
- Enforce semantics via CHECK constraints and partial indexes. Provide separation via SQL views.

- Constraints matrix:
  - **kind='GIFT'**
    - expirationDate: REQUIRED (expirable)
    - domain: exactDomainName XOR parentDomain (one is required, not both)
    - email: recipientEmail REQUIRED; gifterId/personalMessage allowed
    - free-claim: REQUIRED on processing
    - availability: blocks others; recipient sees available
  - **kind='INTERNAL'**
    - expirationDate: DISALLOWED (non-expirable)
    - domain: exactDomainName REQUIRED; parentDomain DISALLOWED
    - email: OPTIONAL
    - free-claim: OPTIONAL
    - availability: blocks everyone

- Example constraints (illustrative):
```sql
-- gift: expirable, exactly one of exact or parent
CHECK (kind <> 'GIFT' OR expiration_date IS NOT NULL),
CHECK (kind <> 'GIFT' OR (exact_domain_name IS NOT NULL) <> (parent_domain IS NOT NULL)),

-- internal: non-expirable, exact only
CHECK (kind <> 'INTERNAL' OR expiration_date IS NULL),
CHECK (kind <> 'INTERNAL' OR (exact_domain_name IS NOT NULL AND parent_domain IS NULL))
```

- Active hold uniqueness (global exclusivity) with a single partial index:
```sql
CREATE UNIQUE INDEX ux_active_hold
ON pbn_issuance_reservations (pbn_domain, exact_domain_name, parent_domain)
WHERE status = 'RESERVED'
  AND (
    (kind = 'GIFT' AND expiration_date > NOW())
    OR (kind = 'INTERNAL')
  );
```

- Separation via views:
```sql
CREATE VIEW vw_gift_reservations AS
  SELECT * FROM pbn_issuance_reservations WHERE kind = 'GIFT';

CREATE VIEW vw_internal_reservations AS
  SELECT * FROM pbn_issuance_reservations WHERE kind = 'INTERNAL';
```

- Emails: choose template based on `kind`.
- Processing: create free-claim only for `kind='GIFT'`.

Pros
- **Simple exclusivity** with one index and one query path.
- **Low duplication**: single schema/types/routers; views provide logical separation.
- **ORM-friendly** and easy to evolve.

Cons
- More CHECK logic in one table; need discipline to keep constraints accurate.

### Option B — Separate tables + shared lock table
- `gift_reservations` and `internal_reservations` with a shared `pbn_domain_locks` table for exclusivity.
- Flow: begin tx → insert lock (unique on domain key for active) → insert into target table → commit.
- Availability checks read `pbn_domain_locks`; recipient exception may require consulting gifts table.

Pros
- Physical separation mirrors different lifecycles and retention/security policies.
- Independent state machines if they diverge materially.

Cons
- **More moving parts**: locks + two tables; careful tx mgmt.
- Recipient exception may still require cross-table reads.
- Heavier operational and maintenance overhead.

#### Decision
- Adopted a single-table design with explicit behavior flags instead of a `kind` enum.

Final model
- Flags:
  - `issueFreeClaim` (boolean): whether a free-claim should be issued for the recipient
  - `reserveHold` (boolean): whether availability should be held (blocked) for others
- Expirations:
  - `reservationExpirationDate` (nullable): controls availability block; NULL means non-expiring hold when `reserveHold=true`
  - `freeClaimExpirationDate` (nullable): controls free-claim validity when `issueFreeClaim=true`
- Other key fields:
  - `creatorId` (required), `recipientEmail` (required iff `issueFreeClaim=true`), `personalMessage` (only allowed when `issueFreeClaim=true`)

Status
- Enum: `pbn_issuance_reservation_status` with values: `CREATED`, `CANCELLED`.
- Derived UI status `EXPIRED` when (status = CREATED) and either:
  - `reserveHold=true` and `reservationExpirationDate < NOW()`; or
  - `issueFreeClaim=true` and `freeClaimExpirationDate < NOW()`.
- A reservation marked as “Received” in UI corresponds to `claimedAt` set (and `freeClaimId` possibly present), but status remains `CREATED` or moved to business-specific terminal states via process.

Readable constraints (implications / CASE)
```sql
-- At least one behavior
CHECK (reserve_hold OR issue_free_claim);

-- Holding only on exact (never on parent)
CHECK ((NOT reserve_hold) OR (exact_domain_name IS NOT NULL AND parent_domain IS NULL));

-- Parent allowed only with free-claim
CHECK ((parent_domain IS NULL) OR issue_free_claim);

-- Free-claim domain selection XOR when issuing
CHECK ((NOT issue_free_claim) OR (((exact_domain_name IS NOT NULL)::int + (parent_domain IS NOT NULL)::int) = 1));

-- Reservation expiration only relevant when reserveHold=true
CHECK (reserve_hold OR reservation_expiration_date IS NULL);

-- Free-claim expiration only when issuing
CHECK (issue_free_claim OR free_claim_expiration_date IS NULL);
```

Database validation (triggers)
- We use BEFORE INSERT/UPDATE triggers for “active” uniqueness because volatile functions like `NOW()` cannot be used in partial index predicates reliably.
- Triggers enforce:
  - Only one active hold per `(pbn_domain, exact_domain_name)` while `reserve_hold=TRUE`, `status='CREATED'`, and `(reservation_expiration_date IS NULL OR > NOW())`.
  - Only one active recipient+exact free-claim per `(recipient_email, exact_domain_name)` while `issue_free_claim=TRUE`, `status='CREATED'`, and `(free_claim_expiration_date IS NULL OR > NOW())`.

See `packages/db/src/extra-sql-scripts/pbn_reservations_triggers.sql`.

Availability semantics
- Domain is unavailable to others when there exists a reservation with `reserveHold=TRUE`, `status='CREATED'`, and (`reservationExpirationDate IS NULL OR > NOW()`).
- If `issueFreeClaim=TRUE`, the intended recipient sees the domain as available (their exception is handled at the application level).

API and UI integration
- Added TRPC router `pbnReservations` with endpoints:
  - `create` (PBN owners): inputs include `issueFreeClaim`, `reserveHold`, and both expiration fields
  - `listByCreator` (PBN owners): filters by `status` and `issueFreeClaim`, returns derived `uiStatus` and `isActiveHold`
  - `cancel` (PBN owners): cancels own `CREATED` reservations
- Frontend admin page shows `uiStatus` mapped as:
  - `CREATED` → “Sent”
  - `CLAIMED` → “Received”
  - `EXPIRED` (derived) → “Expired”
  - `CANCELLED` → “Cancelled”
  It displays both `reservationExpirationDate` and `freeClaimExpirationDate` when relevant.

Registry updates
- Availability check now queries `pbn_issuance_reservations` instead of the legacy gifts table:
  - Filters: `status='CREATED' AND reserve_hold=TRUE AND (reservation_expiration_date IS NULL OR > NOW())`
  - Excludes gift-like holds for the current user via `issue_free_claim` and `recipient_user_id` comparison.

Current schema (abridged)
```sql
-- Enum
CREATE TYPE pbn_issuance_reservation_status AS ENUM ('CREATED', 'CANCELLED');

-- Table
CREATE TABLE pbn_issuance_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pbn_domain TEXT NOT NULL,
  recipient_email TEXT NULL,
  recipient_user_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
  exact_domain_name TEXT NULL,
  parent_domain TEXT NULL,
  reason TEXT NULL,
  issue_free_claim BOOLEAN NOT NULL DEFAULT FALSE,
  reserve_hold BOOLEAN NOT NULL DEFAULT TRUE,
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  personal_message TEXT NULL,
  reservation_expiration_date TIMESTAMP NULL,
  free_claim_expiration_date TIMESTAMP NULL,
  status pbn_issuance_reservation_status NOT NULL DEFAULT 'CREATED',
  claimed_at TIMESTAMP NULL,
  free_claim_id UUID NULL REFERENCES free_claims(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Core CHECK constraints (implication style)
ALTER TABLE pbn_issuance_reservations
  ADD CONSTRAINT pbn_reservations_behavior_at_least_one
    CHECK (reserve_hold OR issue_free_claim),
  ADD CONSTRAINT pbn_reservations_hold_on_exact_only
    CHECK ((NOT reserve_hold) OR (exact_domain_name IS NOT NULL AND parent_domain IS NULL)),
  ADD CONSTRAINT pbn_reservations_parent_only_with_free_claim
    CHECK ((parent_domain IS NULL) OR issue_free_claim),
  ADD CONSTRAINT pbn_reservations_exact_domain_xor_parent_domain
    CHECK ((exact_domain_name IS NULL) <> (parent_domain IS NULL)),
  ADD CONSTRAINT pbn_reservations_freeclaim_requires_email
    CHECK ((NOT issue_free_claim) OR recipient_email IS NOT NULL),
  ADD CONSTRAINT pbn_reservations_personal_message_only_with_freeclaim
    CHECK (issue_free_claim OR personal_message IS NULL),
  ADD CONSTRAINT pbn_reservations_expiration_when_no_hold_null
    CHECK (reserve_hold OR reservation_expiration_date IS NULL),
  ADD CONSTRAINT pbn_reservations_free_claim_expiration_only_when_issuing
    CHECK (issue_free_claim OR free_claim_expiration_date IS NULL);
```

Types (abridged)
```ts
export interface PbnIssuanceReservationSelect {
  id: string;
  pbnDomain: string;
  recipientEmail: string | null;
  recipientUserId: string | null;
  exactDomainName: string | null;
  parentDomain: string | null;
  reason: string | null;
  issueFreeClaim: boolean;
  reserveHold: boolean;
  reservationExpirationDate: Date | null;
  freeClaimExpirationDate: Date | null;
  creatorId: string;
  personalMessage: string | null;
  status: 'CREATED' | 'CANCELLED';
  claimedAt: Date | null;
  freeClaimId: string | null;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Future Considerations
- If lifecycles diverge significantly (e.g., retention/security policies), we can migrate to Option B with a lock table. Existing data can be transitioned by:
  - Creating `pbn_domain_locks` and backfilling active holds.
  - Splitting rows by `kind` into dedicated tables.
  - Dropping the single-table exclusivity index after cut-over.


