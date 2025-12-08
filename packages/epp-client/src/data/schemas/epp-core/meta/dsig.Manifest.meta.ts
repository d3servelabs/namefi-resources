/**
 * Static XmlMeta for Manifest
 * Generated from: http://www.w3.org/2000/09/xmldsig#
 *
 * @generated - Do not edit manually
 */

import type { XmlMeta } from './types';

export const DsigManifestMeta: XmlMeta = {
  strategyId: 'fxp-v1',
  root: {
    qname: {
      namespace: 'http://www.w3.org/2000/09/xmldsig#',
      localName: 'Manifest',
    },
    fields: {
      Id: {
        kind: 'attribute',
        xmlName: 'Id',
        cardinality: 'one',
      },
      'dsig:Reference': {
        kind: 'element',
        xmlName: 'dsig:Reference',
        namespace: 'http://www.w3.org/2000/09/xmldsig#',
        cardinality: 'many',
        nodeMeta: {
          qname: {
            namespace: 'http://www.w3.org/2000/09/xmldsig#',
            localName: 'Reference',
          },
          fields: {
            Id: {
              kind: 'attribute',
              xmlName: 'Id',
              cardinality: 'one',
            },
            URI: {
              kind: 'attribute',
              xmlName: 'URI',
              cardinality: 'one',
            },
            Type: {
              kind: 'attribute',
              xmlName: 'Type',
              cardinality: 'one',
            },
            'dsig:Transforms': {
              kind: 'element',
              xmlName: 'dsig:Transforms',
              namespace: 'http://www.w3.org/2000/09/xmldsig#',
              cardinality: 'one',
              nodeMeta: {
                qname: {
                  namespace: 'http://www.w3.org/2000/09/xmldsig#',
                  localName: 'Transforms',
                },
                fields: {
                  'dsig:Transform': {
                    kind: 'element',
                    xmlName: 'dsig:Transform',
                    namespace: 'http://www.w3.org/2000/09/xmldsig#',
                    cardinality: 'many',
                    nodeMeta: {
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
                  },
                },
              },
            },
            'dsig:DigestMethod': {
              kind: 'element',
              xmlName: 'dsig:DigestMethod',
              namespace: 'http://www.w3.org/2000/09/xmldsig#',
              cardinality: 'one',
              nodeMeta: {
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
            },
            'dsig:DigestValue': {
              kind: 'element',
              xmlName: 'dsig:DigestValue',
              namespace: 'http://www.w3.org/2000/09/xmldsig#',
              cardinality: 'one',
            },
          },
        },
      },
    },
  },
};
