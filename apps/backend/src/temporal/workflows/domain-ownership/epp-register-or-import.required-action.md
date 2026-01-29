Required Action Flow (SLD Register/Import)

Overview
- When a registrar reports REQUIRES_ACTION, we store a per-item requiredAction and notify the user by email + order details UI.
- For IMPORT operations, we pre-check EPP lock and block the transfer until the domain is unlocked.

Action Types
- EPP_UNLOCK_REQUIRED: domain must be unlocked at current registrar.
- EPP_AUTH_CODE_UPDATE_REQUIRED: user must provide a new authorization code.

Workflow Behavior
- On IMPORT: check lock -> if locked, set requiredAction and wait for PROCEED signal -> recheck lock before sending transfer.
- On REQUIRES_ACTION: notify user, wait for PROCEED signal, clear requiredAction, then re-poll registrar status.
- On FAIL signal: aborts the workflow with a non-retryable failure.

Clearing requiredAction
- requiredAction is cleared after PROCEED and before re-polling the registrar.
