# Namefi Astra Documentation

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

Namefi Astra is a domain name registration and management platform that combines traditional domain registration with blockchain technology. The platform allows users to search for available domains, purchase them using either traditional payment methods (credit cards via Stripe) or cryptocurrency (NFSC tokens), and manage their DNS records.

The unique aspect of Namefi Astra is that domain ownership is represented as NFTs (Non-Fungible Tokens) on the blockchain, providing verifiable ownership records. The platform serves both individual users looking to register domains and third-party platforms that want to integrate with Namefi's domain registration capabilities through a "Powered by Namefi" model.

### Key Capabilities

- **Domain Registration**: Search and register domain names with blockchain-backed ownership
- **DNS Management**: Configure and manage DNS records for registered domains
- **Payment Processing**: Support for both traditional (Stripe) and cryptocurrency (NFSC) payments
- **Multi-Tenant Architecture**: White-label solution for parent domain owners to issue subdomains
- **Blockchain Integration**: NFT-based domain ownership verification

## Architecture Overview

Namefi Astra is structured as a monorepo using Bun as the package manager. The architecture follows a modern web application pattern with a clear separation between frontend and backend components.

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

Namefi Astra is organized as a monorepo with the following structure:

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
4. **Order Processing**: System processes payment(s) and registers domains
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

Namefi Astra supports multiple payment methods:

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

Namefi Astra is designed as a white-label application for parent domain owners to issue subdomains under their parent domain. This enables community building, governance, and monetization for communities, KOLs, and clubs.

#### Multi-Tenant Implementation

The multi-tenant architecture affects several aspects of the application:

1. **CORS Configuration**: The backend allows requests from both first-party and third-party hostnames
2. **Cart and Order Filtering**: Cart items and order history are filtered by parent domain on white-labeled sites
3. **Subdomain Restrictions**: Only subdomains of the parent domain can be managed

```typescript
// Multi-tenant CORS configuration from apps/backend/src/index.ts
app.use(async (...args) => {
  const allowedHostnames: string[] = [
    ...config.NAMEFI_FIRST_PARTY_HOSTNAMES,
    ...(await getPoweredByNamefi3PHostnames()),
  ];

  return cors({
    origin: (origin) => {
      if (origin) {
        try {
          const parsedOrigin = new URL(origin);

          // Check if it's using https
          if (!config.ALLOW_HTTP && parsedOrigin.protocol !== 'https:') {
            return null;
          }

          if (
            allowedHostnames.includes(parsedOrigin.hostname) ||
            allowedHostnames.includes(
              config.ADDITIONAL_HOSTNAME_MAP[parsedOrigin.hostname],
            )
          ) {
            return origin;
          }
        } catch (error) {
          console.error('Error parsing origin', error);
          return null;
        }
      }
      return null; // Block other origins
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true, // Allow cookies if needed
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

The backend exposes multiple API layers for different use cases: a tRPC API for the frontend application, an OpenAPI/REST API for external integrations, and various HTTP endpoints for specific services.

### OpenAPI/REST API (External)

The primary externally callable API is available at `/v-next/` with OpenAPI documentation. This API is designed for third-party integrations and programmatic access.

**Base URLs:**
- Development: `https://backend.astra.namefi.dev/v-next/`
- Production: `https://backend.astra.namefi.io/v-next/`

**Documentation:** Interactive API documentation is available at `/v-next/openapi/doc`

**Authentication:** Supports Bearer token and API key (`x-api-key` header) authentication.

**Available Endpoints:**

| Category | Description |
|----------|-------------|
| **search** | Domain availability search and suggestions |
| **orders** | Order creation, status, and instant buy operations |
| **dnsRecords** | DNS record CRUD operations |
| **user** | User profile and domain ownership data |
| **balance** | NFSC token balance queries |

### Public HTTP Endpoints

These endpoints are accessible without user authentication (some require API keys for rate limiting):

