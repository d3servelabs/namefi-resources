/**
 * Static XmlMeta for chkData
 * Generated from: urn:ietf:params:xml:ns:contact-1.0
 *
 * @generated - Do not edit manually
 */

import type { XmlMeta } from './types';

export const ContactChkDataMeta: XmlMeta = {
  strategyId: 'fxp-v1',
  root: {
    qname: {
      namespace: 'urn:ietf:params:xml:ns:contact-1.0',
      localName: 'chkData',
    },
    fields: {
      'contact:cd': {
        kind: 'element',
        xmlName: 'contact:cd',
        namespace: 'urn:ietf:params:xml:ns:contact-1.0',
        cardinality: 'many',
        nodeMeta: {
          qname: {
            namespace: 'urn:ietf:params:xml:ns:contact-1.0',
            localName: 'cd',
          },
          fields: {
            'contact:id': {
              kind: 'element',
              xmlName: 'contact:id',
              namespace: 'urn:ietf:params:xml:ns:contact-1.0',
              cardinality: 'one',
              nodeMeta: {
                qname: {
                  namespace: 'urn:ietf:params:xml:ns:contact-1.0',
                  localName: 'id',
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
            'contact:reason': {
              kind: 'element',
              xmlName: 'contact:reason',
              namespace: 'urn:ietf:params:xml:ns:contact-1.0',
              cardinality: 'one',
              nodeMeta: {
                qname: {
                  namespace: 'urn:ietf:params:xml:ns:contact-1.0',
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
