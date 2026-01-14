![img](https://namefi.io/logotype.svg)


# [Namefi API Client](https://namefi.io)

> This package is still in alpha. APIs and behavior may change without notice.

> For [Full docs](https://namefi.io/public/docs/api)

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)

## Installation

```bash
npm install @namefi/api-client
```

## Usage

```ts
import { createNamefiClient } from '@namefi/api-client';

const client = createNamefiClient({
  authentication: {
    apiKey: process.env.NAMEFI_API_KEY!,
    type: 'API_KEY',
  },
  logger: true,
});

const domain = 'example.com';
const result = await client.search.checkAvailability({ domain });

if (result.availability) {
  const order = await client.orders.registerDomain({
    normalizedDomainName: domain,
    durationInYears: 1,
  });

  console.log('Registered', order.id);
}
```
