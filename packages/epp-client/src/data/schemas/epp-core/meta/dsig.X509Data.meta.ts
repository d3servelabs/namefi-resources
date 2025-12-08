/**
 * Static XmlMeta for X509Data
 * Generated from: http://www.w3.org/2000/09/xmldsig#
 *
 * @generated - Do not edit manually
 */

import type { XmlMeta } from './types';

export const DsigX509DataMeta: XmlMeta = {
  strategyId: 'fxp-v1',
  root: {
    qname: {
      namespace: 'http://www.w3.org/2000/09/xmldsig#',
      localName: 'X509Data',
    },
    fields: {
      'dsig:X509IssuerSerial': {
        kind: 'element',
        xmlName: 'dsig:X509IssuerSerial',
        namespace: 'http://www.w3.org/2000/09/xmldsig#',
        cardinality: 'one',
        nodeMeta: {
          qname: {
            namespace: 'http://www.w3.org/2000/09/xmldsig#',
            localName: 'X509IssuerSerial',
          },
          fields: {
            'dsig:X509IssuerName': {
              kind: 'element',
              xmlName: 'dsig:X509IssuerName',
              namespace: 'http://www.w3.org/2000/09/xmldsig#',
              cardinality: 'one',
            },
            'dsig:X509SerialNumber': {
              kind: 'element',
              xmlName: 'dsig:X509SerialNumber',
              namespace: 'http://www.w3.org/2000/09/xmldsig#',
              cardinality: 'one',
            },
          },
        },
      },
      'dsig:X509SKI': {
        kind: 'element',
        xmlName: 'dsig:X509SKI',
        namespace: 'http://www.w3.org/2000/09/xmldsig#',
        cardinality: 'one',
      },
      'dsig:X509SubjectName': {
        kind: 'element',
        xmlName: 'dsig:X509SubjectName',
        namespace: 'http://www.w3.org/2000/09/xmldsig#',
        cardinality: 'one',
      },
      'dsig:X509Certificate': {
        kind: 'element',
        xmlName: 'dsig:X509Certificate',
        namespace: 'http://www.w3.org/2000/09/xmldsig#',
        cardinality: 'one',
      },
      'dsig:X509CRL': {
        kind: 'element',
        xmlName: 'dsig:X509CRL',
        namespace: 'http://www.w3.org/2000/09/xmldsig#',
        cardinality: 'one',
      },
    },
  },
};
