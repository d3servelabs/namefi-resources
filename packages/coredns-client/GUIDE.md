# CoreDNS Cache Client Guide

This package provides a type-safe client for the CoreDNS Cache Management API.

## Installation

```typescript
import { createCoreDNSClient } from "@namefi-astra/coredns-client";
```

## Client Setup

```typescript
const client = createCoreDNSClient({
  baseUrl: "http://localhost:8181",  // CoreDNS cache API URL
  apiKey: "your-api-key",            // X-API-Key authentication
});
```

## Available Endpoints

### GET /cache/stats

Retrieve cache statistics including size, capacity, and configuration.

```typescript
const { data, error } = await client.GET("/cache/stats");

if (data) {
  console.log(data.success_cache.size);           // Current entries in success cache
  console.log(data.success_cache.capacity);       // Max capacity
  console.log(data.denial_cache.size);            // Current entries in denial cache
  console.log(data.configuration.prefetch_enabled);
}
```

**Response type: `StatsResponse`**

### GET /cache/query

Look up a specific entry in the cache by name and type.

```typescript
const { data, error } = await client.GET("/cache/query", {
  params: {
    query: {
      name: "example.com.",  // Required: FQDN (must end with dot)
      type: "A",             // Optional: DNS record type (default: "A")
      do: "0",               // Optional: DNSSEC OK bit ("0", "1", "true", "false")
      cd: "0",               // Optional: Checking Disabled bit
    },
  },
});

if (data?.found) {
  console.log(data.cache_type);      // "success" or "denial"
  console.log(data.ttl_remaining);   // Seconds until expiry
  console.log(data.answer);          // Array of DNS answer records
}
```

**Response type: `CacheEntry`**

### GET /cache/dump

Export cache contents with pagination.

```typescript
const { data, error } = await client.GET("/cache/dump", {
  params: {
    query: {
      page: 1,              // Optional: Page number (1-indexed, default: 1)
      limit: 100,           // Optional: Entries per page (max 1000, default: 100)
      cache_type: "all",    // Optional: "all", "success", or "denial"
    },
  },
});

if (data) {
  console.log(data.total_entries);   // Total entries across all pages
  console.log(data.total_pages);     // Total number of pages
  for (const entry of data.entries) {
    console.log(entry.name, entry.qtype_name, entry.ttl_remaining);
  }
}
```

**Response type: `DumpResponse`**

### POST /cache/flush

Flush cache entries with optional filters.

```typescript
// Flush all entries
const { data, error } = await client.POST("/cache/flush", {
  body: {},
});

// Flush specific zone
await client.POST("/cache/flush", {
  body: { zone: "example.com." },
});

// Flush specific record type
await client.POST("/cache/flush", {
  body: { qtype: "AAAA" },
});

// Flush zone + type combination
await client.POST("/cache/flush", {
  body: {
    zone: "example.com.",
    qtype: "A",
  },
});

// Flush only success or denial cache
await client.POST("/cache/flush", {
  body: { cache_type: "success" },  // or "denial" or "all"
});

if (data) {
  console.log(data.details.total_flushed);         // Total entries flushed
  console.log(data.details.success_cache_flushed); // From success cache
  console.log(data.details.denial_cache_flushed);  // From denial cache
}
```

**Response type: `FlushResponse`**

### DELETE /cache/flush

Same as POST /cache/flush (alternative RESTful method).

```typescript
await client.DELETE("/cache/flush", {
  body: { zone: "example.com." },
});
```

## Error Handling

All responses include `data` and `error` fields. Check for errors:

```typescript
const { data, error, response } = await client.GET("/cache/stats");

if (error) {
  // error is typed as ErrorResponse
  console.error(error.error);    // Error message
  console.error(error.details);  // Additional details (optional)
  console.error(response.status); // HTTP status code (401, 400, 405)
  return;
}

// data is typed and safe to use
console.log(data.success_cache.size);
```

## Available Types

Import types for use in your code:

```typescript
import type {
  // Client config
  CoreDNSClientConfig,
  
  // Full OpenAPI types
  paths,
  components,
  
  // Schema types
  FlushRequest,
  FlushResponse,
  StatsResponse,
  CacheStats,
  CacheConfiguration,
  CacheEntry,
  DumpResponse,
  ErrorResponse,
} from "@namefi-astra/coredns-client";
```

## Common Patterns

### Check if domain is cached

```typescript
async function isDomainCached(domain: string, type = "A"): Promise<boolean> {
  const { data } = await client.GET("/cache/query", {
    params: { query: { name: domain, type } },
  });
  return data?.found ?? false;
}
```

### Get all cached entries for a zone

```typescript
async function getAllEntriesForZone(zone: string): Promise<CacheEntry[]> {
  const entries: CacheEntry[] = [];
  let page = 1;
  
  while (true) {
    const { data } = await client.GET("/cache/dump", {
      params: { query: { page, limit: 1000 } },
    });
    
    if (!data) break;
    
    // Filter entries matching the zone
    const zoneEntries = data.entries.filter(e => 
      e.name?.endsWith(zone) || e.name === zone
    );
    entries.push(...zoneEntries);
    
    if (page >= data.total_pages) break;
    page++;
  }
  
  return entries;
}
```

### Flush and verify

```typescript
async function flushZoneAndVerify(zone: string): Promise<boolean> {
  const { data: flushResult } = await client.POST("/cache/flush", {
    body: { zone },
  });
  
  if (!flushResult?.success) return false;
  
  // Verify by querying
  const { data: queryResult } = await client.GET("/cache/query", {
    params: { query: { name: zone } },
  });
  
  return queryResult?.found === false;
}
```

### Monitor cache utilization

```typescript
async function getCacheUtilization(): Promise<{
  success: number;
  denial: number;
  total: number;
}> {
  const { data } = await client.GET("/cache/stats");
  
  if (!data) throw new Error("Failed to get cache stats");
  
  return {
    success: data.success_cache.utilization_percent,
    denial: data.denial_cache.utilization_percent,
    total: (data.success_cache.size + data.denial_cache.size) /
           (data.success_cache.capacity + data.denial_cache.capacity) * 100,
  };
}
```
