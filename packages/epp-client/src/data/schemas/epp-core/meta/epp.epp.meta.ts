/**
 * Static XmlMeta for epp
 * Generated from: urn:ietf:params:xml:ns:epp-1.0
 *
 * @generated - Do not edit manually
 */

import type { XmlMeta } from './types';

export const EppEppMeta: XmlMeta = {
  strategyId: 'fxp-v1',
  root: {
    qname: { namespace: 'urn:ietf:params:xml:ns:epp-1.0', localName: 'epp' },
    fields: {
      'epp:greeting': {
        kind: 'element',
        xmlName: 'epp:greeting',
        namespace: 'urn:ietf:params:xml:ns:epp-1.0',
        cardinality: 'one',
        nodeMeta: {
          qname: {
            namespace: 'urn:ietf:params:xml:ns:epp-1.0',
            localName: 'greeting',
          },
          fields: {
            'epp:svID': {
              kind: 'element',
              xmlName: 'epp:svID',
              namespace: 'urn:ietf:params:xml:ns:epp-1.0',
              cardinality: 'one',
            },
            'epp:svDate': {
              kind: 'element',
              xmlName: 'epp:svDate',
              namespace: 'urn:ietf:params:xml:ns:epp-1.0',
              cardinality: 'one',
            },
            'epp:svcMenu': {
              kind: 'element',
              xmlName: 'epp:svcMenu',
              namespace: 'urn:ietf:params:xml:ns:epp-1.0',
              cardinality: 'one',
              nodeMeta: {
                qname: {
                  namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                  localName: 'svcMenu',
                },
                fields: {
                  'epp:version': {
                    kind: 'element',
                    xmlName: 'epp:version',
                    namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                    cardinality: 'many',
                  },
                  'epp:lang': {
                    kind: 'element',
                    xmlName: 'epp:lang',
                    namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                    cardinality: 'many',
                  },
                  'epp:objURI': {
                    kind: 'element',
                    xmlName: 'epp:objURI',
                    namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                    cardinality: 'many',
                  },
                  'epp:svcExtension': {
                    kind: 'element',
                    xmlName: 'epp:svcExtension',
                    namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                        localName: 'svcExtension',
                      },
                      fields: {
                        'epp:extURI': {
                          kind: 'element',
                          xmlName: 'epp:extURI',
                          namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                          cardinality: 'many',
                        },
                      },
                    },
                  },
                },
              },
            },
            'epp:dcp': {
              kind: 'element',
              xmlName: 'epp:dcp',
              namespace: 'urn:ietf:params:xml:ns:epp-1.0',
              cardinality: 'one',
              nodeMeta: {
                qname: {
                  namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                  localName: 'dcp',
                },
                fields: {
                  'epp:access': {
                    kind: 'element',
                    xmlName: 'epp:access',
                    namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                        localName: 'access',
                      },
                      fields: {
                        'epp:all': {
                          kind: 'element',
                          xmlName: 'epp:all',
                          namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                          cardinality: 'one',
                        },
                        'epp:none': {
                          kind: 'element',
                          xmlName: 'epp:none',
                          namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                          cardinality: 'one',
                        },
                        'epp:null': {
                          kind: 'element',
                          xmlName: 'epp:null',
                          namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                          cardinality: 'one',
                        },
                        'epp:other': {
                          kind: 'element',
                          xmlName: 'epp:other',
                          namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                          cardinality: 'one',
                        },
                        'epp:personal': {
                          kind: 'element',
                          xmlName: 'epp:personal',
                          namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                          cardinality: 'one',
                        },
                        'epp:personalAndOther': {
                          kind: 'element',
                          xmlName: 'epp:personalAndOther',
                          namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                          cardinality: 'one',
                        },
                      },
                    },
                  },
                  'epp:statement': {
                    kind: 'element',
                    xmlName: 'epp:statement',
                    namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                    cardinality: 'many',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                        localName: 'statement',
                      },
                      fields: {
                        'epp:purpose': {
                          kind: 'element',
                          xmlName: 'epp:purpose',
                          namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                          cardinality: 'one',
                          nodeMeta: {
                            qname: {
                              namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                              localName: 'purpose',
                            },
                            fields: {
                              'epp:admin': {
                                kind: 'element',
                                xmlName: 'epp:admin',
                                namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                                cardinality: 'one',
                              },
                              'epp:contact': {
                                kind: 'element',
                                xmlName: 'epp:contact',
                                namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                                cardinality: 'one',
                              },
                              'epp:other': {
                                kind: 'element',
                                xmlName: 'epp:other',
                                namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                                cardinality: 'one',
                              },
                              'epp:prov': {
                                kind: 'element',
                                xmlName: 'epp:prov',
                                namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                                cardinality: 'one',
                              },
                            },
                          },
                        },
                        'epp:recipient': {
                          kind: 'element',
                          xmlName: 'epp:recipient',
                          namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                          cardinality: 'one',
                          nodeMeta: {
                            qname: {
                              namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                              localName: 'recipient',
                            },
                            fields: {
                              'epp:other': {
                                kind: 'element',
                                xmlName: 'epp:other',
                                namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                                cardinality: 'one',
                              },
                              'epp:ours': {
                                kind: 'element',
                                xmlName: 'epp:ours',
                                namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                                cardinality: 'many',
                                nodeMeta: {
                                  qname: {
                                    namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                                    localName: 'ours',
                                  },
                                  fields: {
                                    'epp:recDesc': {
                                      kind: 'element',
                                      xmlName: 'epp:recDesc',
                                      namespace:
                                        'urn:ietf:params:xml:ns:epp-1.0',
                                      cardinality: 'one',
                                    },
                                  },
                                },
                              },
                              'epp:public': {
                                kind: 'element',
                                xmlName: 'epp:public',
                                namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                                cardinality: 'one',
                              },
                              'epp:same': {
                                kind: 'element',
                                xmlName: 'epp:same',
                                namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                                cardinality: 'one',
                              },
                              'epp:unrelated': {
                                kind: 'element',
                                xmlName: 'epp:unrelated',
                                namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                                cardinality: 'one',
                              },
                            },
                          },
                        },
                        'epp:retention': {
                          kind: 'element',
                          xmlName: 'epp:retention',
                          namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                          cardinality: 'one',
                          nodeMeta: {
                            qname: {
                              namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                              localName: 'retention',
                            },
                            fields: {
                              'epp:business': {
                                kind: 'element',
                                xmlName: 'epp:business',
                                namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                                cardinality: 'one',
                              },
                              'epp:indefinite': {
                                kind: 'element',
                                xmlName: 'epp:indefinite',
                                namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                                cardinality: 'one',
                              },
                              'epp:legal': {
                                kind: 'element',
                                xmlName: 'epp:legal',
                                namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                                cardinality: 'one',
                              },
                              'epp:none': {
                                kind: 'element',
                                xmlName: 'epp:none',
                                namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                                cardinality: 'one',
                              },
                              'epp:stated': {
                                kind: 'element',
                                xmlName: 'epp:stated',
                                namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                                cardinality: 'one',
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                  'epp:expiry': {
                    kind: 'element',
                    xmlName: 'epp:expiry',
                    namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                        localName: 'expiry',
                      },
                      fields: {
                        'epp:absolute': {
                          kind: 'element',
                          xmlName: 'epp:absolute',
                          namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                          cardinality: 'one',
                        },
                        'epp:relative': {
                          kind: 'element',
                          xmlName: 'epp:relative',
                          namespace: 'urn:ietf:params:xml:ns:epp-1.0',
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
      'epp:hello': {
        kind: 'element',
        xmlName: 'epp:hello',
        namespace: 'urn:ietf:params:xml:ns:epp-1.0',
        cardinality: 'one',
      },
      'epp:command': {
        kind: 'element',
        xmlName: 'epp:command',
        namespace: 'urn:ietf:params:xml:ns:epp-1.0',
        cardinality: 'one',
        nodeMeta: {
          qname: {
            namespace: 'urn:ietf:params:xml:ns:epp-1.0',
            localName: 'command',
          },
          fields: {
            'epp:extension': {
              kind: 'element',
              xmlName: 'epp:extension',
              namespace: 'urn:ietf:params:xml:ns:epp-1.0',
              cardinality: 'one',
              nodeMeta: {
                qname: {
                  namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                  localName: 'extension',
                },
                fields: {
                  'fee:check': {
                    kind: 'element',
                    xmlName: 'fee:check',
                    namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                        localName: 'check',
                      },
                      fields: {
                        'fee:currency': {
                          kind: 'element',
                          xmlName: 'fee:currency',
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
                              name: {
                                kind: 'attribute',
                                xmlName: 'name',
                                cardinality: 'one',
                              },
                              customName: {
                                kind: 'attribute',
                                xmlName: 'customName',
                                cardinality: 'one',
                              },
                              phase: {
                                kind: 'attribute',
                                xmlName: 'phase',
                                cardinality: 'one',
                              },
                              subphase: {
                                kind: 'attribute',
                                xmlName: 'subphase',
                                cardinality: 'one',
                              },
                              'fee:period': {
                                kind: 'element',
                                xmlName: 'fee:period',
                                namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                                cardinality: 'one',
                                nodeMeta: {
                                  qname: {
                                    namespace:
                                      'urn:ietf:params:xml:ns:epp:fee-1.0',
                                    localName: 'period',
                                  },
                                  fields: {
                                    unit: {
                                      kind: 'attribute',
                                      xmlName: 'unit',
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
                  'fee:create': {
                    kind: 'element',
                    xmlName: 'fee:create',
                    namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                        localName: 'create',
                      },
                      fields: {
                        'fee:currency': {
                          kind: 'element',
                          xmlName: 'fee:currency',
                          namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
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
                      },
                    },
                  },
                  'fee:renew': {
                    kind: 'element',
                    xmlName: 'fee:renew',
                    namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                        localName: 'renew',
                      },
                      fields: {
                        'fee:currency': {
                          kind: 'element',
                          xmlName: 'fee:currency',
                          namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
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
                      },
                    },
                  },
                  'fee:transfer': {
                    kind: 'element',
                    xmlName: 'fee:transfer',
                    namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                        localName: 'transfer',
                      },
                      fields: {
                        'fee:currency': {
                          kind: 'element',
                          xmlName: 'fee:currency',
                          namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
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
                      },
                    },
                  },
                  'fee:update': {
                    kind: 'element',
                    xmlName: 'fee:update',
                    namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                        localName: 'update',
                      },
                      fields: {
                        'fee:currency': {
                          kind: 'element',
                          xmlName: 'fee:currency',
                          namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
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
                      },
                    },
                  },
                  'secDNS:create': {
                    kind: 'element',
                    xmlName: 'secDNS:create',
                    namespace: 'urn:ietf:params:xml:ns:secDNS-1.1',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:secDNS-1.1',
                        localName: 'create',
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
                                    namespace:
                                      'urn:ietf:params:xml:ns:secDNS-1.1',
                                    localName: 'keyData',
                                  },
                                  fields: {
                                    'secDNS:flags': {
                                      kind: 'element',
                                      xmlName: 'secDNS:flags',
                                      namespace:
                                        'urn:ietf:params:xml:ns:secDNS-1.1',
                                      cardinality: 'one',
                                    },
                                    'secDNS:protocol': {
                                      kind: 'element',
                                      xmlName: 'secDNS:protocol',
                                      namespace:
                                        'urn:ietf:params:xml:ns:secDNS-1.1',
                                      cardinality: 'one',
                                    },
                                    'secDNS:alg': {
                                      kind: 'element',
                                      xmlName: 'secDNS:alg',
                                      namespace:
                                        'urn:ietf:params:xml:ns:secDNS-1.1',
                                      cardinality: 'one',
                                    },
                                    'secDNS:pubKey': {
                                      kind: 'element',
                                      xmlName: 'secDNS:pubKey',
                                      namespace:
                                        'urn:ietf:params:xml:ns:secDNS-1.1',
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
                  },
                  'secDNS:update': {
                    kind: 'element',
                    xmlName: 'secDNS:update',
                    namespace: 'urn:ietf:params:xml:ns:secDNS-1.1',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:secDNS-1.1',
                        localName: 'update',
                      },
                      fields: {
                        urgent: {
                          kind: 'attribute',
                          xmlName: 'urgent',
                          cardinality: 'one',
                        },
                        'secDNS:rem': {
                          kind: 'element',
                          xmlName: 'secDNS:rem',
                          namespace: 'urn:ietf:params:xml:ns:secDNS-1.1',
                          cardinality: 'one',
                          nodeMeta: {
                            qname: {
                              namespace: 'urn:ietf:params:xml:ns:secDNS-1.1',
                              localName: 'rem',
                            },
                            fields: {
                              'secDNS:all': {
                                kind: 'element',
                                xmlName: 'secDNS:all',
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
                                    namespace:
                                      'urn:ietf:params:xml:ns:secDNS-1.1',
                                    localName: 'dsData',
                                  },
                                  fields: {
                                    'secDNS:keyTag': {
                                      kind: 'element',
                                      xmlName: 'secDNS:keyTag',
                                      namespace:
                                        'urn:ietf:params:xml:ns:secDNS-1.1',
                                      cardinality: 'one',
                                    },
                                    'secDNS:alg': {
                                      kind: 'element',
                                      xmlName: 'secDNS:alg',
                                      namespace:
                                        'urn:ietf:params:xml:ns:secDNS-1.1',
                                      cardinality: 'one',
                                    },
                                    'secDNS:digestType': {
                                      kind: 'element',
                                      xmlName: 'secDNS:digestType',
                                      namespace:
                                        'urn:ietf:params:xml:ns:secDNS-1.1',
                                      cardinality: 'one',
                                    },
                                    'secDNS:digest': {
                                      kind: 'element',
                                      xmlName: 'secDNS:digest',
                                      namespace:
                                        'urn:ietf:params:xml:ns:secDNS-1.1',
                                      cardinality: 'one',
                                    },
                                    'secDNS:keyData': {
                                      kind: 'element',
                                      xmlName: 'secDNS:keyData',
                                      namespace:
                                        'urn:ietf:params:xml:ns:secDNS-1.1',
                                      cardinality: 'one',
                                      nodeMeta: {
                                        qname: {
                                          namespace:
                                            'urn:ietf:params:xml:ns:secDNS-1.1',
                                          localName: 'keyData',
                                        },
                                        fields: {
                                          'secDNS:flags': {
                                            kind: 'element',
                                            xmlName: 'secDNS:flags',
                                            namespace:
                                              'urn:ietf:params:xml:ns:secDNS-1.1',
                                            cardinality: 'one',
                                          },
                                          'secDNS:protocol': {
                                            kind: 'element',
                                            xmlName: 'secDNS:protocol',
                                            namespace:
                                              'urn:ietf:params:xml:ns:secDNS-1.1',
                                            cardinality: 'one',
                                          },
                                          'secDNS:alg': {
                                            kind: 'element',
                                            xmlName: 'secDNS:alg',
                                            namespace:
                                              'urn:ietf:params:xml:ns:secDNS-1.1',
                                            cardinality: 'one',
                                          },
                                          'secDNS:pubKey': {
                                            kind: 'element',
                                            xmlName: 'secDNS:pubKey',
                                            namespace:
                                              'urn:ietf:params:xml:ns:secDNS-1.1',
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
                                    namespace:
                                      'urn:ietf:params:xml:ns:secDNS-1.1',
                                    localName: 'keyData',
                                  },
                                  fields: {
                                    'secDNS:flags': {
                                      kind: 'element',
                                      xmlName: 'secDNS:flags',
                                      namespace:
                                        'urn:ietf:params:xml:ns:secDNS-1.1',
                                      cardinality: 'one',
                                    },
                                    'secDNS:protocol': {
                                      kind: 'element',
                                      xmlName: 'secDNS:protocol',
                                      namespace:
                                        'urn:ietf:params:xml:ns:secDNS-1.1',
                                      cardinality: 'one',
                                    },
                                    'secDNS:alg': {
                                      kind: 'element',
                                      xmlName: 'secDNS:alg',
                                      namespace:
                                        'urn:ietf:params:xml:ns:secDNS-1.1',
                                      cardinality: 'one',
                                    },
                                    'secDNS:pubKey': {
                                      kind: 'element',
                                      xmlName: 'secDNS:pubKey',
                                      namespace:
                                        'urn:ietf:params:xml:ns:secDNS-1.1',
                                      cardinality: 'one',
                                    },
                                  },
                                },
                              },
                            },
                          },
                        },
                        'secDNS:add': {
                          kind: 'element',
                          xmlName: 'secDNS:add',
                          namespace: 'urn:ietf:params:xml:ns:secDNS-1.1',
                          cardinality: 'one',
                          nodeMeta: {
                            qname: {
                              namespace: 'urn:ietf:params:xml:ns:secDNS-1.1',
                              localName: 'add',
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
                                    namespace:
                                      'urn:ietf:params:xml:ns:secDNS-1.1',
                                    localName: 'dsData',
                                  },
                                  fields: {
                                    'secDNS:keyTag': {
                                      kind: 'element',
                                      xmlName: 'secDNS:keyTag',
                                      namespace:
                                        'urn:ietf:params:xml:ns:secDNS-1.1',
                                      cardinality: 'one',
                                    },
                                    'secDNS:alg': {
                                      kind: 'element',
                                      xmlName: 'secDNS:alg',
                                      namespace:
                                        'urn:ietf:params:xml:ns:secDNS-1.1',
                                      cardinality: 'one',
                                    },
                                    'secDNS:digestType': {
                                      kind: 'element',
                                      xmlName: 'secDNS:digestType',
                                      namespace:
                                        'urn:ietf:params:xml:ns:secDNS-1.1',
                                      cardinality: 'one',
                                    },
                                    'secDNS:digest': {
                                      kind: 'element',
                                      xmlName: 'secDNS:digest',
                                      namespace:
                                        'urn:ietf:params:xml:ns:secDNS-1.1',
                                      cardinality: 'one',
                                    },
                                    'secDNS:keyData': {
                                      kind: 'element',
                                      xmlName: 'secDNS:keyData',
                                      namespace:
                                        'urn:ietf:params:xml:ns:secDNS-1.1',
                                      cardinality: 'one',
                                      nodeMeta: {
                                        qname: {
                                          namespace:
                                            'urn:ietf:params:xml:ns:secDNS-1.1',
                                          localName: 'keyData',
                                        },
                                        fields: {
                                          'secDNS:flags': {
                                            kind: 'element',
                                            xmlName: 'secDNS:flags',
                                            namespace:
                                              'urn:ietf:params:xml:ns:secDNS-1.1',
                                            cardinality: 'one',
                                          },
                                          'secDNS:protocol': {
                                            kind: 'element',
                                            xmlName: 'secDNS:protocol',
                                            namespace:
                                              'urn:ietf:params:xml:ns:secDNS-1.1',
                                            cardinality: 'one',
                                          },
                                          'secDNS:alg': {
                                            kind: 'element',
                                            xmlName: 'secDNS:alg',
                                            namespace:
                                              'urn:ietf:params:xml:ns:secDNS-1.1',
                                            cardinality: 'one',
                                          },
                                          'secDNS:pubKey': {
                                            kind: 'element',
                                            xmlName: 'secDNS:pubKey',
                                            namespace:
                                              'urn:ietf:params:xml:ns:secDNS-1.1',
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
                                    namespace:
                                      'urn:ietf:params:xml:ns:secDNS-1.1',
                                    localName: 'keyData',
                                  },
                                  fields: {
                                    'secDNS:flags': {
                                      kind: 'element',
                                      xmlName: 'secDNS:flags',
                                      namespace:
                                        'urn:ietf:params:xml:ns:secDNS-1.1',
                                      cardinality: 'one',
                                    },
                                    'secDNS:protocol': {
                                      kind: 'element',
                                      xmlName: 'secDNS:protocol',
                                      namespace:
                                        'urn:ietf:params:xml:ns:secDNS-1.1',
                                      cardinality: 'one',
                                    },
                                    'secDNS:alg': {
                                      kind: 'element',
                                      xmlName: 'secDNS:alg',
                                      namespace:
                                        'urn:ietf:params:xml:ns:secDNS-1.1',
                                      cardinality: 'one',
                                    },
                                    'secDNS:pubKey': {
                                      kind: 'element',
                                      xmlName: 'secDNS:pubKey',
                                      namespace:
                                        'urn:ietf:params:xml:ns:secDNS-1.1',
                                      cardinality: 'one',
                                    },
                                  },
                                },
                              },
                            },
                          },
                        },
                        'secDNS:chg': {
                          kind: 'element',
                          xmlName: 'secDNS:chg',
                          namespace: 'urn:ietf:params:xml:ns:secDNS-1.1',
                          cardinality: 'one',
                          nodeMeta: {
                            qname: {
                              namespace: 'urn:ietf:params:xml:ns:secDNS-1.1',
                              localName: 'chg',
                            },
                            fields: {
                              'secDNS:maxSigLife': {
                                kind: 'element',
                                xmlName: 'secDNS:maxSigLife',
                                namespace: 'urn:ietf:params:xml:ns:secDNS-1.1',
                                cardinality: 'one',
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                  'epp:rgp:update': {
                    kind: 'element',
                    xmlName: 'epp:rgp:update',
                    namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                    cardinality: 'one',
                  },
                  'launch:check': {
                    kind: 'element',
                    xmlName: 'launch:check',
                    namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                        localName: 'check',
                      },
                      fields: {
                        type: {
                          kind: 'attribute',
                          xmlName: 'type',
                          cardinality: 'one',
                        },
                        'launch:phase': {
                          kind: 'element',
                          xmlName: 'launch:phase',
                          namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                          cardinality: 'one',
                          nodeMeta: {
                            qname: {
                              namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                              localName: 'phase',
                            },
                            fields: {
                              name: {
                                kind: 'attribute',
                                xmlName: 'name',
                                cardinality: 'one',
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                  'launch:info': {
                    kind: 'element',
                    xmlName: 'launch:info',
                    namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                        localName: 'info',
                      },
                      fields: {
                        includeMark: {
                          kind: 'attribute',
                          xmlName: 'includeMark',
                          cardinality: 'one',
                        },
                        'launch:phase': {
                          kind: 'element',
                          xmlName: 'launch:phase',
                          namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                          cardinality: 'one',
                          nodeMeta: {
                            qname: {
                              namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                              localName: 'phase',
                            },
                            fields: {
                              name: {
                                kind: 'attribute',
                                xmlName: 'name',
                                cardinality: 'one',
                              },
                            },
                          },
                        },
                        'launch:applicationID': {
                          kind: 'element',
                          xmlName: 'launch:applicationID',
                          namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                          cardinality: 'one',
                        },
                      },
                    },
                  },
                  'launch:create': {
                    kind: 'element',
                    xmlName: 'launch:create',
                    namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                        localName: 'create',
                      },
                      fields: {
                        type: {
                          kind: 'attribute',
                          xmlName: 'type',
                          cardinality: 'one',
                        },
                        'launch:phase': {
                          kind: 'element',
                          xmlName: 'launch:phase',
                          namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                          cardinality: 'one',
                          nodeMeta: {
                            qname: {
                              namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                              localName: 'phase',
                            },
                            fields: {
                              name: {
                                kind: 'attribute',
                                xmlName: 'name',
                                cardinality: 'one',
                              },
                            },
                          },
                        },
                        'launch:notice': {
                          kind: 'element',
                          xmlName: 'launch:notice',
                          namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                          cardinality: 'one',
                          nodeMeta: {
                            qname: {
                              namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                              localName: 'notice',
                            },
                            fields: {
                              'launch:noticeID': {
                                kind: 'element',
                                xmlName: 'launch:noticeID',
                                namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                                cardinality: 'one',
                                nodeMeta: {
                                  qname: {
                                    namespace:
                                      'urn:ietf:params:xml:ns:launch-1.0',
                                    localName: 'noticeID',
                                  },
                                  fields: {
                                    validatorID: {
                                      kind: 'attribute',
                                      xmlName: 'validatorID',
                                      cardinality: 'one',
                                    },
                                  },
                                },
                              },
                              'launch:notAfter': {
                                kind: 'element',
                                xmlName: 'launch:notAfter',
                                namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                                cardinality: 'one',
                              },
                              'launch:acceptedDate': {
                                kind: 'element',
                                xmlName: 'launch:acceptedDate',
                                namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                                cardinality: 'one',
                              },
                            },
                          },
                        },
                        'launch:codeMark': {
                          kind: 'element',
                          xmlName: 'launch:codeMark',
                          namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                          cardinality: 'many',
                          nodeMeta: {
                            qname: {
                              namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                              localName: 'codeMark',
                            },
                            fields: {
                              'launch:code': {
                                kind: 'element',
                                xmlName: 'launch:code',
                                namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                                cardinality: 'one',
                                nodeMeta: {
                                  qname: {
                                    namespace:
                                      'urn:ietf:params:xml:ns:launch-1.0',
                                    localName: 'code',
                                  },
                                  fields: {
                                    validatorID: {
                                      kind: 'attribute',
                                      xmlName: 'validatorID',
                                      cardinality: 'one',
                                    },
                                  },
                                },
                              },
                              'mark:abstractMark': {
                                kind: 'element',
                                xmlName: 'mark:abstractMark',
                                namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                                cardinality: 'one',
                                nodeMeta: {
                                  qname: {
                                    namespace:
                                      'urn:ietf:params:xml:ns:mark-1.0',
                                    localName: 'abstractMark',
                                  },
                                  fields: {},
                                },
                              },
                            },
                          },
                        },
                        'smd:abstractSignedMark': {
                          kind: 'element',
                          xmlName: 'smd:abstractSignedMark',
                          namespace: 'urn:ietf:params:xml:ns:signedMark-1.0',
                          cardinality: 'many',
                          nodeMeta: {
                            qname: {
                              namespace:
                                'urn:ietf:params:xml:ns:signedMark-1.0',
                              localName: 'abstractSignedMark',
                            },
                            fields: {},
                          },
                        },
                        'smd:encodedSignedMark': {
                          kind: 'element',
                          xmlName: 'smd:encodedSignedMark',
                          namespace: 'urn:ietf:params:xml:ns:signedMark-1.0',
                          cardinality: 'many',
                          nodeMeta: {
                            qname: {
                              namespace:
                                'urn:ietf:params:xml:ns:signedMark-1.0',
                              localName: 'encodedSignedMark',
                            },
                            fields: {
                              encoding: {
                                kind: 'attribute',
                                xmlName: 'encoding',
                                cardinality: 'one',
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                  'launch:update': {
                    kind: 'element',
                    xmlName: 'launch:update',
                    namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                        localName: 'update',
                      },
                      fields: {
                        'launch:phase': {
                          kind: 'element',
                          xmlName: 'launch:phase',
                          namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                          cardinality: 'one',
                          nodeMeta: {
                            qname: {
                              namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                              localName: 'phase',
                            },
                            fields: {
                              name: {
                                kind: 'attribute',
                                xmlName: 'name',
                                cardinality: 'one',
                              },
                            },
                          },
                        },
                        'launch:applicationID': {
                          kind: 'element',
                          xmlName: 'launch:applicationID',
                          namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                          cardinality: 'one',
                        },
                      },
                    },
                  },
                  'launch:delete': {
                    kind: 'element',
                    xmlName: 'launch:delete',
                    namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                        localName: 'delete',
                      },
                      fields: {
                        'launch:phase': {
                          kind: 'element',
                          xmlName: 'launch:phase',
                          namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                          cardinality: 'one',
                          nodeMeta: {
                            qname: {
                              namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                              localName: 'phase',
                            },
                            fields: {
                              name: {
                                kind: 'attribute',
                                xmlName: 'name',
                                cardinality: 'one',
                              },
                            },
                          },
                        },
                        'launch:applicationID': {
                          kind: 'element',
                          xmlName: 'launch:applicationID',
                          namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                          cardinality: 'one',
                        },
                      },
                    },
                  },
                  'artRecord:create': {
                    kind: 'element',
                    xmlName: 'artRecord:create',
                    namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
                        localName: 'create',
                      },
                      fields: {
                        'artRecord:objectType': {
                          kind: 'element',
                          xmlName: 'artRecord:objectType',
                          namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
                          cardinality: 'one',
                        },
                        'artRecord:materialsAndTechniques': {
                          kind: 'element',
                          xmlName: 'artRecord:materialsAndTechniques',
                          namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
                          cardinality: 'one',
                        },
                        'artRecord:dimensions': {
                          kind: 'element',
                          xmlName: 'artRecord:dimensions',
                          namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
                          cardinality: 'one',
                        },
                        'artRecord:title': {
                          kind: 'element',
                          xmlName: 'artRecord:title',
                          namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
                          cardinality: 'one',
                        },
                        'artRecord:dateOrPeriod': {
                          kind: 'element',
                          xmlName: 'artRecord:dateOrPeriod',
                          namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
                          cardinality: 'one',
                        },
                        'artRecord:maker': {
                          kind: 'element',
                          xmlName: 'artRecord:maker',
                          namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
                          cardinality: 'one',
                        },
                        'artRecord:subject': {
                          kind: 'element',
                          xmlName: 'artRecord:subject',
                          namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
                          cardinality: 'one',
                        },
                        'artRecord:inscriptionsAndMarkings': {
                          kind: 'element',
                          xmlName: 'artRecord:inscriptionsAndMarkings',
                          namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
                          cardinality: 'one',
                        },
                        'artRecord:features': {
                          kind: 'element',
                          xmlName: 'artRecord:features',
                          namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
                          cardinality: 'one',
                        },
                        'artRecord:reference': {
                          kind: 'element',
                          xmlName: 'artRecord:reference',
                          namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
                          cardinality: 'one',
                        },
                      },
                    },
                  },
                  'artRecord:update': {
                    kind: 'element',
                    xmlName: 'artRecord:update',
                    namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
                        localName: 'update',
                      },
                      fields: {
                        'artRecord:objectType': {
                          kind: 'element',
                          xmlName: 'artRecord:objectType',
                          namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
                          cardinality: 'one',
                        },
                        'artRecord:materialsAndTechniques': {
                          kind: 'element',
                          xmlName: 'artRecord:materialsAndTechniques',
                          namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
                          cardinality: 'one',
                        },
                        'artRecord:dimensions': {
                          kind: 'element',
                          xmlName: 'artRecord:dimensions',
                          namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
                          cardinality: 'one',
                        },
                        'artRecord:title': {
                          kind: 'element',
                          xmlName: 'artRecord:title',
                          namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
                          cardinality: 'one',
                        },
                        'artRecord:dateOrPeriod': {
                          kind: 'element',
                          xmlName: 'artRecord:dateOrPeriod',
                          namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
                          cardinality: 'one',
                        },
                        'artRecord:maker': {
                          kind: 'element',
                          xmlName: 'artRecord:maker',
                          namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
                          cardinality: 'one',
                        },
                        'artRecord:subject': {
                          kind: 'element',
                          xmlName: 'artRecord:subject',
                          namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
                          cardinality: 'one',
                        },
                        'artRecord:inscriptionsAndMarkings': {
                          kind: 'element',
                          xmlName: 'artRecord:inscriptionsAndMarkings',
                          namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
                          cardinality: 'one',
                        },
                        'artRecord:features': {
                          kind: 'element',
                          xmlName: 'artRecord:features',
                          namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
                          cardinality: 'one',
                        },
                        'artRecord:reference': {
                          kind: 'element',
                          xmlName: 'artRecord:reference',
                          namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
                          cardinality: 'one',
                        },
                      },
                    },
                  },
                },
              },
            },
            'epp:clTRID': {
              kind: 'element',
              xmlName: 'epp:clTRID',
              namespace: 'urn:ietf:params:xml:ns:epp-1.0',
              cardinality: 'one',
            },
            'epp:check': {
              kind: 'element',
              xmlName: 'epp:check',
              namespace: 'urn:ietf:params:xml:ns:epp-1.0',
              cardinality: 'one',
              nodeMeta: {
                qname: {
                  namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                  localName: 'check',
                },
                fields: {
                  'domain:check': {
                    kind: 'element',
                    xmlName: 'domain:check',
                    namespace: 'urn:ietf:params:xml:ns:domain-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:domain-1.0',
                        localName: 'check',
                      },
                      fields: {
                        'domain:name': {
                          kind: 'element',
                          xmlName: 'domain:name',
                          namespace: 'urn:ietf:params:xml:ns:domain-1.0',
                          cardinality: 'many',
                        },
                      },
                    },
                  },
                  'contact:check': {
                    kind: 'element',
                    xmlName: 'contact:check',
                    namespace: 'urn:ietf:params:xml:ns:contact-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:contact-1.0',
                        localName: 'check',
                      },
                      fields: {
                        'contact:id': {
                          kind: 'element',
                          xmlName: 'contact:id',
                          namespace: 'urn:ietf:params:xml:ns:contact-1.0',
                          cardinality: 'many',
                        },
                      },
                    },
                  },
                  'host:check': {
                    kind: 'element',
                    xmlName: 'host:check',
                    namespace: 'urn:ietf:params:xml:ns:host-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:host-1.0',
                        localName: 'check',
                      },
                      fields: {
                        'host:name': {
                          kind: 'element',
                          xmlName: 'host:name',
                          namespace: 'urn:ietf:params:xml:ns:host-1.0',
                          cardinality: 'many',
                        },
                      },
                    },
                  },
                },
              },
            },
            'epp:create': {
              kind: 'element',
              xmlName: 'epp:create',
              namespace: 'urn:ietf:params:xml:ns:epp-1.0',
              cardinality: 'one',
              nodeMeta: {
                qname: {
                  namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                  localName: 'create',
                },
                fields: {
                  'domain:create': {
                    kind: 'element',
                    xmlName: 'domain:create',
                    namespace: 'urn:ietf:params:xml:ns:domain-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:domain-1.0',
                        localName: 'create',
                      },
                      fields: {
                        'domain:name': {
                          kind: 'element',
                          xmlName: 'domain:name',
                          namespace: 'urn:ietf:params:xml:ns:domain-1.0',
                          cardinality: 'one',
                        },
                        'domain:period': {
                          kind: 'element',
                          xmlName: 'domain:period',
                          namespace: 'urn:ietf:params:xml:ns:domain-1.0',
                          cardinality: 'one',
                          nodeMeta: {
                            qname: {
                              namespace: 'urn:ietf:params:xml:ns:domain-1.0',
                              localName: 'period',
                            },
                            fields: {
                              unit: {
                                kind: 'attribute',
                                xmlName: 'unit',
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
                                    namespace:
                                      'urn:ietf:params:xml:ns:domain-1.0',
                                    localName: 'hostAttr',
                                  },
                                  fields: {
                                    'domain:hostName': {
                                      kind: 'element',
                                      xmlName: 'domain:hostName',
                                      namespace:
                                        'urn:ietf:params:xml:ns:domain-1.0',
                                      cardinality: 'one',
                                    },
                                    'domain:hostAddr': {
                                      kind: 'element',
                                      xmlName: 'domain:hostAddr',
                                      namespace:
                                        'urn:ietf:params:xml:ns:domain-1.0',
                                      cardinality: 'many',
                                      nodeMeta: {
                                        qname: {
                                          namespace:
                                            'urn:ietf:params:xml:ns:domain-1.0',
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
                                    namespace:
                                      'urn:ietf:params:xml:ns:domain-1.0',
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
                                    namespace:
                                      'urn:ietf:params:xml:ns:domain-1.0',
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
                  },
                  'contact:create': {
                    kind: 'element',
                    xmlName: 'contact:create',
                    namespace: 'urn:ietf:params:xml:ns:contact-1.0',
                    cardinality: 'one',
                    nodeMeta: {
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
                                    namespace:
                                      'urn:ietf:params:xml:ns:contact-1.0',
                                    localName: 'addr',
                                  },
                                  fields: {
                                    'contact:street': {
                                      kind: 'element',
                                      xmlName: 'contact:street',
                                      namespace:
                                        'urn:ietf:params:xml:ns:contact-1.0',
                                      cardinality: 'many',
                                    },
                                    'contact:city': {
                                      kind: 'element',
                                      xmlName: 'contact:city',
                                      namespace:
                                        'urn:ietf:params:xml:ns:contact-1.0',
                                      cardinality: 'one',
                                    },
                                    'contact:sp': {
                                      kind: 'element',
                                      xmlName: 'contact:sp',
                                      namespace:
                                        'urn:ietf:params:xml:ns:contact-1.0',
                                      cardinality: 'one',
                                    },
                                    'contact:pc': {
                                      kind: 'element',
                                      xmlName: 'contact:pc',
                                      namespace:
                                        'urn:ietf:params:xml:ns:contact-1.0',
                                      cardinality: 'one',
                                    },
                                    'contact:cc': {
                                      kind: 'element',
                                      xmlName: 'contact:cc',
                                      namespace:
                                        'urn:ietf:params:xml:ns:contact-1.0',
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
                                    namespace:
                                      'urn:ietf:params:xml:ns:contact-1.0',
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
                                    namespace:
                                      'urn:ietf:params:xml:ns:contact-1.0',
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
                                    namespace:
                                      'urn:ietf:params:xml:ns:contact-1.0',
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
                                    namespace:
                                      'urn:ietf:params:xml:ns:contact-1.0',
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
                                    namespace:
                                      'urn:ietf:params:xml:ns:contact-1.0',
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
                  },
                  'host:create': {
                    kind: 'element',
                    xmlName: 'host:create',
                    namespace: 'urn:ietf:params:xml:ns:host-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:host-1.0',
                        localName: 'create',
                      },
                      fields: {
                        'host:name': {
                          kind: 'element',
                          xmlName: 'host:name',
                          namespace: 'urn:ietf:params:xml:ns:host-1.0',
                          cardinality: 'one',
                        },
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
                      },
                    },
                  },
                },
              },
            },
            'epp:delete': {
              kind: 'element',
              xmlName: 'epp:delete',
              namespace: 'urn:ietf:params:xml:ns:epp-1.0',
              cardinality: 'one',
              nodeMeta: {
                qname: {
                  namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                  localName: 'delete',
                },
                fields: {
                  'domain:delete': {
                    kind: 'element',
                    xmlName: 'domain:delete',
                    namespace: 'urn:ietf:params:xml:ns:domain-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:domain-1.0',
                        localName: 'delete',
                      },
                      fields: {
                        'domain:name': {
                          kind: 'element',
                          xmlName: 'domain:name',
                          namespace: 'urn:ietf:params:xml:ns:domain-1.0',
                          cardinality: 'one',
                        },
                      },
                    },
                  },
                  'contact:delete': {
                    kind: 'element',
                    xmlName: 'contact:delete',
                    namespace: 'urn:ietf:params:xml:ns:contact-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:contact-1.0',
                        localName: 'delete',
                      },
                      fields: {
                        'contact:id': {
                          kind: 'element',
                          xmlName: 'contact:id',
                          namespace: 'urn:ietf:params:xml:ns:contact-1.0',
                          cardinality: 'one',
                        },
                      },
                    },
                  },
                  'host:delete': {
                    kind: 'element',
                    xmlName: 'host:delete',
                    namespace: 'urn:ietf:params:xml:ns:host-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:host-1.0',
                        localName: 'delete',
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
            },
            'epp:info': {
              kind: 'element',
              xmlName: 'epp:info',
              namespace: 'urn:ietf:params:xml:ns:epp-1.0',
              cardinality: 'one',
              nodeMeta: {
                qname: {
                  namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                  localName: 'info',
                },
                fields: {
                  'domain:info': {
                    kind: 'element',
                    xmlName: 'domain:info',
                    namespace: 'urn:ietf:params:xml:ns:domain-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:domain-1.0',
                        localName: 'info',
                      },
                      fields: {
                        'domain:name': {
                          kind: 'element',
                          xmlName: 'domain:name',
                          namespace: 'urn:ietf:params:xml:ns:domain-1.0',
                          cardinality: 'one',
                          nodeMeta: {
                            qname: {
                              namespace: 'urn:ietf:params:xml:ns:domain-1.0',
                              localName: 'name',
                            },
                            fields: {
                              hosts: {
                                kind: 'attribute',
                                xmlName: 'hosts',
                                cardinality: 'one',
                              },
                            },
                          },
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
                                    namespace:
                                      'urn:ietf:params:xml:ns:domain-1.0',
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
                                    namespace:
                                      'urn:ietf:params:xml:ns:domain-1.0',
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
                  },
                  'contact:info': {
                    kind: 'element',
                    xmlName: 'contact:info',
                    namespace: 'urn:ietf:params:xml:ns:contact-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:contact-1.0',
                        localName: 'info',
                      },
                      fields: {
                        'contact:id': {
                          kind: 'element',
                          xmlName: 'contact:id',
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
                                    namespace:
                                      'urn:ietf:params:xml:ns:contact-1.0',
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
                                    namespace:
                                      'urn:ietf:params:xml:ns:contact-1.0',
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
                  },
                  'host:info': {
                    kind: 'element',
                    xmlName: 'host:info',
                    namespace: 'urn:ietf:params:xml:ns:host-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:host-1.0',
                        localName: 'info',
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
            },
            'epp:login': {
              kind: 'element',
              xmlName: 'epp:login',
              namespace: 'urn:ietf:params:xml:ns:epp-1.0',
              cardinality: 'one',
              nodeMeta: {
                qname: {
                  namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                  localName: 'login',
                },
                fields: {
                  'epp:clID': {
                    kind: 'element',
                    xmlName: 'epp:clID',
                    namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                    cardinality: 'one',
                  },
                  'epp:pw': {
                    kind: 'element',
                    xmlName: 'epp:pw',
                    namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                    cardinality: 'one',
                  },
                  'epp:newPW': {
                    kind: 'element',
                    xmlName: 'epp:newPW',
                    namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                    cardinality: 'one',
                  },
                  'epp:options': {
                    kind: 'element',
                    xmlName: 'epp:options',
                    namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                        localName: 'options',
                      },
                      fields: {
                        'epp:version': {
                          kind: 'element',
                          xmlName: 'epp:version',
                          namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                          cardinality: 'one',
                        },
                        'epp:lang': {
                          kind: 'element',
                          xmlName: 'epp:lang',
                          namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                          cardinality: 'one',
                        },
                      },
                    },
                  },
                  'epp:svcs': {
                    kind: 'element',
                    xmlName: 'epp:svcs',
                    namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                        localName: 'svcs',
                      },
                      fields: {
                        'epp:objURI': {
                          kind: 'element',
                          xmlName: 'epp:objURI',
                          namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                          cardinality: 'many',
                        },
                        'epp:svcExtension': {
                          kind: 'element',
                          xmlName: 'epp:svcExtension',
                          namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                          cardinality: 'one',
                          nodeMeta: {
                            qname: {
                              namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                              localName: 'svcExtension',
                            },
                            fields: {
                              'epp:extURI': {
                                kind: 'element',
                                xmlName: 'epp:extURI',
                                namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                                cardinality: 'many',
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
            'epp:logout': {
              kind: 'element',
              xmlName: 'epp:logout',
              namespace: 'urn:ietf:params:xml:ns:epp-1.0',
              cardinality: 'one',
            },
            'epp:poll': {
              kind: 'element',
              xmlName: 'epp:poll',
              namespace: 'urn:ietf:params:xml:ns:epp-1.0',
              cardinality: 'one',
              nodeMeta: {
                qname: {
                  namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                  localName: 'poll',
                },
                fields: {
                  op: {
                    kind: 'attribute',
                    xmlName: 'op',
                    cardinality: 'one',
                  },
                  msgID: {
                    kind: 'attribute',
                    xmlName: 'msgID',
                    cardinality: 'one',
                  },
                },
              },
            },
            'epp:renew': {
              kind: 'element',
              xmlName: 'epp:renew',
              namespace: 'urn:ietf:params:xml:ns:epp-1.0',
              cardinality: 'one',
              nodeMeta: {
                qname: {
                  namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                  localName: 'renew',
                },
                fields: {
                  'domain:renew': {
                    kind: 'element',
                    xmlName: 'domain:renew',
                    namespace: 'urn:ietf:params:xml:ns:domain-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:domain-1.0',
                        localName: 'renew',
                      },
                      fields: {
                        'domain:name': {
                          kind: 'element',
                          xmlName: 'domain:name',
                          namespace: 'urn:ietf:params:xml:ns:domain-1.0',
                          cardinality: 'one',
                        },
                        'domain:curExpDate': {
                          kind: 'element',
                          xmlName: 'domain:curExpDate',
                          namespace: 'urn:ietf:params:xml:ns:domain-1.0',
                          cardinality: 'one',
                        },
                        'domain:period': {
                          kind: 'element',
                          xmlName: 'domain:period',
                          namespace: 'urn:ietf:params:xml:ns:domain-1.0',
                          cardinality: 'one',
                          nodeMeta: {
                            qname: {
                              namespace: 'urn:ietf:params:xml:ns:domain-1.0',
                              localName: 'period',
                            },
                            fields: {
                              unit: {
                                kind: 'attribute',
                                xmlName: 'unit',
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
            'epp:transfer': {
              kind: 'element',
              xmlName: 'epp:transfer',
              namespace: 'urn:ietf:params:xml:ns:epp-1.0',
              cardinality: 'one',
              nodeMeta: {
                qname: {
                  namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                  localName: 'transfer',
                },
                fields: {
                  op: {
                    kind: 'attribute',
                    xmlName: 'op',
                    cardinality: 'one',
                  },
                  'domain:transfer': {
                    kind: 'element',
                    xmlName: 'domain:transfer',
                    namespace: 'urn:ietf:params:xml:ns:domain-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:domain-1.0',
                        localName: 'transfer',
                      },
                      fields: {
                        'domain:name': {
                          kind: 'element',
                          xmlName: 'domain:name',
                          namespace: 'urn:ietf:params:xml:ns:domain-1.0',
                          cardinality: 'one',
                        },
                        'domain:period': {
                          kind: 'element',
                          xmlName: 'domain:period',
                          namespace: 'urn:ietf:params:xml:ns:domain-1.0',
                          cardinality: 'one',
                          nodeMeta: {
                            qname: {
                              namespace: 'urn:ietf:params:xml:ns:domain-1.0',
                              localName: 'period',
                            },
                            fields: {
                              unit: {
                                kind: 'attribute',
                                xmlName: 'unit',
                                cardinality: 'one',
                              },
                            },
                          },
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
                                    namespace:
                                      'urn:ietf:params:xml:ns:domain-1.0',
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
                                    namespace:
                                      'urn:ietf:params:xml:ns:domain-1.0',
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
                  },
                  'contact:transfer': {
                    kind: 'element',
                    xmlName: 'contact:transfer',
                    namespace: 'urn:ietf:params:xml:ns:contact-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:contact-1.0',
                        localName: 'transfer',
                      },
                      fields: {
                        'contact:id': {
                          kind: 'element',
                          xmlName: 'contact:id',
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
                                    namespace:
                                      'urn:ietf:params:xml:ns:contact-1.0',
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
                                    namespace:
                                      'urn:ietf:params:xml:ns:contact-1.0',
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
                  },
                },
              },
            },
            'epp:update': {
              kind: 'element',
              xmlName: 'epp:update',
              namespace: 'urn:ietf:params:xml:ns:epp-1.0',
              cardinality: 'one',
              nodeMeta: {
                qname: {
                  namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                  localName: 'update',
                },
                fields: {
                  'domain:update': {
                    kind: 'element',
                    xmlName: 'domain:update',
                    namespace: 'urn:ietf:params:xml:ns:domain-1.0',
                    cardinality: 'one',
                    nodeMeta: {
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
                                    namespace:
                                      'urn:ietf:params:xml:ns:domain-1.0',
                                    localName: 'ns',
                                  },
                                  fields: {
                                    'domain:hostObj': {
                                      kind: 'element',
                                      xmlName: 'domain:hostObj',
                                      namespace:
                                        'urn:ietf:params:xml:ns:domain-1.0',
                                      cardinality: 'many',
                                    },
                                    'domain:hostAttr': {
                                      kind: 'element',
                                      xmlName: 'domain:hostAttr',
                                      namespace:
                                        'urn:ietf:params:xml:ns:domain-1.0',
                                      cardinality: 'many',
                                      nodeMeta: {
                                        qname: {
                                          namespace:
                                            'urn:ietf:params:xml:ns:domain-1.0',
                                          localName: 'hostAttr',
                                        },
                                        fields: {
                                          'domain:hostName': {
                                            kind: 'element',
                                            xmlName: 'domain:hostName',
                                            namespace:
                                              'urn:ietf:params:xml:ns:domain-1.0',
                                            cardinality: 'one',
                                          },
                                          'domain:hostAddr': {
                                            kind: 'element',
                                            xmlName: 'domain:hostAddr',
                                            namespace:
                                              'urn:ietf:params:xml:ns:domain-1.0',
                                            cardinality: 'many',
                                            nodeMeta: {
                                              qname: {
                                                namespace:
                                                  'urn:ietf:params:xml:ns:domain-1.0',
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
                                    namespace:
                                      'urn:ietf:params:xml:ns:domain-1.0',
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
                                    namespace:
                                      'urn:ietf:params:xml:ns:domain-1.0',
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
                                    namespace:
                                      'urn:ietf:params:xml:ns:domain-1.0',
                                    localName: 'ns',
                                  },
                                  fields: {
                                    'domain:hostObj': {
                                      kind: 'element',
                                      xmlName: 'domain:hostObj',
                                      namespace:
                                        'urn:ietf:params:xml:ns:domain-1.0',
                                      cardinality: 'many',
                                    },
                                    'domain:hostAttr': {
                                      kind: 'element',
                                      xmlName: 'domain:hostAttr',
                                      namespace:
                                        'urn:ietf:params:xml:ns:domain-1.0',
                                      cardinality: 'many',
                                      nodeMeta: {
                                        qname: {
                                          namespace:
                                            'urn:ietf:params:xml:ns:domain-1.0',
                                          localName: 'hostAttr',
                                        },
                                        fields: {
                                          'domain:hostName': {
                                            kind: 'element',
                                            xmlName: 'domain:hostName',
                                            namespace:
                                              'urn:ietf:params:xml:ns:domain-1.0',
                                            cardinality: 'one',
                                          },
                                          'domain:hostAddr': {
                                            kind: 'element',
                                            xmlName: 'domain:hostAddr',
                                            namespace:
                                              'urn:ietf:params:xml:ns:domain-1.0',
                                            cardinality: 'many',
                                            nodeMeta: {
                                              qname: {
                                                namespace:
                                                  'urn:ietf:params:xml:ns:domain-1.0',
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
                                    namespace:
                                      'urn:ietf:params:xml:ns:domain-1.0',
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
                                    namespace:
                                      'urn:ietf:params:xml:ns:domain-1.0',
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
                                    namespace:
                                      'urn:ietf:params:xml:ns:domain-1.0',
                                    localName: 'authInfo',
                                  },
                                  fields: {
                                    'domain:pw': {
                                      kind: 'element',
                                      xmlName: 'domain:pw',
                                      namespace:
                                        'urn:ietf:params:xml:ns:domain-1.0',
                                      cardinality: 'one',
                                      nodeMeta: {
                                        qname: {
                                          namespace:
                                            'urn:ietf:params:xml:ns:domain-1.0',
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
                                      namespace:
                                        'urn:ietf:params:xml:ns:domain-1.0',
                                      cardinality: 'one',
                                      nodeMeta: {
                                        qname: {
                                          namespace:
                                            'urn:ietf:params:xml:ns:domain-1.0',
                                          localName: 'ext',
                                        },
                                        fields: {},
                                      },
                                    },
                                    'domain:null': {
                                      kind: 'element',
                                      xmlName: 'domain:null',
                                      namespace:
                                        'urn:ietf:params:xml:ns:domain-1.0',
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
                  'contact:update': {
                    kind: 'element',
                    xmlName: 'contact:update',
                    namespace: 'urn:ietf:params:xml:ns:contact-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:contact-1.0',
                        localName: 'update',
                      },
                      fields: {
                        'contact:id': {
                          kind: 'element',
                          xmlName: 'contact:id',
                          namespace: 'urn:ietf:params:xml:ns:contact-1.0',
                          cardinality: 'one',
                        },
                        'contact:add': {
                          kind: 'element',
                          xmlName: 'contact:add',
                          namespace: 'urn:ietf:params:xml:ns:contact-1.0',
                          cardinality: 'one',
                          nodeMeta: {
                            qname: {
                              namespace: 'urn:ietf:params:xml:ns:contact-1.0',
                              localName: 'add',
                            },
                            fields: {
                              'contact:status': {
                                kind: 'element',
                                xmlName: 'contact:status',
                                namespace: 'urn:ietf:params:xml:ns:contact-1.0',
                                cardinality: 'many',
                                nodeMeta: {
                                  qname: {
                                    namespace:
                                      'urn:ietf:params:xml:ns:contact-1.0',
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
                        'contact:rem': {
                          kind: 'element',
                          xmlName: 'contact:rem',
                          namespace: 'urn:ietf:params:xml:ns:contact-1.0',
                          cardinality: 'one',
                          nodeMeta: {
                            qname: {
                              namespace: 'urn:ietf:params:xml:ns:contact-1.0',
                              localName: 'rem',
                            },
                            fields: {
                              'contact:status': {
                                kind: 'element',
                                xmlName: 'contact:status',
                                namespace: 'urn:ietf:params:xml:ns:contact-1.0',
                                cardinality: 'many',
                                nodeMeta: {
                                  qname: {
                                    namespace:
                                      'urn:ietf:params:xml:ns:contact-1.0',
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
                        'contact:chg': {
                          kind: 'element',
                          xmlName: 'contact:chg',
                          namespace: 'urn:ietf:params:xml:ns:contact-1.0',
                          cardinality: 'one',
                          nodeMeta: {
                            qname: {
                              namespace: 'urn:ietf:params:xml:ns:contact-1.0',
                              localName: 'chg',
                            },
                            fields: {
                              'contact:postalInfo': {
                                kind: 'element',
                                xmlName: 'contact:postalInfo',
                                namespace: 'urn:ietf:params:xml:ns:contact-1.0',
                                cardinality: 'many',
                                nodeMeta: {
                                  qname: {
                                    namespace:
                                      'urn:ietf:params:xml:ns:contact-1.0',
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
                                      namespace:
                                        'urn:ietf:params:xml:ns:contact-1.0',
                                      cardinality: 'one',
                                    },
                                    'contact:org': {
                                      kind: 'element',
                                      xmlName: 'contact:org',
                                      namespace:
                                        'urn:ietf:params:xml:ns:contact-1.0',
                                      cardinality: 'one',
                                    },
                                    'contact:addr': {
                                      kind: 'element',
                                      xmlName: 'contact:addr',
                                      namespace:
                                        'urn:ietf:params:xml:ns:contact-1.0',
                                      cardinality: 'one',
                                      nodeMeta: {
                                        qname: {
                                          namespace:
                                            'urn:ietf:params:xml:ns:contact-1.0',
                                          localName: 'addr',
                                        },
                                        fields: {
                                          'contact:street': {
                                            kind: 'element',
                                            xmlName: 'contact:street',
                                            namespace:
                                              'urn:ietf:params:xml:ns:contact-1.0',
                                            cardinality: 'many',
                                          },
                                          'contact:city': {
                                            kind: 'element',
                                            xmlName: 'contact:city',
                                            namespace:
                                              'urn:ietf:params:xml:ns:contact-1.0',
                                            cardinality: 'one',
                                          },
                                          'contact:sp': {
                                            kind: 'element',
                                            xmlName: 'contact:sp',
                                            namespace:
                                              'urn:ietf:params:xml:ns:contact-1.0',
                                            cardinality: 'one',
                                          },
                                          'contact:pc': {
                                            kind: 'element',
                                            xmlName: 'contact:pc',
                                            namespace:
                                              'urn:ietf:params:xml:ns:contact-1.0',
                                            cardinality: 'one',
                                          },
                                          'contact:cc': {
                                            kind: 'element',
                                            xmlName: 'contact:cc',
                                            namespace:
                                              'urn:ietf:params:xml:ns:contact-1.0',
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
                                    namespace:
                                      'urn:ietf:params:xml:ns:contact-1.0',
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
                                    namespace:
                                      'urn:ietf:params:xml:ns:contact-1.0',
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
                                    namespace:
                                      'urn:ietf:params:xml:ns:contact-1.0',
                                    localName: 'authInfo',
                                  },
                                  fields: {
                                    'contact:pw': {
                                      kind: 'element',
                                      xmlName: 'contact:pw',
                                      namespace:
                                        'urn:ietf:params:xml:ns:contact-1.0',
                                      cardinality: 'one',
                                      nodeMeta: {
                                        qname: {
                                          namespace:
                                            'urn:ietf:params:xml:ns:contact-1.0',
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
                                      namespace:
                                        'urn:ietf:params:xml:ns:contact-1.0',
                                      cardinality: 'one',
                                      nodeMeta: {
                                        qname: {
                                          namespace:
                                            'urn:ietf:params:xml:ns:contact-1.0',
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
                                    namespace:
                                      'urn:ietf:params:xml:ns:contact-1.0',
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
                                      namespace:
                                        'urn:ietf:params:xml:ns:contact-1.0',
                                      cardinality: 'many',
                                      nodeMeta: {
                                        qname: {
                                          namespace:
                                            'urn:ietf:params:xml:ns:contact-1.0',
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
                                      namespace:
                                        'urn:ietf:params:xml:ns:contact-1.0',
                                      cardinality: 'many',
                                      nodeMeta: {
                                        qname: {
                                          namespace:
                                            'urn:ietf:params:xml:ns:contact-1.0',
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
                                      namespace:
                                        'urn:ietf:params:xml:ns:contact-1.0',
                                      cardinality: 'many',
                                      nodeMeta: {
                                        qname: {
                                          namespace:
                                            'urn:ietf:params:xml:ns:contact-1.0',
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
                                      namespace:
                                        'urn:ietf:params:xml:ns:contact-1.0',
                                      cardinality: 'one',
                                    },
                                    'contact:fax': {
                                      kind: 'element',
                                      xmlName: 'contact:fax',
                                      namespace:
                                        'urn:ietf:params:xml:ns:contact-1.0',
                                      cardinality: 'one',
                                    },
                                    'contact:email': {
                                      kind: 'element',
                                      xmlName: 'contact:email',
                                      namespace:
                                        'urn:ietf:params:xml:ns:contact-1.0',
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
                  'host:update': {
                    kind: 'element',
                    xmlName: 'host:update',
                    namespace: 'urn:ietf:params:xml:ns:host-1.0',
                    cardinality: 'one',
                    nodeMeta: {
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
                                    namespace:
                                      'urn:ietf:params:xml:ns:host-1.0',
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
                                    namespace:
                                      'urn:ietf:params:xml:ns:host-1.0',
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
                                    namespace:
                                      'urn:ietf:params:xml:ns:host-1.0',
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
                                    namespace:
                                      'urn:ietf:params:xml:ns:host-1.0',
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
                  },
                },
              },
            },
          },
        },
      },
      'epp:response': {
        kind: 'element',
        xmlName: 'epp:response',
        namespace: 'urn:ietf:params:xml:ns:epp-1.0',
        cardinality: 'one',
        nodeMeta: {
          qname: {
            namespace: 'urn:ietf:params:xml:ns:epp-1.0',
            localName: 'response',
          },
          fields: {
            'epp:result': {
              kind: 'element',
              xmlName: 'epp:result',
              namespace: 'urn:ietf:params:xml:ns:epp-1.0',
              cardinality: 'many',
              nodeMeta: {
                qname: {
                  namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                  localName: 'result',
                },
                fields: {
                  code: {
                    kind: 'attribute',
                    xmlName: 'code',
                    cardinality: 'one',
                  },
                  'epp:msg': {
                    kind: 'element',
                    xmlName: 'epp:msg',
                    namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                        localName: 'msg',
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
                  'epp:value': {
                    kind: 'element',
                    xmlName: 'epp:value',
                    namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                        localName: 'value',
                      },
                      fields: {},
                    },
                  },
                  'epp:extValue': {
                    kind: 'element',
                    xmlName: 'epp:extValue',
                    namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                        localName: 'extValue',
                      },
                      fields: {
                        'epp:value': {
                          kind: 'element',
                          xmlName: 'epp:value',
                          namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                          cardinality: 'one',
                          nodeMeta: {
                            qname: {
                              namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                              localName: 'value',
                            },
                            fields: {},
                          },
                        },
                        'epp:reason': {
                          kind: 'element',
                          xmlName: 'epp:reason',
                          namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                          cardinality: 'one',
                          nodeMeta: {
                            qname: {
                              namespace: 'urn:ietf:params:xml:ns:epp-1.0',
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
            },
            'epp:msgQ': {
              kind: 'element',
              xmlName: 'epp:msgQ',
              namespace: 'urn:ietf:params:xml:ns:epp-1.0',
              cardinality: 'one',
              nodeMeta: {
                qname: {
                  namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                  localName: 'msgQ',
                },
                fields: {
                  count: {
                    kind: 'attribute',
                    xmlName: 'count',
                    cardinality: 'one',
                  },
                  id: {
                    kind: 'attribute',
                    xmlName: 'id',
                    cardinality: 'one',
                  },
                  'epp:qDate': {
                    kind: 'element',
                    xmlName: 'epp:qDate',
                    namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                    cardinality: 'one',
                  },
                  'epp:msg': {
                    kind: 'element',
                    xmlName: 'epp:msg',
                    namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                        localName: 'msg',
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
            'epp:resData': {
              kind: 'element',
              xmlName: 'epp:resData',
              namespace: 'urn:ietf:params:xml:ns:epp-1.0',
              cardinality: 'one',
              nodeMeta: {
                qname: {
                  namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                  localName: 'resData',
                },
                fields: {
                  'idn:data': {
                    kind: 'element',
                    xmlName: 'idn:data',
                    namespace: 'urn:ietf:params:xml:ns:idn-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:idn-1.0',
                        localName: 'data',
                      },
                      fields: {
                        'idn:table': {
                          kind: 'element',
                          xmlName: 'idn:table',
                          namespace: 'urn:ietf:params:xml:ns:idn-1.0',
                          cardinality: 'one',
                        },
                        'idn:uname': {
                          kind: 'element',
                          xmlName: 'idn:uname',
                          namespace: 'urn:ietf:params:xml:ns:idn-1.0',
                          cardinality: 'one',
                        },
                      },
                    },
                  },
                  'fee:chkData': {
                    kind: 'element',
                    xmlName: 'fee:chkData',
                    namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                    cardinality: 'one',
                    nodeMeta: {
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
                                    namespace:
                                      'urn:ietf:params:xml:ns:epp:fee-1.0',
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
                                    namespace:
                                      'urn:ietf:params:xml:ns:epp:fee-1.0',
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
                                      namespace:
                                        'urn:ietf:params:xml:ns:epp:fee-1.0',
                                      cardinality: 'many',
                                      nodeMeta: {
                                        qname: {
                                          namespace:
                                            'urn:ietf:params:xml:ns:epp:fee-1.0',
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
                                      namespace:
                                        'urn:ietf:params:xml:ns:epp:fee-1.0',
                                      cardinality: 'many',
                                      nodeMeta: {
                                        qname: {
                                          namespace:
                                            'urn:ietf:params:xml:ns:epp:fee-1.0',
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
                                      namespace:
                                        'urn:ietf:params:xml:ns:epp:fee-1.0',
                                      cardinality: 'one',
                                      nodeMeta: {
                                        qname: {
                                          namespace:
                                            'urn:ietf:params:xml:ns:epp:fee-1.0',
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
                                    namespace:
                                      'urn:ietf:params:xml:ns:epp:fee-1.0',
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
                  },
                  'fee:creData': {
                    kind: 'element',
                    xmlName: 'fee:creData',
                    namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                        localName: 'creData',
                      },
                      fields: {
                        'fee:currency': {
                          kind: 'element',
                          xmlName: 'fee:currency',
                          namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                          cardinality: 'one',
                        },
                        'fee:period': {
                          kind: 'element',
                          xmlName: 'fee:period',
                          namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                          cardinality: 'one',
                          nodeMeta: {
                            qname: {
                              namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                              localName: 'period',
                            },
                            fields: {
                              unit: {
                                kind: 'attribute',
                                xmlName: 'unit',
                                cardinality: 'one',
                              },
                            },
                          },
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
                        'fee:balance': {
                          kind: 'element',
                          xmlName: 'fee:balance',
                          namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                          cardinality: 'one',
                        },
                        'fee:creditLimit': {
                          kind: 'element',
                          xmlName: 'fee:creditLimit',
                          namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                          cardinality: 'one',
                        },
                      },
                    },
                  },
                  'fee:renData': {
                    kind: 'element',
                    xmlName: 'fee:renData',
                    namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                        localName: 'renData',
                      },
                      fields: {
                        'fee:currency': {
                          kind: 'element',
                          xmlName: 'fee:currency',
                          namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                          cardinality: 'one',
                        },
                        'fee:period': {
                          kind: 'element',
                          xmlName: 'fee:period',
                          namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                          cardinality: 'one',
                          nodeMeta: {
                            qname: {
                              namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                              localName: 'period',
                            },
                            fields: {
                              unit: {
                                kind: 'attribute',
                                xmlName: 'unit',
                                cardinality: 'one',
                              },
                            },
                          },
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
                        'fee:balance': {
                          kind: 'element',
                          xmlName: 'fee:balance',
                          namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                          cardinality: 'one',
                        },
                        'fee:creditLimit': {
                          kind: 'element',
                          xmlName: 'fee:creditLimit',
                          namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                          cardinality: 'one',
                        },
                      },
                    },
                  },
                  'fee:trnData': {
                    kind: 'element',
                    xmlName: 'fee:trnData',
                    namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                        localName: 'trnData',
                      },
                      fields: {
                        'fee:currency': {
                          kind: 'element',
                          xmlName: 'fee:currency',
                          namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                          cardinality: 'one',
                        },
                        'fee:period': {
                          kind: 'element',
                          xmlName: 'fee:period',
                          namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                          cardinality: 'one',
                          nodeMeta: {
                            qname: {
                              namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                              localName: 'period',
                            },
                            fields: {
                              unit: {
                                kind: 'attribute',
                                xmlName: 'unit',
                                cardinality: 'one',
                              },
                            },
                          },
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
                        'fee:balance': {
                          kind: 'element',
                          xmlName: 'fee:balance',
                          namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                          cardinality: 'one',
                        },
                        'fee:creditLimit': {
                          kind: 'element',
                          xmlName: 'fee:creditLimit',
                          namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                          cardinality: 'one',
                        },
                      },
                    },
                  },
                  'fee:updData': {
                    kind: 'element',
                    xmlName: 'fee:updData',
                    namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                        localName: 'updData',
                      },
                      fields: {
                        'fee:currency': {
                          kind: 'element',
                          xmlName: 'fee:currency',
                          namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                          cardinality: 'one',
                        },
                        'fee:period': {
                          kind: 'element',
                          xmlName: 'fee:period',
                          namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                          cardinality: 'one',
                          nodeMeta: {
                            qname: {
                              namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                              localName: 'period',
                            },
                            fields: {
                              unit: {
                                kind: 'attribute',
                                xmlName: 'unit',
                                cardinality: 'one',
                              },
                            },
                          },
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
                        'fee:balance': {
                          kind: 'element',
                          xmlName: 'fee:balance',
                          namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                          cardinality: 'one',
                        },
                        'fee:creditLimit': {
                          kind: 'element',
                          xmlName: 'fee:creditLimit',
                          namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                          cardinality: 'one',
                        },
                      },
                    },
                  },
                  'fee:delData': {
                    kind: 'element',
                    xmlName: 'fee:delData',
                    namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                        localName: 'delData',
                      },
                      fields: {
                        'fee:currency': {
                          kind: 'element',
                          xmlName: 'fee:currency',
                          namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                          cardinality: 'one',
                        },
                        'fee:period': {
                          kind: 'element',
                          xmlName: 'fee:period',
                          namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                          cardinality: 'one',
                          nodeMeta: {
                            qname: {
                              namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                              localName: 'period',
                            },
                            fields: {
                              unit: {
                                kind: 'attribute',
                                xmlName: 'unit',
                                cardinality: 'one',
                              },
                            },
                          },
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
                        'fee:balance': {
                          kind: 'element',
                          xmlName: 'fee:balance',
                          namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                          cardinality: 'one',
                        },
                        'fee:creditLimit': {
                          kind: 'element',
                          xmlName: 'fee:creditLimit',
                          namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                          cardinality: 'one',
                        },
                      },
                    },
                  },
                  'epp:infData': {
                    kind: 'element',
                    xmlName: 'epp:infData',
                    namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:epp-1.0',
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
                                    namespace:
                                      'urn:ietf:params:xml:ns:secDNS-1.1',
                                    localName: 'keyData',
                                  },
                                  fields: {
                                    'secDNS:flags': {
                                      kind: 'element',
                                      xmlName: 'secDNS:flags',
                                      namespace:
                                        'urn:ietf:params:xml:ns:secDNS-1.1',
                                      cardinality: 'one',
                                    },
                                    'secDNS:protocol': {
                                      kind: 'element',
                                      xmlName: 'secDNS:protocol',
                                      namespace:
                                        'urn:ietf:params:xml:ns:secDNS-1.1',
                                      cardinality: 'one',
                                    },
                                    'secDNS:alg': {
                                      kind: 'element',
                                      xmlName: 'secDNS:alg',
                                      namespace:
                                        'urn:ietf:params:xml:ns:secDNS-1.1',
                                      cardinality: 'one',
                                    },
                                    'secDNS:pubKey': {
                                      kind: 'element',
                                      xmlName: 'secDNS:pubKey',
                                      namespace:
                                        'urn:ietf:params:xml:ns:secDNS-1.1',
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
                  },
                  'rgp:infData': {
                    kind: 'element',
                    xmlName: 'rgp:infData',
                    namespace: 'urn:ietf:params:xml:ns:rgp-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:rgp-1.0',
                        localName: 'infData',
                      },
                      fields: {
                        'rgp:rgpStatus': {
                          kind: 'element',
                          xmlName: 'rgp:rgpStatus',
                          namespace: 'urn:ietf:params:xml:ns:rgp-1.0',
                          cardinality: 'many',
                          nodeMeta: {
                            qname: {
                              namespace: 'urn:ietf:params:xml:ns:rgp-1.0',
                              localName: 'rgpStatus',
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
                  'rgp:upData': {
                    kind: 'element',
                    xmlName: 'rgp:upData',
                    namespace: 'urn:ietf:params:xml:ns:rgp-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:rgp-1.0',
                        localName: 'upData',
                      },
                      fields: {
                        'rgp:rgpStatus': {
                          kind: 'element',
                          xmlName: 'rgp:rgpStatus',
                          namespace: 'urn:ietf:params:xml:ns:rgp-1.0',
                          cardinality: 'many',
                          nodeMeta: {
                            qname: {
                              namespace: 'urn:ietf:params:xml:ns:rgp-1.0',
                              localName: 'rgpStatus',
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
                  'launch:chkData': {
                    kind: 'element',
                    xmlName: 'launch:chkData',
                    namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                        localName: 'chkData',
                      },
                      fields: {
                        'launch:phase': {
                          kind: 'element',
                          xmlName: 'launch:phase',
                          namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                          cardinality: 'one',
                          nodeMeta: {
                            qname: {
                              namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                              localName: 'phase',
                            },
                            fields: {
                              name: {
                                kind: 'attribute',
                                xmlName: 'name',
                                cardinality: 'one',
                              },
                            },
                          },
                        },
                        'launch:cd': {
                          kind: 'element',
                          xmlName: 'launch:cd',
                          namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                          cardinality: 'many',
                          nodeMeta: {
                            qname: {
                              namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                              localName: 'cd',
                            },
                            fields: {
                              'launch:name': {
                                kind: 'element',
                                xmlName: 'launch:name',
                                namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                                cardinality: 'one',
                                nodeMeta: {
                                  qname: {
                                    namespace:
                                      'urn:ietf:params:xml:ns:launch-1.0',
                                    localName: 'name',
                                  },
                                  fields: {
                                    exists: {
                                      kind: 'attribute',
                                      xmlName: 'exists',
                                      cardinality: 'one',
                                    },
                                  },
                                },
                              },
                              'launch:claimKey': {
                                kind: 'element',
                                xmlName: 'launch:claimKey',
                                namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                                cardinality: 'one',
                                nodeMeta: {
                                  qname: {
                                    namespace:
                                      'urn:ietf:params:xml:ns:launch-1.0',
                                    localName: 'claimKey',
                                  },
                                  fields: {
                                    validatorID: {
                                      kind: 'attribute',
                                      xmlName: 'validatorID',
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
                  'launch:creData': {
                    kind: 'element',
                    xmlName: 'launch:creData',
                    namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                        localName: 'creData',
                      },
                      fields: {
                        'launch:phase': {
                          kind: 'element',
                          xmlName: 'launch:phase',
                          namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                          cardinality: 'one',
                          nodeMeta: {
                            qname: {
                              namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                              localName: 'phase',
                            },
                            fields: {
                              name: {
                                kind: 'attribute',
                                xmlName: 'name',
                                cardinality: 'one',
                              },
                            },
                          },
                        },
                        'launch:applicationID': {
                          kind: 'element',
                          xmlName: 'launch:applicationID',
                          namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                          cardinality: 'one',
                        },
                      },
                    },
                  },
                  'launch:infData': {
                    kind: 'element',
                    xmlName: 'launch:infData',
                    namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                        localName: 'infData',
                      },
                      fields: {
                        'launch:phase': {
                          kind: 'element',
                          xmlName: 'launch:phase',
                          namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                          cardinality: 'one',
                          nodeMeta: {
                            qname: {
                              namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                              localName: 'phase',
                            },
                            fields: {
                              name: {
                                kind: 'attribute',
                                xmlName: 'name',
                                cardinality: 'one',
                              },
                            },
                          },
                        },
                        'launch:applicationID': {
                          kind: 'element',
                          xmlName: 'launch:applicationID',
                          namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                          cardinality: 'one',
                        },
                        'launch:status': {
                          kind: 'element',
                          xmlName: 'launch:status',
                          namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                          cardinality: 'one',
                          nodeMeta: {
                            qname: {
                              namespace: 'urn:ietf:params:xml:ns:launch-1.0',
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
                              name: {
                                kind: 'attribute',
                                xmlName: 'name',
                                cardinality: 'one',
                              },
                            },
                          },
                        },
                        'mark:abstractMark': {
                          kind: 'element',
                          xmlName: 'mark:abstractMark',
                          namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                          cardinality: 'many',
                          nodeMeta: {
                            qname: {
                              namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                              localName: 'abstractMark',
                            },
                            fields: {},
                          },
                        },
                      },
                    },
                  },
                  'artRecord:infData': {
                    kind: 'element',
                    xmlName: 'artRecord:infData',
                    namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
                        localName: 'infData',
                      },
                      fields: {
                        'artRecord:objectType': {
                          kind: 'element',
                          xmlName: 'artRecord:objectType',
                          namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
                          cardinality: 'one',
                        },
                        'artRecord:materialsAndTechniques': {
                          kind: 'element',
                          xmlName: 'artRecord:materialsAndTechniques',
                          namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
                          cardinality: 'one',
                        },
                        'artRecord:dimensions': {
                          kind: 'element',
                          xmlName: 'artRecord:dimensions',
                          namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
                          cardinality: 'one',
                        },
                        'artRecord:title': {
                          kind: 'element',
                          xmlName: 'artRecord:title',
                          namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
                          cardinality: 'one',
                        },
                        'artRecord:dateOrPeriod': {
                          kind: 'element',
                          xmlName: 'artRecord:dateOrPeriod',
                          namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
                          cardinality: 'one',
                        },
                        'artRecord:maker': {
                          kind: 'element',
                          xmlName: 'artRecord:maker',
                          namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
                          cardinality: 'one',
                        },
                        'artRecord:subject': {
                          kind: 'element',
                          xmlName: 'artRecord:subject',
                          namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
                          cardinality: 'one',
                        },
                        'artRecord:inscriptionsAndMarkings': {
                          kind: 'element',
                          xmlName: 'artRecord:inscriptionsAndMarkings',
                          namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
                          cardinality: 'one',
                        },
                        'artRecord:features': {
                          kind: 'element',
                          xmlName: 'artRecord:features',
                          namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
                          cardinality: 'one',
                        },
                        'artRecord:reference': {
                          kind: 'element',
                          xmlName: 'artRecord:reference',
                          namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
                          cardinality: 'one',
                        },
                      },
                    },
                  },
                },
              },
            },
            'epp:extension': {
              kind: 'element',
              xmlName: 'epp:extension',
              namespace: 'urn:ietf:params:xml:ns:epp-1.0',
              cardinality: 'one',
              nodeMeta: {
                qname: {
                  namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                  localName: 'extension',
                },
                fields: {
                  'idn:data': {
                    kind: 'element',
                    xmlName: 'idn:data',
                    namespace: 'urn:ietf:params:xml:ns:idn-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:idn-1.0',
                        localName: 'data',
                      },
                      fields: {
                        'idn:table': {
                          kind: 'element',
                          xmlName: 'idn:table',
                          namespace: 'urn:ietf:params:xml:ns:idn-1.0',
                          cardinality: 'one',
                        },
                        'idn:uname': {
                          kind: 'element',
                          xmlName: 'idn:uname',
                          namespace: 'urn:ietf:params:xml:ns:idn-1.0',
                          cardinality: 'one',
                        },
                      },
                    },
                  },
                  'fee:chkData': {
                    kind: 'element',
                    xmlName: 'fee:chkData',
                    namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                    cardinality: 'one',
                    nodeMeta: {
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
                                    namespace:
                                      'urn:ietf:params:xml:ns:epp:fee-1.0',
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
                                    namespace:
                                      'urn:ietf:params:xml:ns:epp:fee-1.0',
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
                                      namespace:
                                        'urn:ietf:params:xml:ns:epp:fee-1.0',
                                      cardinality: 'many',
                                      nodeMeta: {
                                        qname: {
                                          namespace:
                                            'urn:ietf:params:xml:ns:epp:fee-1.0',
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
                                      namespace:
                                        'urn:ietf:params:xml:ns:epp:fee-1.0',
                                      cardinality: 'many',
                                      nodeMeta: {
                                        qname: {
                                          namespace:
                                            'urn:ietf:params:xml:ns:epp:fee-1.0',
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
                                      namespace:
                                        'urn:ietf:params:xml:ns:epp:fee-1.0',
                                      cardinality: 'one',
                                      nodeMeta: {
                                        qname: {
                                          namespace:
                                            'urn:ietf:params:xml:ns:epp:fee-1.0',
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
                                    namespace:
                                      'urn:ietf:params:xml:ns:epp:fee-1.0',
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
                  },
                  'fee:creData': {
                    kind: 'element',
                    xmlName: 'fee:creData',
                    namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                        localName: 'creData',
                      },
                      fields: {
                        'fee:currency': {
                          kind: 'element',
                          xmlName: 'fee:currency',
                          namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                          cardinality: 'one',
                        },
                        'fee:period': {
                          kind: 'element',
                          xmlName: 'fee:period',
                          namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                          cardinality: 'one',
                          nodeMeta: {
                            qname: {
                              namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                              localName: 'period',
                            },
                            fields: {
                              unit: {
                                kind: 'attribute',
                                xmlName: 'unit',
                                cardinality: 'one',
                              },
                            },
                          },
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
                        'fee:balance': {
                          kind: 'element',
                          xmlName: 'fee:balance',
                          namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                          cardinality: 'one',
                        },
                        'fee:creditLimit': {
                          kind: 'element',
                          xmlName: 'fee:creditLimit',
                          namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                          cardinality: 'one',
                        },
                      },
                    },
                  },
                  'fee:renData': {
                    kind: 'element',
                    xmlName: 'fee:renData',
                    namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                        localName: 'renData',
                      },
                      fields: {
                        'fee:currency': {
                          kind: 'element',
                          xmlName: 'fee:currency',
                          namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                          cardinality: 'one',
                        },
                        'fee:period': {
                          kind: 'element',
                          xmlName: 'fee:period',
                          namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                          cardinality: 'one',
                          nodeMeta: {
                            qname: {
                              namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                              localName: 'period',
                            },
                            fields: {
                              unit: {
                                kind: 'attribute',
                                xmlName: 'unit',
                                cardinality: 'one',
                              },
                            },
                          },
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
                        'fee:balance': {
                          kind: 'element',
                          xmlName: 'fee:balance',
                          namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                          cardinality: 'one',
                        },
                        'fee:creditLimit': {
                          kind: 'element',
                          xmlName: 'fee:creditLimit',
                          namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                          cardinality: 'one',
                        },
                      },
                    },
                  },
                  'fee:trnData': {
                    kind: 'element',
                    xmlName: 'fee:trnData',
                    namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                        localName: 'trnData',
                      },
                      fields: {
                        'fee:currency': {
                          kind: 'element',
                          xmlName: 'fee:currency',
                          namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                          cardinality: 'one',
                        },
                        'fee:period': {
                          kind: 'element',
                          xmlName: 'fee:period',
                          namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                          cardinality: 'one',
                          nodeMeta: {
                            qname: {
                              namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                              localName: 'period',
                            },
                            fields: {
                              unit: {
                                kind: 'attribute',
                                xmlName: 'unit',
                                cardinality: 'one',
                              },
                            },
                          },
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
                        'fee:balance': {
                          kind: 'element',
                          xmlName: 'fee:balance',
                          namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                          cardinality: 'one',
                        },
                        'fee:creditLimit': {
                          kind: 'element',
                          xmlName: 'fee:creditLimit',
                          namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                          cardinality: 'one',
                        },
                      },
                    },
                  },
                  'fee:updData': {
                    kind: 'element',
                    xmlName: 'fee:updData',
                    namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                        localName: 'updData',
                      },
                      fields: {
                        'fee:currency': {
                          kind: 'element',
                          xmlName: 'fee:currency',
                          namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                          cardinality: 'one',
                        },
                        'fee:period': {
                          kind: 'element',
                          xmlName: 'fee:period',
                          namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                          cardinality: 'one',
                          nodeMeta: {
                            qname: {
                              namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                              localName: 'period',
                            },
                            fields: {
                              unit: {
                                kind: 'attribute',
                                xmlName: 'unit',
                                cardinality: 'one',
                              },
                            },
                          },
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
                        'fee:balance': {
                          kind: 'element',
                          xmlName: 'fee:balance',
                          namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                          cardinality: 'one',
                        },
                        'fee:creditLimit': {
                          kind: 'element',
                          xmlName: 'fee:creditLimit',
                          namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                          cardinality: 'one',
                        },
                      },
                    },
                  },
                  'fee:delData': {
                    kind: 'element',
                    xmlName: 'fee:delData',
                    namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                        localName: 'delData',
                      },
                      fields: {
                        'fee:currency': {
                          kind: 'element',
                          xmlName: 'fee:currency',
                          namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                          cardinality: 'one',
                        },
                        'fee:period': {
                          kind: 'element',
                          xmlName: 'fee:period',
                          namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                          cardinality: 'one',
                          nodeMeta: {
                            qname: {
                              namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                              localName: 'period',
                            },
                            fields: {
                              unit: {
                                kind: 'attribute',
                                xmlName: 'unit',
                                cardinality: 'one',
                              },
                            },
                          },
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
                        'fee:balance': {
                          kind: 'element',
                          xmlName: 'fee:balance',
                          namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                          cardinality: 'one',
                        },
                        'fee:creditLimit': {
                          kind: 'element',
                          xmlName: 'fee:creditLimit',
                          namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                          cardinality: 'one',
                        },
                      },
                    },
                  },
                  'epp:infData': {
                    kind: 'element',
                    xmlName: 'epp:infData',
                    namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:epp-1.0',
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
                                    namespace:
                                      'urn:ietf:params:xml:ns:secDNS-1.1',
                                    localName: 'keyData',
                                  },
                                  fields: {
                                    'secDNS:flags': {
                                      kind: 'element',
                                      xmlName: 'secDNS:flags',
                                      namespace:
                                        'urn:ietf:params:xml:ns:secDNS-1.1',
                                      cardinality: 'one',
                                    },
                                    'secDNS:protocol': {
                                      kind: 'element',
                                      xmlName: 'secDNS:protocol',
                                      namespace:
                                        'urn:ietf:params:xml:ns:secDNS-1.1',
                                      cardinality: 'one',
                                    },
                                    'secDNS:alg': {
                                      kind: 'element',
                                      xmlName: 'secDNS:alg',
                                      namespace:
                                        'urn:ietf:params:xml:ns:secDNS-1.1',
                                      cardinality: 'one',
                                    },
                                    'secDNS:pubKey': {
                                      kind: 'element',
                                      xmlName: 'secDNS:pubKey',
                                      namespace:
                                        'urn:ietf:params:xml:ns:secDNS-1.1',
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
                  },
                  'rgp:infData': {
                    kind: 'element',
                    xmlName: 'rgp:infData',
                    namespace: 'urn:ietf:params:xml:ns:rgp-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:rgp-1.0',
                        localName: 'infData',
                      },
                      fields: {
                        'rgp:rgpStatus': {
                          kind: 'element',
                          xmlName: 'rgp:rgpStatus',
                          namespace: 'urn:ietf:params:xml:ns:rgp-1.0',
                          cardinality: 'many',
                          nodeMeta: {
                            qname: {
                              namespace: 'urn:ietf:params:xml:ns:rgp-1.0',
                              localName: 'rgpStatus',
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
                  'rgp:upData': {
                    kind: 'element',
                    xmlName: 'rgp:upData',
                    namespace: 'urn:ietf:params:xml:ns:rgp-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:rgp-1.0',
                        localName: 'upData',
                      },
                      fields: {
                        'rgp:rgpStatus': {
                          kind: 'element',
                          xmlName: 'rgp:rgpStatus',
                          namespace: 'urn:ietf:params:xml:ns:rgp-1.0',
                          cardinality: 'many',
                          nodeMeta: {
                            qname: {
                              namespace: 'urn:ietf:params:xml:ns:rgp-1.0',
                              localName: 'rgpStatus',
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
                  'launch:chkData': {
                    kind: 'element',
                    xmlName: 'launch:chkData',
                    namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                        localName: 'chkData',
                      },
                      fields: {
                        'launch:phase': {
                          kind: 'element',
                          xmlName: 'launch:phase',
                          namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                          cardinality: 'one',
                          nodeMeta: {
                            qname: {
                              namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                              localName: 'phase',
                            },
                            fields: {
                              name: {
                                kind: 'attribute',
                                xmlName: 'name',
                                cardinality: 'one',
                              },
                            },
                          },
                        },
                        'launch:cd': {
                          kind: 'element',
                          xmlName: 'launch:cd',
                          namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                          cardinality: 'many',
                          nodeMeta: {
                            qname: {
                              namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                              localName: 'cd',
                            },
                            fields: {
                              'launch:name': {
                                kind: 'element',
                                xmlName: 'launch:name',
                                namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                                cardinality: 'one',
                                nodeMeta: {
                                  qname: {
                                    namespace:
                                      'urn:ietf:params:xml:ns:launch-1.0',
                                    localName: 'name',
                                  },
                                  fields: {
                                    exists: {
                                      kind: 'attribute',
                                      xmlName: 'exists',
                                      cardinality: 'one',
                                    },
                                  },
                                },
                              },
                              'launch:claimKey': {
                                kind: 'element',
                                xmlName: 'launch:claimKey',
                                namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                                cardinality: 'one',
                                nodeMeta: {
                                  qname: {
                                    namespace:
                                      'urn:ietf:params:xml:ns:launch-1.0',
                                    localName: 'claimKey',
                                  },
                                  fields: {
                                    validatorID: {
                                      kind: 'attribute',
                                      xmlName: 'validatorID',
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
                  'launch:creData': {
                    kind: 'element',
                    xmlName: 'launch:creData',
                    namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                        localName: 'creData',
                      },
                      fields: {
                        'launch:phase': {
                          kind: 'element',
                          xmlName: 'launch:phase',
                          namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                          cardinality: 'one',
                          nodeMeta: {
                            qname: {
                              namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                              localName: 'phase',
                            },
                            fields: {
                              name: {
                                kind: 'attribute',
                                xmlName: 'name',
                                cardinality: 'one',
                              },
                            },
                          },
                        },
                        'launch:applicationID': {
                          kind: 'element',
                          xmlName: 'launch:applicationID',
                          namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                          cardinality: 'one',
                        },
                      },
                    },
                  },
                  'launch:infData': {
                    kind: 'element',
                    xmlName: 'launch:infData',
                    namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                        localName: 'infData',
                      },
                      fields: {
                        'launch:phase': {
                          kind: 'element',
                          xmlName: 'launch:phase',
                          namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                          cardinality: 'one',
                          nodeMeta: {
                            qname: {
                              namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                              localName: 'phase',
                            },
                            fields: {
                              name: {
                                kind: 'attribute',
                                xmlName: 'name',
                                cardinality: 'one',
                              },
                            },
                          },
                        },
                        'launch:applicationID': {
                          kind: 'element',
                          xmlName: 'launch:applicationID',
                          namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                          cardinality: 'one',
                        },
                        'launch:status': {
                          kind: 'element',
                          xmlName: 'launch:status',
                          namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                          cardinality: 'one',
                          nodeMeta: {
                            qname: {
                              namespace: 'urn:ietf:params:xml:ns:launch-1.0',
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
                              name: {
                                kind: 'attribute',
                                xmlName: 'name',
                                cardinality: 'one',
                              },
                            },
                          },
                        },
                        'mark:abstractMark': {
                          kind: 'element',
                          xmlName: 'mark:abstractMark',
                          namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                          cardinality: 'many',
                          nodeMeta: {
                            qname: {
                              namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                              localName: 'abstractMark',
                            },
                            fields: {},
                          },
                        },
                      },
                    },
                  },
                  'artRecord:infData': {
                    kind: 'element',
                    xmlName: 'artRecord:infData',
                    namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
                        localName: 'infData',
                      },
                      fields: {
                        'artRecord:objectType': {
                          kind: 'element',
                          xmlName: 'artRecord:objectType',
                          namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
                          cardinality: 'one',
                        },
                        'artRecord:materialsAndTechniques': {
                          kind: 'element',
                          xmlName: 'artRecord:materialsAndTechniques',
                          namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
                          cardinality: 'one',
                        },
                        'artRecord:dimensions': {
                          kind: 'element',
                          xmlName: 'artRecord:dimensions',
                          namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
                          cardinality: 'one',
                        },
                        'artRecord:title': {
                          kind: 'element',
                          xmlName: 'artRecord:title',
                          namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
                          cardinality: 'one',
                        },
                        'artRecord:dateOrPeriod': {
                          kind: 'element',
                          xmlName: 'artRecord:dateOrPeriod',
                          namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
                          cardinality: 'one',
                        },
                        'artRecord:maker': {
                          kind: 'element',
                          xmlName: 'artRecord:maker',
                          namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
                          cardinality: 'one',
                        },
                        'artRecord:subject': {
                          kind: 'element',
                          xmlName: 'artRecord:subject',
                          namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
                          cardinality: 'one',
                        },
                        'artRecord:inscriptionsAndMarkings': {
                          kind: 'element',
                          xmlName: 'artRecord:inscriptionsAndMarkings',
                          namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
                          cardinality: 'one',
                        },
                        'artRecord:features': {
                          kind: 'element',
                          xmlName: 'artRecord:features',
                          namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
                          cardinality: 'one',
                        },
                        'artRecord:reference': {
                          kind: 'element',
                          xmlName: 'artRecord:reference',
                          namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
                          cardinality: 'one',
                        },
                      },
                    },
                  },
                },
              },
            },
            'epp:trID': {
              kind: 'element',
              xmlName: 'epp:trID',
              namespace: 'urn:ietf:params:xml:ns:epp-1.0',
              cardinality: 'one',
              nodeMeta: {
                qname: {
                  namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                  localName: 'trID',
                },
                fields: {
                  'epp:clTRID': {
                    kind: 'element',
                    xmlName: 'epp:clTRID',
                    namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                    cardinality: 'one',
                  },
                  'epp:svTRID': {
                    kind: 'element',
                    xmlName: 'epp:svTRID',
                    namespace: 'urn:ietf:params:xml:ns:epp-1.0',
                    cardinality: 'one',
                  },
                },
              },
            },
          },
        },
      },
      'epp:extension': {
        kind: 'element',
        xmlName: 'epp:extension',
        namespace: 'urn:ietf:params:xml:ns:epp-1.0',
        cardinality: 'one',
        nodeMeta: {
          qname: {
            namespace: 'urn:ietf:params:xml:ns:epp-1.0',
            localName: 'extension',
          },
          fields: {
            'fee:check': {
              kind: 'element',
              xmlName: 'fee:check',
              namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
              cardinality: 'one',
              nodeMeta: {
                qname: {
                  namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                  localName: 'check',
                },
                fields: {
                  'fee:currency': {
                    kind: 'element',
                    xmlName: 'fee:currency',
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
                        name: {
                          kind: 'attribute',
                          xmlName: 'name',
                          cardinality: 'one',
                        },
                        customName: {
                          kind: 'attribute',
                          xmlName: 'customName',
                          cardinality: 'one',
                        },
                        phase: {
                          kind: 'attribute',
                          xmlName: 'phase',
                          cardinality: 'one',
                        },
                        subphase: {
                          kind: 'attribute',
                          xmlName: 'subphase',
                          cardinality: 'one',
                        },
                        'fee:period': {
                          kind: 'element',
                          xmlName: 'fee:period',
                          namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                          cardinality: 'one',
                          nodeMeta: {
                            qname: {
                              namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                              localName: 'period',
                            },
                            fields: {
                              unit: {
                                kind: 'attribute',
                                xmlName: 'unit',
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
            'fee:create': {
              kind: 'element',
              xmlName: 'fee:create',
              namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
              cardinality: 'one',
              nodeMeta: {
                qname: {
                  namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                  localName: 'create',
                },
                fields: {
                  'fee:currency': {
                    kind: 'element',
                    xmlName: 'fee:currency',
                    namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
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
                },
              },
            },
            'fee:renew': {
              kind: 'element',
              xmlName: 'fee:renew',
              namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
              cardinality: 'one',
              nodeMeta: {
                qname: {
                  namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                  localName: 'renew',
                },
                fields: {
                  'fee:currency': {
                    kind: 'element',
                    xmlName: 'fee:currency',
                    namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
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
                },
              },
            },
            'fee:transfer': {
              kind: 'element',
              xmlName: 'fee:transfer',
              namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
              cardinality: 'one',
              nodeMeta: {
                qname: {
                  namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                  localName: 'transfer',
                },
                fields: {
                  'fee:currency': {
                    kind: 'element',
                    xmlName: 'fee:currency',
                    namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
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
                },
              },
            },
            'fee:update': {
              kind: 'element',
              xmlName: 'fee:update',
              namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
              cardinality: 'one',
              nodeMeta: {
                qname: {
                  namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                  localName: 'update',
                },
                fields: {
                  'fee:currency': {
                    kind: 'element',
                    xmlName: 'fee:currency',
                    namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
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
                },
              },
            },
            'fee:chkData': {
              kind: 'element',
              xmlName: 'fee:chkData',
              namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
              cardinality: 'one',
              nodeMeta: {
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
                                    namespace:
                                      'urn:ietf:params:xml:ns:epp:fee-1.0',
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
                                    namespace:
                                      'urn:ietf:params:xml:ns:epp:fee-1.0',
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
                                    namespace:
                                      'urn:ietf:params:xml:ns:epp:fee-1.0',
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
            },
            'fee:creData': {
              kind: 'element',
              xmlName: 'fee:creData',
              namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
              cardinality: 'one',
              nodeMeta: {
                qname: {
                  namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                  localName: 'creData',
                },
                fields: {
                  'fee:currency': {
                    kind: 'element',
                    xmlName: 'fee:currency',
                    namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                    cardinality: 'one',
                  },
                  'fee:period': {
                    kind: 'element',
                    xmlName: 'fee:period',
                    namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                        localName: 'period',
                      },
                      fields: {
                        unit: {
                          kind: 'attribute',
                          xmlName: 'unit',
                          cardinality: 'one',
                        },
                      },
                    },
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
                  'fee:balance': {
                    kind: 'element',
                    xmlName: 'fee:balance',
                    namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                    cardinality: 'one',
                  },
                  'fee:creditLimit': {
                    kind: 'element',
                    xmlName: 'fee:creditLimit',
                    namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                    cardinality: 'one',
                  },
                },
              },
            },
            'fee:renData': {
              kind: 'element',
              xmlName: 'fee:renData',
              namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
              cardinality: 'one',
              nodeMeta: {
                qname: {
                  namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                  localName: 'renData',
                },
                fields: {
                  'fee:currency': {
                    kind: 'element',
                    xmlName: 'fee:currency',
                    namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                    cardinality: 'one',
                  },
                  'fee:period': {
                    kind: 'element',
                    xmlName: 'fee:period',
                    namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                        localName: 'period',
                      },
                      fields: {
                        unit: {
                          kind: 'attribute',
                          xmlName: 'unit',
                          cardinality: 'one',
                        },
                      },
                    },
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
                  'fee:balance': {
                    kind: 'element',
                    xmlName: 'fee:balance',
                    namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                    cardinality: 'one',
                  },
                  'fee:creditLimit': {
                    kind: 'element',
                    xmlName: 'fee:creditLimit',
                    namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                    cardinality: 'one',
                  },
                },
              },
            },
            'fee:trnData': {
              kind: 'element',
              xmlName: 'fee:trnData',
              namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
              cardinality: 'one',
              nodeMeta: {
                qname: {
                  namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                  localName: 'trnData',
                },
                fields: {
                  'fee:currency': {
                    kind: 'element',
                    xmlName: 'fee:currency',
                    namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                    cardinality: 'one',
                  },
                  'fee:period': {
                    kind: 'element',
                    xmlName: 'fee:period',
                    namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                        localName: 'period',
                      },
                      fields: {
                        unit: {
                          kind: 'attribute',
                          xmlName: 'unit',
                          cardinality: 'one',
                        },
                      },
                    },
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
                  'fee:balance': {
                    kind: 'element',
                    xmlName: 'fee:balance',
                    namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                    cardinality: 'one',
                  },
                  'fee:creditLimit': {
                    kind: 'element',
                    xmlName: 'fee:creditLimit',
                    namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                    cardinality: 'one',
                  },
                },
              },
            },
            'fee:updData': {
              kind: 'element',
              xmlName: 'fee:updData',
              namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
              cardinality: 'one',
              nodeMeta: {
                qname: {
                  namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                  localName: 'updData',
                },
                fields: {
                  'fee:currency': {
                    kind: 'element',
                    xmlName: 'fee:currency',
                    namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                    cardinality: 'one',
                  },
                  'fee:period': {
                    kind: 'element',
                    xmlName: 'fee:period',
                    namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                        localName: 'period',
                      },
                      fields: {
                        unit: {
                          kind: 'attribute',
                          xmlName: 'unit',
                          cardinality: 'one',
                        },
                      },
                    },
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
                  'fee:balance': {
                    kind: 'element',
                    xmlName: 'fee:balance',
                    namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                    cardinality: 'one',
                  },
                  'fee:creditLimit': {
                    kind: 'element',
                    xmlName: 'fee:creditLimit',
                    namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                    cardinality: 'one',
                  },
                },
              },
            },
            'fee:delData': {
              kind: 'element',
              xmlName: 'fee:delData',
              namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
              cardinality: 'one',
              nodeMeta: {
                qname: {
                  namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                  localName: 'delData',
                },
                fields: {
                  'fee:currency': {
                    kind: 'element',
                    xmlName: 'fee:currency',
                    namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                    cardinality: 'one',
                  },
                  'fee:period': {
                    kind: 'element',
                    xmlName: 'fee:period',
                    namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                        localName: 'period',
                      },
                      fields: {
                        unit: {
                          kind: 'attribute',
                          xmlName: 'unit',
                          cardinality: 'one',
                        },
                      },
                    },
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
                  'fee:balance': {
                    kind: 'element',
                    xmlName: 'fee:balance',
                    namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                    cardinality: 'one',
                  },
                  'fee:creditLimit': {
                    kind: 'element',
                    xmlName: 'fee:creditLimit',
                    namespace: 'urn:ietf:params:xml:ns:epp:fee-1.0',
                    cardinality: 'one',
                  },
                },
              },
            },
            'secDNS:create': {
              kind: 'element',
              xmlName: 'secDNS:create',
              namespace: 'urn:ietf:params:xml:ns:secDNS-1.1',
              cardinality: 'one',
              nodeMeta: {
                qname: {
                  namespace: 'urn:ietf:params:xml:ns:secDNS-1.1',
                  localName: 'create',
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
            },
            'secDNS:update': {
              kind: 'element',
              xmlName: 'secDNS:update',
              namespace: 'urn:ietf:params:xml:ns:secDNS-1.1',
              cardinality: 'one',
              nodeMeta: {
                qname: {
                  namespace: 'urn:ietf:params:xml:ns:secDNS-1.1',
                  localName: 'update',
                },
                fields: {
                  urgent: {
                    kind: 'attribute',
                    xmlName: 'urgent',
                    cardinality: 'one',
                  },
                  'secDNS:rem': {
                    kind: 'element',
                    xmlName: 'secDNS:rem',
                    namespace: 'urn:ietf:params:xml:ns:secDNS-1.1',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:secDNS-1.1',
                        localName: 'rem',
                      },
                      fields: {
                        'secDNS:all': {
                          kind: 'element',
                          xmlName: 'secDNS:all',
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
                                    namespace:
                                      'urn:ietf:params:xml:ns:secDNS-1.1',
                                    localName: 'keyData',
                                  },
                                  fields: {
                                    'secDNS:flags': {
                                      kind: 'element',
                                      xmlName: 'secDNS:flags',
                                      namespace:
                                        'urn:ietf:params:xml:ns:secDNS-1.1',
                                      cardinality: 'one',
                                    },
                                    'secDNS:protocol': {
                                      kind: 'element',
                                      xmlName: 'secDNS:protocol',
                                      namespace:
                                        'urn:ietf:params:xml:ns:secDNS-1.1',
                                      cardinality: 'one',
                                    },
                                    'secDNS:alg': {
                                      kind: 'element',
                                      xmlName: 'secDNS:alg',
                                      namespace:
                                        'urn:ietf:params:xml:ns:secDNS-1.1',
                                      cardinality: 'one',
                                    },
                                    'secDNS:pubKey': {
                                      kind: 'element',
                                      xmlName: 'secDNS:pubKey',
                                      namespace:
                                        'urn:ietf:params:xml:ns:secDNS-1.1',
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
                  },
                  'secDNS:add': {
                    kind: 'element',
                    xmlName: 'secDNS:add',
                    namespace: 'urn:ietf:params:xml:ns:secDNS-1.1',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:secDNS-1.1',
                        localName: 'add',
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
                                    namespace:
                                      'urn:ietf:params:xml:ns:secDNS-1.1',
                                    localName: 'keyData',
                                  },
                                  fields: {
                                    'secDNS:flags': {
                                      kind: 'element',
                                      xmlName: 'secDNS:flags',
                                      namespace:
                                        'urn:ietf:params:xml:ns:secDNS-1.1',
                                      cardinality: 'one',
                                    },
                                    'secDNS:protocol': {
                                      kind: 'element',
                                      xmlName: 'secDNS:protocol',
                                      namespace:
                                        'urn:ietf:params:xml:ns:secDNS-1.1',
                                      cardinality: 'one',
                                    },
                                    'secDNS:alg': {
                                      kind: 'element',
                                      xmlName: 'secDNS:alg',
                                      namespace:
                                        'urn:ietf:params:xml:ns:secDNS-1.1',
                                      cardinality: 'one',
                                    },
                                    'secDNS:pubKey': {
                                      kind: 'element',
                                      xmlName: 'secDNS:pubKey',
                                      namespace:
                                        'urn:ietf:params:xml:ns:secDNS-1.1',
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
                  },
                  'secDNS:chg': {
                    kind: 'element',
                    xmlName: 'secDNS:chg',
                    namespace: 'urn:ietf:params:xml:ns:secDNS-1.1',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:secDNS-1.1',
                        localName: 'chg',
                      },
                      fields: {
                        'secDNS:maxSigLife': {
                          kind: 'element',
                          xmlName: 'secDNS:maxSigLife',
                          namespace: 'urn:ietf:params:xml:ns:secDNS-1.1',
                          cardinality: 'one',
                        },
                      },
                    },
                  },
                },
              },
            },
            'epp:infData': {
              kind: 'element',
              xmlName: 'epp:infData',
              namespace: 'urn:ietf:params:xml:ns:epp-1.0',
              cardinality: 'one',
              nodeMeta: {
                qname: {
                  namespace: 'urn:ietf:params:xml:ns:epp-1.0',
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
            },
            'idn:data': {
              kind: 'element',
              xmlName: 'idn:data',
              namespace: 'urn:ietf:params:xml:ns:idn-1.0',
              cardinality: 'one',
              nodeMeta: {
                qname: {
                  namespace: 'urn:ietf:params:xml:ns:idn-1.0',
                  localName: 'data',
                },
                fields: {
                  'idn:table': {
                    kind: 'element',
                    xmlName: 'idn:table',
                    namespace: 'urn:ietf:params:xml:ns:idn-1.0',
                    cardinality: 'one',
                  },
                  'idn:uname': {
                    kind: 'element',
                    xmlName: 'idn:uname',
                    namespace: 'urn:ietf:params:xml:ns:idn-1.0',
                    cardinality: 'one',
                  },
                },
              },
            },
            'epp:rgp:update': {
              kind: 'element',
              xmlName: 'epp:rgp:update',
              namespace: 'urn:ietf:params:xml:ns:epp-1.0',
              cardinality: 'one',
            },
            'rgp:infData': {
              kind: 'element',
              xmlName: 'rgp:infData',
              namespace: 'urn:ietf:params:xml:ns:rgp-1.0',
              cardinality: 'one',
              nodeMeta: {
                qname: {
                  namespace: 'urn:ietf:params:xml:ns:rgp-1.0',
                  localName: 'infData',
                },
                fields: {
                  'rgp:rgpStatus': {
                    kind: 'element',
                    xmlName: 'rgp:rgpStatus',
                    namespace: 'urn:ietf:params:xml:ns:rgp-1.0',
                    cardinality: 'many',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:rgp-1.0',
                        localName: 'rgpStatus',
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
            'rgp:upData': {
              kind: 'element',
              xmlName: 'rgp:upData',
              namespace: 'urn:ietf:params:xml:ns:rgp-1.0',
              cardinality: 'one',
              nodeMeta: {
                qname: {
                  namespace: 'urn:ietf:params:xml:ns:rgp-1.0',
                  localName: 'upData',
                },
                fields: {
                  'rgp:rgpStatus': {
                    kind: 'element',
                    xmlName: 'rgp:rgpStatus',
                    namespace: 'urn:ietf:params:xml:ns:rgp-1.0',
                    cardinality: 'many',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:rgp-1.0',
                        localName: 'rgpStatus',
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
            'launch:check': {
              kind: 'element',
              xmlName: 'launch:check',
              namespace: 'urn:ietf:params:xml:ns:launch-1.0',
              cardinality: 'one',
              nodeMeta: {
                qname: {
                  namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                  localName: 'check',
                },
                fields: {
                  type: {
                    kind: 'attribute',
                    xmlName: 'type',
                    cardinality: 'one',
                  },
                  'launch:phase': {
                    kind: 'element',
                    xmlName: 'launch:phase',
                    namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                        localName: 'phase',
                      },
                      fields: {
                        name: {
                          kind: 'attribute',
                          xmlName: 'name',
                          cardinality: 'one',
                        },
                      },
                    },
                  },
                },
              },
            },
            'launch:info': {
              kind: 'element',
              xmlName: 'launch:info',
              namespace: 'urn:ietf:params:xml:ns:launch-1.0',
              cardinality: 'one',
              nodeMeta: {
                qname: {
                  namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                  localName: 'info',
                },
                fields: {
                  includeMark: {
                    kind: 'attribute',
                    xmlName: 'includeMark',
                    cardinality: 'one',
                  },
                  'launch:phase': {
                    kind: 'element',
                    xmlName: 'launch:phase',
                    namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                        localName: 'phase',
                      },
                      fields: {
                        name: {
                          kind: 'attribute',
                          xmlName: 'name',
                          cardinality: 'one',
                        },
                      },
                    },
                  },
                  'launch:applicationID': {
                    kind: 'element',
                    xmlName: 'launch:applicationID',
                    namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                    cardinality: 'one',
                  },
                },
              },
            },
            'launch:create': {
              kind: 'element',
              xmlName: 'launch:create',
              namespace: 'urn:ietf:params:xml:ns:launch-1.0',
              cardinality: 'one',
              nodeMeta: {
                qname: {
                  namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                  localName: 'create',
                },
                fields: {
                  type: {
                    kind: 'attribute',
                    xmlName: 'type',
                    cardinality: 'one',
                  },
                  'launch:phase': {
                    kind: 'element',
                    xmlName: 'launch:phase',
                    namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                        localName: 'phase',
                      },
                      fields: {
                        name: {
                          kind: 'attribute',
                          xmlName: 'name',
                          cardinality: 'one',
                        },
                      },
                    },
                  },
                  'launch:notice': {
                    kind: 'element',
                    xmlName: 'launch:notice',
                    namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                        localName: 'notice',
                      },
                      fields: {
                        'launch:noticeID': {
                          kind: 'element',
                          xmlName: 'launch:noticeID',
                          namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                          cardinality: 'one',
                          nodeMeta: {
                            qname: {
                              namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                              localName: 'noticeID',
                            },
                            fields: {
                              validatorID: {
                                kind: 'attribute',
                                xmlName: 'validatorID',
                                cardinality: 'one',
                              },
                            },
                          },
                        },
                        'launch:notAfter': {
                          kind: 'element',
                          xmlName: 'launch:notAfter',
                          namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                          cardinality: 'one',
                        },
                        'launch:acceptedDate': {
                          kind: 'element',
                          xmlName: 'launch:acceptedDate',
                          namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                          cardinality: 'one',
                        },
                      },
                    },
                  },
                  'launch:codeMark': {
                    kind: 'element',
                    xmlName: 'launch:codeMark',
                    namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                    cardinality: 'many',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                        localName: 'codeMark',
                      },
                      fields: {
                        'launch:code': {
                          kind: 'element',
                          xmlName: 'launch:code',
                          namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                          cardinality: 'one',
                          nodeMeta: {
                            qname: {
                              namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                              localName: 'code',
                            },
                            fields: {
                              validatorID: {
                                kind: 'attribute',
                                xmlName: 'validatorID',
                                cardinality: 'one',
                              },
                            },
                          },
                        },
                        'mark:abstractMark': {
                          kind: 'element',
                          xmlName: 'mark:abstractMark',
                          namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                          cardinality: 'one',
                          nodeMeta: {
                            qname: {
                              namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                              localName: 'abstractMark',
                            },
                            fields: {},
                          },
                        },
                      },
                    },
                  },
                  'smd:abstractSignedMark': {
                    kind: 'element',
                    xmlName: 'smd:abstractSignedMark',
                    namespace: 'urn:ietf:params:xml:ns:signedMark-1.0',
                    cardinality: 'many',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:signedMark-1.0',
                        localName: 'abstractSignedMark',
                      },
                      fields: {},
                    },
                  },
                  'smd:encodedSignedMark': {
                    kind: 'element',
                    xmlName: 'smd:encodedSignedMark',
                    namespace: 'urn:ietf:params:xml:ns:signedMark-1.0',
                    cardinality: 'many',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:signedMark-1.0',
                        localName: 'encodedSignedMark',
                      },
                      fields: {
                        encoding: {
                          kind: 'attribute',
                          xmlName: 'encoding',
                          cardinality: 'one',
                        },
                      },
                    },
                  },
                },
              },
            },
            'launch:update': {
              kind: 'element',
              xmlName: 'launch:update',
              namespace: 'urn:ietf:params:xml:ns:launch-1.0',
              cardinality: 'one',
              nodeMeta: {
                qname: {
                  namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                  localName: 'update',
                },
                fields: {
                  'launch:phase': {
                    kind: 'element',
                    xmlName: 'launch:phase',
                    namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                        localName: 'phase',
                      },
                      fields: {
                        name: {
                          kind: 'attribute',
                          xmlName: 'name',
                          cardinality: 'one',
                        },
                      },
                    },
                  },
                  'launch:applicationID': {
                    kind: 'element',
                    xmlName: 'launch:applicationID',
                    namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                    cardinality: 'one',
                  },
                },
              },
            },
            'launch:delete': {
              kind: 'element',
              xmlName: 'launch:delete',
              namespace: 'urn:ietf:params:xml:ns:launch-1.0',
              cardinality: 'one',
              nodeMeta: {
                qname: {
                  namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                  localName: 'delete',
                },
                fields: {
                  'launch:phase': {
                    kind: 'element',
                    xmlName: 'launch:phase',
                    namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                        localName: 'phase',
                      },
                      fields: {
                        name: {
                          kind: 'attribute',
                          xmlName: 'name',
                          cardinality: 'one',
                        },
                      },
                    },
                  },
                  'launch:applicationID': {
                    kind: 'element',
                    xmlName: 'launch:applicationID',
                    namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                    cardinality: 'one',
                  },
                },
              },
            },
            'launch:chkData': {
              kind: 'element',
              xmlName: 'launch:chkData',
              namespace: 'urn:ietf:params:xml:ns:launch-1.0',
              cardinality: 'one',
              nodeMeta: {
                qname: {
                  namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                  localName: 'chkData',
                },
                fields: {
                  'launch:phase': {
                    kind: 'element',
                    xmlName: 'launch:phase',
                    namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                        localName: 'phase',
                      },
                      fields: {
                        name: {
                          kind: 'attribute',
                          xmlName: 'name',
                          cardinality: 'one',
                        },
                      },
                    },
                  },
                  'launch:cd': {
                    kind: 'element',
                    xmlName: 'launch:cd',
                    namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                    cardinality: 'many',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                        localName: 'cd',
                      },
                      fields: {
                        'launch:name': {
                          kind: 'element',
                          xmlName: 'launch:name',
                          namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                          cardinality: 'one',
                          nodeMeta: {
                            qname: {
                              namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                              localName: 'name',
                            },
                            fields: {
                              exists: {
                                kind: 'attribute',
                                xmlName: 'exists',
                                cardinality: 'one',
                              },
                            },
                          },
                        },
                        'launch:claimKey': {
                          kind: 'element',
                          xmlName: 'launch:claimKey',
                          namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                          cardinality: 'one',
                          nodeMeta: {
                            qname: {
                              namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                              localName: 'claimKey',
                            },
                            fields: {
                              validatorID: {
                                kind: 'attribute',
                                xmlName: 'validatorID',
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
            'launch:creData': {
              kind: 'element',
              xmlName: 'launch:creData',
              namespace: 'urn:ietf:params:xml:ns:launch-1.0',
              cardinality: 'one',
              nodeMeta: {
                qname: {
                  namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                  localName: 'creData',
                },
                fields: {
                  'launch:phase': {
                    kind: 'element',
                    xmlName: 'launch:phase',
                    namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                        localName: 'phase',
                      },
                      fields: {
                        name: {
                          kind: 'attribute',
                          xmlName: 'name',
                          cardinality: 'one',
                        },
                      },
                    },
                  },
                  'launch:applicationID': {
                    kind: 'element',
                    xmlName: 'launch:applicationID',
                    namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                    cardinality: 'one',
                  },
                },
              },
            },
            'launch:infData': {
              kind: 'element',
              xmlName: 'launch:infData',
              namespace: 'urn:ietf:params:xml:ns:launch-1.0',
              cardinality: 'one',
              nodeMeta: {
                qname: {
                  namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                  localName: 'infData',
                },
                fields: {
                  'launch:phase': {
                    kind: 'element',
                    xmlName: 'launch:phase',
                    namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                        localName: 'phase',
                      },
                      fields: {
                        name: {
                          kind: 'attribute',
                          xmlName: 'name',
                          cardinality: 'one',
                        },
                      },
                    },
                  },
                  'launch:applicationID': {
                    kind: 'element',
                    xmlName: 'launch:applicationID',
                    namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                    cardinality: 'one',
                  },
                  'launch:status': {
                    kind: 'element',
                    xmlName: 'launch:status',
                    namespace: 'urn:ietf:params:xml:ns:launch-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:launch-1.0',
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
                        name: {
                          kind: 'attribute',
                          xmlName: 'name',
                          cardinality: 'one',
                        },
                      },
                    },
                  },
                  'mark:abstractMark': {
                    kind: 'element',
                    xmlName: 'mark:abstractMark',
                    namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                    cardinality: 'many',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                        localName: 'abstractMark',
                      },
                      fields: {},
                    },
                  },
                },
              },
            },
            'artRecord:create': {
              kind: 'element',
              xmlName: 'artRecord:create',
              namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
              cardinality: 'one',
              nodeMeta: {
                qname: {
                  namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
                  localName: 'create',
                },
                fields: {
                  'artRecord:objectType': {
                    kind: 'element',
                    xmlName: 'artRecord:objectType',
                    namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
                    cardinality: 'one',
                  },
                  'artRecord:materialsAndTechniques': {
                    kind: 'element',
                    xmlName: 'artRecord:materialsAndTechniques',
                    namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
                    cardinality: 'one',
                  },
                  'artRecord:dimensions': {
                    kind: 'element',
                    xmlName: 'artRecord:dimensions',
                    namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
                    cardinality: 'one',
                  },
                  'artRecord:title': {
                    kind: 'element',
                    xmlName: 'artRecord:title',
                    namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
                    cardinality: 'one',
                  },
                  'artRecord:dateOrPeriod': {
                    kind: 'element',
                    xmlName: 'artRecord:dateOrPeriod',
                    namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
                    cardinality: 'one',
                  },
                  'artRecord:maker': {
                    kind: 'element',
                    xmlName: 'artRecord:maker',
                    namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
                    cardinality: 'one',
                  },
                  'artRecord:subject': {
                    kind: 'element',
                    xmlName: 'artRecord:subject',
                    namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
                    cardinality: 'one',
                  },
                  'artRecord:inscriptionsAndMarkings': {
                    kind: 'element',
                    xmlName: 'artRecord:inscriptionsAndMarkings',
                    namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
                    cardinality: 'one',
                  },
                  'artRecord:features': {
                    kind: 'element',
                    xmlName: 'artRecord:features',
                    namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
                    cardinality: 'one',
                  },
                  'artRecord:reference': {
                    kind: 'element',
                    xmlName: 'artRecord:reference',
                    namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
                    cardinality: 'one',
                  },
                },
              },
            },
            'artRecord:update': {
              kind: 'element',
              xmlName: 'artRecord:update',
              namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
              cardinality: 'one',
              nodeMeta: {
                qname: {
                  namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
                  localName: 'update',
                },
                fields: {
                  'artRecord:objectType': {
                    kind: 'element',
                    xmlName: 'artRecord:objectType',
                    namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
                    cardinality: 'one',
                  },
                  'artRecord:materialsAndTechniques': {
                    kind: 'element',
                    xmlName: 'artRecord:materialsAndTechniques',
                    namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
                    cardinality: 'one',
                  },
                  'artRecord:dimensions': {
                    kind: 'element',
                    xmlName: 'artRecord:dimensions',
                    namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
                    cardinality: 'one',
                  },
                  'artRecord:title': {
                    kind: 'element',
                    xmlName: 'artRecord:title',
                    namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
                    cardinality: 'one',
                  },
                  'artRecord:dateOrPeriod': {
                    kind: 'element',
                    xmlName: 'artRecord:dateOrPeriod',
                    namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
                    cardinality: 'one',
                  },
                  'artRecord:maker': {
                    kind: 'element',
                    xmlName: 'artRecord:maker',
                    namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
                    cardinality: 'one',
                  },
                  'artRecord:subject': {
                    kind: 'element',
                    xmlName: 'artRecord:subject',
                    namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
                    cardinality: 'one',
                  },
                  'artRecord:inscriptionsAndMarkings': {
                    kind: 'element',
                    xmlName: 'artRecord:inscriptionsAndMarkings',
                    namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
                    cardinality: 'one',
                  },
                  'artRecord:features': {
                    kind: 'element',
                    xmlName: 'artRecord:features',
                    namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
                    cardinality: 'one',
                  },
                  'artRecord:reference': {
                    kind: 'element',
                    xmlName: 'artRecord:reference',
                    namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
                    cardinality: 'one',
                  },
                },
              },
            },
            'artRecord:infData': {
              kind: 'element',
              xmlName: 'artRecord:infData',
              namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
              cardinality: 'one',
              nodeMeta: {
                qname: {
                  namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
                  localName: 'infData',
                },
                fields: {
                  'artRecord:objectType': {
                    kind: 'element',
                    xmlName: 'artRecord:objectType',
                    namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
                    cardinality: 'one',
                  },
                  'artRecord:materialsAndTechniques': {
                    kind: 'element',
                    xmlName: 'artRecord:materialsAndTechniques',
                    namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
                    cardinality: 'one',
                  },
                  'artRecord:dimensions': {
                    kind: 'element',
                    xmlName: 'artRecord:dimensions',
                    namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
                    cardinality: 'one',
                  },
                  'artRecord:title': {
                    kind: 'element',
                    xmlName: 'artRecord:title',
                    namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
                    cardinality: 'one',
                  },
                  'artRecord:dateOrPeriod': {
                    kind: 'element',
                    xmlName: 'artRecord:dateOrPeriod',
                    namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
                    cardinality: 'one',
                  },
                  'artRecord:maker': {
                    kind: 'element',
                    xmlName: 'artRecord:maker',
                    namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
                    cardinality: 'one',
                  },
                  'artRecord:subject': {
                    kind: 'element',
                    xmlName: 'artRecord:subject',
                    namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
                    cardinality: 'one',
                  },
                  'artRecord:inscriptionsAndMarkings': {
                    kind: 'element',
                    xmlName: 'artRecord:inscriptionsAndMarkings',
                    namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
                    cardinality: 'one',
                  },
                  'artRecord:features': {
                    kind: 'element',
                    xmlName: 'artRecord:features',
                    namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
                    cardinality: 'one',
                  },
                  'artRecord:reference': {
                    kind: 'element',
                    xmlName: 'artRecord:reference',
                    namespace: 'urn:ietf:params:xml:ns:artRecord-0.2',
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
