# DNS Records Design: Simplified Zone Management Through NFT Ownership

## Status
Accepted

## Context
When designing the DNS records management system, we needed to decide how to:
1. Structure the relationship between DNS zones and records
2. Handle domain ownership and permissions
3. Manage subdomains for third-party domains

## Decision
We decided to implement a simplified DNS records structure with the following key characteristics:

1. **No Separate DNS Zones Table**
   - DNS zones are implicitly managed through the `normalizedDomainName` field
   - Zone ownership is derived from NFT address associated with the domain name
   - `normalizedDomainName` serves as the primary key

2. **Subdomain Restrictions**
   - Only subdomains of `PoweredByNamefiThirdPartyDomainName` are allowed
   - The `name` field specifically stores the subdomain part, not the full domain name
   - This restriction is enforced at the API level

## Consequences

### Positive
1. **Simplified Data Model**
   - Eliminates need for a separate zones table and complex joins
   - Direct mapping between NFT ownership and DNS zone management rights
   - Cleaner, more maintainable codebase

2. **Built-in Security**
   - Zone ownership verification is inherent through NFT ownership
   - Clear separation between subdomain management and root domain control

3. **Efficient Queries**
   - Direct lookups using `normalizedDomainName` as primary key
   - No need for complex zone hierarchy traversal

### Negative
1. **Limited Flexibility**
   - System is specifically designed for NFT-based ownership model
   - May require modifications if different ownership models needed in future

2. **Subdomain Restrictions**
   - Only works with `PoweredByNamefiThirdPartyDomainName` subdomains
   - May limit certain use cases requiring different domain structures

## Implementation Notes
- The `normalizedDomainName` field serves as both zone identifier and primary key
- API-level validation ensures subdomain restrictions are properly enforced
- NFT address derivation from domain name provides ownership verification

## Related Documents
- Database schema definition in `packages/db/src/schema.ts` 

## TODOs
- Add API restriction when writing to the database to check that the normalizedDomainName is a subdomain of PoweredByNamefiThirdPartyDomainName.