| Path | Description |
|------|-------------|
| `GET /v1/availability` | Check domain availability (single domain) |
| `POST /v1/availability/bulk` | Check availability for multiple domains (up to 200) |
| `GET /v1/public/tlds` | Get TLD pricing table |
| `POST /v1/public/ai/generate-logo` | Generate AI logo for a domain (requires API key) |
| `GET /v1/public/ai/generations/:id` | Retrieve a generated logo (requires API key) |

### Webhook Endpoints

| Path | Description |
|------|-------------|
| `POST /webhooks/nft-activity` | Alchemy webhook for NFT activity notifications |

### tRPC API (Frontend)

The tRPC API at `/trpc/*` is the primary API used by the Namefi Astra frontend application. It provides type-safe communication between the frontend and backend with full TypeScript inference.

**Base URLs:**
- Development: `https://backend.astra.namefi.dev/trpc/`
- Production: `https://backend.astra.namefi.io/trpc/`

**Authentication:** Uses Privy authentication tokens passed via the `Authorization` header.

**Available Routers:**

| Router | Description |
|--------|-------------|
| **admin** | Administrative operations and user management |
| **ai** | AI-powered domain suggestions and branding |
| **apiKeys** | API key management |
| **auth** | Authentication operations |
| **freeClaims** | Free domain claim processing |
| **pbnReservations** | Powered by NameFI subdomain reservations |
| **analytics** | Analytics and tracking |
| **bigQueryAudit** | Audit log queries |
| **config** | Application configuration |
| **dnsRecords** | DNS record management |
| **users** | User profile and domain ownership |
| **carts** | Shopping cart operations |
| **payments** | Payment processing (Stripe, NFSC) |
| **search** | Domain search and availability |
| **registry** | Domain registry operations |
| **orders** | Order management and history |
| **domainConfig** | Domain configuration (DNSSEC, nameservers) |
| **hunt** | Domain hunting/discovery features |
| **share** | Domain sharing functionality |
| **wishlist** | Domain wishlist management |
| **pbnOwner** | Powered by NameFI owner operations |
| **newsletter** | Newsletter subscription management |
| **feedback** | User feedback collection |
| **dnsCache** | DNS cache management |
| **version** | API version information |

#### Detailed tRPC Endpoint Reference

The following sections document each tRPC router's endpoints with their input parameters and source code locations. Endpoints are categorized by authentication level: **public** (no auth required), **protected** (requires Privy auth), **admin** (requires admin permissions), or **owner** (requires domain ownership).

##### search Router
Source: [`apps/backend/src/trpc/routers/searchRouter.ts`](../apps/backend/src/trpc/routers/searchRouter.ts)

| Endpoint | Type | Auth | Input | Description |
|----------|------|------|-------|-------------|
| `isDomainAvailable` | query | public/protected | `{ domain: string }` | Check if a domain is available for registration |
| `getClubsCategoriesWithStats` | query | public/protected | none | Get club categories with statistics |
| `getDomainSuggestions` | query | public | `{ query: string, tlds?: string[] }` | Get domain name suggestions based on query |
| `streamDomainAvailability` | subscription | public/protected | `{ domains: string[] }` | Stream availability status for multiple domains |
| `checkFreeClaimEligibility` | query | protected | `{ domain: string }` | Check if user is eligible for free domain claim |

##### orders Router
Source: [`apps/backend/src/trpc/routers/ordersRouter.ts`](../apps/backend/src/trpc/routers/ordersRouter.ts)

| Endpoint | Type | Auth | Input | Description |
|----------|------|------|-------|-------------|
| `createOrder` | mutation | protected | `{ items: OrderItem[], paymentMethod: string }` | Create a new order |
| `getOrder` | query | protected | `{ orderId: string }` | Get order details by ID |
| `getOrderItems` | query | protected | `{ orderId: string }` | Get items in an order |
| `getOrderProgress` | query | protected | `{ orderId: string }` | Get order processing progress |
| `createOrderV2` | mutation | protected | `{ items: OrderItem[], paymentMethod: string }` | Create order (v2 with enhanced features) |
| `instantBuy` | mutation | protected | `{ domain: string, paymentMethod: string }` | Quick purchase a domain |

