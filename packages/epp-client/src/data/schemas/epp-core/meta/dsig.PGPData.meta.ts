/**
 * Static XmlMeta for PGPData
 * Generated from: http://www.w3.org/2000/09/xmldsig#
 *
 * @generated - Do not edit manually
 */

import type { XmlMeta } from './types';

export const DsigPGPDataMeta: XmlMeta = {
  strategyId: 'fxp-v1',
  root: {
    qname: {
      namespace: 'http://www.w3.org/2000/09/xmldsig#',
      localName: 'PGPData',
    },
    fields: {
      'dsig:PGPKeyID': {
        kind: 'element',
        xmlName: 'dsig:PGPKeyID',
        namespace: 'http://www.w3.org/2000/09/xmldsig#',
        cardinality: 'one',
      },
      'dsig:PGPKeyPacket': {
        kind: 'element',
        xmlName: 'dsig:PGPKeyPacket',
        namespace: 'http://www.w3.org/2000/09/xmldsig#',
        cardinality: 'one',
      },
    },
  },
};
