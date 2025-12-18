# My Domains Page Documentation

## DNS Records in Table and Bulk Edit DNS Records

This document details the implementation status of the DNS Records column feature in the My Domains table, including in-place editing capabilities and bulk operations.

### Overview

The DNS Records feature adds a new column to the My Domains table that displays visual indicators (icons) for various DNS record types. Users can click on these icons to edit DNS records in-place via modal dialogs. Additionally, when multiple domains are selected, batch action icons appear in the floating action panel to allow bulk editing across selected domains.

### Implementation Status

#### ✅ Completed Features

##### Backend Implementation

1. **Enhanced `getCurrentUserDomains` Query** (`apps/backend/src/trpc/routers/usersRouter.ts`)
   - Modified to fetch comprehensive DNS status information for each domain
   - Returns a `dnsStatus` object containing:
     - `nameservers`: Array of nameserver strings
     - `isUsingNamefiNameservers`: Boolean indicating if domain uses Namefi nameservers
     - `isParkingEnabled`: Boolean indicating if domain has parking enabled
     - `forwardTo`: String or null for URL forwarding configuration
     - `hasWebRecords`: Boolean indicating presence of A/AAAA/CNAME records
     - `hasMxRecords`: Boolean indicating presence of MX records
     - `ensRecord`: String or null for ENS resolution record (TXT record starting with "ENS1")
   - Data sources:
     - `indexedDomainsTable`: For nameserver information
     - `domainConfigTable`: For parking and forwarding configuration
     - `dnsRecordsTable`: For DNS record existence checks
   - All queries are executed in parallel using `Promise.all()` for optimal performance

##### Frontend Components

1. **DnsStatusCell Component** (`apps/frontend/src/components/domain-and-dns-managment/cells/dns-status-cell.tsx`)
   - Displays 5 icon indicators:
     - **NS (Nameservers)**: `Server` icon
       - Green (`text-emerald-500`) when using Namefi nameservers
       - Blue (`text-sky-500`) when using custom nameservers
       - Grey (`text-zinc-600`) when no nameservers configured
     - **Web**: `Globe` icon
       - Green when Namefi parking service is enabled
       - Blue when A/AAAA/CNAME records exist
       - Grey when no web records configured
     - **MX**: `Mail` icon
       - Blue when MX records exist
       - Grey when no MX records
     - **ENS**: `Hexagon` icon
       - Blue when ENS resolution record exists (TXT record with "ENS1" prefix)
       - Grey when no ENS record
     - **Forward**: `ArrowRight` icon
       - Blue when URL forwarding is configured
       - Grey when no forwarding configured
   - Each icon has a tooltip showing the current value/status
   - Clicking an icon opens the appropriate editing dialog
   - **Disable Logic**: Web, MX, ENS, and Forward icons are disabled (non-clickable) when:
     - Domain is not using Namefi nameservers (`!status.isUsingNamefiNameservers`)
     - This prevents editing DNS records that are managed externally

2. **NameserversDialog Component** (`apps/frontend/src/components/domain-and-dns-managment/dialogs/nameservers-dialog.tsx`)
   - Wraps the existing `NameserversPanelInner` component in a dialog
   - Allows users to change or reset nameservers for a domain
   - Uses the existing nameserver management workflow with EIP-712 signature requirements

3. **ForwardingDialog Component** (`apps/frontend/src/components/domain-and-dns-managment/dialogs/forwarding-dialog.tsx`)
   - Simple dialog for setting or clearing URL forwarding
   - Uses `trpc.domainConfig.updateDomainPreferencesAndConfig` mutation
   - Includes input validation and error handling
   - Refreshes domain list after successful update

4. **EditDnsRecordsWrapper Component** (`apps/frontend/src/components/domain-and-dns-managment/dialogs/edit-dns-records-wrapper.tsx`)
   - Wrapper component that fetches DNS records on-demand
   - Filters records by type (A/AAAA/CNAME for Web, MX for MX, TXT for ENS)
   - Reuses existing `AddEditRecordsDialog` component
   - Handles both "add" and "edit" modes based on existing records
   - For ENS records, filters to only show TXT records starting with "ENS1" and name "@"

5. **MyDomainsTable Integration** (`apps/frontend/src/components/my-domains.tsx`)
   - Added "DNS Records" column to the table
   - Column appears before the "Actions" column
   - Uses `DnsStatusCell` component to render DNS status icons
   - Added batch action icons to the floating action panel:
     - Appears when multiple domains are selected
     - Shows 5 icons (NS, Web, MX, ENS, Forward) matching the table column icons
     - Icons are clickable and open `BatchDnsDialog`

6. **BatchDnsDialog Component** (`apps/frontend/src/components/domain-and-dns-managment/dialogs/batch-dns-dialog.tsx`)
   - Handles bulk operations for selected domains
   - **Implemented**: Batch URL Forwarding
     - Allows setting the same forwarding URL for all selected domains
     - Uses `Promise.all()` to update all domains in parallel
     - Shows success toast with count of updated domains

