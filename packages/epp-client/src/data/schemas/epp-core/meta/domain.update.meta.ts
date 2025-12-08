/**
 * Static XmlMeta for update
 * Generated from: urn:ietf:params:xml:ns:domain-1.0
 *
 * @generated - Do not edit manually
 */

import type { XmlMeta } from './types';

export const DomainUpdateMeta: XmlMeta = {
  strategyId: 'fxp-v1',
  root: {
    qname: {
      namespace: 'urn:ietf:params:xml:ns:domain-1.0',
      localName: 'update',
    },
    fields: {
      'domain:name': {
        kind: 'element',
        xmlName: 'domain:name',
        namespace: 'urn:ietf:params:xml:ns:domain-1.0',
        cardinality: 'one',
      },
      'domain:add': {
        kind: 'element',
        xmlName: 'domain:add',
        namespace: 'urn:ietf:params:xml:ns:domain-1.0',
        cardinality: 'one',
        nodeMeta: {
          qname: {
            namespace: 'urn:ietf:params:xml:ns:domain-1.0',
            localName: 'add',
          },
          fields: {
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
          },
        },
      },
      'domain:rem': {
        kind: 'element',
        xmlName: 'domain:rem',
        namespace: 'urn:ietf:params:xml:ns:domain-1.0',
        cardinality: 'one',
        nodeMeta: {
          qname: {
            namespace: 'urn:ietf:params:xml:ns:domain-1.0',
            localName: 'rem',
          },
          fields: {
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
          },
        },
      },
      'domain:chg': {
        kind: 'element',
        xmlName: 'domain:chg',
        namespace: 'urn:ietf:params:xml:ns:domain-1.0',
        cardinality: 'one',
        nodeMeta: {
          qname: {
            namespace: 'urn:ietf:params:xml:ns:domain-1.0',
            localName: 'chg',
          },
          fields: {
            'domain:registrant': {
              kind: 'element',
              xmlName: 'domain:registrant',
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
                  'domain:null': {
                    kind: 'element',
                    xmlName: 'domain:null',
                    namespace: 'urn:ietf:params:xml:ns:domain-1.0',
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
