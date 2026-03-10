/**
 * This is an endpoint that is used to track if a domain is served by Namefi.
 * It is used to track if a domain is served by Namefi.
 * This is used for plugins in coredns to determine if a domain is served by Namefi. and control specific behavior.
 */
import { Hono } from 'hono';
import { nsJsonRouter } from './v1/ns-json';
import { dnsAnalyticsGateRouter } from './v1/analytics-gate';
import { dnssecRouter } from './v1/dnssec';
import { createNsJsonHandlerRouter } from './v2/json';
import { createDnsRequestHandlerV2_1 } from '#services/dns/factory';

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

export { dnsRouter };
