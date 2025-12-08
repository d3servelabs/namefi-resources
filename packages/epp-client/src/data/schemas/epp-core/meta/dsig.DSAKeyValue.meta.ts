/**
 * Static XmlMeta for DSAKeyValue
 * Generated from: http://www.w3.org/2000/09/xmldsig#
 *
 * @generated - Do not edit manually
 */

import type { XmlMeta } from './types';

export const DsigDSAKeyValueMeta: XmlMeta = {
  strategyId: 'fxp-v1',
  root: {
    qname: {
      namespace: 'http://www.w3.org/2000/09/xmldsig#',
      localName: 'DSAKeyValue',
    },
    fields: {
      'dsig:G': {
        kind: 'element',
        xmlName: 'dsig:G',
        namespace: 'http://www.w3.org/2000/09/xmldsig#',
        cardinality: 'one',
      },
      'dsig:Y': {
        kind: 'element',
        xmlName: 'dsig:Y',
        namespace: 'http://www.w3.org/2000/09/xmldsig#',
        cardinality: 'one',
      },
      'dsig:J': {
        kind: 'element',
        xmlName: 'dsig:J',
        namespace: 'http://www.w3.org/2000/09/xmldsig#',
        cardinality: 'one',
      },
      'dsig:P': {
        kind: 'element',
        xmlName: 'dsig:P',
        namespace: 'http://www.w3.org/2000/09/xmldsig#',
        cardinality: 'one',
      },
      'dsig:Q': {
        kind: 'element',
        xmlName: 'dsig:Q',
        namespace: 'http://www.w3.org/2000/09/xmldsig#',
        cardinality: 'one',
      },
      'dsig:Seed': {
        kind: 'element',
        xmlName: 'dsig:Seed',
        namespace: 'http://www.w3.org/2000/09/xmldsig#',
        cardinality: 'one',
      },
      'dsig:PgenCounter': {
        kind: 'element',
        xmlName: 'dsig:PgenCounter',
        namespace: 'http://www.w3.org/2000/09/xmldsig#',
        cardinality: 'one',
      },
    },
  },
};
