/**
 * Static XmlMeta for check
 * Generated from: urn:ietf:params:xml:ns:epp:fee-1.0
 *
 * @generated - Do not edit manually
 */

import type { XmlMeta } from './types';

export const FeeCheckMeta: XmlMeta = {
  strategyId: 'fxp-v1',
  root: {
    qname: {
      namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
      localName: 'check',
    },
    fields: {
      'fee:currency': {
        kind: 'element',
        xmlName: 'fee:currency',
        namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
        cardinality: 'one',
      },
      'fee:command': {
        kind: 'element',
        xmlName: 'fee:command',
        namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
        cardinality: 'many',
        nodeMeta: {
          qname: {
            namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
            localName: 'command',
          },
          fields: {
            name: {
              kind: 'attribute',
              xmlName: 'name',
              cardinality: 'one',
            },
            customName: {
              kind: 'attribute',
              xmlName: 'customName',
              cardinality: 'one',
            },
            phase: {
              kind: 'attribute',
              xmlName: 'phase',
              cardinality: 'one',
            },
            subphase: {
              kind: 'attribute',
              xmlName: 'subphase',
              cardinality: 'one',
            },
            'fee:period': {
              kind: 'element',
              xmlName: 'fee:period',
              namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
              cardinality: 'one',
              nodeMeta: {
                qname: {
                  namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
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
          },
        },
      },
    },
  },
};
