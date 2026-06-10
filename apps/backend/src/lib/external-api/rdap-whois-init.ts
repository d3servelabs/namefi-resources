/**
 * Wires the lazy RDAP/WHOIS clients exported by
 * `@namefi-astra/registrars/lib/rdap-whois` to the backend's env config.
 *
 * Each client only needs a factory override when the matching `*_BASE_URL`
 * is set (or, for WHOIS, when we want to pass the API key explicitly rather
 * than relying on the client's lazy `process.env.WHOIS_API_KEY` fallback).
 * Importing this module is a side-effect; do it once at backend startup
 * before any code path calls `RDAP.*` or `WhoisClient.*`.
 */
import {
  RdapClient,
  setRdapClientFactory,
} from '@namefi-astra/registrars/rdap-whois/rdap_client';
import {
  setWhoisClientFactory,
  WhoisJsonApiClient,
} from '@namefi-astra/registrars/rdap-whois/whois_client';
import { config, secrets } from '#lib/env';
import { createLogger } from '#lib/logger';

const logger = createLogger({ module: 'rdap-whois-init' });

if (config.RDAP_BASE_URL) {
  const baseUrl = config.RDAP_BASE_URL;
  setRdapClientFactory(() => new RdapClient({ baseUrl }));
  logger.info({ baseUrl }, 'RDAP client base URL overridden');
}

if (config.WHOIS_BASE_URL || secrets.WHOIS_API_KEY) {
  const baseUrl = config.WHOIS_BASE_URL;
  const apiKey = secrets.WHOIS_API_KEY;
  setWhoisClientFactory(() => new WhoisJsonApiClient({ baseUrl, apiKey }));
  if (baseUrl) {
    logger.info({ baseUrl }, 'WHOIS client base URL overridden');
  }
}
