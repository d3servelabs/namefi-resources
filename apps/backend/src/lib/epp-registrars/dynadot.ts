import { DynadotRegistrarService } from '@namefi-astra/registrars/registrars/sub-registrars';
import { config } from '#lib/env';
import { secrets } from '#lib/env';
import { createLogger } from '#lib/logger';
import { Registrars } from '@namefi-astra/registrars/registrars/registrars-keys';
import type { PunycodeDomainName } from '@namefi-astra/registrars/lib/data/validations';
import { CENTRALNIC_OTE_TLDS } from './centralnic';
import { defaultKeyv } from '#lib/keyv';
import { z } from 'zod';

let _dynadotRegistrars: ReturnType<typeof initDynadotRegistrars> | null = null;

const accountTypesSchema = z.object({
  DYNADOT_GDG_ACCOUNT_TYPE: z
    .enum(['super_bulk', 'bulk', 'regular'])
    .optional()
    .default('super_bulk'),
  DYNADOT_REGULAR_ACCOUNT_TYPE: z
    .enum(['super_bulk', 'bulk', 'regular'])
    .optional()
    .default('bulk'),
});

export const initDynadotRegistrars = (connection: any) => {
  const accountTypes = accountTypesSchema.parse(process.env);
  const dynadotGdg = new DynadotRegistrarService({
    apiKey: secrets.DYNADOT_GDG_API_KEY,

    privateKey: secrets.DYNADOT_PRIVATE_KEY,
    accountId: secrets.DYNADOT_ACCOUNT_ID,
    baseUrl: config.DYNADOT_BASE_URL,
    accountType: accountTypes.DYNADOT_GDG_ACCOUNT_TYPE,

    customLogger: createLogger({
      registrar: Registrars.DynadotGdg,
    }) as any,
    connection,
    hooks: {
      afterFetchAllowedTlds: async (gdgAllowedTlds: PunycodeDomainName[]) => {
        const disabledTlds = await defaultKeyv.get<string[]>(
          'dynadot-gdg-disabled-tlds',
        );

        const final = gdgAllowedTlds.filter((tld) => {
          return !(
            (config.CENTRALNIC_KEY === Registrars.CentralNic_OTE_01 &&
              CENTRALNIC_OTE_TLDS.includes(tld)) ||
            (disabledTlds &&
              Array.isArray(disabledTlds) &&
              disabledTlds.includes(tld))
          );
        });
        return final;
      },
    },
  });
  const regular = new DynadotRegistrarService({
    apiKey: secrets.DYNADOT_REGULAR_API_KEY,

    privateKey: secrets.DYNADOT_PRIVATE_KEY,
    accountId: secrets.DYNADOT_ACCOUNT_ID,
    baseUrl: config.DYNADOT_BASE_URL,
    accountType: accountTypes.DYNADOT_REGULAR_ACCOUNT_TYPE,

    customLogger: createLogger({
      registrar: Registrars.DynadotRegular,
    }) as any,
    connection,
    overrideKey: Registrars.DynadotRegular,
    hooks: {
      afterFetchAllowedTlds: async (
        regularDynadotAllowedTlds: PunycodeDomainName[],
      ) => {
        const disabledTlds = await defaultKeyv.get<string[]>(
          'dynadot-regular-disabled-tlds',
        );

        const gdgExistingTlds = await dynadotGdg.getAllowedParentDomains();
        const regularDynadotTldsForExistingDomains = [
          'com',
          'net',
          'org',
          'click',
          'cv',
        ];
        const final = regularDynadotAllowedTlds.filter((tld) => {
          if (regularDynadotTldsForExistingDomains.includes(tld)) {
            return true;
          }
          return !(
            gdgExistingTlds.includes(tld) ||
            (disabledTlds &&
              Array.isArray(disabledTlds) &&
              disabledTlds.includes(tld)) ||
            (config.CENTRALNIC_KEY === Registrars.CentralNic_OTE_01 &&
              CENTRALNIC_OTE_TLDS.includes(tld))
          );
        });
        return final;
      },
    },
  });

  return {
    gdg: dynadotGdg,
    regular,
  };
};
export const getDynadotRegistrars = (connection: any) => {
  if (!_dynadotRegistrars) {
    _dynadotRegistrars = initDynadotRegistrars(connection);
  }

  return _dynadotRegistrars;
};
