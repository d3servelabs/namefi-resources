# ADR: Reservation Status Naming - `CREATED` instead of `RESERVED`

## Context
- Our unified PBN issuance reservations table covers both gift-like (issueFreeClaim=true) and internal reservations (issueFreeClaim=false) with optional holds (`reserveHold`).
- The previous status value `RESERVED` implied an active hold on a name, which is not always true (e.g., gifts with `reserveHold=false`).
- We derive expiration at query time via dates; a status should not suggest active/non-active time semantics.

## Decision
- Rename status enum value from `RESERVED` to `CREATED`.
- Status set:
  - CREATED: record exists and is available for subsequent flows (e.g., claim, expiry, or cancellation)
  - CLAIMED: converted to a free claim (for gift-like) and attributed to a user
  - CANCELLED: explicitly cancelled
  - EXPIRED: derived at query-time when (status = CREATED AND expirationDate < NOW())

## Rationale
- `CREATED` is semantically neutral; it does not imply a hold or recipient action.
- Works for both gift and internal reservations.
- Aligns with our existing derived-expiration logic and avoids confusion with non-held gifts.

## Implementation Notes
- DB enum `reservation_status` updated to `CREATED | CANCELLED` (CLAIMED remains as a separate state via columns and UI mapping).
- Triggers and queries: all checks using `status = 'RESERVED'` changed to `status = 'CREATED'`.
- Backend API and activities updated.
- Frontend filters and badges updated (Reserved -> Created; Claimed remains shown as “Received”).

## Alternatives Considered
- PENDING: implies user action; misleading for no-action cases.
- ACTIVE: misleading once expiration passes.
- SENT / ISSUED / OPEN: either channel-specific or vague compared to CREATED.

## Consequences
- Clearer semantics across UI and code.
- Reduced ambiguity when `reserveHold=false`.

## Migration
- Since prior code was not merged to production for the old value, we performed an in-place rename and code updates without a data migration.