#### ⚠️ Partially Implemented / Coming Soon

##### Batch Operations

1. **Batch Nameserver Update** (`action === 'ns'`)
   - **Status**: Not implemented (shows "Coming soon" message)
   - **Reason**:
     - Nameserver changes require EIP-712 cryptographic signatures from the user's wallet
     - Current implementation requires one signature per domain
     - Batch operation would require either:
       - Multiple sequential signatures (poor UX)
       - A new backend endpoint that accepts a single signature for multiple domains
     - **Required Work**:
       - Design and implement a batch nameserver change workflow
       - Create new backend endpoint: `batchChangeNameservers`
       - Update EIP-712 signature schema to include multiple domains
       - Implement frontend flow for batch signature collection

2. **Batch DNS Record Updates** (`action === 'web' | 'mx' | 'ens'`)
   - **Status**: Not implemented (shows "Coming soon" message)
   - **Reason**:
     - Ambiguity in merge vs. overwrite behavior:
       - Should batch operation *add* a new record to all domains (preserving existing)?
       - Or should it *replace* all existing records of that type?
     - Risk of breaking existing configurations:
       - Different domains may have different existing DNS setups
       - Applying a blanket rule could break email (MX) or hosting (A/CNAME) for some domains
     - **Required Work**:
       - Design batch operation strategy (add vs. replace vs. merge)
       - Implement validation to prevent breaking changes
       - Create batch DNS record update endpoints
       - Add confirmation dialogs warning users of potential impacts
       - Consider domain-by-domain preview before applying changes

### Technical Details

#### Data Flow

1. **Initial Load**:
   - `getCurrentUserDomains` query fetches domain list with DNS status
   - Backend performs parallel queries to `indexedDomainsTable`, `domainConfigTable`, and `dnsRecordsTable`
   - Results are aggregated into `dnsStatus` object per domain

2. **Icon Click (Single Domain)**:
   - User clicks an icon in the `DnsStatusCell`
   - Appropriate dialog opens:
     - NS → `NameserversDialog`
     - Web → `EditDnsRecordsWrapper` (filters for A/AAAA/CNAME)
     - MX → `EditDnsRecordsWrapper` (filters for MX)
     - ENS → `EditDnsRecordsWrapper` (filters for TXT with "ENS1")
     - Forward → `ForwardingDialog`
   - User makes changes and saves
   - Dialog closes and domain list refreshes

3. **Batch Action (Multiple Domains)**:
   - User selects multiple domains via checkboxes
   - Floating action panel appears with DNS icons
   - User clicks a batch action icon
   - `BatchDnsDialog` opens
   - For forwarding: User enters URL and saves → all selected domains updated
   - For other actions: Shows "Coming soon" message

#### File Structure

```
apps/
├── backend/
│   └── src/
│       └── trpc/
│           └── routers/
│               └── usersRouter.ts          # Enhanced getCurrentUserDomains
└── frontend/
    └── src/
        └── components/
            ├── my-domains.tsx              # Main table with DNS column
            └── domain-and-dns-managment/
                ├── cells/
                │   └── dns-status-cell.tsx # Icon display component
                └── dialogs/
                    ├── nameservers-dialog.tsx
                    ├── forwarding-dialog.tsx
                    ├── edit-dns-records-wrapper.tsx
                    └── batch-dns-dialog.tsx
```

### Future Enhancements

1. **Batch Nameserver Updates**:
   - Implement single-signature batch nameserver change workflow
   - Add progress tracking for batch operations
   - Handle partial failures gracefully

2. **Batch DNS Record Updates**:
   - Implement safe merge strategy for DNS records
   - Add preview mode showing what will change before applying
   - Add domain-by-domain conflict resolution
   - Implement validation to prevent breaking email/hosting configurations

3. **Enhanced Tooltips**:
   - Show more detailed information in tooltips (e.g., actual record values)
   - Add copy-to-clipboard functionality for record values

4. **Performance Optimizations**:
   - Consider lazy-loading DNS status for domains not in viewport
   - Cache DNS status to reduce backend queries

5. **Accessibility**:
   - Add ARIA labels for icon buttons
   - Ensure keyboard navigation works for all dialogs
   - Add screen reader announcements for status changes

### Known Limitations

1. **DNS Status Caching**: DNS status is fetched on every domain list load. For users with many domains, this could be optimized with caching.

2. **Real-time Updates**: DNS status changes may not reflect immediately in the table until the list is refreshed. Consider adding real-time updates via WebSocket or polling.

3. **Error Handling**: Some error scenarios may not have user-friendly messages. Consider enhancing error handling and user feedback.

4. **Batch Operation Safety**: Currently, batch operations (when implemented) will apply changes to all selected domains without domain-specific validation. This could be enhanced with per-domain validation and warnings.
