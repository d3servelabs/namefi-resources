/**
 * Static XmlMeta for creData
 * Generated from: urn:ietf:params:xml:ns:domain-1.0
 *
 * @generated - Do not edit manually
 */

import type { XmlMeta } from './types';

export const DomainCreDataMeta: XmlMeta = {
  strategyId: 'fxp-v1',
  root: {
    qname: {
      namespace: 'urn:ietf:params:xml:ns:domain-1.0',
      localName: 'creData',
    },
    fields: {
      'domain:name': {
        kind: 'element',
        xmlName: 'domain:name',
        namespace: 'urn:ietf:params:xml:ns:domain-1.0',
        cardinality: 'one',
      },
      'domain:crDate': {
        kind: 'element',
        xmlName: 'domain:crDate',
        namespace: 'urn:ietf:params:xml:ns:domain-1.0',
        cardinality: 'one',
      },
      'domain:exDate': {
        kind: 'element',
        xmlName: 'domain:exDate',
        namespace: 'urn:ietf:params:xml:ns:domain-1.0',
        cardinality: 'one',
      },
    },
  },
};
