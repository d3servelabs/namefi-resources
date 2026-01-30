---
targets:
  - '*'
root: false
description: >-
  Trigger when agent is working with dates, date formatting, date display, or
  timestamps in code or UI.
globs: []
cursor:
  alwaysApply: false
  description: >-
    Trigger when agent is working with dates, date formatting, date display, or
    timestamps in code or UI.
---
# Date Formatting Standards

## Preferred Format
Always use **ISO 8601 format** (`yyyy-MM-dd`) for displaying dates to users unless explicitly requested otherwise.

## Examples

### Good
- `2026-01-25`
- `format(date, 'yyyy-MM-dd')`

### Avoid
- `January 25, 2026` (verbose, locale-dependent)
- `01/25/2026` (ambiguous: MM/DD/YYYY vs DD/MM/YYYY)
- `25-01-2026` (non-standard)
- `Jan 25, 2026` (abbreviated month names)

## Rationale
1. **Unambiguous**: No confusion between MM/DD and DD/MM conventions
2. **Sortable**: ISO dates sort correctly as strings
3. **International**: Works across all locales without confusion
4. **Compact**: Shorter than spelled-out month names

## Implementation
When using date-fns:
```typescript
import { format } from 'date-fns';
format(date, 'yyyy-MM-dd'); // "2026-01-25"
```

## Exceptions
- If the user explicitly requests a different format
- Internal logging or debugging (timestamps with time may use ISO 8601 with time: `yyyy-MM-dd'T'HH:mm:ss`)
