# Metrics Collectors Index

| Collector path | Metric name(s) | Description |
|----------------|----------------|-------------|
| [`collectors/domainsByRegistrar.ts`](./domainsByRegistrar.ts) | `namefi_domains_total` | Total number of domains grouped by registrar. |
| [`collectors/domainsByParent.ts`](./domainsByParent.ts) | `namefi_domains_by_parent_total` | Total domains grouped by parent domain (TLD). |
| [`collectors/domainsByNameservers.ts`](./domainsByNameservers.ts) | `namefi_domains_nameservers_total` | Domains grouped by nameserver type (`our` vs `external`). |
| [`collectors/domainsByDnssec.ts`](./domainsByDnssec.ts) | `namefi_domains_dnssec_total` | Domains grouped by DNSSEC status (`enabled` vs `disabled`). |
| [`collectors/domainsByExpirationBucket.ts`](./domainsByExpirationBucket.ts) | `namefi_domains_expiration_bucket_total` | Domain counts by expiration time bucket relative to now. |
| [`collectors/expiredUnburnedNft.ts`](./expiredUnburnedNft.ts) | `namefi_domains_expired_nft_unburned_total` | Domains expired in registrar but NFT is still unburned. |
| [`collectors/expirationMismatch.ts`](./expirationMismatch.ts) | `namefi_domains_expiration_mismatch_total` | Domains where registrar expiration differs from NFT expiration. |
| [`collectors/expiredGt60d.ts`](./expiredGt60d.ts) | `namefi_domains_expired_gt_60d_total` | Domains that have been expired for more than 60 days. |
| [`collectors/parkedSplit.ts`](./parkedSplit.ts) | `namefi_domains_parking_total` | Domains grouped by parking state (`true` vs `false`). |
| [`collectors/usersEmailSplit.ts`](./usersEmailSplit.ts) | `namefi_users_email_total` | Users grouped by email presence. |
| [`collectors/usersWalletSplit.ts`](./usersWalletSplit.ts) | `namefi_users_wallets_total` | Users grouped by wallet count class (`single` vs `multi`). |
| [`collectors/usersWithWishlist.ts`](./usersWithWishlist.ts) | `namefi_users_with_wishlist_total` | Users with at least one wishlist item. |
| [`collectors/usersWithCart.ts`](./usersWithCart.ts) | `namefi_users_with_cart_total` | Users with at least one cart item. |
| [`collectors/missingNft.ts`](./missingNft.ts) | `namefi_domains_missing_nft_total` | Domains present in registrar but missing NFT. |
| [`collectors/missingInRegistrar.ts`](./missingInRegistrar.ts) | `namefi_domains_missing_in_registrar_total` | Domains with NFT but missing in registrar. |
| [`collectors/orders.ts`](./orders.ts) | `namefi_orders_total` | Orders created in the last 24 hours grouped by source. |
| [`collectors/payments.ts`](./payments.ts) | `namefi_payments_total` | Payment attempts in the last 24 hours grouped by status and method. |
| [`collectors/durations.ts`](./durations.ts) | `namefi_order_duration_seconds_bucket`, `namefi_order_duration_seconds_sum`, `namefi_order_duration_seconds_count`, `namefi_order_handling_duration_seconds_bucket`, `namefi_order_handling_duration_seconds_sum`, `namefi_order_handling_duration_seconds_count` | Order duration and handling duration buckets, sums, and counts (last 24 hours). |
