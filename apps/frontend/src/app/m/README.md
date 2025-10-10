# Mail(Messages) Redirects (/m/*)

This redirector system handles permanent links from emails that need to redirect to the appropriate branded domain based on the `powered-by-namefi` query parameter.

## Why This Directory Exists

When sending emails to users, we need stable URLs that will always work regardless of which branded domain the user should be redirected to. The `/m/*` paths provide these stable redirect endpoints that:

1. **Maintain URL stability** - Email links won't break if branding changes
2. **Support multi-tenant branding** - Same email template can redirect to different domains
3. **Provide a consistent API** - All email links follow the same `/m/*` pattern

## How It Works

Redirects are handled by **Next.js Middleware** (`src/middleware.ts`) which runs at the edge **before any page rendering occurs**. This provides:

1. **Fast redirects** - Happens before any page loads or server-side rendering
2. **Efficient** - No React components need to render
3. **Edge-optimized** - Runs on CDN edge locations when deployed

The middleware:

1. Intercepts all `/m/*` requests
2. Checks for a `powered-by-namefi` query parameter in the URL
3. Determines the target hostname (defaults to the value from `FIRST_PARTY_DEPLOYMENT_URL` env var)
4. Performs a 307 redirect to the equivalent path on the target domain

### Example Flow

```text
Email link: https://namefi.io/m/user/orders/123?powered-by-namefi=0x.city
↓
Redirects to: https://0x.city/orders/123
```

## Directory Structure

```text
/m/
  README.md           ← This file (documentation only)
```

**Note:** No page files are needed! All redirects are handled by middleware which runs before route matching.

## Adding New Redirect Routes

To add a new email redirect route, simply **add the route to the middleware** (`src/middleware.ts`):

1. Add a new entry to the `redirectRoutes` array
2. Define the pattern (regex) that matches the route
3. Define the `getDestination` function that returns the target path

**That's it!** No page files needed since middleware intercepts requests before route matching.

### Example: Adding a Static Route

Add an entry to the `redirectRoutes` array in `src/middleware.ts`:

```typescript
{
  pattern: /^\/m\/user\/settings$/,
  getDestination: () => "/settings",
}
```

### Example: Adding a Dynamic Route

Add an entry to the `redirectRoutes` array in `src/middleware.ts`:

```typescript
{
  pattern: /^\/m\/user\/invoices\/([^/]+)$/,
  getDestination: (pathname: string) => {
    const params = extractPathParams(pathname, "/m/user/invoices/[invoiceId]");
    return `/invoices/${params.invoiceId}`;
  },
}
```

## Query Parameters

- `powered-by-namefi`: Specifies the target domain for redirection
- All other query parameters are preserved and passed through to the target URL
