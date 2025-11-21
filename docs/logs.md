# Logs Access

Datadog access and log tips for the team. If you are new to Datadog, skim the quick start below.

Login

- Go to https://us5.datadoghq.com/account/login
- Choose "Continue with Google" and use company SSO
- You land on US5; no VPN required for normal use

Essential links

- Logs stream: https://us5.datadoghq.com/logs (defaults to inline view; adjust time range and columns)
- Ponder dashboard: https://us5.datadoghq.com/dashboard/v5v-3bi-d3x/ponder-indexer---complete-monitoring-dashboard
- CoreDNS dashboard: https://us5.datadoghq.com/dashboard/hih-6hy-373/coredns

How to pull logs fast

1) Open the Logs stream link above.
2) Set the time range (top right). Start with "Past 15 minutes" and expand if empty.
3) Add filters in the search bar:
   - By service: `service:ponder-indexer` (or `service:coredns`, `service:astra-api`, etc.)
   - By environment: `env:prod` or `env:staging`
   - By severity: `status:error` to see only errors
   - Combine terms: `service:ponder-indexer env:prod status:error`
4) Expand a log line to see attributes and JSON payloads. Use "View in context" for surrounding entries.
5) Save useful searches with "Save as view" so others can reuse them.

Troubleshooting patterns

- Spikes in errors: filter `status:error` and add `@http.status_code:[500 TO 599]` if HTTP related.
- Missing logs: check the time picker and confirm the correct service name; then check the service dashboard for pipeline/ingestion errors.
- DNS issues: use the CoreDNS dashboard first, then pivot into logs with `service:coredns`.

Short video primer

- How to use Datadog logs (YouTube): https://www.youtube.com/watch?v=2ps8cBnypd0&pp=ygUXaG93IHRvIHVzZSBkYXRhZG9nIGxvZ3M%3D

