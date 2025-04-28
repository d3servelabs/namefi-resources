# NameFi Astra Documentation

## Table of Contents
- [Introduction](#introduction)
- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Core Components](#core-components)
  - [Backend](#backend)
  - [Frontend](#frontend)
  - [Database](#database)
  - [Temporal Workflows](#temporal-workflows)
- [Key Features](#key-features)
  - [Domain Registration](#domain-registration)
  - [DNS Management](#dns-management)
  - [Payment Processing](#payment-processing)
  - [Multi-Tenant Architecture](#multi-tenant-architecture)
- [Data Flow](#data-flow)
- [API Reference](#api-reference)
- [Development Guide](#development-guide)
- [Glossary](#glossary)

## Introduction

NameFi Astra is a domain name registration and management platform that combines traditional domain registration with blockchain technology. The platform allows users to search for available domains, purchase them using either traditional payment methods (credit cards via Stripe) or cryptocurrency (NFSC tokens), and manage their DNS records.

The unique aspect of NameFi Astra is that domain ownership is represented as NFTs (Non-Fungible Tokens) on the blockchain, providing verifiable ownership records. The platform serves both individual users looking to register domains and third-party platforms that want to integrate with NameFi's domain registration capabilities through a "Powered by NameFi" model.

### Key Capabilities

- **Domain Registration**: Search and register domain names with blockchain-backed ownership
- **DNS Management**: Configure and manage DNS records for registered domains
- **Payment Processing**: Support for both traditional (Stripe) and cryptocurrency (NFSC) payments
- **Multi-Tenant Architecture**: White-label solution for parent domain owners to issue subdomains
- **Blockchain Integration**: NFT-based domain ownership verification

## Architecture Overview

NameFi Astra is structured as a monorepo using Bun as the package manager. The architecture follows a modern web application pattern with a clear separation between frontend and backend components.

### High-Level Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│    Frontend     │◄────┤  Backend API    │◄────┤    Database     │
│    (Next.js)    │     │    (Hono)       │     │  (PostgreSQL)   │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               │
                        ┌──────▼──────┐     ┌─────────────────┐
                        │             │     │                 │
                        │   Temporal  │◄────┤  Blockchain     │
                        │  Workflows  │     │  Integration    │
                        │             │     │                 │
                        └─────────────┘     └─────────────────┘
```

The architecture consists of the following main components:

1. **Frontend**: A Next.js application providing the user interface
2. **Backend API**: A Hono-based server exposing a tRPC API
3. **Database**: PostgreSQL database with Drizzle ORM for type-safe queries
4. **Temporal Workflows**: Orchestration engine for long-running processes
5. **Blockchain Integration**: Services for interacting with blockchain networks

### Communication Flow

1. Users interact with the Next.js frontend
2. Frontend makes tRPC calls to the backend API
3. Backend processes requests, interacts with the database, and initiates workflows
4. Temporal workflows orchestrate complex processes like domain registration and payment processing
5. Blockchain integration services handle NFT minting and token transactions

## Project Structure

NameFi Astra is organized as a monorepo with the following structure:

```
namefi-astra/
├── apps/
│   ├── frontend/       # Next.js application
│   └── backend/        # Hono server with tRPC API
├── packages/
│   ├── db/             # Database schema and queries
│   ├── env/            # Environment configuration
│   ├── utils/          # Shared utilities
│   └── zod-dns/        # DNS validation schemas
└── docs/               # Documentation
```

### Key Directories

#### Frontend (`apps/frontend/`)

```
apps/frontend/
├── src/
│   ├── app/            # Next.js app router pages
│   ├── components/     # React components
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utility libraries
│   └── utils/          # Helper functions
```

#### Backend (`apps/backend/`)

```
apps/backend/
├── src/
│   ├── lib/            # Utility libraries
│   ├── services/       # Business logic services
│   ├── temporal/       # Temporal workflows and activities
│   ├── trpc/           # tRPC API routers
│   └── index.ts        # Main entry point
```

## Core Components

### Backend

The backend is built using Hono, a lightweight web framework, and exposes a tRPC API for type-safe communication with the frontend.

#### Main Entry Point

The main entry point for the backend is defined in `apps/backend/src/index.ts`:

```typescript
// apps/backend/src/index.ts
import { serve } from '@hono/node-server';
import { trpcServer } from '@hono/trpc-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { getPoweredByNamefi3PHostnames } from '#lib/namefi-registry';
import { config, secrets } from './lib/env';
import { nsJsonRouter } from './ns-json';
import { webhooksRouter } from './routers/webhooks';
import { createContext } from './trpc';
import { appRouter } from './trpc/routers/appRouter';

const app = new Hono();

// CORS configuration for multi-tenant support
app.use(async (...args) => {
  const allowedHostnames: string[] = [
    ...config.NAMEFI_FIRST_PARTY_HOSTNAMES,
    ...(await getPoweredByNamefi3PHostnames()),
  ];

  return cors({
    origin: (origin) => {
      // Origin validation logic
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })(...args);
});

// Configure middleware
app.use(prettyJSON());
app.use(logger());

// Mount tRPC router
app.use(
  '/trpc/*',
  trpcServer({
    router: appRouter,
    createContext,
  }),
);

// Mount other routers
app.route('v1/ns-json', nsJsonRouter);
app.route('/webhooks', webhooksRouter);

// Start server
serve(
  {
    fetch: app.fetch,
    port: config.PORT,
  },
  (info) => {
    console.info('Server is running on port', info.port);
  },
);
```

#### tRPC Routers

The backend API is organized into multiple tRPC routers, each handling a specific domain of functionality. The main router is defined in `apps/backend/src/trpc/routers/appRouter.ts`:

```typescript
// apps/backend/src/trpc/routers/appRouter.ts
import { createTRPCRouter } from '../base';

import { cartsRouter } from './cartsRouter';
import { dnsRecordsRouter } from './dnsRecordsRouter';
import { ordersRouter } from './ordersRouter';
import { paymentsRouter } from './paymentsRouter';
import { registryRouter } from './registryRouter';
import { searchRouter } from './searchRouter';
import { usersRouter } from './usersRouter';

export const appRouter = createTRPCRouter({
  dnsRecords: dnsRecordsRouter,
  users: usersRouter,
  carts: cartsRouter,
  payments: paymentsRouter,
  search: searchRouter,
  registry: registryRouter,
  orders: ordersRouter,
});

export type AppRouter = typeof appRouter;
```

The individual routers handle specific functionality:

- **dnsRecordsRouter**: DNS record management (create, update, delete)
- **usersRouter**: User profile and domain ownership management
- **cartsRouter**: Shopping cart operations
- **paymentsRouter**: Payment processing
- **searchRouter**: Domain search functionality
- **registryRouter**: Domain registry operations
- **ordersRouter**: Order management

### Frontend

The frontend is built using Next.js and provides the user interface for the platform.

#### Key Components

##### Domain Search

The domain search functionality is implemented in `apps/frontend/src/components/search/Search.tsx`:

```typescript
// Example from search component
export const Search = ({
  onSearch,
  placeholder = 'Search for a domain name',
  ...props
}: SearchProps) => {
  // Implementation details
  return (
    <div className="relative w-full">
      <Input
        placeholder={placeholder}
        value={searchTerm}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        className="pr-10"
        {...props}
      />
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-0 top-0"
        onClick={handleSearch}
      >
        <Search className="h-4 w-4" />
      </Button>
    </div>
  );
};
```

##### DNS Management

The DNS management interface is implemented in `apps/frontend/src/components/DNS/DnsManagement.tsx`:

```typescript
// apps/frontend/src/components/DNS/DnsManagement.tsx
export const DnsManagement: FC<DnsManagementProps> = ({
  domain,
  className,
  ...rest
}: DnsManagementProps) => {
  const [, setRecentDomains] = useLocalStorage(
    LocalStorageKeys.RECENT_DOMAINS,
    [domain] as string[],
  );

  useEffect(() => {
    setRecentDomains((prevRecentDomains) => {
      const filtered = prevRecentDomains.filter(
        (recentDomain) => recentDomain !== domain,
      );
      return [...filtered, domain];
    });
  }, [setRecentDomains, domain]);

  return (
    <div className={cn('', className)} {...rest}>
      <Tabs defaultValue="dns-setting" className="w-full">
        <TabsList className="grid w-full grid-cols-1 mb-8">
          <TabsTrigger value="dns-setting">DNS Setting</TabsTrigger>
        </TabsList>

        <TabsContent value="dns-setting">
          <Tabs defaultValue="dns-records">
            <TabsList className="mb-8">
              <TabsTrigger value="dns-records">DNS Records</TabsTrigger>
              <TabsTrigger value="forwarding">Forwarding</TabsTrigger>
              <TabsTrigger value="nameservers">Nameservers</TabsTrigger>
              <TabsTrigger value="dnssec">DNSSEC</TabsTrigger>
            </TabsList>

            <TabsContent value="dns-records">
              <DnsRecordsPanel domain={domain} />
            </TabsContent>
            
            {/* Other tabs content */}
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
};
```

### Database

The database schema is defined using Drizzle ORM in `packages/db/src/schema.ts`. It includes tables for users, cart items, orders, payments, DNS records, and NFT ownership.

#### Key Tables

##### Users Table

```typescript
// packages/db/src/schema.ts
export const usersTable = pgTable('users', {
  ...randomUuid,
  primaryEmail: text('primary_email').unique(),
  stripeCustomerId: text('stripe_customer_id').unique(),
  privyUserId: text('privy_user_id').notNull().unique(),
  ...timestamps,
});
```

##### DNS Records Table

```typescript
// packages/db/src/schema.ts
export const dnsRecordsTable = pgTable(
  'dns_records',
  {
    ...randomUuid,
    zoneName: text('zone_name').notNull().$type<NamefiNormalizedDomain>(),
    /**
     * The owner name of this DNS record (RFC-1034 3.6, RFC-1035 3.2.1)
     *
     * This field follows RFC-1034 conventions where:
     * - For zone apex records: use "@" or empty string
     * - For subdomains: use the label only (e.g., "www" not "www.example.com")
     * - For records outside the zone: use the full name ending with "."
     */
    name: text('name').notNull().default('@'), // max 255 chars
    type: recordTypePgEnum('type').notNull(),
    class: text('class').notNull().default('IN'),
    ttl: integer('ttl').notNull().default(120),
    rdata: text('rdata').notNull(),
    metadata: jsonb('metadata').default({}).$type<any>(),
    ...timestamps,
  },
  (table) => [
    index('dns_records_domain_idx').on(table.zoneName),
    index('dns_records_name_idx').on(table.name),
    index('dns_records_type_idx').on(table.type),
    unique('dns_records_domain_name_type_class_rdata_unique').on(
      table.zoneName,
      table.name,
      table.type,
      table.class,
      table.rdata,
    ),
  ],
);
```

##### NFT Ownership Table

```typescript
// packages/db/src/schema.ts
export const namefiNftTable = pgTable(
  'namefi_nft',
  {
    ...normalizedDomain, // is treated as an id and primary key
    chainId: integer('chain_id').notNull(),
    asOfBlockNumber: bigint('as_of_block_number', { mode: 'bigint' }).notNull(),
    ownerAddress: text('owner_address').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.normalizedDomainName] }),
    index('namefi_nft_owner_address_idx').on(table.ownerAddress),
    index('namefi_nft_chain_id_idx').on(table.chainId),
  ],
);
```

### Temporal Workflows

Temporal is used for orchestrating long-running processes such as domain registration, payment processing, and NFT minting. The Temporal integration is organized in the `apps/backend/src/temporal/` directory.

#### Workflow Structure

```
temporal/
├── activities/        # Activity implementations that do actual work
├── shared/            # Shared configurations and constants
├── workers/           # Worker setup and management
├── workflows/         # Workflow definitions that orchestrate activities
├── main.temporal.ts   # Main entry point for the Temporal server
└── workers.router.ts  # HTTP endpoints for managing workers
```

#### Key Workflows

##### Process Order Workflow

The process order workflow orchestrates the entire order processing lifecycle, from payment to domain registration and NFT minting:

```typescript
// Example workflow structure
export async function processOrderWorkflow(
  input: ProcessOrderWorkflowInput,
): Promise<ProcessOrderWorkflowResult> {
  // 1. Validate order
  // 2. Process payment
  // 3. Register domains
  // 4. Mint NFTs
  // 5. Update order status
}
```

##### Charge User Workflow

The charge user workflow handles payment processing through different payment providers:

```typescript
// Example workflow structure
export async function chargeUserWorkflow(
  input: ChargeUserWorkflowInput,
): Promise<ChargeUserWorkflowResult> {
  // 1. Validate payment details
  // 2. Process payment through selected provider (Stripe or NFSC)
  // 3. Handle payment confirmation
  // 4. Update payment status
}
```

## Key Features

### Domain Registration

The domain registration process involves several steps:

1. **Domain Search**: Users search for available domains
2. **Cart Management**: Users add domains to their cart
3. **Checkout**: Users select payment method and complete purchase
4. **Order Processing**: System processes payment and registers domains
5. **NFT Minting**: System mints NFTs representing domain ownership

#### Domain Search Implementation

The domain search functionality is implemented in the `searchRouter`:

```typescript
// Example from searchRouter
export const searchRouter = createTRPCRouter({
  search: publicProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ input }) => {
      // Implementation details for domain search
    }),
  
  suggestions: publicProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ input }) => {
      // Implementation details for domain suggestions
    }),
});
```

### DNS Management

The DNS management feature allows users to configure and manage DNS records for their registered domains. The implementation follows a simplified zone management approach through NFT ownership.

#### DNS Records Design

As described in the architecture decision document:

1. **No Separate DNS Zones Table**
   - DNS zones are implicitly managed through the `normalizedDomainName` field
   - Zone ownership is derived from NFT address associated with the domain name

2. **Subdomain Restrictions**
   - Only subdomains of `PoweredByNamefiThirdPartyDomainName` are allowed
   - The `name` field specifically stores the subdomain part, not the full domain name

#### DNS Records Router

The DNS records management API is implemented in the `dnsRecordsRouter`:

```typescript
// Example from dnsRecordsRouter
export const dnsRecordsRouter = createTRPCRouter({
  list: authenticatedProcedure
    .input(z.object({ domain: z.string() }))
    .query(async ({ ctx, input }) => {
      // Implementation details for listing DNS records
    }),
  
  create: authenticatedProcedure
    .input(createDnsRecordSchema)
    .mutation(async ({ ctx, input }) => {
      // Implementation details for creating DNS records
    }),
  
  update: authenticatedProcedure
    .input(updateDnsRecordSchema)
    .mutation(async ({ ctx, input }) => {
      // Implementation details for updating DNS records
    }),
  
  delete: authenticatedProcedure
    .input(deleteDnsRecordSchema)
    .mutation(async ({ ctx, input }) => {
      // Implementation details for deleting DNS records
    }),
});
```

### Payment Processing

NameFi Astra supports multiple payment methods:

1. **Credit Card Payments**: Processed through Stripe
2. **Cryptocurrency Payments**: Using NFSC tokens

#### Payment Router

The payment processing API is implemented in the `paymentsRouter`:

```typescript
// Example from paymentsRouter
export const paymentsRouter = createTRPCRouter({
  createPayment: authenticatedProcedure
    .input(createPaymentSchema)
    .mutation(async ({ ctx, input }) => {
      // Implementation details for creating payments
    }),
  
  getPaymentStatus: authenticatedProcedure
    .input(z.object({ paymentId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Implementation details for getting payment status
    }),
});
```

### Multi-Tenant Architecture

NameFi Astra is designed as a white-label application for parent domain owners to issue subdomains under their parent domain. This enables community building, governance, and monetization for communities, KOLs, and clubs.

#### Multi-Tenant Implementation

The multi-tenant architecture affects several aspects of the application:

1. **CORS Configuration**: The backend allows requests from both first-party and third-party hostnames
2. **Cart and Order Filtering**: Cart items and order history are filtered by parent domain on white-labeled sites
3. **Subdomain Restrictions**: Only subdomains of the parent domain can be managed

```typescript
// Example of multi-tenant CORS configuration
app.use(async (...args) => {
  const allowedHostnames: string[] = [
    ...config.NAMEFI_FIRST_PARTY_HOSTNAMES,
    ...(await getPoweredByNamefi3PHostnames()),
  ];

  return cors({
    origin: (origin) => {
      // Origin validation logic
    },
    // Other CORS settings
  })(...args);
});
```

## Data Flow

### Domain Registration Flow

1. **User searches for domains**
   - Frontend: User enters domain name in search component
   - Backend: `searchRouter.search` procedure checks domain availability
   - Frontend: Displays search results with available domains

2. **User adds domains to cart**
   - Frontend: User clicks "Add to Cart" button
   - Backend: `cartsRouter.addToCart` procedure adds domain to user's cart
   - Frontend: Updates cart UI with new item

3. **User checks out**
   - Frontend: User navigates to cart and clicks "Checkout"
   - Frontend: User selects payment method (Stripe or NFSC)
   - Backend: `paymentsRouter.createPayment` procedure creates payment record
   - Backend: `ordersRouter.createOrder` procedure creates order record

4. **System processes payment**
   - Backend: Temporal `chargeUserWorkflow` processes payment
   - Backend: Payment provider (Stripe or NFSC) handles transaction
   - Backend: Temporal workflow updates payment status

5. **System registers domain and mints NFT**
   - Backend: Temporal `processOrderWorkflow` processes order items
   - Backend: Temporal `registerSubdomainWorkflow` registers domain
   - Backend: Temporal `mintNamefiNFT` mints NFT for domain ownership
   - Backend: Order status is updated to "SUCCEEDED"

6. **System notifies user**
   - Backend: Notification is sent to user
   - Frontend: Order confirmation page is displayed

### DNS Management Flow

1. **User navigates to DNS management**
   - Frontend: User selects domain from dashboard
   - Frontend: `DnsManagement` component is rendered
   - Backend: `dnsRecordsRouter.list` procedure fetches DNS records

2. **User manages DNS records**
   - Frontend: User interacts with DNS records table
   - Frontend: User adds, edits, or deletes DNS records
   - Backend: `dnsRecordsRouter` procedures handle CRUD operations
   - Backend: DNS records are updated in the database

## API Reference

### tRPC Routers

#### App Router

The main tRPC router that aggregates all sub-routers:

```typescript
// apps/backend/src/trpc/routers/appRouter.ts
export const appRouter = createTRPCRouter({
  dnsRecords: dnsRecordsRouter,
  users: usersRouter,
  carts: cartsRouter,
  payments: paymentsRouter,
  search: searchRouter,
  registry: registryRouter,
  orders: ordersRouter,
});
```

#### DNS Records Router

Handles DNS record management:

```typescript
// apps/backend/src/trpc/routers/dnsRecordsRouter.ts
export const dnsRecordsRouter = createTRPCRouter({
  list: authenticatedProcedure
    .input(z.object({ domain: z.string() }))
    .query(async ({ ctx, input }) => {
      // Implementation details
    }),
  
  create: authenticatedProcedure
    .input(createDnsRecordSchema)
    .mutation(async ({ ctx, input }) => {
      // Implementation details
    }),
  
  // Other procedures
});
```

#### Orders Router

Handles order management:

```typescript
// apps/backend/src/trpc/routers/ordersRouter.ts
export const ordersRouter = createTRPCRouter({
  create: authenticatedProcedure
    .input(createOrderSchema)
    .mutation(async ({ ctx, input }) => {
      // Implementation details
    }),
  
  getOrder: authenticatedProcedure
    .input(z.object({ orderId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Implementation details
    }),
  
  // Other procedures
});
```

## Development Guide

### Local Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/d3servelabs/namefi-astra.git
   cd namefi-astra
   ```

2. **Install dependencies**:
   ```bash
   bun install
   ```

3. **Set up environment variables**:
   ```bash
   cp apps/frontend/.env.template apps/frontend/.env
   cp apps/backend/.env.template apps/backend/.env
   ```

4. **Start the backend**:
   ```bash
   bun --cwd apps/backend with-env env
   ```

5. **Start the frontend**:
   ```bash
   bun --cwd apps/frontend with-env env
   ```

### Running Tests

```bash
bun run test
```

### Linting

```bash
bun run validate
```

## Glossary

| Term | Description | Code Reference |
|------|-------------|----------------|
| **NameFi Astra** | The name of the platform for domain registration with blockchain integration | `@namefi-astra/*` |
| **NFSC** | Namefi Service Credit, a token used for payments within the platform | `packages/utils/src/contract-addresses.ts` |
| **Namefi NFT** | Non-fungible token representing domain ownership on the blockchain | `packages/utils/src/contract-addresses.ts` |
| **NamefiNormalizedDomain** | Type for standardized domain name format (lowercase FQDN without terminating dot) | `packages/db/src/schema.ts` |
| **appRouter** | Main tRPC router that aggregates all sub-routers for the backend API | `apps/backend/src/trpc/routers/appRouter.ts` |
| **processOrderWorkflow** | Temporal workflow orchestrating the order processing lifecycle | `apps/backend/src/temporal/workflows/processOrder.workflow.ts` |
| **chargeUserWorkflow** | Temporal workflow for charging a user via payment provider | `apps/backend/src/temporal/workflows/chargeUser.workflow.ts` |
| **registerSubdomainWorkflow** | Temporal workflow for registering a domain by minting an NFT | `apps/backend/src/temporal/workflows/register-subdomain.workflow.ts` |
| **mintNamefiNFT** | Function to mint NFTs representing domain ownership | `apps/backend/src/temporal/workflows/mint.workflow.ts` |
| **parkDomain** | Function to set specific DNS records for a parked domain | `apps/backend/src/services/dns/parking.ts` |
| **isDomainParked** | Function to check if a domain has the standard parking DNS records | `apps/backend/src/services/dns/parking.ts` |
