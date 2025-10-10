# Mail(Messages) Redirects (/m/*)

This redirector system handles permanent links from emails that need to redirect to the appropriate branded domain based on the `powered-by-namefi` query parameter.

## Why This Directory Exists

When sending emails to users, we need stable URLs that will always work regardless of which branded domain the user should be redirected to. The `/m/*` paths provide these stable redirect endpoints that:

1. **Maintain URL stability** - Email links won't break if branding changes
2. **Support multi-tenant branding** - Same email template can redirect to different domains
3. **Provide a consistent API** - All email links follow the same `/m/*` pattern

## How It Works

Each file in this directory uses the `poweredByNamefiRedirect` utility from `@/lib/utils/dynamic-redirect.ts` to:

1. Check for a `powered-by-namefi` query parameter in the URL
2. Determine the target hostname (defaults to `astra.namefi.io`)
3. Redirect to the equivalent path on the target domain

### Example Flow

```
Email link: https://namefi.io/m/user/orders/123?powered-by-namefi=0x.city
↓
Redirects to: https://0x.city/orders/123
```

## Directory Structure (App Router)

```
/m/
  user/
    domains/
      [domain]/
        page.tsx     → /domains/{domain}
      page.tsx       → /domains
    orders/
      [orderId]/
        page.tsx     → /orders/{orderId}
      page.tsx       → /orders
    payment-methods/
      page.tsx       → /payment-methods
```

## Adding New Redirect Routes

To add a new email redirect route:

1. Create a new `page.tsx` file in the appropriate directory
2. Import and use `poweredByNamefiRedirect` from `@/lib/utils/dynamic-redirect`
3. Define the target path in the resolver function
4. Export an async Server Component that calls the redirect function

### Example Implementation (Static Path)

```tsx
import { poweredByNamefiRedirect } from "@/lib/utils/dynamic-redirect";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({ searchParams }: Props) {
  await poweredByNamefiRedirect(
    ({ redirectHostname }) => `https://${redirectHostname}/payment-methods`,
    await searchParams,
  );
}
```

### Example Implementation (Dynamic Route)

```tsx
import { poweredByNamefiRedirect } from "@/lib/utils/dynamic-redirect";

type Props = {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({ params, searchParams }: Props) {
  const { orderId } = await params;
  
  await poweredByNamefiRedirect(
    ({ redirectHostname }) => `https://${redirectHostname}/orders/${orderId}`,
    await searchParams,
    { orderId },
  );
}

## Query Parameters

- `powered-by-namefi`: Specifies the target domain for redirection
- All other query parameters are preserved and passed through to the target URL 