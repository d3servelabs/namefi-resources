/**
 * Static XmlMeta for delete
 * Generated from: urn:ietf:params:xml:ns:contact-1.0
 *
 * @generated - Do not edit manually
 */

import type { XmlMeta } from './types';

export const ContactDeleteMeta: XmlMeta = {
  strategyId: 'fxp-v1',
  root: {
    qname: {
      namespace: 'urn:ietf:params:xml:ns:contact-1.0',
      localName: 'delete',
    },
    fields: {
      'contact:id': {
        kind: 'element',
        xmlName: 'contact:id',
        namespace: 'urn:ietf:params:xml:ns:contact-1.0',
        cardinality: 'one',
      },
    },
  },
};
