/**
 * Static XmlMeta for panData
 * Generated from: urn:ietf:params:xml:ns:domain-1.0
 *
 * @generated - Do not edit manually
 */

import type { XmlMeta } from './types';

export const DomainPanDataMeta: XmlMeta = {
  strategyId: 'fxp-v1',
  root: {
    qname: {
      namespace: 'urn:ietf:params:xml:ns:domain-1.0',
      localName: 'panData',
    },
    fields: {
      'domain:name': {
        kind: 'element',
        xmlName: 'domain:name',
        namespace: 'urn:ietf:params:xml:ns:domain-1.0',
        cardinality: 'one',
        nodeMeta: {
          qname: {
            namespace: 'urn:ietf:params:xml:ns:domain-1.0',
            localName: 'name',
          },
          fields: {
            paResult: {
              kind: 'attribute',
              xmlName: 'paResult',
              cardinality: 'one',
            },
          },
        },
      },
      'domain:paTRID': {
        kind: 'element',
        xmlName: 'domain:paTRID',
        namespace: 'urn:ietf:params:xml:ns:domain-1.0',
        cardinality: 'one',
        nodeMeta: {
          qname: {
            namespace: 'urn:ietf:params:xml:ns:domain-1.0',
            localName: 'paTRID',
          },
          fields: {
            'epp:clTRID': {
              kind: 'element',
              xmlName: 'epp:clTRID',
              namespace: 'urn:ietf:params:xml:ns:epp-1.0',
              cardinality: 'one',
            },
            'epp:svTRID': {
              kind: 'element',
              xmlName: 'epp:svTRID',
              namespace: 'urn:ietf:params:xml:ns:epp-1.0',
              cardinality: 'one',
            },
          },
        },
      },
      'domain:paDate': {
        kind: 'element',
        xmlName: 'domain:paDate',
        namespace: 'urn:ietf:params:xml:ns:domain-1.0',
        cardinality: 'one',
      },
    },
  },
};
