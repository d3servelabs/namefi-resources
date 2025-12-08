/**
 * Static XmlMeta for RetrievalMethod
 * Generated from: http://www.w3.org/2000/09/xmldsig#
 *
 * @generated - Do not edit manually
 */

import type { XmlMeta } from './types';

export const DsigRetrievalMethodMeta: XmlMeta = {
  strategyId: 'fxp-v1',
  root: {
    qname: {
      namespace: 'http://www.w3.org/2000/09/xmldsig#',
      localName: 'RetrievalMethod',
    },
    fields: {
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
    },
  },
};
