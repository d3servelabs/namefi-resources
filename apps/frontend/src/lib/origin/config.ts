import type { OriginConfigMap } from './types';
import { originConfig as astraConfig } from '@/pbns/astra/config';
import { originConfig as aaveConfig } from '@/pbns/aave/config';
import { originConfig as uniswapConfig } from '@/pbns/uniswap/config';
import { originConfig as zeroxCityConfig } from '@/pbns/0x-city/config';
import { originConfig as tokenComConfig } from '@/pbns/token-com/config';
import { originConfig as taylorCvConfig } from '@/pbns/cv/names/taylor';
import { originConfig as aliCvConfig } from '@/pbns/cv/names/ali';
import { originConfig as liCvConfig } from '@/pbns/cv/names/li';
import { originConfig as mullerCvConfig } from '@/pbns/cv/names/muller';
import { originConfig as kumarCvConfig } from '@/pbns/cv/names/kumar';
import { originConfig as victorCvConfig } from '@/pbns/cv/names/victor';
import { originConfig as startsTodayConfig } from '@/pbns/bespoke/domains/starts-today';
import { originConfig as endsTodayConfig } from '@/pbns/bespoke/domains/ends-today';
import { originConfig as promosTodayConfig } from '@/pbns/bespoke/domains/promos-today';
import { originConfig as availableTodayConfig } from '@/pbns/bespoke/domains/available-today';
import { originConfig as discountsTodayConfig } from '@/pbns/bespoke/domains/discounts-today';

/**
 * Consolidated origin-specific configuration
 */
export const originConfig: OriginConfigMap = {
  firstParty: astraConfig,
  thirdParty: {
    aave: aaveConfig,
    uniswap: uniswapConfig,
    '0x.city': zeroxCityConfig,
    'token.com': tokenComConfig,
    'taylor.cv': taylorCvConfig,
    'ali.cv': aliCvConfig,
    'li.cv': liCvConfig,
    'muller.cv': mullerCvConfig,
    'kumar.cv': kumarCvConfig,
    'victor.cv': victorCvConfig,
    'starts.today': startsTodayConfig,
    'ends.today': endsTodayConfig,
    'promos.today': promosTodayConfig,
    'available.today': availableTodayConfig,
    'discounts.today': discountsTodayConfig,
  },
};
