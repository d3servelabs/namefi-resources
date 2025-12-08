/**
 * Static XmlMeta for SignatureProperty
 * Generated from: http://www.w3.org/2000/09/xmldsig#
 *
 * @generated - Do not edit manually
 */

import type { XmlMeta } from './types';

export const DsigSignaturePropertyMeta: XmlMeta = {
  strategyId: 'fxp-v1',
  root: {
    qname: {
      namespace: 'http://www.w3.org/2000/09/xmldsig#',
      localName: 'SignatureProperty',
    },
    fields: {
      Target: {
        kind: 'attribute',
        xmlName: 'Target',
        cardinality: 'one',
      },
      Id: {
        kind: 'attribute',
        xmlName: 'Id',
        cardinality: 'one',
      },
    },
  },
};
