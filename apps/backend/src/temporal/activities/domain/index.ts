import {
  getDomainDetails,
  pollRegistrarOperationStatus,
} from './registrar.activities';

import * as DnssecLib from '#lib/domains/dnssec';
import * as NameserversLib from '#lib/domains/nameservers';
import { isDomainParked, parkDomain } from '#services/dns/parking';
import * as DnssecActivities from './dnssec.activities';

//TODO: add a check to see if name collision is happening
export const DomainsActivities = {
  pollRegistrarOperationStatus,
  getDomainDetails,
  parkDomain,
  isDomainParked,
  ...NameserversLib,
  ...DnssecLib,
  ...DnssecActivities,
};
