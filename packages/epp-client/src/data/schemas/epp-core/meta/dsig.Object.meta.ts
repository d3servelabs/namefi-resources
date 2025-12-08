/**
 * Static XmlMeta for Object
 * Generated from: http://www.w3.org/2000/09/xmldsig#
 *
 * @generated - Do not edit manually
 */

import type { XmlMeta } from './types';

export const DsigObjectMeta: XmlMeta = {
  strategyId: 'fxp-v1',
  root: {
    qname: {
      namespace: 'http://www.w3.org/2000/09/xmldsig#',
      localName: 'Object',
    },
    fields: {
      Id: {
        kind: 'attribute',
        xmlName: 'Id',
        cardinality: 'one',
      },
      MimeType: {
        kind: 'attribute',
        xmlName: 'MimeType',
        cardinality: 'one',
      },
      Encoding: {
        kind: 'attribute',
        xmlName: 'Encoding',
        cardinality: 'one',
      },
    },
  },
};
