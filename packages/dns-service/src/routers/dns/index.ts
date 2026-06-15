/**
 * Composes the DNS-over-JSON routers across API versions into a single
 * `dnsRouter`: v1 (`json`, `tracking`, `dnssec`) plus the factory-built v2 /
 * v2.1 / v2.2 JSON handlers. This is what `apps/ns-json-api` serves and what
 * CoreDNS forwards to.
 */
import { Hono } from 'hono';
import { nsJsonRouter } from './v1/ns-json';
import { dnsAnalyticsGateRouter } from './v1/analytics-gate';
import { dnssecRouter } from './v1/dnssec';
import { createNsJsonHandlerRouter } from './v2/json';
import {
  createDnsRequestHandlerV2_1,
  createDnsRequestHandlerV2_2,
} from '#services/dns/factory';

const dnsRouter = new Hono();

dnsRouter.route('v1/json', nsJsonRouter);
dnsRouter.route('v1/tracking', dnsAnalyticsGateRouter);
dnsRouter.route('v1/dnssec', dnssecRouter);

dnsRouter.route('v2/json', createNsJsonHandlerRouter());
dnsRouter.route(
  'v2.1/json',
  createNsJsonHandlerRouter({
    dnsRequestHandler: createDnsRequestHandlerV2_1(),
  }),
);
dnsRouter.route(
  'v2.2/json',
  createNsJsonHandlerRouter({
    dnsRequestHandler: createDnsRequestHandlerV2_2(),
  }),
);

export { dnsRouter };
