/**
 * Static XmlMeta for check
 * Generated from: urn:ietf:params:xml:ns:launch-1.0
 *
 * @generated - Do not edit manually
 */

import type { XmlMeta } from './types';

export const LaunchCheckMeta: XmlMeta = {
  strategyId: 'fxp-v1',
  root: {
    qname: {
      namespace: 'urn:ietf:params:xml:ns:launch-1.0',
      localName: 'check',
    },
    fields: {
      type: {
        kind: 'attribute',
        xmlName: 'type',
        cardinality: 'one',
      },
      'launch:phase': {
        kind: 'element',
        xmlName: 'launch:phase',
        namespace: 'urn:ietf:params:xml:ns:launch-1.0',
        cardinality: 'one',
        nodeMeta: {
          qname: {
            namespace: 'urn:ietf:params:xml:ns:launch-1.0',
            localName: 'phase',
          },
          fields: {
            name: {
              kind: 'attribute',
              xmlName: 'name',
              cardinality: 'one',
            },
          },
        },
      },
    },
  },
};
