/**
 * Static XmlMeta for CanonicalizationMethod
 * Generated from: http://www.w3.org/2000/09/xmldsig#
 *
 * @generated - Do not edit manually
 */

import type { XmlMeta } from './types';

export const DsigCanonicalizationMethodMeta: XmlMeta = {
  strategyId: 'fxp-v1',
  root: {
    qname: {
      namespace: 'http://www.w3.org/2000/09/xmldsig#',
      localName: 'CanonicalizationMethod',
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
