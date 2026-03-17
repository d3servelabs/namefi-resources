# Export Tracking Architecture

This document captures the current and target architecture for domain export tracking.

## Current Runtime Flow

```mermaid
flowchart TD
  A[Domain Export Tracking Schedule\nEvery 6 hours] --> B[Fetch locked NFTs\ngetLockedNftsForTracking]
  B --> C[Process each locked domain\nprocessSingleDomainExportStatus]
  C --> D[Gather evidence\nRDAP/WHOIS + in-account check]
  D --> E{Legacy status decision}
  E -->|pendingTransfer| F[PENDING_TRANSFER]
  E -->|transferPeriod| G[TRANSFER_PERIOD]
  E -->|not in account| H[TRANSFER_COMPLETED]
  E -->|none| I[skip]
  F --> J[Persist domain_export_tracking]
  G --> J
  H --> J
  J --> K[Send pending export emails\nfor newly created records]
  K --> L[Fetch transfer-watch records]
  L --> M[checkSinglePendingTransfer]
  M --> N{Transition}
  N -->|completed| O[TRANSFER_COMPLETED]
  N -->|failed| P[TRANSFER_FAILED]
  N -->|still pending| Q[No status change]
  O --> R[Evaluate burn eligibility]
  R --> S[Burn NFT + record tx]
  S --> T[Send export complete email]
  T --> U[Send report email]
```

## Refined Composable Pipeline

```mermaid
flowchart TD
  A[selectExportReadyDomains] --> B[gatherEvidenceForDomain]
  B --> C[normalizeEvidence]
  C --> D[decideExportTrackingState]
  D --> E[persistStateTransition]
  E --> F{Side-effect boundary}
  F -->|needs admin review| G[createAdminReviewTask]
  F -->|approved path only| H[sendUserNotification]
  F -->|no side effects| I[done]
```

## Proposed State Machine

```mermaid
stateDiagram-v2
  [*] --> NOT_EXPORT_READY

  NOT_EXPORT_READY --> EXPORT_READY: nft_locked && epp_unlocked
  EXPORT_READY --> NO_SIGNAL: explicit negative checks
  EXPORT_READY --> UNDETERMINED: timeout/null/parse error
  EXPORT_READY --> PENDING_TRANSFER: explicit pending signal

  NO_SIGNAL --> PENDING_TRANSFER: explicit pending signal
  NO_SIGNAL --> UNDETERMINED: ambiguous evidence

  PENDING_TRANSFER --> TRANSFERRED: transferPeriod or explicit transferred evidence
  PENDING_TRANSFER --> NO_SIGNAL: explicit cleared transfer && in account
  PENDING_TRANSFER --> UNDETERMINED: ambiguous evidence

  TRANSFERRED --> NEEDS_ADMIN_REVIEW: communication or burn action recommended
  NEEDS_ADMIN_REVIEW --> NOTIFIED: admin approved + notification sent
  NEEDS_ADMIN_REVIEW --> RESOLVED: admin dismissed or false positive
  NOTIFIED --> RESOLVED: terminal bookkeeping complete
```

## Registrar Evidence Strategy

| Registrar capability | Primary signal | Secondary signal | Notes |
| --- | --- | --- | --- |
| Dynadot | `queryPendingTransfer` | RDAP/WHOIS status | direct transfer API available |
| CentralNic/EPP-direct | EPP transfer query (`op=query`) | RDAP/WHOIS status | explicit EPP semantics |
| Route53 | In-account + EPP/RDAP status | RDAP events when explicit | no direct pending-transfer API |

## Implementation Notes

- Evidence gathering, normalization, and decision logic are split into explicit functions in `apps/backend/src/temporal/activities/domain/export-tracking.activities.ts`.
- Transfer-watch polling now includes both `PENDING_TRANSFER` and `TRANSFER_PERIOD` records.
- Ambiguous evidence is treated as `undetermined` and does not trigger state transitions.
