/**
 * Static XmlMeta for create
 * Generated from: urn:ietf:params:xml:ns:contact-1.0
 *
 * @generated - Do not edit manually
 */

import type { XmlMeta } from './types';

export const ContactCreateMeta: XmlMeta = {
  strategyId: 'fxp-v1',
  root: {
    qname: {
      namespace: 'urn:ietf:params:xml:ns:contact-1.0',
      localName: 'create',
    },
    fields: {
      'contact:id': {
        kind: 'element',
        xmlName: 'contact:id',
        namespace: 'urn:ietf:params:xml:ns:contact-1.0',
        cardinality: 'one',
      },
      'contact:postalInfo': {
        kind: 'element',
        xmlName: 'contact:postalInfo',
        namespace: 'urn:ietf:params:xml:ns:contact-1.0',
        cardinality: 'many',
        nodeMeta: {
          qname: {
            namespace: 'urn:ietf:params:xml:ns:contact-1.0',
            localName: 'postalInfo',
          },
          fields: {
            type: {
              kind: 'attribute',
              xmlName: 'type',
              cardinality: 'one',
            },
            'contact:name': {
              kind: 'element',
              xmlName: 'contact:name',
              namespace: 'urn:ietf:params:xml:ns:contact-1.0',
              cardinality: 'one',
            },
            'contact:org': {
              kind: 'element',
              xmlName: 'contact:org',
              namespace: 'urn:ietf:params:xml:ns:contact-1.0',
              cardinality: 'one',
            },
            'contact:addr': {
              kind: 'element',
              xmlName: 'contact:addr',
              namespace: 'urn:ietf:params:xml:ns:contact-1.0',
              cardinality: 'one',
              nodeMeta: {
                qname: {
                  namespace: 'urn:ietf:params:xml:ns:contact-1.0',
                  localName: 'addr',
                },
                fields: {
                  'contact:street': {
                    kind: 'element',
                    xmlName: 'contact:street',
                    namespace: 'urn:ietf:params:xml:ns:contact-1.0',
                    cardinality: 'many',
                  },
                  'contact:city': {
                    kind: 'element',
                    xmlName: 'contact:city',
                    namespace: 'urn:ietf:params:xml:ns:contact-1.0',
                    cardinality: 'one',
                  },
                  'contact:sp': {
                    kind: 'element',
                    xmlName: 'contact:sp',
                    namespace: 'urn:ietf:params:xml:ns:contact-1.0',
                    cardinality: 'one',
                  },
                  'contact:pc': {
                    kind: 'element',
                    xmlName: 'contact:pc',
                    namespace: 'urn:ietf:params:xml:ns:contact-1.0',
                    cardinality: 'one',
                  },
                  'contact:cc': {
                    kind: 'element',
                    xmlName: 'contact:cc',
                    namespace: 'urn:ietf:params:xml:ns:contact-1.0',
                    cardinality: 'one',
                  },
                },
              },
            },
          },
        },
      },
      'contact:voice': {
        kind: 'element',
        xmlName: 'contact:voice',
        namespace: 'urn:ietf:params:xml:ns:contact-1.0',
        cardinality: 'one',
        nodeMeta: {
          qname: {
            namespace: 'urn:ietf:params:xml:ns:contact-1.0',
            localName: 'voice',
          },
          fields: {
            x: {
              kind: 'attribute',
              xmlName: 'x',
              cardinality: 'one',
            },
          },
        },
      },
      'contact:fax': {
        kind: 'element',
        xmlName: 'contact:fax',
        namespace: 'urn:ietf:params:xml:ns:contact-1.0',
        cardinality: 'one',
        nodeMeta: {
          qname: {
            namespace: 'urn:ietf:params:xml:ns:contact-1.0',
            localName: 'fax',
          },
          fields: {
            x: {
              kind: 'attribute',
              xmlName: 'x',
              cardinality: 'one',
            },
          },
        },
      },
      'contact:email': {
        kind: 'element',
        xmlName: 'contact:email',
        namespace: 'urn:ietf:params:xml:ns:contact-1.0',
        cardinality: 'one',
      },
      'contact:authInfo': {
        kind: 'element',
        xmlName: 'contact:authInfo',
        namespace: 'urn:ietf:params:xml:ns:contact-1.0',
        cardinality: 'one',
        nodeMeta: {
          qname: {
            namespace: 'urn:ietf:params:xml:ns:contact-1.0',
            localName: 'authInfo',
          },
          fields: {
            'contact:pw': {
              kind: 'element',
              xmlName: 'contact:pw',
              namespace: 'urn:ietf:params:xml:ns:contact-1.0',
              cardinality: 'one',
              nodeMeta: {
                qname: {
                  namespace: 'urn:ietf:params:xml:ns:contact-1.0',
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
            'contact:ext': {
              kind: 'element',
              xmlName: 'contact:ext',
              namespace: 'urn:ietf:params:xml:ns:contact-1.0',
              cardinality: 'one',
              nodeMeta: {
                qname: {
                  namespace: 'urn:ietf:params:xml:ns:contact-1.0',
                  localName: 'ext',
                },
                fields: {},
              },
            },
          },
        },
      },
      'contact:disclose': {
        kind: 'element',
        xmlName: 'contact:disclose',
        namespace: 'urn:ietf:params:xml:ns:contact-1.0',
        cardinality: 'one',
        nodeMeta: {
          qname: {
            namespace: 'urn:ietf:params:xml:ns:contact-1.0',
            localName: 'disclose',
          },
          fields: {
            flag: {
              kind: 'attribute',
              xmlName: 'flag',
              cardinality: 'one',
            },
            'contact:name': {
              kind: 'element',
              xmlName: 'contact:name',
              namespace: 'urn:ietf:params:xml:ns:contact-1.0',
              cardinality: 'many',
              nodeMeta: {
                qname: {
                  namespace: 'urn:ietf:params:xml:ns:contact-1.0',
                  localName: 'name',
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
            'contact:org': {
              kind: 'element',
              xmlName: 'contact:org',
              namespace: 'urn:ietf:params:xml:ns:contact-1.0',
              cardinality: 'many',
              nodeMeta: {
                qname: {
                  namespace: 'urn:ietf:params:xml:ns:contact-1.0',
                  localName: 'org',
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
            'contact:addr': {
              kind: 'element',
              xmlName: 'contact:addr',
              namespace: 'urn:ietf:params:xml:ns:contact-1.0',
              cardinality: 'many',
              nodeMeta: {
                qname: {
                  namespace: 'urn:ietf:params:xml:ns:contact-1.0',
                  localName: 'addr',
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
            'contact:voice': {
              kind: 'element',
              xmlName: 'contact:voice',
              namespace: 'urn:ietf:params:xml:ns:contact-1.0',
              cardinality: 'one',
            },
            'contact:fax': {
              kind: 'element',
              xmlName: 'contact:fax',
              namespace: 'urn:ietf:params:xml:ns:contact-1.0',
              cardinality: 'one',
            },
            'contact:email': {
              kind: 'element',
              xmlName: 'contact:email',
              namespace: 'urn:ietf:params:xml:ns:contact-1.0',
              cardinality: 'one',
            },
          },
        },
      },
    },
  },
};
