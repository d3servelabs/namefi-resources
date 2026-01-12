# @namefi-astra/coredns-client

Type-safe client for the CoreDNS Cache Management API, built with [openapi-fetch](https://openapi-ts.dev/openapi-fetch/).

## Features

- Type-safe API calls generated from OpenAPI spec
- Zero runtime overhead (~6kb)
- X-API-Key authentication middleware
- Full TypeScript IntelliSense support

## Installation

```bash
bun add @namefi-astra/coredns-client
```

## Quick Start

```typescript
import { createCoreDNSClient } from "@namefi-astra/coredns-client";

const client = createCoreDNSClient({
  baseUrl: "http://localhost:8181",
  apiKey: "your-api-key",
});

// Get cache statistics
const { data, error } = await client.GET("/cache/stats");

// Query a specific cache entry
const { data: entry } = await client.GET("/cache/query", {
  params: { query: { name: "example.com.", type: "A" } },
});

// Flush cache entries
await client.POST("/cache/flush", {
  body: { zone: "example.com.", qtype: "A" },
});

// Dump cache with pagination
const { data: dump } = await client.GET("/cache/dump", {
  params: { query: { page: 1, limit: 100 } },
});
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/cache/stats` | Get cache statistics (size, capacity, config) |
| `GET` | `/cache/query` | Query a specific cache entry by name/type |
| `GET` | `/cache/dump` | Dump cache contents with pagination |
| `POST` | `/cache/flush` | Flush cache entries (with optional filters) |
| `DELETE` | `/cache/flush` | Flush cache entries (RESTful alternative) |

## Types

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

## Error Handling

```typescript
const { data, error, response } = await client.GET("/cache/stats");

if (error) {
  console.error(error.error);      // Error message
  console.error(response.status);  // HTTP status (401, 400, 405)
  return;
}

// data is fully typed
console.log(data.success_cache.size);
```

## Development

```bash
# Generate types from OpenAPI spec
bun run generate:types

# Type check
bun run typecheck

# Run tests
bun test
```

## OpenAPI Spec

The OpenAPI specification is located at `openapi-spec/cache.yaml`. Types are auto-generated to `src/generated/cache.d.ts`.

## Documentation

See [GUIDE.md](./GUIDE.md) for detailed usage examples and common patterns.
