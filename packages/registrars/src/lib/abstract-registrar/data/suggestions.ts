import type { DomainAvailability } from './domain-availability';
import type { DomainPriceDetails } from './domain-price-details';

export type DomainSuggestion<Registrars extends string> = {
  domainName: string;
  available: DomainAvailability;
  price: Pick<DomainPriceDetails, 'registrationPrice'>;
  registrarKey: Registrars;
};

export type DomainSuggestionsQueryResult<Registrars extends string> = {
  result: DomainSuggestion<Registrars>[];
};
