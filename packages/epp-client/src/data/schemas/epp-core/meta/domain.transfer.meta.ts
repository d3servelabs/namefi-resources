/**
 * Static XmlMeta for transfer
 * Generated from: urn:ietf:params:xml:ns:domain-1.0
 *
 * @generated - Do not edit manually
 */

import type { XmlMeta } from './types';

export const DomainTransferMeta: XmlMeta = {
  strategyId: 'fxp-v1',
  root: {
    qname: {
      namespace: 'urn:ietf:params:xml:ns:domain-1.0',
      localName: 'transfer',
    },
    fields: {
      'domain:name': {
        kind: 'element',
        xmlName: 'domain:name',
        namespace: 'urn:ietf:params:xml:ns:domain-1.0',
        cardinality: 'one',
      },
      'domain:period': {
        kind: 'element',
        xmlName: 'domain:period',
        namespace: 'urn:ietf:params:xml:ns:domain-1.0',
        cardinality: 'one',
        nodeMeta: {
          qname: {
            namespace: 'urn:ietf:params:xml:ns:domain-1.0',
            localName: 'period',
          },
          fields: {
            unit: {
              kind: 'attribute',
              xmlName: 'unit',
              cardinality: 'one',
            },
          },
        },
      },
      'domain:authInfo': {
        kind: 'element',
        xmlName: 'domain:authInfo',
        namespace: 'urn:ietf:params:xml:ns:domain-1.0',
        cardinality: 'one',
        nodeMeta: {
          qname: {
            namespace: 'urn:ietf:params:xml:ns:domain-1.0',
            localName: 'authInfo',
          },
          fields: {
            'domain:pw': {
              kind: 'element',
              xmlName: 'domain:pw',
              namespace: 'urn:ietf:params:xml:ns:domain-1.0',
              cardinality: 'one',
              nodeMeta: {
                qname: {
                  namespace: 'urn:ietf:params:xml:ns:domain-1.0',
                  localName: 'pw',
                },
                fields: {
                  roid: {
                    kind: 'attribute',
                    xmlName: 'roid',
                    cardinality: 'one',
                  },
                },
              },
            },
            'domain:ext': {
              kind: 'element',
              xmlName: 'domain:ext',
              namespace: 'urn:ietf:params:xml:ns:domain-1.0',
              cardinality: 'one',
              nodeMeta: {
                qname: {
                  namespace: 'urn:ietf:params:xml:ns:domain-1.0',
                  localName: 'ext',
                },
                fields: {},
              },
            },
          },
        },
      },
    },
  },
};
