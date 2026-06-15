/**
 * @deprecated The DNS routers moved to `@namefi-astra/dns-service` and are now
 * served by `apps/ns-json-api`. This re-export shim keeps the backend's
 * `app.route('dns', dnsRouter)` mount working and will be dropped later.
 */
export { dnsRouter } from '@namefi-astra/dns-service/routers/dns';
