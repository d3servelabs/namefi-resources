## analytics.getParsedReportByRecordName

Endpoint: `/trpc/analytics.getParsedReportByRecordName`

Auth:
- Header `x-api-key: <your-api-key>`

Transport:
- GET: SuperJSON-wrapped query param `input={"json":{...}}` (URL-encoded)
- POST: JSON body `{ "input": { "json": { ... } } }`

### Input
Object (SuperJSON-wrapped when sent over the wire)

```json
{
  "startDate": "YYYY-MM-DD | today | yesterday | NdaysAgo",
  "endDate": "YYYY-MM-DD | today | yesterday | NdaysAgo",
  "domainName": "string"
}
```

- startDate: string. One of:
  - ISO date: e.g., "2025-09-01"
  - Relative: "today", "yesterday", or "NdaysAgo" (e.g., "7daysAgo")
- endDate: string. Same accepted formats as `startDate`.
- domainName: string. Record/host name to match (domain and its subdomains). Trailing dot is normalized.

Examples (REST Client variables shown in `analytics.rest`):
- GET: `?input=%7B%22json%22%3A%7B%22startDate%22%3A%222025-09-01%22%2C%22endDate%22%3A%22today%22%2C%22domainName%22%3A%220x.city%22%7D%7D`

### Output
Returns a parsed analytics object:

```ts
type DnsAnalyticsParsed = {
  summary: {
    totalQueries: number;
    uniqueDomains: number;
    cacheHitRatePercent: number | null; // 0-100; null if not computable
    uniqueClientIps: number;
    topClientIpsDetails?: Array<{ ip: string; count: number }>; // present only when includeIpDetails enabled (false here)
  };
  topDomains: Array<{ domain: string; count: number }>;
  queriesByResponseCode: Array<{ rcode: string; count: number }>; // e.g., "NOERROR(0)"
  queriesByType: Array<{ queryType: string; count: number }>;
  cacheHitBreakdown: { hits: number; misses: number; hitRatePercent: number | null };
  topClientIps: Array<{ ip: string; count: number }>;
  dnssecStats: Array<{ status: string; count: number }>; // e.g., "DNSSEC Enabled" | "No DNSSEC"
  hourlyVolume: Array<{ dateHour: string; count: number }>; // GA format YYYYMMDDHH
  dailyVolume: Array<{ date: string; count: number }>; // GA format YYYYMMDD
  publicSuffix: Array<{ publicSuffix: string; count: number }>;
  publicSuffixPlusOne: Array<{ domain: string; count: number }>;
};
```

Notes:
- Data originates from GA4 runReport; values without data may be omitted or appear as empty arrays.
- This route sets `includeIpDetails: false`, so `summary.topClientIpsDetails` is not included.

### JavaScript fetch examples (Node 18+)

POST with SuperJSON body
```js
const res = await fetch('http://localhost:3000/trpc/analytics.getParsedReportByRecordName', {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'x-api-key': '--dev-api-auth-key--',
  },
  body: JSON.stringify({
    input: {
      json: {
        startDate: '2025-09-01',
        endDate: 'today',
        domainName: '0x.city',
      },
    },
  }),
});
const json = await res.json();
console.log(json.result?.data);
```

GET with SuperJSON-wrapped query param
```js
const params = new URLSearchParams({
  input: JSON.stringify({ json: {
    startDate: '2025-09-01',
    endDate: 'today',
    domainName: '0x.city',
  } }),
});
const res = await fetch(`http://localhost:3000/trpc/analytics.getParsedReportByRecordName?${params}`, {
  headers: { 'x-api-key': '--dev-api-auth-key--' },
});
const json = await res.json();
console.log(json.result?.data);
```

See also `apps/backend/requests/analytics.fetch.js` for a runnable script.


