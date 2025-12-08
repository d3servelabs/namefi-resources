/**
 * Static XmlMeta for chkData
 * Generated from: urn:ietf:params:xml:ns:domain-1.0
 *
 * @generated - Do not edit manually
 */

import type { XmlMeta } from './types';

export const DomainChkDataMeta: XmlMeta = {
  strategyId: 'fxp-v1',
  root: {
    qname: {
      namespace: 'urn:ietf:params:xml:ns:domain-1.0',
      localName: 'chkData',
    },
    fields: {
      'domain:cd': {
        kind: 'element',
        xmlName: 'domain:cd',
        namespace: 'urn:ietf:params:xml:ns:domain-1.0',
        cardinality: 'many',
        nodeMeta: {
          qname: {
            namespace: 'urn:ietf:params:xml:ns:domain-1.0',
            localName: 'cd',
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
                  avail: {
                    kind: 'attribute',
                    xmlName: 'avail',
                    cardinality: 'one',
                  },
                },
              },
            },
            'domain:reason': {
              kind: 'element',
              xmlName: 'domain:reason',
              namespace: 'urn:ietf:params:xml:ns:domain-1.0',
              cardinality: 'one',
              nodeMeta: {
                qname: {
                  namespace: 'urn:ietf:params:xml:ns:domain-1.0',
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
