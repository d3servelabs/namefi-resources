/**
 * Static XmlMeta for mark
 * Generated from: urn:ietf:params:xml:ns:mark-1.0
 *
 * @generated - Do not edit manually
 */

import type { XmlMeta } from './types';

export const MarkMarkMeta: XmlMeta = {
  strategyId: 'fxp-v1',
  root: {
    qname: { namespace: 'urn:ietf:params:xml:ns:mark-1.0', localName: 'mark' },
    fields: {
      'mark:trademark': {
        kind: 'element',
        xmlName: 'mark:trademark',
        namespace: 'urn:ietf:params:xml:ns:mark-1.0',
        cardinality: 'many',
        nodeMeta: {
          qname: {
            namespace: 'urn:ietf:params:xml:ns:mark-1.0',
            localName: 'trademark',
          },
          fields: {
            'mark:id': {
              kind: 'element',
              xmlName: 'mark:id',
              namespace: 'urn:ietf:params:xml:ns:mark-1.0',
              cardinality: 'one',
            },
            'mark:markName': {
              kind: 'element',
              xmlName: 'mark:markName',
              namespace: 'urn:ietf:params:xml:ns:mark-1.0',
              cardinality: 'one',
            },
            'mark:holder': {
              kind: 'element',
              xmlName: 'mark:holder',
              namespace: 'urn:ietf:params:xml:ns:mark-1.0',
              cardinality: 'many',
              nodeMeta: {
                qname: {
                  namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                  localName: 'holder',
                },
                fields: {
                  entitlement: {
                    kind: 'attribute',
                    xmlName: 'entitlement',
                    cardinality: 'one',
                  },
                  'mark:name': {
                    kind: 'element',
                    xmlName: 'mark:name',
                    namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                    cardinality: 'one',
                  },
                  'mark:org': {
                    kind: 'element',
                    xmlName: 'mark:org',
                    namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                    cardinality: 'one',
                  },
                  'mark:addr': {
                    kind: 'element',
                    xmlName: 'mark:addr',
                    namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                        localName: 'addr',
                      },
                      fields: {
                        'mark:street': {
                          kind: 'element',
                          xmlName: 'mark:street',
                          namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                          cardinality: 'many',
                        },
                        'mark:city': {
                          kind: 'element',
                          xmlName: 'mark:city',
                          namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                          cardinality: 'one',
                        },
                        'mark:sp': {
                          kind: 'element',
                          xmlName: 'mark:sp',
                          namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                          cardinality: 'one',
                        },
                        'mark:pc': {
                          kind: 'element',
                          xmlName: 'mark:pc',
                          namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                          cardinality: 'one',
                        },
                        'mark:cc': {
                          kind: 'element',
                          xmlName: 'mark:cc',
                          namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                          cardinality: 'one',
                        },
                      },
                    },
                  },
                  'mark:voice': {
                    kind: 'element',
                    xmlName: 'mark:voice',
                    namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:mark-1.0',
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
                  'mark:fax': {
                    kind: 'element',
                    xmlName: 'mark:fax',
                    namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:mark-1.0',
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
                  'mark:email': {
                    kind: 'element',
                    xmlName: 'mark:email',
                    namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                    cardinality: 'one',
                  },
                },
              },
            },
            'mark:contact': {
              kind: 'element',
              xmlName: 'mark:contact',
              namespace: 'urn:ietf:params:xml:ns:mark-1.0',
              cardinality: 'many',
              nodeMeta: {
                qname: {
                  namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                  localName: 'contact',
                },
                fields: {
                  type: {
                    kind: 'attribute',
                    xmlName: 'type',
                    cardinality: 'one',
                  },
                  'mark:name': {
                    kind: 'element',
                    xmlName: 'mark:name',
                    namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                    cardinality: 'one',
                  },
                  'mark:org': {
                    kind: 'element',
                    xmlName: 'mark:org',
                    namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                    cardinality: 'one',
                  },
                  'mark:addr': {
                    kind: 'element',
                    xmlName: 'mark:addr',
                    namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                        localName: 'addr',
                      },
                      fields: {
                        'mark:street': {
                          kind: 'element',
                          xmlName: 'mark:street',
                          namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                          cardinality: 'many',
                        },
                        'mark:city': {
                          kind: 'element',
                          xmlName: 'mark:city',
                          namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                          cardinality: 'one',
                        },
                        'mark:sp': {
                          kind: 'element',
                          xmlName: 'mark:sp',
                          namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                          cardinality: 'one',
                        },
                        'mark:pc': {
                          kind: 'element',
                          xmlName: 'mark:pc',
                          namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                          cardinality: 'one',
                        },
                        'mark:cc': {
                          kind: 'element',
                          xmlName: 'mark:cc',
                          namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                          cardinality: 'one',
                        },
                      },
                    },
                  },
                  'mark:voice': {
                    kind: 'element',
                    xmlName: 'mark:voice',
                    namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:mark-1.0',
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
                  'mark:fax': {
                    kind: 'element',
                    xmlName: 'mark:fax',
                    namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:mark-1.0',
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
                  'mark:email': {
                    kind: 'element',
                    xmlName: 'mark:email',
                    namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                    cardinality: 'one',
                  },
                },
              },
            },
            'mark:jurisdiction': {
              kind: 'element',
              xmlName: 'mark:jurisdiction',
              namespace: 'urn:ietf:params:xml:ns:mark-1.0',
              cardinality: 'one',
            },
            'mark:class': {
              kind: 'element',
              xmlName: 'mark:class',
              namespace: 'urn:ietf:params:xml:ns:mark-1.0',
              cardinality: 'many',
            },
            'mark:label': {
              kind: 'element',
              xmlName: 'mark:label',
              namespace: 'urn:ietf:params:xml:ns:mark-1.0',
              cardinality: 'many',
            },
            'mark:goodsAndServices': {
              kind: 'element',
              xmlName: 'mark:goodsAndServices',
              namespace: 'urn:ietf:params:xml:ns:mark-1.0',
              cardinality: 'one',
            },
            'mark:apId': {
              kind: 'element',
              xmlName: 'mark:apId',
              namespace: 'urn:ietf:params:xml:ns:mark-1.0',
              cardinality: 'one',
            },
            'mark:apDate': {
              kind: 'element',
              xmlName: 'mark:apDate',
              namespace: 'urn:ietf:params:xml:ns:mark-1.0',
              cardinality: 'one',
            },
            'mark:regNum': {
              kind: 'element',
              xmlName: 'mark:regNum',
              namespace: 'urn:ietf:params:xml:ns:mark-1.0',
              cardinality: 'one',
            },
            'mark:regDate': {
              kind: 'element',
              xmlName: 'mark:regDate',
              namespace: 'urn:ietf:params:xml:ns:mark-1.0',
              cardinality: 'one',
            },
            'mark:exDate': {
              kind: 'element',
              xmlName: 'mark:exDate',
              namespace: 'urn:ietf:params:xml:ns:mark-1.0',
              cardinality: 'one',
            },
          },
        },
      },
      'mark:treatyOrStatute': {
        kind: 'element',
        xmlName: 'mark:treatyOrStatute',
        namespace: 'urn:ietf:params:xml:ns:mark-1.0',
        cardinality: 'many',
        nodeMeta: {
          qname: {
            namespace: 'urn:ietf:params:xml:ns:mark-1.0',
            localName: 'treatyOrStatute',
          },
          fields: {
            'mark:id': {
              kind: 'element',
              xmlName: 'mark:id',
              namespace: 'urn:ietf:params:xml:ns:mark-1.0',
              cardinality: 'one',
            },
            'mark:markName': {
              kind: 'element',
              xmlName: 'mark:markName',
              namespace: 'urn:ietf:params:xml:ns:mark-1.0',
              cardinality: 'one',
            },
            'mark:holder': {
              kind: 'element',
              xmlName: 'mark:holder',
              namespace: 'urn:ietf:params:xml:ns:mark-1.0',
              cardinality: 'many',
              nodeMeta: {
                qname: {
                  namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                  localName: 'holder',
                },
                fields: {
                  entitlement: {
                    kind: 'attribute',
                    xmlName: 'entitlement',
                    cardinality: 'one',
                  },
                  'mark:name': {
                    kind: 'element',
                    xmlName: 'mark:name',
                    namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                    cardinality: 'one',
                  },
                  'mark:org': {
                    kind: 'element',
                    xmlName: 'mark:org',
                    namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                    cardinality: 'one',
                  },
                  'mark:addr': {
                    kind: 'element',
                    xmlName: 'mark:addr',
                    namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                        localName: 'addr',
                      },
                      fields: {
                        'mark:street': {
                          kind: 'element',
                          xmlName: 'mark:street',
                          namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                          cardinality: 'many',
                        },
                        'mark:city': {
                          kind: 'element',
                          xmlName: 'mark:city',
                          namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                          cardinality: 'one',
                        },
                        'mark:sp': {
                          kind: 'element',
                          xmlName: 'mark:sp',
                          namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                          cardinality: 'one',
                        },
                        'mark:pc': {
                          kind: 'element',
                          xmlName: 'mark:pc',
                          namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                          cardinality: 'one',
                        },
                        'mark:cc': {
                          kind: 'element',
                          xmlName: 'mark:cc',
                          namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                          cardinality: 'one',
                        },
                      },
                    },
                  },
                  'mark:voice': {
                    kind: 'element',
                    xmlName: 'mark:voice',
                    namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:mark-1.0',
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
                  'mark:fax': {
                    kind: 'element',
                    xmlName: 'mark:fax',
                    namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:mark-1.0',
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
                  'mark:email': {
                    kind: 'element',
                    xmlName: 'mark:email',
                    namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                    cardinality: 'one',
                  },
                },
              },
            },
            'mark:contact': {
              kind: 'element',
              xmlName: 'mark:contact',
              namespace: 'urn:ietf:params:xml:ns:mark-1.0',
              cardinality: 'many',
              nodeMeta: {
                qname: {
                  namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                  localName: 'contact',
                },
                fields: {
                  type: {
                    kind: 'attribute',
                    xmlName: 'type',
                    cardinality: 'one',
                  },
                  'mark:name': {
                    kind: 'element',
                    xmlName: 'mark:name',
                    namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                    cardinality: 'one',
                  },
                  'mark:org': {
                    kind: 'element',
                    xmlName: 'mark:org',
                    namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                    cardinality: 'one',
                  },
                  'mark:addr': {
                    kind: 'element',
                    xmlName: 'mark:addr',
                    namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                        localName: 'addr',
                      },
                      fields: {
                        'mark:street': {
                          kind: 'element',
                          xmlName: 'mark:street',
                          namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                          cardinality: 'many',
                        },
                        'mark:city': {
                          kind: 'element',
                          xmlName: 'mark:city',
                          namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                          cardinality: 'one',
                        },
                        'mark:sp': {
                          kind: 'element',
                          xmlName: 'mark:sp',
                          namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                          cardinality: 'one',
                        },
                        'mark:pc': {
                          kind: 'element',
                          xmlName: 'mark:pc',
                          namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                          cardinality: 'one',
                        },
                        'mark:cc': {
                          kind: 'element',
                          xmlName: 'mark:cc',
                          namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                          cardinality: 'one',
                        },
                      },
                    },
                  },
                  'mark:voice': {
                    kind: 'element',
                    xmlName: 'mark:voice',
                    namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:mark-1.0',
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
                  'mark:fax': {
                    kind: 'element',
                    xmlName: 'mark:fax',
                    namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:mark-1.0',
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
                  'mark:email': {
                    kind: 'element',
                    xmlName: 'mark:email',
                    namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                    cardinality: 'one',
                  },
                },
              },
            },
            'mark:protection': {
              kind: 'element',
              xmlName: 'mark:protection',
              namespace: 'urn:ietf:params:xml:ns:mark-1.0',
              cardinality: 'many',
              nodeMeta: {
                qname: {
                  namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                  localName: 'protection',
                },
                fields: {
                  'mark:cc': {
                    kind: 'element',
                    xmlName: 'mark:cc',
                    namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                    cardinality: 'one',
                  },
                  'mark:region': {
                    kind: 'element',
                    xmlName: 'mark:region',
                    namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                    cardinality: 'one',
                  },
                  'mark:ruling': {
                    kind: 'element',
                    xmlName: 'mark:ruling',
                    namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                    cardinality: 'many',
                  },
                },
              },
            },
            'mark:label': {
              kind: 'element',
              xmlName: 'mark:label',
              namespace: 'urn:ietf:params:xml:ns:mark-1.0',
              cardinality: 'many',
            },
            'mark:goodsAndServices': {
              kind: 'element',
              xmlName: 'mark:goodsAndServices',
              namespace: 'urn:ietf:params:xml:ns:mark-1.0',
              cardinality: 'one',
            },
            'mark:refNum': {
              kind: 'element',
              xmlName: 'mark:refNum',
              namespace: 'urn:ietf:params:xml:ns:mark-1.0',
              cardinality: 'one',
            },
            'mark:proDate': {
              kind: 'element',
              xmlName: 'mark:proDate',
              namespace: 'urn:ietf:params:xml:ns:mark-1.0',
              cardinality: 'one',
            },
            'mark:title': {
              kind: 'element',
              xmlName: 'mark:title',
              namespace: 'urn:ietf:params:xml:ns:mark-1.0',
              cardinality: 'one',
            },
            'mark:execDate': {
              kind: 'element',
              xmlName: 'mark:execDate',
              namespace: 'urn:ietf:params:xml:ns:mark-1.0',
              cardinality: 'one',
            },
          },
        },
      },
      'mark:court': {
        kind: 'element',
        xmlName: 'mark:court',
        namespace: 'urn:ietf:params:xml:ns:mark-1.0',
        cardinality: 'many',
        nodeMeta: {
          qname: {
            namespace: 'urn:ietf:params:xml:ns:mark-1.0',
            localName: 'court',
          },
          fields: {
            'mark:id': {
              kind: 'element',
              xmlName: 'mark:id',
              namespace: 'urn:ietf:params:xml:ns:mark-1.0',
              cardinality: 'one',
            },
            'mark:markName': {
              kind: 'element',
              xmlName: 'mark:markName',
              namespace: 'urn:ietf:params:xml:ns:mark-1.0',
              cardinality: 'one',
            },
            'mark:holder': {
              kind: 'element',
              xmlName: 'mark:holder',
              namespace: 'urn:ietf:params:xml:ns:mark-1.0',
              cardinality: 'many',
              nodeMeta: {
                qname: {
                  namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                  localName: 'holder',
                },
                fields: {
                  entitlement: {
                    kind: 'attribute',
                    xmlName: 'entitlement',
                    cardinality: 'one',
                  },
                  'mark:name': {
                    kind: 'element',
                    xmlName: 'mark:name',
                    namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                    cardinality: 'one',
                  },
                  'mark:org': {
                    kind: 'element',
                    xmlName: 'mark:org',
                    namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                    cardinality: 'one',
                  },
                  'mark:addr': {
                    kind: 'element',
                    xmlName: 'mark:addr',
                    namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                        localName: 'addr',
                      },
                      fields: {
                        'mark:street': {
                          kind: 'element',
                          xmlName: 'mark:street',
                          namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                          cardinality: 'many',
                        },
                        'mark:city': {
                          kind: 'element',
                          xmlName: 'mark:city',
                          namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                          cardinality: 'one',
                        },
                        'mark:sp': {
                          kind: 'element',
                          xmlName: 'mark:sp',
                          namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                          cardinality: 'one',
                        },
                        'mark:pc': {
                          kind: 'element',
                          xmlName: 'mark:pc',
                          namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                          cardinality: 'one',
                        },
                        'mark:cc': {
                          kind: 'element',
                          xmlName: 'mark:cc',
                          namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                          cardinality: 'one',
                        },
                      },
                    },
                  },
                  'mark:voice': {
                    kind: 'element',
                    xmlName: 'mark:voice',
                    namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:mark-1.0',
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
                  'mark:fax': {
                    kind: 'element',
                    xmlName: 'mark:fax',
                    namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:mark-1.0',
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
                  'mark:email': {
                    kind: 'element',
                    xmlName: 'mark:email',
                    namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                    cardinality: 'one',
                  },
                },
              },
            },
            'mark:contact': {
              kind: 'element',
              xmlName: 'mark:contact',
              namespace: 'urn:ietf:params:xml:ns:mark-1.0',
              cardinality: 'many',
              nodeMeta: {
                qname: {
                  namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                  localName: 'contact',
                },
                fields: {
                  type: {
                    kind: 'attribute',
                    xmlName: 'type',
                    cardinality: 'one',
                  },
                  'mark:name': {
                    kind: 'element',
                    xmlName: 'mark:name',
                    namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                    cardinality: 'one',
                  },
                  'mark:org': {
                    kind: 'element',
                    xmlName: 'mark:org',
                    namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                    cardinality: 'one',
                  },
                  'mark:addr': {
                    kind: 'element',
                    xmlName: 'mark:addr',
                    namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                        localName: 'addr',
                      },
                      fields: {
                        'mark:street': {
                          kind: 'element',
                          xmlName: 'mark:street',
                          namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                          cardinality: 'many',
                        },
                        'mark:city': {
                          kind: 'element',
                          xmlName: 'mark:city',
                          namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                          cardinality: 'one',
                        },
                        'mark:sp': {
                          kind: 'element',
                          xmlName: 'mark:sp',
                          namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                          cardinality: 'one',
                        },
                        'mark:pc': {
                          kind: 'element',
                          xmlName: 'mark:pc',
                          namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                          cardinality: 'one',
                        },
                        'mark:cc': {
                          kind: 'element',
                          xmlName: 'mark:cc',
                          namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                          cardinality: 'one',
                        },
                      },
                    },
                  },
                  'mark:voice': {
                    kind: 'element',
                    xmlName: 'mark:voice',
                    namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:mark-1.0',
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
                  'mark:fax': {
                    kind: 'element',
                    xmlName: 'mark:fax',
                    namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'urn:ietf:params:xml:ns:mark-1.0',
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
                  'mark:email': {
                    kind: 'element',
                    xmlName: 'mark:email',
                    namespace: 'urn:ietf:params:xml:ns:mark-1.0',
                    cardinality: 'one',
                  },
                },
              },
            },
            'mark:label': {
              kind: 'element',
              xmlName: 'mark:label',
              namespace: 'urn:ietf:params:xml:ns:mark-1.0',
              cardinality: 'many',
            },
            'mark:goodsAndServices': {
              kind: 'element',
              xmlName: 'mark:goodsAndServices',
              namespace: 'urn:ietf:params:xml:ns:mark-1.0',
              cardinality: 'one',
            },
            'mark:refNum': {
              kind: 'element',
              xmlName: 'mark:refNum',
              namespace: 'urn:ietf:params:xml:ns:mark-1.0',
              cardinality: 'one',
            },
            'mark:proDate': {
              kind: 'element',
              xmlName: 'mark:proDate',
              namespace: 'urn:ietf:params:xml:ns:mark-1.0',
              cardinality: 'one',
            },
            'mark:cc': {
              kind: 'element',
              xmlName: 'mark:cc',
              namespace: 'urn:ietf:params:xml:ns:mark-1.0',
              cardinality: 'one',
            },
            'mark:region': {
              kind: 'element',
              xmlName: 'mark:region',
              namespace: 'urn:ietf:params:xml:ns:mark-1.0',
              cardinality: 'many',
            },
            'mark:courtName': {
              kind: 'element',
              xmlName: 'mark:courtName',
              namespace: 'urn:ietf:params:xml:ns:mark-1.0',
              cardinality: 'one',
            },
          },
        },
      },
    },
  },
};
