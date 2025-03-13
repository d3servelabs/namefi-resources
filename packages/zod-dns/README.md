# Zod DNS Schemas

Zod schemas for DNS created by [Namefi](https://namefi.io) Team.

## Installation

```bash
npm install @namefi-astra/zod-dns
```

## Usage

1. Validate a Zone

```ts
import { zoneSchema } from '@namefi-astra/zod-dns';

const zone = zoneSchema.parse({
  zoneName: 'example.com',
  records: [],
});
```

2. Validate a Record

```ts
import { recordSchema } from '@namefi-astra/zod-dns';

const record = recordSchema.parse({
  name: 'www',
  type: 'A',
  ttl: 3600,
  rdata: '192.168.1.1',
});
```

