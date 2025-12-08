/**
 * Static XmlMeta for DigestMethod
 * Generated from: http://www.w3.org/2000/09/xmldsig#
 *
 * @generated - Do not edit manually
 */

import type { XmlMeta } from './types';

export const DsigDigestMethodMeta: XmlMeta = {
  strategyId: 'fxp-v1',
  root: {
    qname: {
      namespace: 'http://www.w3.org/2000/09/xmldsig#',
      localName: 'DigestMethod',
    },
    fields: {
      Algorithm: {
        kind: 'attribute',
        xmlName: 'Algorithm',
        cardinality: 'one',
      },
    },
  },
};
