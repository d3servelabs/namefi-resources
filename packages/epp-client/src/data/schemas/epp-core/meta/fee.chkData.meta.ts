/**
 * Static XmlMeta for chkData
 * Generated from: urn:ietf:params:xml:ns:epp:fee-1.0
 *
 * @generated - Do not edit manually
 */

import type { XmlMeta } from './types';

export const FeeChkDataMeta: XmlMeta = {
  strategyId: 'fxp-v1',
  root: {
    qname: {
      namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
      localName: 'chkData',
    },
    fields: {
      'fee:currency': {
        kind: 'element',
        xmlName: 'fee:currency',
        namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
        cardinality: 'one',
      },
      'fee:cd': {
        kind: 'element',
        xmlName: 'fee:cd',
        namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
        cardinality: 'many',
        nodeMeta: {
          qname: {
            namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
            localName: 'cd',
          },
          fields: {
            avail: {
              kind: 'attribute',
              xmlName: 'avail',
              cardinality: 'one',
            },
            'fee:objID': {
              kind: 'element',
              xmlName: 'fee:objID',
              namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
              cardinality: 'one',
              nodeMeta: {
                qname: {
                  namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                  localName: 'objID',
                },
                fields: {
                  element: {
                    kind: 'attribute',
                    xmlName: 'element',
                    cardinality: 'one',
                  },
                },
              },
            },
            'fee:class': {
              kind: 'element',
              xmlName: 'fee:class',
              namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
              cardinality: 'one',
            },
            'fee:command': {
              kind: 'element',
              xmlName: 'fee:command',
              namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
              cardinality: 'many',
              nodeMeta: {
                qname: {
                  namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                  localName: 'command',
                },
                fields: {
                  standard: {
                    kind: 'attribute',
                    xmlName: 'standard',
                    cardinality: 'one',
                  },
                  'fee:fee': {
                    kind: 'element',
                    xmlName: 'fee:fee',
                    namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                    cardinality: 'many',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                        localName: 'fee',
                      },
                      fields: {
                        description: {
                          kind: 'attribute',
                          xmlName: 'description',
                          cardinality: 'one',
                        },
                        lang: {
                          kind: 'attribute',
                          xmlName: 'lang',
                          cardinality: 'one',
                        },
                        refundable: {
                          kind: 'attribute',
                          xmlName: 'refundable',
                          cardinality: 'one',
                        },
                        'grace-period': {
                          kind: 'attribute',
                          xmlName: 'grace-period',
                          cardinality: 'one',
                        },
                        applied: {
                          kind: 'attribute',
                          xmlName: 'applied',
                          cardinality: 'one',
                        },
                      },
                    },
                  },
                  'fee:credit': {
                    kind: 'element',
                    xmlName: 'fee:credit',
                    namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                    cardinality: 'many',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                        localName: 'credit',
                      },
                      fields: {
                        description: {
                          kind: 'attribute',
                          xmlName: 'description',
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
                  'fee:reason': {
                    kind: 'element',
                    xmlName: 'fee:reason',
                    namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                        localName: 'reason',
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
                },
              },
            },
            'fee:reason': {
              kind: 'element',
              xmlName: 'fee:reason',
              namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
              cardinality: 'one',
              nodeMeta: {
                qname: {
                  namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                  localName: 'reason',
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
          },
        },
      },
    },
  },
};
