/**
 * Static XmlMeta for transfer
 * Generated from: urn:ietf:params:xml:ns:contact-1.0
 *
 * @generated - Do not edit manually
 */

import type { XmlMeta } from './types';

export const ContactTransferMeta: XmlMeta = {
  strategyId: 'fxp-v1',
  root: {
    qname: {
      namespace: 'urn:ietf:params:xml:ns:contact-1.0',
      localName: 'transfer',
    },
    fields: {
      'contact:id': {
        kind: 'element',
        xmlName: 'contact:id',
        namespace: 'urn:ietf:params:xml:ns:contact-1.0',
        cardinality: 'one',
      },
      'contact:authInfo': {
        kind: 'element',
        xmlName: 'contact:authInfo',
        namespace: 'urn:ietf:params:xml:ns:contact-1.0',
        cardinality: 'one',
        nodeMeta: {
          qname: {
            namespace: 'urn:ietf:params:xml:ns:contact-1.0',
            localName: 'authInfo',
          },
          fields: {
            'contact:pw': {
              kind: 'element',
              xmlName: 'contact:pw',
              namespace: 'urn:ietf:params:xml:ns:contact-1.0',
              cardinality: 'one',
              nodeMeta: {
                qname: {
                  namespace: 'urn:ietf:params:xml:ns:contact-1.0',
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
            'contact:ext': {
              kind: 'element',
              xmlName: 'contact:ext',
              namespace: 'urn:ietf:params:xml:ns:contact-1.0',
              cardinality: 'one',
              nodeMeta: {
                qname: {
                  namespace: 'urn:ietf:params:xml:ns:contact-1.0',
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
