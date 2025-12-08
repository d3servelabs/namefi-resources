/**
 * Static XmlMeta for chkData
 * Generated from: urn:ietf:params:xml:ns:host-1.0
 *
 * @generated - Do not edit manually
 */

import type { XmlMeta } from './types';

export const HostChkDataMeta: XmlMeta = {
  strategyId: 'fxp-v1',
  root: {
    qname: {
      namespace: 'urn:ietf:params:xml:ns:host-1.0',
      localName: 'chkData',
    },
    fields: {
      'host:cd': {
        kind: 'element',
        xmlName: 'host:cd',
        namespace: 'urn:ietf:params:xml:ns:host-1.0',
        cardinality: 'many',
        nodeMeta: {
          qname: {
            namespace: 'urn:ietf:params:xml:ns:host-1.0',
            localName: 'cd',
          },
          fields: {
            'host:name': {
              kind: 'element',
              xmlName: 'host:name',
              namespace: 'urn:ietf:params:xml:ns:host-1.0',
              cardinality: 'one',
              nodeMeta: {
                qname: {
                  namespace: 'urn:ietf:params:xml:ns:host-1.0',
                  localName: 'name',
                },
                fields: {
                  avail: {
                    kind: 'attribute',
                    xmlName: 'avail',
                    cardinality: 'one',
                  },
                },
              },
            },
            'host:reason': {
              kind: 'element',
              xmlName: 'host:reason',
              namespace: 'urn:ietf:params:xml:ns:host-1.0',
              cardinality: 'one',
              nodeMeta: {
                qname: {
                  namespace: 'urn:ietf:params:xml:ns:host-1.0',
                  localName: 'reason',
                },
                fields: {
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
      },
    },
  },
};
