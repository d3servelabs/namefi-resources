# ADR 2024-07: DNS Record Type Storage Format

## Status
✅ Accepted

## Context
When designing the DNS record storage schema, we needed to choose between:
- **String-based type storage** (e.g., 'A', 'AAAA', 'CNAME')
- **Integer-based type storage** (using DNS TYPE codes from RFC 1035)

## Decision
We will store DNS record types as strings using PostgreSQL enums, validated through Zod schemas.

## Implementation Location
`packages/db/src/schema.ts` (Drizzle ORM schema definition)

## Rationale
### Key Advantages
1. **Protocol Alignment**  
   Matches DNS specification terminology directly (RFC 1035, 3596, 6698)

2. **Developer Experience**  
   - Clear meaning in raw database queries
   - Eliminates mental mapping of type codes
   - Easier debugging with human-readable values

3. **Evolutionary Design**  
   - Add new record types without migrations
   - Compatible with extended DNS types (e.g., 'URI', 'CAA')

4. **Validation Consistency**  
   ```typescript
   // Existing validation (@namefi-astra/zod-dns)
   recordTypeEnum = z.enum(['A', 'AAAA', 'CNAME', ...])
   ```

## Alternatives Considered
### Integer Storage
**Pros**  
- 4x storage efficiency (4 bytes vs 16 avg for strings)
- Slightly faster index lookups

**Cons**  
- Requires conversion layer for RFC compliance
- Obscures direct record meaning
- Harder to maintain with custom DNS types

## Implications
1. **Schema Definition**  
   ```typescript
   // Current implementation
   export const dnsRecordsTable = pgTable('dns_records', {
     type: recordTypePgEnum('type').notNull(),
     // ...
   });
   ```

2. **Storage Optimization**  
   PostgreSQL automatically compresses enum values

3. **Future Extensions**  
   New types can be added by:
   ```typescript
   // 1. Update Zod enum
   // 2. Modify PostgreSQL enum type
   // 3. No data migration needed
   ```

## References
- [RFC 1035: Domain Names Specification](https://tools.ietf.org/html/rfc1035)
- [IANA DNS Parameters](https://www.iana.org/assignments/dns-parameters/dns-parameters.xhtml)
- [PostgreSQL Enum Types](https://www.postgresql.org/docs/current/datatype-enum.html)