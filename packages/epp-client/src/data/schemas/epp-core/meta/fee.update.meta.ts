/**
 * Static XmlMeta for update
 * Generated from: urn:ietf:params:xml:ns:epp:fee-1.0
 *
 * @generated - Do not edit manually
 */

import type { XmlMeta } from './types';

export const FeeUpdateMeta: XmlMeta = {
  strategyId: 'fxp-v1',
  root: {
    qname: {
      namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
      localName: 'update',
    },
    fields: {
      'fee:currency': {
        kind: 'element',
        xmlName: 'fee:currency',
        namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
        cardinality: 'one',
      },
      'fee:fee': {
        kind: 'element',
        xmlName: 'fee:fee',
        namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
        cardinality: 'many',
        nodeMeta: {
          qname: {
            namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
            localName: 'fee',
          },
          fields: {
            description: {
              kind: 'attribute',
              xmlName: 'description',
              cardinality: 'one',
            },
            lang: {
              kind: 'attribute',
              xmlName: 'lang',
              cardinality: 'one',
            },
            refundable: {
              kind: 'attribute',
              xmlName: 'refundable',
              cardinality: 'one',
            },
            'grace-period': {
              kind: 'attribute',
              xmlName: 'grace-period',
              cardinality: 'one',
            },
            applied: {
              kind: 'attribute',
              xmlName: 'applied',
              cardinality: 'one',
            },
          },
        },
      },
      'fee:credit': {
        kind: 'element',
        xmlName: 'fee:credit',
        namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
        cardinality: 'many',
        nodeMeta: {
          qname: {
            namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
            localName: 'credit',
          },
          fields: {
            description: {
              kind: 'attribute',
              xmlName: 'description',
              cardinality: 'one',
            },
            lang: {
              kind: 'attribute',
              xmlName: 'lang',
              cardinality: 'one',
            },
          },
        },
      },
    },
  },
};
