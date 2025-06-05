export type RdapResponse = {
  objectClassName: 'domain';
  rdapConformance: string[];
  handle: string;
  status: Status[];
  notices: Notice[];
  /**
   * letters-digits-hyphens name
   */
  ldhName: string;
  unicodeName: string;
  nameservers: NameServer[];
  publicIds: PublicId[];
  events: RdapEvent[];
  entities: Entity[];
  links: Link[];
};
const sample: RdapResponse = {
  rdapConformance: [
    'rdap_level_0',
    'icann_rdap_response_profile_0',
    'icann_rdap_technical_implementation_guide_0',
  ],
  notices: [
    {
      title: 'Terms of Service',
      description: [
        "Access to RDAP information is provided to assist persons in determining the contents of a domain name registration record in the registry database. The data in this record is provided by Identity Digital or, if the record pertains to a TLD not operated by Identity Digital, then the corresponding primary Registry Operator for informational purposes only, and neither Identity Digital nor the Registry Operator guarantee its accuracy. This service is intended only for query-based access. You agree that you will use this data only for lawful purposes and that, under no circumstances will you use this data to (a) allow, enable, or otherwise support the transmission by e-mail, telephone, or facsimile of mass unsolicited, commercial advertising or solicitations to entities other than the data recipient's own existing customers; or (b) enable high volume, automated, electronic processes that send queries or data to the systems of Identity Digital, a Registrar, or Registry Operator except as reasonably necessary to register domain names or modify existing registrations. When using the RDAP service, please consider the following: the RDAP service is not a replacement for standard EPP commands to the SRS service. RDAP is not considered authoritative for registered domain objects. The RDAP service may be scheduled for downtime during production or OT&E maintenance periods. Queries to the RDAP services are throttled. If too many queries are received from a single IP address within a specified time, the service will begin to reject further queries for a period of time to prevent disruption of RDAP service access. Abuse of the RDAP system through data mining is mitigated by detecting and limiting bulk query access from single sources. Where applicable, the presence of a [Non-Public Data] tag indicates that such data is not made publicly available due to applicable data privacy laws or requirements. Should you wish to contact the registrant, please refer to the RDAP records available through the registrar URL listed above. Access to non-public data may be provided, upon request, where it can be reasonably confirmed that the requester holds a specific legitimate interest and a proper legal basis for accessing the withheld data. Access to the data provided by Identity Digital can be requested by submitting a request via the form found at https://www.identity.digital/about/policies/whois-layered-access/ Identity Digital Inc. and, if applicable, the primary Registry Operators reserve the right to modify these terms at any time. By submitting this query, you agree to abide by this policy.",
      ],
      links: [
        {
          value: 'https://rdap.donuts.co/rdap/domain/d3.cards',
          rel: 'alternate',
          href: 'https://www.identity.digital/about/policies/rdap-access-policy/',
          type: 'text/html',
        },
      ],
    },
    {
      title: 'Status Codes',
      description: [
        'For more information on domain status codes, please visit https://icann.org/epp',
      ],
      links: [
        {
          value: 'https://icann.org/epp',
          rel: 'self',
          href: 'https://icann.org/epp',
          type: 'application/rdap+json',
        },
      ],
    },
    {
      title: 'RDDS Inaccuracy Complaint Form',
      description: [
        'URL of the ICANN RDDS Inaccuracy Complaint Form: https://www.icann.org/wicf',
      ],
      links: [
        {
          value: 'https://www.icann.org/wicf',
          rel: 'self',
          href: 'https://www.icann.org/wicf',
          type: 'application/rdap+json',
        },
      ],
    },
  ],
  ldhName: 'd3.cards',
  unicodeName: 'd3.cards',
  nameservers: [
    {
      ldhName: 'ns-cloud-b1.googledomains.com',
      unicodeName: 'ns-cloud-b1.googledomains.com',
      objectClassName: 'nameserver',
      handle: '57bc05500723404d85d5ec96f483c3d8-DONUTS',
      status: ['associated'],
    },
    {
      ldhName: 'ns-cloud-b2.googledomains.com',
      unicodeName: 'ns-cloud-b2.googledomains.com',
      objectClassName: 'nameserver',
      handle: 'c8e242b9333944978f471a1016103675-DONUTS',
      status: ['associated'],
    },
    {
      ldhName: 'ns-cloud-b3.googledomains.com',
      unicodeName: 'ns-cloud-b3.googledomains.com',
      objectClassName: 'nameserver',
      handle: '4496dd59257d452bae23c34c14ac9949-DONUTS',
      status: ['associated'],
    },
    {
      ldhName: 'ns-cloud-b4.googledomains.com',
      unicodeName: 'ns-cloud-b4.googledomains.com',
      objectClassName: 'nameserver',
      handle: 'db29744e59564ffdab9f712422e3a27f-DONUTS',
      status: ['associated'],
    },
  ],
  publicIds: [{ type: 'IANA Registrar ID', identifier: '625' }],
  objectClassName: 'domain',
  handle: 'f4339c31219e4426a58b2f771fdfb3dc-DONUTS',
  status: ['client transfer prohibited'],
  events: [
    {
      eventAction: 'expiration',
      eventDate: '2024-06-12T15:32:19.444Z',
    },
    {
      eventAction: 'registration',
      eventDate: '2023-06-12T15:32:19.444Z',
    },
    {
      eventAction: 'last changed',
      eventDate: '2023-07-13T21:56:02.706Z',
    },
    {
      eventAction: 'last update of RDAP database',
      eventDate: '2023-08-30T16:33:14.246Z',
    },
  ],
  entities: [
    {
      vcardArray: [
        'vcard',
        [
          ['version', {}, 'text', '4.0'],
          ['org', { type: 'work' }, 'text', 'Domain Protection Services, Inc.'],
          ['adr', {}, 'text', ['', '', '', '', 'CO', '', 'US']],
        ],
      ],
      roles: ['registrant'],
      objectClassName: 'entity',
      remarks: [
        {
          title: 'REDACTED FOR PRIVACY',
          type: 'object redacted due to authorization',
          description: ['Some of the data in this object has been removed.'],
        },
        {
          title: 'EMAIL REDACTED FOR PRIVACY',
          type: 'object redacted due to authorization',
          description: [
            'Please query the RDDS service of the Registrar of Record identified in this output for information on how to contact the Registrant of the queried domain name.',
          ],
        },
      ],
      events: [
        {
          eventAction: 'last update of RDAP database',
          eventDate: '2023-08-30T16:33:14.246Z',
        },
      ],
    },
    {
      vcardArray: ['vcard', [['version', {}, 'text', '4.0']]],
      roles: ['technical', 'administrative'],
      objectClassName: 'entity',
      remarks: [
        {
          title: 'REDACTED FOR PRIVACY',
          type: 'object redacted due to authorization',
          description: ['Some of the data in this object has been removed.'],
        },
        {
          title: 'EMAIL REDACTED FOR PRIVACY',
          type: 'object redacted due to authorization',
          description: [
            'Please query the RDDS service of the Registrar of Record identified in this output for information on how to contact the Registrant of the queried domain name.',
          ],
        },
      ],
      events: [
        {
          eventAction: 'last update of RDAP database',
          eventDate: '2023-08-30T16:33:14.246Z',
        },
      ],
    },
    {
      vcardArray: [
        'vcard',
        [
          ['version', {}, 'text', '4.0'],
          ['fn', {}, 'text', 'Name.com, Inc.'],
        ],
      ],
      roles: ['registrar'],
      publicIds: [{ type: 'IANA Registrar ID', identifier: '625' }],
      objectClassName: 'entity',
      handle: '625',
      entities: [
        {
          vcardArray: [
            'vcard',
            [
              ['version', {}, 'text', '4.0'],
              ['tel', { type: 'voice' }, 'uri', 'tel:+1.7203101849'],
              ['email', {}, 'text', 'abuse@name.com'],
            ],
          ],
          roles: ['abuse'],
          objectClassName: 'entity',
          handle: '7479354922d24c79beaa35fa31b9ef0a-DONUTS',
        },
      ],
      links: [
        {
          value: 'https://rdap.donuts.co/rdap/entity/625',
          rel: 'self',
          href: 'https://rdap.donuts.co/rdap/entity/625',
          type: 'application/rdap+json',
        },
      ],
    },
  ],
  links: [
    {
      value: 'https://namerdap.systems/domain/d3.cards',
      rel: 'related',
      href: 'https://namerdap.systems/domain/d3.cards',
      type: 'application/rdap+json',
    },
    {
      value: 'https://rdap.donuts.co/rdap/domain/d3.cards',
      rel: 'self',
      href: 'https://rdap.donuts.co/rdap/domain/d3.cards',
      type: 'application/rdap+json',
    },
  ],
};

