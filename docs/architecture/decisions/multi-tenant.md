# Multi-Tenant architecture

Namefi Astra: "Shopify for subdomain issuance" and "Kickstarter based on domain names", is a white-label application
for parent domain owner to issue subdomains under the parent domain for
community building, governance, monetization and more targeting communities, 
KOLs, clubs, and more.

To achieve this, Namefi Astra is designed to be a multi-tenant application
where white-labeling is enabled.

For example, a domain issuer who owns the parent domain `0x.city`
could sell and issue subdomains to their community members at their
parent domain `https://0x.city` and has the themed experience.

## Cart and Order History Views

### Cart View

When a user visits the cart view of a white-labeled site, the cart items are filtered by the parent
domain.

When a user visits the cart view on `namefi.io`, the cart items are not filtered by the parent
domain.

### Order History View

When a user visits the order history view of a white-labeled site, the order history items are filtered by the parent
domain.

When a user visits the order history view on `namefi.io`, the order history items are not filtered by the parent
domain.

```ui-wireframe
# Show individual orderItems filtered by Parent Domain
- [ sami.0x.city ], [Date purchased](link to order), [status]
- [ build.0x.city ], [Date purchased](link to order), [status]
- [ john.0x.city ], [Date purchased](link to order), [status]
```

When clicking on "link to order", navigate to Order Details View

API call: `GetOrderItems(q: {userId, parentDomain}):OrderItem[]`

When ParentDomain is undefined, return all OrderItems for this user without filtering by parent domain.

### Order Details View

API call: `GetOrder(q: {orderId}):OrderInfo`

```ui-wireframe
# List of Items
- [ sami.0x.city ], Order (abcd1234-efg)
- [ build.0x.city ], Order (abcd1234-efg)
- [ john.0x.city ], Order (abcd1234-efg)
- [ sami.defi.build ], Order (abcd1234-efg)
Surcharge

Total 123.00
Payment paid: 123.00
```
