/**
 * Static XmlMeta for Transform
 * Generated from: http://www.w3.org/2000/09/xmldsig#
 *
 * @generated - Do not edit manually
 */

import type { XmlMeta } from './types';

export const DsigTransformMeta: XmlMeta = {
  strategyId: 'fxp-v1',
  root: {
    qname: {
      namespace: 'http://www.w3.org/2000/09/xmldsig#',
      localName: 'Transform',
    },
    fields: {
      Algorithm: {
        kind: 'attribute',
        xmlName: 'Algorithm',
        cardinality: 'one',
      },
      'dsig:XPath': {
        kind: 'element',
        xmlName: 'dsig:XPath',
        namespace: 'http://www.w3.org/2000/09/xmldsig#',
        cardinality: 'one',
      },
    },
  },
};