##### carts Router
Source: [`apps/backend/src/trpc/routers/cartsRouter.ts`](../apps/backend/src/trpc/routers/cartsRouter.ts)

| Endpoint | Type | Auth | Input | Description |
|----------|------|------|-------|-------------|
| `getItems` | query | protected | none | Get all items in user's cart |
| `addItems` | mutation | protected | `{ items: CartItem[] }` | Add items to cart |
| `updateItem` | mutation | protected | `{ itemId: string, updates: object }` | Update a cart item |
| `removeItem` | mutation | protected | `{ itemId: string }` | Remove item from cart |
| `clear` | mutation | protected | none | Clear all items from cart |

##### users Router
Source: [`apps/backend/src/trpc/routers/usersRouter.ts`](../apps/backend/src/trpc/routers/usersRouter.ts)

| Endpoint | Type | Auth | Input | Description |
|----------|------|------|-------|-------------|
| `getUser` | query | protected | none | Get current user profile |
| `getMyPermissions` | query | protected | none | Get user's permissions |
| `getCurrentUserDomains` | query | protected | `{ page?, limit? }` | Get domains owned by current user |
| `requestNfscFaucet` | mutation | public | `{ walletAddress: string }` | Request NFSC tokens from faucet |
| `getNfscFaucetStatus` | query | public | `{ walletAddress: string }` | Check faucet request status |
| `updatePrivyCustomMetadata` | mutation | protected | `{ metadata: object }` | Update user's Privy metadata |
| `getUserQualifiesForDomainNamePromo` | query | protected | `{ domain: string }` | Check promo eligibility |
| `getImpersonationStatus` | query | protected | none | Get current impersonation status |
| `impersonateUser` | mutation | admin | `{ userId: string }` | Impersonate another user (admin only) |
| `stopImpersonating` | mutation | protected | none | Stop impersonating |

##### dnsRecords Router
Source: [`apps/backend/src/trpc/routers/dnsRecordsRouter.ts`](../apps/backend/src/trpc/routers/dnsRecordsRouter.ts)

| Endpoint | Type | Auth | Input | Description |
|----------|------|------|-------|-------------|
| `getRecords` | query | public | `{ domain: string }` | Get DNS records for a domain |
| `createDnsRecord` | mutation | protected | `{ domain: string, record: DnsRecord }` | Create a DNS record |
| `updateRecord` | mutation | protected | `{ domain: string, recordId: string, record: DnsRecord }` | Update a DNS record |
| `deleteRecord` | mutation | protected | `{ domain: string, recordId: string }` | Delete a DNS record |
| `updateRecords` | mutation | protected | `{ domain: string, records: DnsRecord[] }` | Batch update DNS records |
| `createRecords` | mutation | protected | `{ domain: string, records: DnsRecord[] }` | Batch create DNS records |
| `deleteRecords` | mutation | protected | `{ domain: string, recordIds: string[] }` | Batch delete DNS records |
| `parkDomain` | mutation | protected | `{ domain: string }` | Set parking DNS records |

##### payments Router
Source: [`apps/backend/src/trpc/routers/paymentsRouter.ts`](../apps/backend/src/trpc/routers/paymentsRouter.ts)

| Endpoint | Type | Auth | Input | Description |
|----------|------|------|-------|-------------|
| `createCustomerSession` | mutation | protected | none | Create Stripe customer session |
| `createSetupIntent` | mutation | protected | none | Create Stripe setup intent |
| `deletePaymentMethod` | mutation | protected | `{ paymentMethodId: string }` | Delete a saved payment method |
| `getPaymentMethods` | query | protected | none | Get user's saved payment methods |

##### ai Router
Source: [`apps/backend/src/trpc/routers/aiRouter.ts`](../apps/backend/src/trpc/routers/aiRouter.ts)

