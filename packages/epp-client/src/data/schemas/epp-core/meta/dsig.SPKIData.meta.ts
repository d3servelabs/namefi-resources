/**
 * Static XmlMeta for SPKIData
 * Generated from: http://www.w3.org/2000/09/xmldsig#
 *
 * @generated - Do not edit manually
 */

import type { XmlMeta } from './types';

export const DsigSPKIDataMeta: XmlMeta = {
  strategyId: 'fxp-v1',
  root: {
    qname: {
      namespace: 'http://www.w3.org/2000/09/xmldsig#',
      localName: 'SPKIData',
    },
    fields: {
      'dsig:SPKISexp': {
        kind: 'element',
        xmlName: 'dsig:SPKISexp',
        namespace: 'http://www.w3.org/2000/09/xmldsig#',
        cardinality: 'one',
      },
    },
  },
};