/**
 * The "links" array is found in data structures to signify links to other resources on the Internet.
 *  The relationship of these links is defined by the IANA registry described by [[RFC8288](https://datatracker.ietf.org/doc/html/rfc8288)]
 */
type Link = {
  /**
   * URI
   */
  value: string;

  /**
   * 	  The relation type of link conveyed in the Link header field is
   *    conveyed in the "rel" parameter's value.  The rel parameter MUST be
   *    present but MUST NOT appear more than once in a given link-value;
   *    occurrences after the first MUST be ignored by parsers.
   *
   * 	  *Possible Values:* 'self', 'related', 'up'
   *
   *    **A "related" link relation MUST NOT include an "href" URI that is the same as
   *    the "self" link relation "href" URI to reduce the risk of infinite client processing loops.**
   */
  rel: string;

  /**
   * URI
   */
  href: string;

  /**
   *  an array of 2-Letter Locales
   */
  hreflang?: string[];
  title?: string;
  media?: string; //'screen'
  type?: string; //mimetype like "application/json" "application/rdap+json"
};

/**
 * he notices structure denotes information about the service providing RDAP information
 * and/or information about the entire response, whereas the remarks structure denotes information
 * about the object class that contains it
 */
type Notice = {
  /**
   * Title of the notice or remark
   */
  title?: string;
  /**
   * a "type" string denoting a registered type of remark or notice (see [RFC-9083 Section 10.2.1](https://datatracker.ietf.org/doc/html/rfc9083#sect-10.2.1))
   */
  type?: string;
  /**
   * An Array of Lines representing the content of the notice or remark,for the purposes of
   * conveying any descriptive text
   *
   */
  description: string[];

  links?: Link[];
};

