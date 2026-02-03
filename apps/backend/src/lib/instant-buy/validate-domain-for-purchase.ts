import { TRPCError } from '@trpc/server';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { itemTypeSchema } from '@namefi-astra/db/types';
import {
  computeChargesInUsdOrThrow,
  usdToCents,
} from '@namefi-astra/registrars/multi-year-pricing';
import {
  getDomainListInfo,
  type DomainAvailabilityInfo,
} from '#lib/namefi-registry';
import { getDomainPricingForOperation } from '../../trpc/types';
import { userQualifiesForDomainNamePromo } from '#lib/user-promo';
import { createLogger } from '#lib/logger';

const logger = createLogger({ module: 'instant-buy' });

export interface ValidateDomainForPurchaseResult {
  isValid: boolean;
  priceInUsdCents: number;
  registrar: string;
  domainAvailabilityInfo: DomainAvailabilityInfo;
  error?: string;
}

export interface ValidateDomainForPurchaseInput {
  normalizedDomainName: NamefiNormalizedDomain;
  durationInYears: number;
  user?: { id: string; privyUserId: string };
}

/**
 * Validates a domain for instant purchase (registration only, not imports).
 * Checks availability, calculates pricing, and validates promo eligibility if applicable.
 */
export async function validateDomainForInstantPurchase(
  input: ValidateDomainForPurchaseInput,
): Promise<ValidateDomainForPurchaseResult> {
  const { normalizedDomainName, durationInYears, user } = input;

  logger.debug(
    { normalizedDomainName, durationInYears, userId: user?.id },
    'Validating domain for instant purchase',
  );

  // 1. Fetch domain availability info
  const domainInfos = await getDomainListInfo(
    [normalizedDomainName],
    user ? { privyUserId: user.privyUserId } : null,
  );

  const domainInfo = domainInfos[0];

  if (!domainInfo) {
    logger.warn({ normalizedDomainName }, 'Domain info not found');
    return {
      isValid: false,
      priceInUsdCents: 0,
      registrar: '',
      domainAvailabilityInfo: {
        domain: normalizedDomainName,
        availability: false,
        pricingDetails: undefined,
        currentOwner: undefined,
        importable: false,
        supported: false,
      },
      error: `Could not fetch domain information for ${normalizedDomainName}`,
    };
  }

  // 2. Check domain is available for registration (not import)
  if (!domainInfo.availability) {
    logger.debug(
      { normalizedDomainName, importable: domainInfo.importable },
      'Domain not available for registration',
    );
    return {
      isValid: false,
      priceInUsdCents: 0,
      registrar: domainInfo.registrarKey || '',
      domainAvailabilityInfo: domainInfo,
      error: domainInfo.importable
        ? `${normalizedDomainName} is not available for registration. It can only be imported.`
        : `${normalizedDomainName} is not available for registration.`,
    };
  }

  // 3. Check domain is supported
  if (!domainInfo.supported) {
    logger.debug({ normalizedDomainName }, 'Domain TLD not supported');
    return {
      isValid: false,
      priceInUsdCents: 0,
      registrar: domainInfo.registrarKey || '',
      domainAvailabilityInfo: domainInfo,
      error: `${normalizedDomainName} is not supported for registration.`,
    };
  }

  // 4. Validate duration constraints
  const minDuration = domainInfo.durationValidationInYears?.min ?? 1;
  const maxDuration = domainInfo.durationValidationInYears?.max ?? 1;

  if (durationInYears < minDuration || durationInYears > maxDuration) {
    logger.debug(
      { normalizedDomainName, durationInYears, minDuration, maxDuration },
      'Duration outside allowed range',
    );
    return {
      isValid: false,
      priceInUsdCents: 0,
      registrar: domainInfo.registrarKey || '',
      domainAvailabilityInfo: domainInfo,
      error: `Duration must be between ${minDuration} and ${maxDuration} years for ${normalizedDomainName}.`,
    };
  }

  // 5. Get pricing for registration
  const pricingDetails = getDomainPricingForOperation(
    domainInfo,
    itemTypeSchema.enum.REGISTER,
  );

  if (!pricingDetails) {
    logger.warn({ normalizedDomainName }, 'Pricing details unavailable');
    return {
      isValid: false,
      priceInUsdCents: 0,
      registrar: domainInfo.registrarKey || '',
      domainAvailabilityInfo: domainInfo,
      error: `Pricing information unavailable for ${normalizedDomainName}.`,
    };
  }

  // 6. Calculate price
  let priceInUsdCents: number;
  try {
    const chargeAmountInUsd = computeChargesInUsdOrThrow(
      pricingDetails,
      durationInYears,
    );
    priceInUsdCents = usdToCents(chargeAmountInUsd);
  } catch (error) {
    logger.error(
      { error, normalizedDomainName, durationInYears },
      'Failed to calculate price',
    );
    return {
      isValid: false,
      priceInUsdCents: 0,
      registrar: domainInfo.registrarKey || '',
      domainAvailabilityInfo: domainInfo,
      error: `Could not calculate price for ${normalizedDomainName}.`,
    };
  }

  // 7. If price is 0, verify promo eligibility
  if (priceInUsdCents === 0 && user) {
    const qualifiesForPromo = await userQualifiesForDomainNamePromo({
      normalizedDomainName,
      user: { privyUserId: user.privyUserId },
    });

    if (!qualifiesForPromo) {
      logger.debug(
        { normalizedDomainName, userId: user.id },
        'User does not qualify for promotional pricing',
      );
      return {
        isValid: false,
        priceInUsdCents: 0,
        registrar: domainInfo.registrarKey || '',
        domainAvailabilityInfo: domainInfo,
        error: 'You do not qualify for promotional pricing on this domain.',
      };
    }
  }

  logger.debug(
    {
      normalizedDomainName,
      priceInUsdCents,
      registrar: domainInfo.registrarKey,
    },
    'Domain validated successfully for instant purchase',
  );

  return {
    isValid: true,
    priceInUsdCents,
    registrar: domainInfo.registrarKey || '',
    domainAvailabilityInfo: domainInfo,
  };
}

/**
 * Validates domain and throws TRPCError if invalid.
 * Convenience wrapper for use in tRPC mutations.
 */
export async function validateDomainForInstantPurchaseOrThrow(
  input: ValidateDomainForPurchaseInput,
): Promise<Omit<ValidateDomainForPurchaseResult, 'isValid' | 'error'>> {
  const result = await validateDomainForInstantPurchase(input);

  if (!result.isValid) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: result.error || 'Domain validation failed',
    });
  }

  return {
    priceInUsdCents: result.priceInUsdCents,
    registrar: result.registrar,
    domainAvailabilityInfo: result.domainAvailabilityInfo,
  };
}
