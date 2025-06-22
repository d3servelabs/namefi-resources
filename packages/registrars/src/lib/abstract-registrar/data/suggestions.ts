import type { PunycodeDomainName } from '#lib/data/validations';
import type { DomainAvailability } from './domain-availability';
import type { DomainPricingDetails } from './price-with-currency';

export type DomainSuggestion<Registrars extends string> = {
  domainName: PunycodeDomainName;
  available: DomainAvailability;
  price: Pick<DomainPricingDetails, 'registrationPrice'>;
  registrarKey: Registrars;
};

export type DomainSuggestionsQueryResult<Registrars extends string> = {
  result: DomainSuggestion<Registrars>[];
};
