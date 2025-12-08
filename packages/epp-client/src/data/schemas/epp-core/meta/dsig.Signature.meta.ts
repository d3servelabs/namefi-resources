/**
 * Static XmlMeta for Signature
 * Generated from: http://www.w3.org/2000/09/xmldsig#
 *
 * @generated - Do not edit manually
 */

import type { XmlMeta } from './types';

export const DsigSignatureMeta: XmlMeta = {
  strategyId: 'fxp-v1',
  root: {
    qname: {
      namespace: 'http://www.w3.org/2000/09/xmldsig#',
      localName: 'Signature',
    },
    fields: {
      Id: {
        kind: 'attribute',
        xmlName: 'Id',
        cardinality: 'one',
      },
      'dsig:SignedInfo': {
        kind: 'element',
        xmlName: 'dsig:SignedInfo',
        namespace: 'http://www.w3.org/2000/09/xmldsig#',
        cardinality: 'one',
        nodeMeta: {
          qname: {
            namespace: 'http://www.w3.org/2000/09/xmldsig#',
            localName: 'SignedInfo',
          },
          fields: {
            Id: {
              kind: 'attribute',
              xmlName: 'Id',
              cardinality: 'one',
            },
            'dsig:CanonicalizationMethod': {
              kind: 'element',
              xmlName: 'dsig:CanonicalizationMethod',
              namespace: 'http://www.w3.org/2000/09/xmldsig#',
              cardinality: 'one',
              nodeMeta: {
                qname: {
                  namespace: 'http://www.w3.org/2000/09/xmldsig#',
                  localName: 'CanonicalizationMethod',
                },
                fields: {
                  Algorithm: {
                    kind: 'attribute',
                    xmlName: 'Algorithm',
                    cardinality: 'one',
                  },
                },
              },
            },
            'dsig:SignatureMethod': {
              kind: 'element',
              xmlName: 'dsig:SignatureMethod',
              namespace: 'http://www.w3.org/2000/09/xmldsig#',
              cardinality: 'one',
              nodeMeta: {
                qname: {
                  namespace: 'http://www.w3.org/2000/09/xmldsig#',
                  localName: 'SignatureMethod',
                },
                fields: {
                  Algorithm: {
                    kind: 'attribute',
                    xmlName: 'Algorithm',
                    cardinality: 'one',
                  },
                  'dsig:HMACOutputLength': {
                    kind: 'element',
                    xmlName: 'dsig:HMACOutputLength',
                    namespace: 'http://www.w3.org/2000/09/xmldsig#',
                    cardinality: 'one',
                  },
                },
              },
            },
            'dsig:Reference': {
              kind: 'element',
              xmlName: 'dsig:Reference',
              namespace: 'http://www.w3.org/2000/09/xmldsig#',
              cardinality: 'many',
              nodeMeta: {
                qname: {
                  namespace: 'http://www.w3.org/2000/09/xmldsig#',
                  localName: 'Reference',
                },
                fields: {
                  Id: {
                    kind: 'attribute',
                    xmlName: 'Id',
                    cardinality: 'one',
                  },
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
                  'dsig:DigestMethod': {
                    kind: 'element',
                    xmlName: 'dsig:DigestMethod',
                    namespace: 'http://www.w3.org/2000/09/xmldsig#',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'http://www.w3.org/2000/09/xmldsig#',
                        localName: 'DigestMethod',
                      },
                      fields: {
                        Algorithm: {
                          kind: 'attribute',
                          xmlName: 'Algorithm',
                          cardinality: 'one',
                        },
                      },
                    },
                  },
                  'dsig:DigestValue': {
                    kind: 'element',
                    xmlName: 'dsig:DigestValue',
                    namespace: 'http://www.w3.org/2000/09/xmldsig#',
                    cardinality: 'one',
                  },
                },
              },
            },
          },
        },
      },
      'dsig:SignatureValue': {
        kind: 'element',
        xmlName: 'dsig:SignatureValue',
        namespace: 'http://www.w3.org/2000/09/xmldsig#',
        cardinality: 'one',
        nodeMeta: {
          qname: {
            namespace: 'http://www.w3.org/2000/09/xmldsig#',
            localName: 'SignatureValue',
          },
          fields: {
            Id: {
              kind: 'attribute',
              xmlName: 'Id',
              cardinality: 'one',
            },
          },
        },
      },
      'dsig:KeyInfo': {
        kind: 'element',
        xmlName: 'dsig:KeyInfo',
        namespace: 'http://www.w3.org/2000/09/xmldsig#',
        cardinality: 'one',
        nodeMeta: {
          qname: {
            namespace: 'http://www.w3.org/2000/09/xmldsig#',
            localName: 'KeyInfo',
          },
          fields: {
            Id: {
              kind: 'attribute',
              xmlName: 'Id',
              cardinality: 'one',
            },
            'dsig:KeyName': {
              kind: 'element',
              xmlName: 'dsig:KeyName',
              namespace: 'http://www.w3.org/2000/09/xmldsig#',
              cardinality: 'one',
            },
            'dsig:KeyValue': {
              kind: 'element',
              xmlName: 'dsig:KeyValue',
              namespace: 'http://www.w3.org/2000/09/xmldsig#',
              cardinality: 'one',
              nodeMeta: {
                qname: {
                  namespace: 'http://www.w3.org/2000/09/xmldsig#',
                  localName: 'KeyValue',
                },
                fields: {
                  'dsig:DSAKeyValue': {
                    kind: 'element',
                    xmlName: 'dsig:DSAKeyValue',
                    namespace: 'http://www.w3.org/2000/09/xmldsig#',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'http://www.w3.org/2000/09/xmldsig#',
                        localName: 'DSAKeyValue',
                      },
                      fields: {
                        'dsig:G': {
                          kind: 'element',
                          xmlName: 'dsig:G',
                          namespace: 'http://www.w3.org/2000/09/xmldsig#',
                          cardinality: 'one',
                        },
                        'dsig:Y': {
                          kind: 'element',
                          xmlName: 'dsig:Y',
                          namespace: 'http://www.w3.org/2000/09/xmldsig#',
                          cardinality: 'one',
                        },
                        'dsig:J': {
                          kind: 'element',
                          xmlName: 'dsig:J',
                          namespace: 'http://www.w3.org/2000/09/xmldsig#',
                          cardinality: 'one',
                        },
                        'dsig:P': {
                          kind: 'element',
                          xmlName: 'dsig:P',
                          namespace: 'http://www.w3.org/2000/09/xmldsig#',
                          cardinality: 'one',
                        },
                        'dsig:Q': {
                          kind: 'element',
                          xmlName: 'dsig:Q',
                          namespace: 'http://www.w3.org/2000/09/xmldsig#',
                          cardinality: 'one',
                        },
                        'dsig:Seed': {
                          kind: 'element',
                          xmlName: 'dsig:Seed',
                          namespace: 'http://www.w3.org/2000/09/xmldsig#',
                          cardinality: 'one',
                        },
                        'dsig:PgenCounter': {
                          kind: 'element',
                          xmlName: 'dsig:PgenCounter',
                          namespace: 'http://www.w3.org/2000/09/xmldsig#',
                          cardinality: 'one',
                        },
                      },
                    },
                  },
                  'dsig:RSAKeyValue': {
                    kind: 'element',
                    xmlName: 'dsig:RSAKeyValue',
                    namespace: 'http://www.w3.org/2000/09/xmldsig#',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'http://www.w3.org/2000/09/xmldsig#',
                        localName: 'RSAKeyValue',
                      },
                      fields: {
                        'dsig:Modulus': {
                          kind: 'element',
                          xmlName: 'dsig:Modulus',
                          namespace: 'http://www.w3.org/2000/09/xmldsig#',
                          cardinality: 'one',
                        },
                        'dsig:Exponent': {
                          kind: 'element',
                          xmlName: 'dsig:Exponent',
                          namespace: 'http://www.w3.org/2000/09/xmldsig#',
                          cardinality: 'one',
                        },
                      },
                    },
                  },
                },
              },
            },
            'dsig:RetrievalMethod': {
              kind: 'element',
              xmlName: 'dsig:RetrievalMethod',
              namespace: 'http://www.w3.org/2000/09/xmldsig#',
              cardinality: 'one',
              nodeMeta: {
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
            },
            'dsig:X509Data': {
              kind: 'element',
              xmlName: 'dsig:X509Data',
              namespace: 'http://www.w3.org/2000/09/xmldsig#',
              cardinality: 'one',
              nodeMeta: {
                qname: {
                  namespace: 'http://www.w3.org/2000/09/xmldsig#',
                  localName: 'X509Data',
                },
                fields: {
                  'dsig:X509IssuerSerial': {
                    kind: 'element',
                    xmlName: 'dsig:X509IssuerSerial',
                    namespace: 'http://www.w3.org/2000/09/xmldsig#',
                    cardinality: 'one',
                    nodeMeta: {
                      qname: {
                        namespace: 'http://www.w3.org/2000/09/xmldsig#',
                        localName: 'X509IssuerSerial',
                      },
                      fields: {
                        'dsig:X509IssuerName': {
                          kind: 'element',
                          xmlName: 'dsig:X509IssuerName',
                          namespace: 'http://www.w3.org/2000/09/xmldsig#',
                          cardinality: 'one',
                        },
                        'dsig:X509SerialNumber': {
                          kind: 'element',
                          xmlName: 'dsig:X509SerialNumber',
                          namespace: 'http://www.w3.org/2000/09/xmldsig#',
                          cardinality: 'one',
                        },
                      },
                    },
                  },
                  'dsig:X509SKI': {
                    kind: 'element',
                    xmlName: 'dsig:X509SKI',
                    namespace: 'http://www.w3.org/2000/09/xmldsig#',
                    cardinality: 'one',
                  },
                  'dsig:X509SubjectName': {
                    kind: 'element',
                    xmlName: 'dsig:X509SubjectName',
                    namespace: 'http://www.w3.org/2000/09/xmldsig#',
                    cardinality: 'one',
                  },
                  'dsig:X509Certificate': {
                    kind: 'element',
                    xmlName: 'dsig:X509Certificate',
                    namespace: 'http://www.w3.org/2000/09/xmldsig#',
                    cardinality: 'one',
                  },
                  'dsig:X509CRL': {
                    kind: 'element',
                    xmlName: 'dsig:X509CRL',
                    namespace: 'http://www.w3.org/2000/09/xmldsig#',
                    cardinality: 'one',
                  },
                },
              },
            },
            'dsig:PGPData': {
              kind: 'element',
              xmlName: 'dsig:PGPData',
              namespace: 'http://www.w3.org/2000/09/xmldsig#',
              cardinality: 'one',
              nodeMeta: {
                qname: {
                  namespace: 'http://www.w3.org/2000/09/xmldsig#',
                  localName: 'PGPData',
                },
                fields: {
                  'dsig:PGPKeyID': {
                    kind: 'element',
                    xmlName: 'dsig:PGPKeyID',
                    namespace: 'http://www.w3.org/2000/09/xmldsig#',
                    cardinality: 'one',
                  },
                  'dsig:PGPKeyPacket': {
                    kind: 'element',
                    xmlName: 'dsig:PGPKeyPacket',
                    namespace: 'http://www.w3.org/2000/09/xmldsig#',
                    cardinality: 'one',
                  },
                },
              },
            },
            'dsig:SPKIData': {
              kind: 'element',
              xmlName: 'dsig:SPKIData',
              namespace: 'http://www.w3.org/2000/09/xmldsig#',
              cardinality: 'one',
              nodeMeta: {
                qname: {
                  namespace: 'http://www.w3.org/2000/09/xmldsig#',
                  localName: 'SPKIData',
                },
                fields: {
                  'dsig:SPKISexp': {
                    kind: 'element',
                    xmlName: 'dsig:SPKISexp',
                    namespace: 'http://www.w3.org/2000/09/xmldsig#',
                    cardinality: 'one',
                  },
                },
              },
            },
            'dsig:MgmtData': {
              kind: 'element',
              xmlName: 'dsig:MgmtData',
              namespace: 'http://www.w3.org/2000/09/xmldsig#',
              cardinality: 'one',
            },
          },
        },
      },
      'dsig:Object': {
        kind: 'element',
        xmlName: 'dsig:Object',
        namespace: 'http://www.w3.org/2000/09/xmldsig#',
        cardinality: 'many',
        nodeMeta: {
          qname: {
            namespace: 'http://www.w3.org/2000/09/xmldsig#',
            localName: 'Object',
          },
          fields: {
            Id: {
              kind: 'attribute',
              xmlName: 'Id',
              cardinality: 'one',
            },
            MimeType: {
              kind: 'attribute',
              xmlName: 'MimeType',
              cardinality: 'one',
            },
            Encoding: {
              kind: 'attribute',
              xmlName: 'Encoding',
              cardinality: 'one',
            },
          },
        },
      },
    },
  },
};