| Endpoint | Type | Auth | Input | Description |
|----------|------|------|-------|-------------|
| `generateLogo` | mutation | protected | `{ domain: string, type: string, style: string, model?: string }` | Generate AI logo for domain |
| `generatePoster` | mutation | protected | `{ domain: string, collateralType?: string, model?: string }` | Generate marketing poster |
| `getGenerationsByDomain` | query | protected | `{ domain: string }` | Get AI generations for a domain |
| `getUserDomains` | query | protected | none | Get domains with AI generations |
| `getUserGenerationsFiltered` | query | protected | `{ types?: string[], domains?: string[], limit?: number }` | Get filtered AI generations |
| `getGenerationsByType` | query | protected | `{ domain: string, type: string }` | Get generations by type |
| `getFeaturedAndRecentGenerations` | query | public | none | Get featured and recent generations |
| `getGenerationById` | query | public | `{ id: string }` | Get generation by ID |
| `deleteGeneration` | mutation | protected | `{ id: string }` | Delete an AI generation |
| `getInternalGenerationsByDomain` | query | public | `{ domain: string }` | Get internal generations for domain |
| `getInternalGenerationsByDomains` | query | public | `{ domains: string[] }` | Get internal generations for multiple domains |
| `getUserGenerationUsage` | query | protected | none | Get user's generation usage stats |

##### apiKeys Router
Source: [`apps/backend/src/trpc/routers/apiKeysRouter.ts`](../apps/backend/src/trpc/routers/apiKeysRouter.ts)

| Endpoint | Type | Auth | Input | Description |
|----------|------|------|-------|-------------|
| `getSigningTypes` | query | protected | none | Get EIP-712 signing types for API key operations |
| `list` | query | protected | none | List user's API keys |
| `create` | mutation | protected | `{ signature: string, payload: CreateApiKeyPayload }` | Create new API key (requires EIP-712 signature) |
| `revoke` | mutation | protected | `{ signature: string, payload: RevokeApiKeyPayload }` | Revoke an API key (requires EIP-712 signature) |
| `updateName` | mutation | protected | `{ signature: string, payload: UpdateNamePayload }` | Update API key name (requires EIP-712 signature) |
| `getById` | query | protected | `{ keyId: string }` | Get API key by ID |

##### auth Router
Source: [`apps/backend/src/trpc/routers/authRouter.ts`](../apps/backend/src/trpc/routers/authRouter.ts)

| Endpoint | Type | Auth | Input | Description |
|----------|------|------|-------|-------------|
| `getSigningDomain` | query | public | none | Get EIP-712 domain configuration for signing |

##### freeClaims Router
Source: [`apps/backend/src/trpc/routers/freeClaimsRouter.ts`](../apps/backend/src/trpc/routers/freeClaimsRouter.ts)

| Endpoint | Type | Auth | Input | Description |
|----------|------|------|-------|-------------|
| `checkEligibility` | query | protected | `{ groupOrCampaignKey: string, normalizedDomainName: string }` | Check free claim eligibility |
| `processClaim` | mutation | protected | `{ normalizedDomainName: string, recipientWalletAddress: string, durationInYears: number, registrarKey: string }` | Process a free claim |
| `getDomainClaimStatus` | query | protected | `{ domainName: string, claimId?: string }` | Get claim workflow status |
| `searchWorkflows` | query | protected | `{ domainName?: string, groupOrCampaignKey?: string, limit?: number }` | Search free claim workflows |
| `processClaimWithTransaction` | mutation | protected | `{ normalizedDomainName: string, recipientWalletAddress: string, registrarKey: string }` | Process claim with transaction |
| `getUserClaims` | query | protected | none | Get user's free claims |

##### registry Router
Source: [`apps/backend/src/trpc/routers/registryRouter.ts`](../apps/backend/src/trpc/routers/registryRouter.ts)

