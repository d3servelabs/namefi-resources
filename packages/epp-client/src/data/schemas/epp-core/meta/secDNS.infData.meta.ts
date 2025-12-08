/**
 * Static XmlMeta for infData
 * Generated from: urn:ietf:params:xml:ns:secDNS-1.1
 *
 * @generated - Do not edit manually
 */

import type { XmlMeta } from './types';

export const SecDNSInfDataMeta: XmlMeta = {
  strategyId: 'fxp-v1',
  root: {
    qname: {
      namespace: 'urn:ietf:params:xml:ns:secDNS-1.1',
      localName: 'infData',
    },
    fields: {
      'secDNS:maxSigLife': {
        kind: 'element',
        xmlName: 'secDNS:maxSigLife',
        namespace: 'urn:ietf:params:xml:ns:secDNS-1.1',
        cardinality: 'one',
      },
      'secDNS:dsData': {
        kind: 'element',
        xmlName: 'secDNS:dsData',
        namespace: 'urn:ietf:params:xml:ns:secDNS-1.1',
        cardinality: 'many',
        nodeMeta: {
          qname: {
            namespace: 'urn:ietf:params:xml:ns:secDNS-1.1',
            localName: 'dsData',
          },
          fields: {
            'secDNS:keyTag': {
              kind: 'element',
              xmlName: 'secDNS:keyTag',
              namespace: 'urn:ietf:params:xml:ns:secDNS-1.1',
              cardinality: 'one',
            },
            'secDNS:alg': {
              kind: 'element',
              xmlName: 'secDNS:alg',
              namespace: 'urn:ietf:params:xml:ns:secDNS-1.1',
              cardinality: 'one',
            },
            'secDNS:digestType': {
              kind: 'element',
              xmlName: 'secDNS:digestType',
              namespace: 'urn:ietf:params:xml:ns:secDNS-1.1',
              cardinality: 'one',
            },
            'secDNS:digest': {
              kind: 'element',
              xmlName: 'secDNS:digest',
              namespace: 'urn:ietf:params:xml:ns:secDNS-1.1',
              cardinality: 'one',
            },
            'secDNS:keyData': {
              kind: 'element',
              xmlName: 'secDNS:keyData',
              namespace: 'urn:ietf:params:xml:ns:secDNS-1.1',
              cardinality: 'one',
              nodeMeta: {
                qname: {
                  namespace: 'urn:ietf:params:xml:ns:secDNS-1.1',
                  localName: 'keyData',
                },
                fields: {
                  'secDNS:flags': {
                    kind: 'element',
                    xmlName: 'secDNS:flags',
                    namespace: 'urn:ietf:params:xml:ns:secDNS-1.1',
                    cardinality: 'one',
                  },
                  'secDNS:protocol': {
                    kind: 'element',
                    xmlName: 'secDNS:protocol',
                    namespace: 'urn:ietf:params:xml:ns:secDNS-1.1',
                    cardinality: 'one',
                  },
                  'secDNS:alg': {
                    kind: 'element',
                    xmlName: 'secDNS:alg',
                    namespace: 'urn:ietf:params:xml:ns:secDNS-1.1',
                    cardinality: 'one',
                  },
                  'secDNS:pubKey': {
                    kind: 'element',
                    xmlName: 'secDNS:pubKey',
                    namespace: 'urn:ietf:params:xml:ns:secDNS-1.1',
                    cardinality: 'one',
                  },
                },
              },
            },
          },
        },
      },
      'secDNS:keyData': {
        kind: 'element',
        xmlName: 'secDNS:keyData',
        namespace: 'urn:ietf:params:xml:ns:secDNS-1.1',
        cardinality: 'many',
        nodeMeta: {
          qname: {
            namespace: 'urn:ietf:params:xml:ns:secDNS-1.1',
            localName: 'keyData',
          },
          fields: {
            'secDNS:flags': {
              kind: 'element',
              xmlName: 'secDNS:flags',
              namespace: 'urn:ietf:params:xml:ns:secDNS-1.1',
              cardinality: 'one',
            },
            'secDNS:protocol': {
              kind: 'element',
              xmlName: 'secDNS:protocol',
              namespace: 'urn:ietf:params:xml:ns:secDNS-1.1',
              cardinality: 'one',
            },
            'secDNS:alg': {
              kind: 'element',
              xmlName: 'secDNS:alg',
              namespace: 'urn:ietf:params:xml:ns:secDNS-1.1',
              cardinality: 'one',
            },
            'secDNS:pubKey': {
              kind: 'element',
              xmlName: 'secDNS:pubKey',
              namespace: 'urn:ietf:params:xml:ns:secDNS-1.1',
              cardinality: 'one',
            },
          },
        },
      },
    },
  },
};
