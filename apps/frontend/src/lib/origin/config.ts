import type { OriginConfigMap } from './types';
import { originConfig as astraConfig } from '@/pbns/astra/config';
import { originConfig as zeroxCityConfig } from '@/pbns/0x-city/config';
import { originConfig as taylorCvConfig } from '@/pbns/cv/names/taylor';
import { originConfig as aliCvConfig } from '@/pbns/cv/names/ali';
import { originConfig as liCvConfig } from '@/pbns/cv/names/li';
import { originConfig as mullerCvConfig } from '@/pbns/cv/names/muller';
import { originConfig as kumarCvConfig } from '@/pbns/cv/names/kumar';

/**
 * Consolidated origin-specific configuration
 */
export const originConfig: OriginConfigMap = {
  firstParty: astraConfig,
  thirdParty: {
    '0x.city': zeroxCityConfig,
    'taylor.cv': taylorCvConfig,
    'ali.cv': aliCvConfig,
    'li.cv': liCvConfig,
    'muller.cv': mullerCvConfig,
    'kumar.cv': kumarCvConfig,
  },
};
