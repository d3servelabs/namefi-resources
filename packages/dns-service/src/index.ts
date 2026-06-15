// Pure DNS primitives
export * from './lib/dns/types';
export * from './lib/dns/rcodes';
export * from './lib/dns/record-type-codes';

// Resolution engine
export * from './services/dns/factory';
export * from './services/dns/dns-request-question';
export type {
  DnsQuestion,
  DnsRequestHandler,
} from './services/dns/dns-request-handler.types';

// HTTP routers (DNS-over-JSON; what CoreDNS / ns-json-api serve)
export { dnsRouter } from './routers/dns';
