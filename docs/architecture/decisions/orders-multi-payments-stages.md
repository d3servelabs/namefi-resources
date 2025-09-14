# Orders → Multiple Payments: Five-Stage Plan (Brief)

## First (3 Stages): Data structure and Code Architecture Migration

- At the end of the first 3 stages, our code and db will allow multiple payments for the order, but the users will not be affected and they will still be doing single payments.
- If everything goes smoothly will proceed to the 4th stage.

### Stage 1 — Array-first reads (no DB change)

*Summary*: In this stage, our data types and interfaces will be dealing with a list of payments instead of a single instance.

- Service returns: `{ order, payments: PaymentSelect[], items, user }` (array of one for now).
- API and UI consume `payments[]` instead of a single field.
- Workflows operate on `payments[0]` (primary) while storage remains unchanged.

### Stage 2 — Storage Agnostic Writes

*Summary*: In this stage, all order creation will be agnostic and with no direct interaction with the db, which will allow to replace the business logic (db writing logic) later without affecting the rest of the code.

- Add write utils (e.g., `createOrderWithPayment`) that encapsulates order creation with payments.
- Route all creation flows (checkout, autorenew, free-claim) through the service.
- Still writes to `orders.payment_id` internally during this stage.

### Stage 3 — Schema migration

*Summary*: In this stage, the db schema will be changed and we'll migrate existing data. the agnostic functions in Stage 2 will have their db interactions changed to work with the new schema.

- Add `order_payments(order_id, payment_id, is_primary, created_at, updated_at)` with deferrable constraints.
- Dual-write to both legacy column and join table, backfill legacy, then switch reads to the join.
- Drop `orders.payment_id`, update relations/view, and stop dual-write.

Notes

- This plan avoids UI churn by introducing arrays in Stage 1 and migrates storage later.
- Deferrable constraints ensure integrity while allowing transactional reassignment during migration.

## Post Migration Plan (Post 3 Stage Migration): Implementing Actual MultiPayments from User

### Stage 4 — Multi-Payment order creation + multi-charge/refund

*Summary*: our workflows will be able to process multiple payments and refund accordingly. And create orders with Multi-Payment.

- Charging:
  - Support charging multiple payments for a single order (sequential with idempotency safeguards).
  - Prioritize Stripe/NFSC per business rules if needed.
- Refunds:
  - Support full refunds across all charged payments.
  - Support partial refunds with credit-card priority (refund card first, then on-chain if necessary).
- Observability:
  - Track per-payment outcomes; aggregate at order level.

### Stage 5 — Exposing the Multi-Payment Orders to the user

*Summary*: This is the final stage, the user now will be able to checkout a single cart with multiple payments.

- Routers:
  - Introduce `orders.createOrderV2` with `payments[]` (amountInUsdCents, paymentProviderDetails, optional paymentMetadata).
  - Validate: sum(payments.amountInUsdCents) === cart total; ownership of NFSC wallet; Stripe confirmation token per payment when applicable.
  - Start `processOrderWorkflow` with a typed `paymentsMetadata` map keyed by paymentId.
- Frontend:
  - Cart supports multi-payment mode with hints:
    - If balance < total: hint to add credit card for remaining amount.
    - If paying by card and balance > 0: hint to use balance for partial coverage.
  - Simple list UI to add/remove NFSC and Stripe entries; enforce totals equality before submit.
  - Submit via `orders.createOrderV2` with `payments[]` and per-payment metadata (e.g., Stripe confirmationTokenId).
  - Order details already array-first from Stage 1; UI surfaces multiple payments.
