/**
 * Static XmlMeta for infData
 * Generated from: urn:ietf:params:xml:ns:domain-1.0
 *
 * @generated - Do not edit manually
 */

import type { XmlMeta } from './types';

export const DomainInfDataMeta: XmlMeta = {
  strategyId: 'fxp-v1',
  root: {
    qname: {
      namespace: 'urn:ietf:params:xml:ns:domain-1.0',
      localName: 'infData',
    },
    fields: {
      'domain:name': {
        kind: 'element',
        xmlName: 'domain:name',
        namespace: 'urn:ietf:params:xml:ns:domain-1.0',
        cardinality: 'one',
      },
      'domain:roid': {
        kind: 'element',
        xmlName: 'domain:roid',
        namespace: 'urn:ietf:params:xml:ns:domain-1.0',
        cardinality: 'one',
      },
      'domain:status': {
        kind: 'element',
        xmlName: 'domain:status',
        namespace: 'urn:ietf:params:xml:ns:domain-1.0',
        cardinality: 'many',
        nodeMeta: {
          qname: {
            namespace: 'urn:ietf:params:xml:ns:domain-1.0',
            localName: 'status',
          },
          fields: {
            s: {
              kind: 'attribute',
              xmlName: 's',
              cardinality: 'one',
            },
            lang: {
              kind: 'attribute',
              xmlName: 'lang',
              cardinality: 'one',
            },
          },
        },
      },
      'domain:registrant': {
        kind: 'element',
        xmlName: 'domain:registrant',
        namespace: 'urn:ietf:params:xml:ns:domain-1.0',
        cardinality: 'one',
      },
      'domain:contact': {
        kind: 'element',
        xmlName: 'domain:contact',
        namespace: 'urn:ietf:params:xml:ns:domain-1.0',
        cardinality: 'many',
        nodeMeta: {
          qname: {
            namespace: 'urn:ietf:params:xml:ns:domain-1.0',
            localName: 'contact',
          },
          fields: {
            type: {
              kind: 'attribute',
              xmlName: 'type',
              cardinality: 'one',
            },
          },
        },
      },
      'domain:ns': {
        kind: 'element',
        xmlName: 'domain:ns',
        namespace: 'urn:ietf:params:xml:ns:domain-1.0',
        cardinality: 'one',
        nodeMeta: {
          qname: {
            namespace: 'urn:ietf:params:xml:ns:domain-1.0',
            localName: 'ns',
          },
          fields: {
            'domain:hostObj': {
              kind: 'element',
              xmlName: 'domain:hostObj',
              namespace: 'urn:ietf:params:xml:ns:domain-1.0',
              cardinality: 'many',
            },
            'domain:hostAttr': {
              kind: 'element',
              xmlName: 'domain:hostAttr',
              namespace: 'urn:ietf:params:xml:ns:domain-1.0',
              cardinality: 'many',
              nodeMeta: {
                qname: {
                  namespace: 'urn:ietf:params:xml:ns:domain-1.0',
                  localName: 'hostAttr',
                },
                fields: {
                  'domain:hostName': {
                    kind: 'element',
                    xmlName: 'domain:hostName',
                    namespace: 'urn:ietf:params:xml:ns:domain-1.0',
                    cardinality: 'one',
                  },
                  'domain:hostAddr': {
                    kind: 'element',
                    xmlName: 'domain:hostAddr',
                    namespace: 'urn:ietf:params:xml:ns:domain-1.0',
                    cardinality: 'many',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:domain-1.0',
                        localName: 'hostAddr',
                      },
                      fields: {
                        ip: {
                          kind: 'attribute',
                          xmlName: 'ip',
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
      },
      'domain:host': {
        kind: 'element',
        xmlName: 'domain:host',
        namespace: 'urn:ietf:params:xml:ns:domain-1.0',
        cardinality: 'many',
      },
      'domain:clID': {
        kind: 'element',
        xmlName: 'domain:clID',
        namespace: 'urn:ietf:params:xml:ns:domain-1.0',
        cardinality: 'one',
      },
      'domain:crID': {
        kind: 'element',
        xmlName: 'domain:crID',
        namespace: 'urn:ietf:params:xml:ns:domain-1.0',
        cardinality: 'one',
      },
      'domain:crDate': {
        kind: 'element',
        xmlName: 'domain:crDate',
        namespace: 'urn:ietf:params:xml:ns:domain-1.0',
        cardinality: 'one',
      },
      'domain:upID': {
        kind: 'element',
        xmlName: 'domain:upID',
        namespace: 'urn:ietf:params:xml:ns:domain-1.0',
        cardinality: 'one',
      },
      'domain:upDate': {
        kind: 'element',
        xmlName: 'domain:upDate',
        namespace: 'urn:ietf:params:xml:ns:domain-1.0',
        cardinality: 'one',
      },
      'domain:exDate': {
        kind: 'element',
        xmlName: 'domain:exDate',
        namespace: 'urn:ietf:params:xml:ns:domain-1.0',
        cardinality: 'one',
      },
      'domain:trDate': {
        kind: 'element',
        xmlName: 'domain:trDate',
        namespace: 'urn:ietf:params:xml:ns:domain-1.0',
        cardinality: 'one',
      },
      'domain:authInfo': {
        kind: 'element',
        xmlName: 'domain:authInfo',
        namespace: 'urn:ietf:params:xml:ns:domain-1.0',
        cardinality: 'one',
        nodeMeta: {
          qname: {
            namespace: 'urn:ietf:params:xml:ns:domain-1.0',
            localName: 'authInfo',
          },
          fields: {
            'domain:pw': {
              kind: 'element',
              xmlName: 'domain:pw',
              namespace: 'urn:ietf:params:xml:ns:domain-1.0',
              cardinality: 'one',
              nodeMeta: {
                qname: {
                  namespace: 'urn:ietf:params:xml:ns:domain-1.0',
                  localName: 'pw',
                },
                fields: {
                  roid: {
                    kind: 'attribute',
                    xmlName: 'roid',
                    cardinality: 'one',
                  },
                },
              },
            },
            'domain:ext': {
              kind: 'element',
              xmlName: 'domain:ext',
              namespace: 'urn:ietf:params:xml:ns:domain-1.0',
              cardinality: 'one',
              nodeMeta: {
                qname: {
                  namespace: 'urn:ietf:params:xml:ns:domain-1.0',
                  localName: 'ext',
                },
                fields: {},
              },
            },
          },
        },
      },
    },
  },
};
