import type {
  ContactEntity,
  DomainContacts,
  DomainPriceDetails,
  DomainRegistration,
  PriceWithCurrency,
} from './data';

export type Transformer<FROM, TO, FROMB = FROM, TOB = TO> = {
  from: (value: FROM) => TOB;
  to: (value: TO) => FROMB;
};
export type TransformersTypesMap = {
  From: {
    Price?: any;
    PriceDetails?: any;
    Contact?: any;
    ContactsMap?: any;
    DomainInfo?: any;
  };
};
export type Transformers<T extends TransformersTypesMap> = {
  PriceTransformer?: Transformer<T['From']['Price'], PriceWithCurrency>;
  DomainPriceDetailsTransformer?: Transformer<
    T['From']['PriceDetails'],
    DomainPriceDetails
  >;

  ContactsMapTransformer?: Transformer<
    T['From']['ContactsMap'],
    Partial<DomainContacts>,
    T['From']['ContactsMap'],
    DomainContacts
  >;
  ContactTransformer?: Transformer<
    T['From']['Contact'],
    ContactEntity | undefined
  >;

  DomainInfoTransformer?: Transformer<
    T['From']['DomainInfo'],
    Omit<DomainRegistration, 'supportsDnssec'>
  >;
};
