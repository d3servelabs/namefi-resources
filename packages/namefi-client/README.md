# Namefi Client

API client for Namefi.

> This package is still in alpha. APIs and behavior may change without notice.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Authentication](#authentication)
- [Contract](#contract)

## Installation

```bash
npm install @namefi-astra/client
```

## Usage

```ts
import { createNamefiClient } from '@namefi-astra/client';

const client = createNamefiClient({
  authentication: {
    apiKey: process.env.NAMEFI_API_KEY ?? '',
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

## Authentication

Provide an API key through the `authentication` option when creating the client.

## Contract

The client is generated against the bundled `contract.json` OpenAPI contract, which defines the available routes and shapes.
