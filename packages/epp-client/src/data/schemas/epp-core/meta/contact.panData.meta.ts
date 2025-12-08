/**
 * Static XmlMeta for panData
 * Generated from: urn:ietf:params:xml:ns:contact-1.0
 *
 * @generated - Do not edit manually
 */

import type { XmlMeta } from './types';

export const ContactPanDataMeta: XmlMeta = {
  strategyId: 'fxp-v1',
  root: {
    qname: {
      namespace: 'urn:ietf:params:xml:ns:contact-1.0',
      localName: 'panData',
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
            paResult: {
              kind: 'attribute',
              xmlName: 'paResult',
              cardinality: 'one',
            },
          },
        },
      },
      'contact:paTRID': {
        kind: 'element',
        xmlName: 'contact:paTRID',
        namespace: 'urn:ietf:params:xml:ns:contact-1.0',
        cardinality: 'one',
        nodeMeta: {
          qname: {
            namespace: 'urn:ietf:params:xml:ns:contact-1.0',
            localName: 'paTRID',
          },
          fields: {
            'epp:clTRID': {
              kind: 'element',
              xmlName: 'epp:clTRID',
              namespace: 'urn:ietf:params:xml:ns:epp-1.0',
              cardinality: 'one',
            },
            'epp:svTRID': {
              kind: 'element',
              xmlName: 'epp:svTRID',
              namespace: 'urn:ietf:params:xml:ns:epp-1.0',
              cardinality: 'one',
            },
          },
        },
      },
      'contact:paDate': {
        kind: 'element',
        xmlName: 'contact:paDate',
        namespace: 'urn:ietf:params:xml:ns:contact-1.0',
        cardinality: 'one',
      },
    },
  },
};
