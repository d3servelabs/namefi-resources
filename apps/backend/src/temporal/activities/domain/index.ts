import * as DnssecLib from '#lib/domains/dnssec';
import * as NameserversLib from '#lib/domains/nameservers';
import { getPoweredByNamefi3PDomains } from '#lib/namefi-registry';
import { isDomainParked, parkDomain } from '#services/dns/parking';
import * as DnssecActivities from './dnssec.activities';
import * as RegistrarActivities from './registrar.activities';

//TODO: add a check to see if name collision is happening
export const DomainsActivities = {
  parkDomain,
  isDomainParked,
  ...NameserversLib,
  ...DnssecLib,
  ...DnssecActivities,
  ...RegistrarActivities,
  getPoweredByNamefi3PDomains,
};
