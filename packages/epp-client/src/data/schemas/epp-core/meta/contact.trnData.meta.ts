/**
 * Static XmlMeta for trnData
 * Generated from: urn:ietf:params:xml:ns:contact-1.0
 *
 * @generated - Do not edit manually
 */

import type { XmlMeta } from './types';

export const ContactTrnDataMeta: XmlMeta = {
  strategyId: 'fxp-v1',
  root: {
    qname: {
      namespace: 'urn:ietf:params:xml:ns:contact-1.0',
      localName: 'trnData',
    },
    fields: {
      'contact:id': {
        kind: 'element',
        xmlName: 'contact:id',
        namespace: 'urn:ietf:params:xml:ns:contact-1.0',
        cardinality: 'one',
      },
      'contact:trStatus': {
        kind: 'element',
        xmlName: 'contact:trStatus',
        namespace: 'urn:ietf:params:xml:ns:contact-1.0',
        cardinality: 'one',
      },
      'contact:reID': {
        kind: 'element',
        xmlName: 'contact:reID',
        namespace: 'urn:ietf:params:xml:ns:contact-1.0',
        cardinality: 'one',
      },
      'contact:reDate': {
        kind: 'element',
        xmlName: 'contact:reDate',
        namespace: 'urn:ietf:params:xml:ns:contact-1.0',
        cardinality: 'one',
      },
      'contact:acID': {
        kind: 'element',
        xmlName: 'contact:acID',
        namespace: 'urn:ietf:params:xml:ns:contact-1.0',
        cardinality: 'one',
      },
      'contact:acDate': {
        kind: 'element',
        xmlName: 'contact:acDate',
        namespace: 'urn:ietf:params:xml:ns:contact-1.0',
        cardinality: 'one',
      },
    },
  },
};
