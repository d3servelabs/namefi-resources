import { db } from '@namefi-astra/db';
import { createLogger } from '#lib/logger';
import { keyvPostgres } from '#lib/keyv';
import Keyv from 'keyv';
import { recordCollectorError, recordCollectorSuccess } from './common/errors';
import type { MetricsContext } from './types';
import {
  METRIC_NAME as DOMAINS_BY_REGISTRAR_METRIC,
  collectTotalDomainsByRegistrar,
} from './collectors/domainsByRegistrar';
import {
  METRIC_NAME as DOMAINS_BY_PARENT_METRIC,
  collectTotalDomainsByParentDomain,
} from './collectors/domainsByParent';
import {
  METRIC_NAME as DOMAINS_BY_NAMESERVER_METRIC,
  collectDomainsByNameserverType,
} from './collectors/domainsByNameservers';
import {
  METRIC_NAME as DOMAINS_BY_DNSSEC_METRIC,
  collectDomainsByDnssecStatus,
} from './collectors/domainsByDnssec';
import {
  METRIC_NAME as DOMAINS_BY_EXPIRATION_BUCKET_METRIC,
  collectDomainsByExpirationBucket,
} from './collectors/domainsByExpirationBucket';
import {
  METRIC_NAME as EXPIRED_UNBURNED_METRIC,
  collectExpiredDomainsWithUnburnedNft,
} from './collectors/expiredUnburnedNft';
import {
  METRIC_NAME as EXPIRATION_MISMATCH_METRIC,
  collectDomainsWithExpirationMismatch,
} from './collectors/expirationMismatch';
import {
  METRIC_NAME as DOMAINS_EXPIRED_GT_60D_METRIC,
  collectDomainsExpiredGreaterThan60Days,
} from './collectors/expiredGt60d';
import {
  METRIC_NAME as DOMAINS_PARKING_METRIC,
  collectDomainsByParkingState,
} from './collectors/parkedSplit';
import {
  METRIC_NAME as USERS_EMAIL_METRIC,
  collectUsersByEmailPresence,
} from './collectors/usersEmailSplit';
import {
  METRIC_NAME as USERS_WALLETS_METRIC,
  collectUsersByWalletCountClass,
} from './collectors/usersWalletSplit';
import {
  METRIC_NAME as PAYMENTS_METRIC,
  collectPaymentsByStatusAndMethod,
} from './collectors/payments';
import {
  METRIC_NAME as ORDERS_METRIC,
  collectOrdersTotal,
} from './collectors/orders';
import {
  METRIC_NAME_ACTUAL_ORDER_PROCESSING,
  METRIC_NAME_TOTAL_ORDER_DURATION,
  collectActualOrderProcessingMetrics,
  collectTotalOrderDurationMetrics,
} from './collectors/durations';
import {
  METRIC_NAME as USERS_WITH_WISHLIST_METRIC,
  collectUsersWithWishlistItems,
} from './collectors/usersWithWishlist';
import {
  METRIC_NAME as USERS_WITH_CART_METRIC,
  collectUsersWithCartItems,
} from './collectors/usersWithCart';
import {
  METRIC_NAME as DOMAINS_MISSING_NFT_METRIC,
  collectDomainsInRegistrarMissingNft,
} from './collectors/missingNft';
import {
  METRIC_NAME as DOMAINS_MISSING_IN_REGISTRAR_METRIC,
  collectDomainsWithNftMissingInRegistrar,
} from './collectors/missingInRegistrar';

const logger = createLogger({ context: 'METRICS' });
const metricsCache = new Keyv(keyvPostgres, { namespace: 'metrics' });

type CollectorEntry = {
  metric: string;
  collect: (ctx: MetricsContext) => Promise<void>;
};

const collectors: CollectorEntry[] = [
  {
    metric: DOMAINS_BY_REGISTRAR_METRIC,
    collect: collectTotalDomainsByRegistrar,
  },
  {
    metric: DOMAINS_BY_PARENT_METRIC,
    collect: collectTotalDomainsByParentDomain,
  },
  {
    metric: DOMAINS_BY_NAMESERVER_METRIC,
    collect: collectDomainsByNameserverType,
  },
  {
    metric: DOMAINS_BY_DNSSEC_METRIC,
    collect: collectDomainsByDnssecStatus,
  },
  {
    metric: DOMAINS_BY_EXPIRATION_BUCKET_METRIC,
    collect: collectDomainsByExpirationBucket,
  },
  {
    metric: EXPIRED_UNBURNED_METRIC,
    collect: collectExpiredDomainsWithUnburnedNft,
  },
  {
    metric: EXPIRATION_MISMATCH_METRIC,
    collect: collectDomainsWithExpirationMismatch,
  },
  {
    metric: ORDERS_METRIC,
    collect: collectOrdersTotal,
  },
  {
    metric: DOMAINS_EXPIRED_GT_60D_METRIC,
    collect: collectDomainsExpiredGreaterThan60Days,
  },
  {
    metric: DOMAINS_PARKING_METRIC,
    collect: collectDomainsByParkingState,
  },
  {
    metric: USERS_EMAIL_METRIC,
    collect: collectUsersByEmailPresence,
  },
  {
    metric: USERS_WALLETS_METRIC,
    collect: collectUsersByWalletCountClass,
  },
  {
    metric: PAYMENTS_METRIC,
    collect: collectPaymentsByStatusAndMethod,
  },
  {
    metric: METRIC_NAME_TOTAL_ORDER_DURATION,
    collect: collectTotalOrderDurationMetrics,
  },
  {
    metric: METRIC_NAME_ACTUAL_ORDER_PROCESSING,
    collect: collectActualOrderProcessingMetrics,
  },
  {
    metric: USERS_WITH_WISHLIST_METRIC,
    collect: collectUsersWithWishlistItems,
  },
  {
    metric: USERS_WITH_CART_METRIC,
    collect: collectUsersWithCartItems,
  },
  {
    metric: DOMAINS_MISSING_NFT_METRIC,
    collect: collectDomainsInRegistrarMissingNft,
  },
  {
    metric: DOMAINS_MISSING_IN_REGISTRAR_METRIC,
    collect: collectDomainsWithNftMissingInRegistrar,
  },
];

export function createMetricsContext(): MetricsContext {
  return {
    now: new Date(),
    db,
    log: logger,
    cache: metricsCache,
  };
}

export async function collectAll(ctx?: MetricsContext): Promise<void> {
  const metricsContext = ctx ?? createMetricsContext();

  for (const collector of collectors) {
    try {
      await collector.collect(metricsContext);
      recordCollectorSuccess(collector.metric, metricsContext.now);
    } catch (error) {
      recordCollectorError(collector.metric);
      metricsContext.log.trace(
        { error, metric: collector.metric },
        'Failed to collect metric',
      );
    }
  }
}

export { register } from './registry';