| Endpoint | Type | Auth | Input | Description |
|----------|------|------|-------|-------------|
| `getDomainListInfo` | query | public/protected | `{ domains: string[] }` | Get info for multiple domains |
| `getDomainInfo` | query | public/protected | `{ domain: string }` | Get info for a single domain |
| `getTldPricingTable` | query | public/protected | none | Get TLD pricing information |
| `getDomainsByOwner` | query | public | `{ identifier: string }` | Get domains by wallet address or ENS name |
| `queryDomain` | query | public/protected | `{ query: string, parentDomains?: string[] }` | Generate domain suggestions |
| `get0xDotCityPercentageRollout` | query | public | none | Get 0x.city rollout percentage |

##### config Router
Source: [`apps/backend/src/trpc/routers/configRouter.ts`](../apps/backend/src/trpc/routers/configRouter.ts)

| Endpoint | Type | Auth | Input | Description |
|----------|------|------|-------|-------------|
| `allowedChains` | query | public | none | Get list of allowed blockchain chains |

##### domainConfig Router
Source: [`apps/backend/src/trpc/routers/domainConfig/domainConfigRouter.ts`](../apps/backend/src/trpc/routers/domainConfig/domainConfigRouter.ts)

| Endpoint | Type | Auth | Input | Description |
|----------|------|------|-------|-------------|
| `getDomainDetails` | query | protected | `{ domainName: string }` | Get domain configuration details |
| `getDomainRenewalDetails` | query | protected | `{ normalizedDomainName: string }` | Get domain renewal information |
| `changeDomainNameservers` | mutation | protected | `{ signature: string, payload: DomainActionPayload }` | Change nameservers (requires EIP-712 signature) |
| `resetDomainNameservers` | mutation | protected | `{ signature: string, payload: DomainActionPayload }` | Reset to Namefi nameservers (requires EIP-712 signature) |
| `queryActiveNameserversChangeWorkflow` | query | protected | `{ domainName: string }` | Query active nameserver change workflow |
| `getDomainSupportedFeatures` | query | protected | `{ normalizedDomainName: string }` | Get supported features for domain |
| `getDomainPreferences` | query | protected | `{ normalizedDomainName: string }` | Get domain preferences |
| `updateDomainPreferences` | mutation | protected | `{ normalizedDomainName: string, preferences: object }` | Update domain preferences |
| `getDomainExportStatus` | query | protected | `{ domainName: string }` | Get domain export status |
| `enableDomainExport` | mutation | protected | `{ signature: string, payload: DomainActionPayload }` | Enable domain export |
| `approveDomainExport` | mutation | protected | `{ signature: string, payload: DomainActionPayload }` | Approve domain export |
| `rejectDomainExport` | mutation | protected | `{ signature: string, payload: DomainActionPayload }` | Reject domain export |
| `getAuthCode` | mutation | protected | `{ signature: string, payload: DomainActionPayload }` | Get domain auth code for transfer |
| `getMyDomainsWithExpirationStatus` | query | protected | `{ page?, limit? }` | Get user's domains with expiration info |
| `dnssec.*` | nested | protected | various | DNSSEC management (see domainDnssec router) |

##### domainDnssec Router (nested under domainConfig.dnssec)
Source: [`apps/backend/src/trpc/routers/domainConfig/domainDnssecRouter.ts`](../apps/backend/src/trpc/routers/domainConfig/domainDnssecRouter.ts)

| Endpoint | Type | Auth | Input | Description |
|----------|------|------|-------|-------------|
| `getDomainDnssecDetails` | query | protected | `{ domainName: string }` | Get DNSSEC status and details |
| `enableDnssec` | mutation | protected | `{ domainName: string }` | Enable DNSSEC for domain |
| `disableDnssec` | mutation | protected | `{ domainName: string }` | Disable DNSSEC for domain |
| `associateDelegationSigner` | mutation | protected | `{ domainName: string, signingConfig: DnssecConfig }` | Associate delegation signer |
| `getActiveDnssecOperationWorkflows` | query | protected | `{ domainName: string }` | Get active DNSSEC workflows |