type Remark = Notice;

/**
 * Definition Not complete
 */
type NameServer = {
  objectClassName: 'nameserver';
  ldhName: string;
  unicodeName: string;
  handle: string;
  status: Status[];
};

/**
 * Definition Not complete
 */
type PublicId = {
  type: string;
  identifier: string;
};

/**
 * Definition Not complete
 */
type RdapEvent = {
  eventAction:
    | string
    | 'expiration'
    | 'registration'
    | 'last changed'
    | 'last update of RDAP database';
  /**
   * Date string ISO format
   */
  eventDate: string;
};

/**
 * Definition Not complete
 */
type Entity = {
  objectClassName: 'entity';

  handle?: string;
  publicIds?: PublicId[];
  vcardArray: JCard;
  roles: string[];
  remarks?: Remark[];
  events?: RdapEvent[];
  entities?: Entity[];
  links?: Link[];
};
type JCard = any;
const Status = {
  /**
   * Signifies that the data of the object instance has been found to be accurate. This type of status is usually found on entity object instances to note the validity of identifying contact information.
   * */
  validated: 'validated',

  /**
   * Renewal or reregistration of the object instance is forbidden.
   * */
  renew_prohibited: 'renew prohibited',

  /**
   * Updates to the object instance are forbidden.
   * */
  update_prohibited: 'update prohibited',

  /**
   * Transfers of the registration from one registrar to another are forbidden. This type of status normally applies to DNR domain names.
   * */
  transfer_prohibited: 'transfer prohibited',

  /**
   * Deletion of the registration of the object instance is forbidden. This type of status normally applies to DNR domain names.
   * */
  delete_prohibited: 'delete prohibited',

  /**
   * The registration of the object instance has been performed by a third party. This is most commonly applied to entities.
   * */
  proxy: 'proxy',

  /**
   * The information of the object instance is not designated for public consumption. This is most commonly applied to entities.
   * */
  private: 'private',

  /**
   * Some of the information of the object instance has not been made available and has been removed. This is most commonly applied to entities.
   * */
  removed: 'removed',

  /**
   * Some of the information of the object instance has been altered for the purposes of not readily revealing the actual information of the object instance. This is most commonly applied to entities.
   * */
  obscured: 'obscured',

  /**
   * The object instance is associated with other object instances in the registry. This is most commonly used to signify that a nameserver is associated with a domain or that an entity is associated with a network resource or domain.
   * */
  associated: 'associated',

  /**
   * The object instance is in use. For domain names, it signifies that the domain name is published in DNS. For network and autnum registrations, it signifies that they are allocated or assigned for use in operational networks. This maps to the "OK" status of the Extensible Provisioning Protocol (EPP) [RFC5730].
   * */
  active: 'active',

  /**
   *  The object instance is not in use. See "active".
   * */
  inactive: 'inactive',

  /**
   * Changes to the object instance cannot be made, including the association of other object instances.
   * */
  locked: 'locked',

  /**
   * A request has been received for the creation of the object instance, but this action is not yet complete.
   * */
  pending_create: 'pending create',

  /**
   * A request has been received for the renewal of the object instance, but this action is not yet complete.
   * */
  pending_renew: 'pending renew',

  /**
   * A request has been received for the transfer of the object instance, but this action is not yet complete.
   * */
  pending_transfer: 'pending transfer',

  /**
   * A request has been received for the update or modification of the object instance, but this action is not yet complete.
   * */
  pending_update: 'pending update',

  /**
   * A request has been received for the deletion or removal of the object instance, but this action is not yet complete. For domains, this might mean that the name is no longer published in DNS but has not yet been purged from the registry database.
   * */
  pending_delete: 'pending delete',
} as const;

type Status =
  | (typeof Status)[keyof typeof Status]
  | `client ${(typeof Status)[keyof typeof Status]}`
  | `server ${(typeof Status)[keyof typeof Status]}`;

export { Status as RdapDomainStatus };
