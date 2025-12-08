/**
 * Static XmlMeta for update
 * Generated from: urn:ietf:params:xml:ns:rgp-1.0
 *
 * @generated - Do not edit manually
 */

import type { XmlMeta } from './types';

export const RgpUpdateMeta: XmlMeta = {
  strategyId: 'fxp-v1',
  root: {
    qname: { namespace: 'urn:ietf:params:xml:ns:rgp-1.0', localName: 'update' },
    fields: {
      'rgp:restore': {
        kind: 'element',
        xmlName: 'rgp:restore',
        namespace: 'urn:ietf:params:xml:ns:rgp-1.0',
        cardinality: 'one',
        nodeMeta: {
          qname: {
            namespace: 'urn:ietf:params:xml:ns:rgp-1.0',
            localName: 'restore',
          },
          fields: {
            op: {
              kind: 'attribute',
              xmlName: 'op',
              cardinality: 'one',
            },
            'rgp:report': {
              kind: 'element',
              xmlName: 'rgp:report',
              namespace: 'urn:ietf:params:xml:ns:rgp-1.0',
              cardinality: 'one',
              nodeMeta: {
                qname: {
                  namespace: 'urn:ietf:params:xml:ns:rgp-1.0',
                  localName: 'report',
                },
                fields: {
                  'rgp:preData': {
                    kind: 'element',
                    xmlName: 'rgp:preData',
                    namespace: 'urn:ietf:params:xml:ns:rgp-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:rgp-1.0',
                        localName: 'preData',
                      },
                      fields: {},
                    },
                  },
                  'rgp:postData': {
                    kind: 'element',
                    xmlName: 'rgp:postData',
                    namespace: 'urn:ietf:params:xml:ns:rgp-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:rgp-1.0',
                        localName: 'postData',
                      },
                      fields: {},
                    },
                  },
                  'rgp:delTime': {
                    kind: 'element',
                    xmlName: 'rgp:delTime',
                    namespace: 'urn:ietf:params:xml:ns:rgp-1.0',
                    cardinality: 'one',
                  },
                  'rgp:resTime': {
                    kind: 'element',
                    xmlName: 'rgp:resTime',
                    namespace: 'urn:ietf:params:xml:ns:rgp-1.0',
                    cardinality: 'one',
                  },
                  'rgp:resReason': {
                    kind: 'element',
                    xmlName: 'rgp:resReason',
                    namespace: 'urn:ietf:params:xml:ns:rgp-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:rgp-1.0',
                        localName: 'resReason',
                      },
                      fields: {
                        lang: {
                          kind: 'attribute',
                          xmlName: 'lang',
                          cardinality: 'one',
                        },
                      },
                    },
                  },
                  'rgp:statement': {
                    kind: 'element',
                    xmlName: 'rgp:statement',
                    namespace: 'urn:ietf:params:xml:ns:rgp-1.0',
                    cardinality: 'many',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:rgp-1.0',
                        localName: 'statement',
                      },
                      fields: {
                        lang: {
                          kind: 'attribute',
                          xmlName: 'lang',
                          cardinality: 'one',
                        },
                      },
                    },
                  },
                  'rgp:other': {
                    kind: 'element',
                    xmlName: 'rgp:other',
                    namespace: 'urn:ietf:params:xml:ns:rgp-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:rgp-1.0',
                        localName: 'other',
                      },
                      fields: {},
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
};
