import { DynadotRegistrarService } from '@namefi-astra/registrars/registrars/sub-registrars';
import { config } from '#lib/env';
import { secrets } from '#lib/env';
import { createLogger } from '#lib/logger';
import { Registrars } from '@namefi-astra/registrars/registrars/registrars-keys';
import type { PunycodeDomainName } from '@namefi-astra/registrars/lib/data/validations';
import { CENTRALNIC_OTE_TLDS } from './centralnic';

export const getDynadotRegistrars = (connection: any) => {
  const dynadotGdg = new DynadotRegistrarService({
    apiKey: secrets.DYNADOT_GDG_API_KEY,

    privateKey: secrets.DYNADOT_PRIVATE_KEY,
    accountId: secrets.DYNADOT_ACCOUNT_ID,
    baseUrl: config.DYNADOT_BASE_URL,
    accountType: 'super_bulk',

    customLogger: createLogger({
      registrar: Registrars.DynadotGdg,
    }) as any,
    connection,
    hooks: {
      afterFetchAllowedTlds: async (gdgAllowedTlds: PunycodeDomainName[]) => {
        return gdgAllowedTlds.filter((tld) => {
          return !(
            config.CENTRALNIC_KEY === Registrars.CentralNic_OTE_01 &&
            CENTRALNIC_OTE_TLDS.includes(tld)
          );
        });
      },
    },
  });

  const regular = new DynadotRegistrarService({
    apiKey: secrets.DYNADOT_REGULAR_API_KEY,

    privateKey: secrets.DYNADOT_PRIVATE_KEY,
    accountId: secrets.DYNADOT_ACCOUNT_ID,
    baseUrl: config.DYNADOT_BASE_URL,
    accountType: 'bulk',

    customLogger: createLogger({
      registrar: Registrars.DynadotRegular,
    }) as any,
    connection,
    overrideKey: Registrars.DynadotRegular,
    hooks: {
      afterFetchAllowedTlds: async (
        regularAllowedTlds: PunycodeDomainName[],
      ) => {
        const gdgExistingTlds = await dynadotGdg.getAllowedParentDomains();
        return regularAllowedTlds.filter((tld) => {
          return !(
            gdgExistingTlds.includes(tld) ||
            (config.CENTRALNIC_KEY === Registrars.CentralNic_OTE_01 &&
              CENTRALNIC_OTE_TLDS.includes(tld))
          );
        });
      },
    },
  });

  return {
    gdg: dynadotGdg,
    regular,
  };
};
