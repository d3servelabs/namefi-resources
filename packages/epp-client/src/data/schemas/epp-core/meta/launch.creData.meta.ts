/**
 * Static XmlMeta for creData
 * Generated from: urn:ietf:params:xml:ns:launch-1.0
 *
 * @generated - Do not edit manually
 */

import type { XmlMeta } from './types';

export const LaunchCreDataMeta: XmlMeta = {
  strategyId: 'fxp-v1',
  root: {
    qname: {
      namespace: 'urn:ietf:params:xml:ns:launch-1.0',
      localName: 'creData',
    },
    fields: {
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
      'launch:applicationID': {
        kind: 'element',
        xmlName: 'launch:applicationID',
        namespace: 'urn:ietf:params:xml:ns:launch-1.0',
        cardinality: 'one',
      },
    },
  },
};
