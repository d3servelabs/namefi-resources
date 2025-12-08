/**
 * Static XmlMeta for chkData
 * Generated from: urn:ietf:params:xml:ns:launch-1.0
 *
 * @generated - Do not edit manually
 */

import type { XmlMeta } from './types';

export const LaunchChkDataMeta: XmlMeta = {
  strategyId: 'fxp-v1',
  root: {
    qname: {
      namespace: 'urn:ietf:params:xml:ns:launch-1.0',
      localName: 'chkData',
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
      'launch:cd': {
        kind: 'element',
        xmlName: 'launch:cd',
        namespace: 'urn:ietf:params:xml:ns:launch-1.0',
        cardinality: 'many',
        nodeMeta: {
          qname: {
            namespace: 'urn:ietf:params:xml:ns:launch-1.0',
            localName: 'cd',
          },
          fields: {
            'launch:name': {
              kind: 'element',
              xmlName: 'launch:name',
              namespace: 'urn:ietf:params:xml:ns:launch-1.0',
              cardinality: 'one',
              nodeMeta: {
                qname: {
                  namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                  localName: 'name',
                },
                fields: {
                  exists: {
                    kind: 'attribute',
                    xmlName: 'exists',
                    cardinality: 'one',
                  },
                },
              },
            },
            'launch:claimKey': {
              kind: 'element',
              xmlName: 'launch:claimKey',
              namespace: 'urn:ietf:params:xml:ns:launch-1.0',
              cardinality: 'one',
              nodeMeta: {
                qname: {
                  namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                  localName: 'claimKey',
                },
                fields: {
                  validatorID: {
                    kind: 'attribute',
                    xmlName: 'validatorID',
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