##### hunt Router
Source: [`apps/backend/src/trpc/routers/hunt/huntRouter.ts`](../apps/backend/src/trpc/routers/hunt/huntRouter.ts)

| Endpoint | Type | Auth | Input | Description |
|----------|------|------|-------|-------------|
| `submitDomain` | mutation | protected | `{ domainName: string }` | Submit a domain for hunting |
| `removeDomain` | mutation | protected | `{ domainName: string }` | Remove a submitted domain |
| `getMySubmittedDomains` | query | protected | `{ offset?: number, limit?: number }` | Get user's submitted domains |
| `getMyUpvotedDomains` | query | protected | `{ offset?: number, limit?: number }` | Get user's upvoted domains |
| `getTrendingDomainsPublic` | query | public | `{ offset?, limit?, timeRange?, extension? }` | Get trending domains (public) |
| `getTrendingDomains` | query | protected | `{ offset?, limit?, timeRange?, extension? }` | Get trending domains with user data |
| `upvote` | mutation | protected | `{ domainName: string }` | Upvote a domain |
| `unvote` | mutation | protected | `{ domainName: string }` | Remove upvote from domain |
| `checkDomainOwnership` | query | protected | `{ domainName: string }` | Check if user submitted domain |
| `getDomainDetail` | query | protected | `{ domainName: string }` | Get domain details with user data |
| `getDomainDetailPublic` | query | public | `{ domainName: string }` | Get domain details (public) |
| `getCampaignPublic` | query | public | `{ campaignKey: string, offset?, limit? }` | Get campaign details (public) |
| `getCampaign` | query | protected | `{ campaignKey: string, offset?, limit? }` | Get campaign with user data |
| `getPeriodAwards` | query | public | `{ type: string, periodKey: string, offset?, limit? }` | Get period awards |
| `getDomainAwards` | query | public | `{ domainName: string }` | Get awards for a domain |

##### share Router
Source: [`apps/backend/src/trpc/routers/shareRouter.ts`](../apps/backend/src/trpc/routers/shareRouter.ts)

| Endpoint | Type | Auth | Input | Description |
|----------|------|------|-------|-------------|
| `submitShare` | mutation | protected | `{ normalizedDomainName: string, postUrl: string, sharedUrl: string, campaignKey?: string }` | Submit a social share |
| `submitShareAnonymous` | mutation | public | `{ normalizedDomainName: string, postUrl: string, sharedUrl: string, campaignKey?: string }` | Submit anonymous share |
| `hasUserShared` | query | protected | `{ normalizedDomainName: string }` | Check if user has shared domain |

##### wishlist Router
Source: [`apps/backend/src/trpc/routers/wishlistRouter.ts`](../apps/backend/src/trpc/routers/wishlistRouter.ts)

| Endpoint | Type | Auth | Input | Description |
|----------|------|------|-------|-------------|
| `addToWishlist` | mutation | protected | `[{ normalizedDomainName: string }]` | Add domains to wishlist |
| `removeFromWishlist` | mutation | protected | `[{ normalizedDomainName: string }]` | Remove domains from wishlist |
| `getWishlistDomains` | query | protected | none | Get user's wishlisted domains |

##### newsletter Router
Source: [`apps/backend/src/trpc/routers/newsletterRouter.ts`](../apps/backend/src/trpc/routers/newsletterRouter.ts)

| Endpoint | Type | Auth | Input | Description |
|----------|------|------|-------|-------------|
| `subscribe` | mutation | public | `{ email: string, name?: string, from: string, attributes?: object, altcha: string }` | Subscribe to newsletter |

##### feedback Router
Source: [`apps/backend/src/trpc/routers/feedbackRouter.ts`](../apps/backend/src/trpc/routers/feedbackRouter.ts)

| Endpoint | Type | Auth | Input | Description |
|----------|------|------|-------|-------------|
| `submit` | mutation | public | `{ rating: number, message?: string, feedbackId?: string, path?: string }` | Submit feedback |
| `claimAnonymous` | mutation | protected | `{ feedbackIds: string[] }` | Claim anonymous feedback entries |

