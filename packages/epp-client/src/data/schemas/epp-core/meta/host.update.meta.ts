/**
 * Static XmlMeta for update
 * Generated from: urn:ietf:params:xml:ns:host-1.0
 *
 * @generated - Do not edit manually
 */

import type { XmlMeta } from './types';

export const HostUpdateMeta: XmlMeta = {
  strategyId: 'fxp-v1',
  root: {
    qname: {
      namespace: 'urn:ietf:params:xml:ns:host-1.0',
      localName: 'update',
    },
    fields: {
      'host:name': {
        kind: 'element',
        xmlName: 'host:name',
        namespace: 'urn:ietf:params:xml:ns:host-1.0',
        cardinality: 'one',
      },
      'host:add': {
        kind: 'element',
        xmlName: 'host:add',
        namespace: 'urn:ietf:params:xml:ns:host-1.0',
        cardinality: 'one',
        nodeMeta: {
          qname: {
            namespace: 'urn:ietf:params:xml:ns:host-1.0',
            localName: 'add',
          },
          fields: {
            'host:addr': {
              kind: 'element',
              xmlName: 'host:addr',
              namespace: 'urn:ietf:params:xml:ns:host-1.0',
              cardinality: 'many',
              nodeMeta: {
                qname: {
                  namespace: 'urn:ietf:params:xml:ns:host-1.0',
                  localName: 'addr',
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
            'host:status': {
              kind: 'element',
              xmlName: 'host:status',
              namespace: 'urn:ietf:params:xml:ns:host-1.0',
              cardinality: 'many',
              nodeMeta: {
                qname: {
                  namespace: 'urn:ietf:params:xml:ns:host-1.0',
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
          },
        },
      },
      'host:rem': {
        kind: 'element',
        xmlName: 'host:rem',
        namespace: 'urn:ietf:params:xml:ns:host-1.0',
        cardinality: 'one',
        nodeMeta: {
          qname: {
            namespace: 'urn:ietf:params:xml:ns:host-1.0',
            localName: 'rem',
          },
          fields: {
            'host:addr': {
              kind: 'element',
              xmlName: 'host:addr',
              namespace: 'urn:ietf:params:xml:ns:host-1.0',
              cardinality: 'many',
              nodeMeta: {
                qname: {
                  namespace: 'urn:ietf:params:xml:ns:host-1.0',
                  localName: 'addr',
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
            'host:status': {
              kind: 'element',
              xmlName: 'host:status',
              namespace: 'urn:ietf:params:xml:ns:host-1.0',
              cardinality: 'many',
              nodeMeta: {
                qname: {
                  namespace: 'urn:ietf:params:xml:ns:host-1.0',
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
          },
        },
      },
      'host:chg': {
        kind: 'element',
        xmlName: 'host:chg',
        namespace: 'urn:ietf:params:xml:ns:host-1.0',
        cardinality: 'one',
        nodeMeta: {
          qname: {
            namespace: 'urn:ietf:params:xml:ns:host-1.0',
            localName: 'chg',
          },
          fields: {
            'host:name': {
              kind: 'element',
              xmlName: 'host:name',
              namespace: 'urn:ietf:params:xml:ns:host-1.0',
              cardinality: 'one',
            },
          },
        },
      },
    },
  },
};
