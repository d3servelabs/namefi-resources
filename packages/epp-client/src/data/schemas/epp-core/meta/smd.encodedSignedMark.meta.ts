/**
 * Static XmlMeta for encodedSignedMark
 * Generated from: urn:ietf:params:xml:ns:signedMark-1.0
 *
 * @generated - Do not edit manually
 */

import type { XmlMeta } from './types';

export const SmdEncodedSignedMarkMeta: XmlMeta = {
  strategyId: 'fxp-v1',
  root: {
    qname: {
      namespace: 'urn:ietf:params:xml:ns:signedMark-1.0',
      localName: 'encodedSignedMark',
    },
    fields: {
      encoding: {
        kind: 'attribute',
        xmlName: 'encoding',
        cardinality: 'one',
      },
    },
  },
};