##### pbnIssuanceReservations Router
Source: [`apps/backend/src/trpc/routers/pbnIssuanceReservationsRouter.ts`](../apps/backend/src/trpc/routers/pbnIssuanceReservationsRouter.ts)

| Endpoint | Type | Auth | Input | Description |
|----------|------|------|-------|-------------|
| `create` | mutation | owner | `{ pbnDomain: string, recipientEmail?: string, exactDomainName?: string, parentDomain?: string, ... }` | Create subdomain reservation |
| `listByCreator` | query | owner | `{ status?: string, issueFreeClaim?: boolean, pbnDomain?: string }` | List reservations by creator |
| `cancel` | mutation | owner | `{ reservationId: string }` | Cancel a reservation |
| `createBulk` | mutation | owner | `{ pbnDomain: string, items: ReservationItem[], sendEmail?: boolean }` | Create bulk reservations |

##### poweredByNamefiOwner Router
Source: [`apps/backend/src/trpc/routers/poweredByNamefiOwnerRouter.ts`](../apps/backend/src/trpc/routers/poweredByNamefiOwnerRouter.ts)

| Endpoint | Type | Auth | Input | Description |
|----------|------|------|-------|-------------|
| `isUserAPoweredByNamefiOwner` | query | protected | none | Check if user owns any PBN domains |
| `isUserOwnerOf` | query | protected | `{ normalizedDomainName: string }` | Check if user owns specific domain |
| `getAnalyticsDashboardOverview` | query | owner | `{ startDate: string, endDate: string, publicSuffixPlusOne: string }` | Get analytics dashboard |
| `listOwnedDomains` | query | owner | none | List user's PBN domains |
| `updateDomain` | mutation | owner | `{ normalizedDomainName: string, ... }` | Update PBN domain settings |
| `orderItemsHistory` | query | owner | `{ page?, limit?, normalizedDomainName? }` | Get order history for PBN |
| `revenue` | query | owner | `{ from?: Date, to?: Date, normalizedDomainName?, interval? }` | Get revenue data |
| `revenueByDomain` | query | owner | `{ from?: Date, to?: Date }` | Get revenue by domain |
| `getReservedWords` | query | owner | `{ normalizedDomainName: string }` | Get reserved words for domain |
| `validateReservedWords` | query | owner | `{ normalizedDomainName: string, words: string[] }` | Validate reserved words |
| `addReservedWords` | mutation | owner | `{ normalizedDomainName: string, words: string[] }` | Add reserved words |
| `removeReservedWords` | mutation | owner | `{ normalizedDomainName: string, words: string[] }` | Remove reserved words |

##### analytics Router
Source: [`apps/backend/src/trpc/routers/analyticsRouter.ts`](../apps/backend/src/trpc/routers/analyticsRouter.ts)

| Endpoint | Type | Auth | Input | Description |
|----------|------|------|-------|-------------|
| `getDashboardOverview` | query | admin | `{ startDate: string, endDate: string, publicSuffix?, publicSuffixPlusOne? }` | Get DNS analytics dashboard |
| `getByPublicSuffix` | query | admin | `{ limit?: number, startDate: string, endDate: string }` | Get queries by public suffix |
| `getByPublicSuffixPlusOne` | query | admin | `{ limit?: number, startDate: string, endDate: string }` | Get queries by public suffix+1 |
| `getFullReportByRecordName` | query | admin | `{ startDate: string, endDate: string, domainName: string }` | Get full report by record name |
| `getParsedReportByRecordName` | query | admin | `{ startDate: string, endDate: string, domainName: string }` | Get parsed report by record name |

##### dnsCache Router
Source: [`apps/backend/src/trpc/routers/dnsCacheRouter.ts`](../apps/backend/src/trpc/routers/dnsCacheRouter.ts)

| Endpoint | Type | Auth | Input | Description |
|----------|------|------|-------|-------------|
| `listServers` | query | public | none | List configured DNS cache servers |
| `flushCache` | mutation | public | `{ zone: string, recordType?: string, altcha: string }` | Flush DNS cache (with Altcha verification) |
| `flushCacheAdmin` | mutation | admin | `{ zone: string, recordType?: string, serverNames?: string[] }` | Flush DNS cache (admin) |
| `getServerStats` | query | admin | `{ serverName: string }` | Get cache stats for server |
| `dumpServerCache` | query | admin | `{ serverName: string, page?, limit?, cacheType? }` | Dump cache contents |
| `flushAllOnServer` | mutation | admin | `{ serverName: string }` | Flush all cache on server |
| `flushAllServers` | mutation | admin | none | Flush all cache on all servers |
| `getCombinedStats` | query | admin | `{ serverNames: string[] }` | Get combined stats for servers |
| `testConnectivity` | query | admin | `{ serverNames: string[] }` | Test connectivity to servers |

##### bigQueryAudit Router
Source: [`apps/backend/src/trpc/routers/bigQueryAuditRouter.ts`](../apps/backend/src/trpc/routers/bigQueryAuditRouter.ts)

| Endpoint | Type | Auth | Input | Description |
|----------|------|------|-------|-------------|
| `list` | query | admin | `{ pageSize?: number, pageToken?: string, orderBy?: string, filters?: object }` | List audit logs |

##### admin Router
Source: [`apps/backend/src/trpc/routers/adminRouter.ts`](../apps/backend/src/trpc/routers/adminRouter.ts)

The admin router contains numerous endpoints for administrative operations including NFT management, user management, workflow management, and system operations. Key endpoints include:

| Endpoint | Type | Auth | Input | Description |
|----------|------|------|-------|-------------|
| `isUserAdmin` | query | protected | none | Check if current user has admin access |
| `getNftsWithExpirationStatus` | query | admin | `{ page, limit, sortBy, sortOrder, filterBy, searchTerm }` | Get NFTs with expiration status |
| `burnNft` | mutation | admin | `{ normalizedDomainName: string, chainId: number }` | Burn an expired NFT |
| `getBurnWorkflowStatus` | query | admin | `{ normalizedDomainName: string, chainId: number }` | Get burn workflow status |
| `getActiveBurnWorkflows` | query | admin | none | Get all active burn workflows |

Additional admin sub-routers include `schedules`, `poweredByNamefi`, `permissions`, `nfsc`, and `eppTesting`.

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

   Key environment variables required:

   **Backend Environment Variables**:
   - `DATABASE_URL`: PostgreSQL connection string
   - `STRIPE_SECRET_KEY`: API key for Stripe payment integration
   - `ENVIRONMENT`: Development environment (local, development, production)
   - `API_AUTH_KEY`: Authentication key for API access
   - `TEMPORAL_API_KEY`, `TEMPORAL_NAMESPACE`, `TEMPORAL_API_URL`: Temporal workflow engine configuration

   **Blockchain Integration Variables**:
   - `LOCAL_SIGNER_PRIVATE_KEY`: Private key for blockchain transactions
   - `GCP_HSM_KEYRING_RESOURCE_NAME`: For production HSM key management
   - `BLOCKCHAIN_RPC_URL`: RPC endpoint for blockchain network
   - `NFT_CONTRACT_ADDRESS`: Address of the NFT contract for domain ownership
   - `NFSC_TOKEN_ADDRESS`: Address of the NFSC token contract for payments

4. **Start the backend**:
   ```bash
   bun --cwd apps/backend with-env dev
   ```
   The backend will be available at http://localhost:3000

5. **Start the frontend**:
   ```bash
   bun --cwd apps/frontend with-env dev
   ```
   The frontend will be available at http://localhost:23001

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
| **Namefi Astra** | The name of the platform for domain registration with blockchain integration | `@namefi-astra/*` |
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
