import { config } from '#lib/env';
import { getCentralnicRegistrar } from '#lib/epp-registrars/centralnic';
import { createLogger } from '#lib/logger';
import {
  toPunycodeDomainName,
  toUnicodeDomainName,
  type PunycodeDomainName,
} from '@namefi-astra/registrars/lib/data/validations';
import { EppStatuses } from '@namefi-astra/utils';
import { Hono, type Context } from 'hono';
import { z } from 'zod';

const _logger = createLogger({ context: 'RDAP' });

const RDAP_CONTENT_TYPE = 'application/rdap+json';
const RDAP_CONFORMANCE = [
  'rdap_level_0',
  'icann_rdap_response_profile_0',
  'icann_rdap_technical_implementation_guide_0',
] as const;
const PORT_43 = 'whois.centralnic.com';
const TRAILING_DOT_REGEX = /\.$/;

type RdapStatusCode = 200 | 400 | 404 | 501 | 502 | 503;

const rdapObjectTypeSchema = z.enum([
  'domain',
  'nameserver',
  'entity',
  'ip',
  'autnum',
]);

export type RdapDomainObject = {
  rdapConformance: string[];
  lang: string;
  notices?: Array<Record<string, unknown>>;
  objectClassName: 'domain';
  ldhName: string;
  unicodeName: string;
  port43: string;
  status: string[];
  events: Array<{ eventAction: string; eventDate: string }>;
  nameservers: Array<{
    objectClassName: 'nameserver';
    ldhName: string;
    unicodeName: string;
  }>;
  entities: Array<Record<string, unknown>>;
};

export type RdapDomainLookupResult =
  | {
      ok: true;
      normalizedDomainName: PunycodeDomainName;
      rdapDomain: RdapDomainObject;
    }
  | {
      ok: false;
      normalizedDomainName?: PunycodeDomainName;
      error: RdapErrorData;
    };

export const rdapRouter = new Hono();

rdapRouter.use(async (_c, next) => {
  _logger.assign({ context: 'RDAP', noindex: true });
  return next();
});

rdapRouter.get('/help', (c) => {
  return rdapResponse(c, {
    ...rdapResponseCommon(),
    notices: [
      {
        title: 'RDAP Service Help',
        description: [
          'Use /domain/{name}, /nameserver/{name}, /entity/{handle}, /ip/{address}, and /autnum/{number}.',
          'WHOIS output is currently under implementation; use RDAP responses as the source of truth.',
        ],
        links: [
          {
            value: 'https://icann.org/epp',
            rel: 'related',
            href: 'https://icann.org/epp',
            type: 'text/html',
          },
        ],
      },
    ],
  });
});

rdapRouter.on('HEAD', '/:type/:handle', async (c) => {
  const typeParse = rdapObjectTypeSchema.safeParse(c.req.param('type'));
  if (!typeParse.success) {
    return rdapHead(c, 404);
  }

  const handle = c.req.param('handle')?.trim();
  if (!handle) {
    return rdapHead(c, 404);
  }

  if (typeParse.data !== 'domain') {
    if (!isDummyRdapObjectsEnabled()) {
      return rdapHead(c, 501);
    }
    return rdapHead(c, 200);
  }

  const domainName = validateDomainHandle(handle);
  if (!domainName) {
    return rdapHead(c, 404);
  }

  const registrar = getConfiguredCentralnicRegistrar();
  if (!registrar) {
    return rdapHead(c, 503);
  }

  try {
    await registrar.getDomainDetails(domainName);
    return rdapHead(c, 200);
  } catch (error) {
    const mapped = mapRdapLookupError(error);
    return rdapHead(c, mapped.errorCode === 404 ? 404 : 502);
  }
});

rdapRouter.get('/:type/:handle', async (c) => {
  const typeParse = rdapObjectTypeSchema.safeParse(c.req.param('type'));
  if (!typeParse.success) {
    return rdapError(c, {
      errorCode: 404,
      title: 'Not Found',
      description: `Unsupported RDAP object type: ${c.req.param('type')}`,
    });
  }

  const handle = c.req.param('handle')?.trim();
  if (!handle) {
    return rdapError(c, {
      errorCode: 400,
      title: 'Bad Request',
      description: 'The object handle is required.',
    });
  }

  return handleRdapObjectLookup(c, typeParse.data, handle);
});

rdapRouter.use('/*', async (c) => {
  return rdapError(c, {
    errorCode: 404,
    title: 'Not Found',
    description: 'The requested RDAP endpoint does not exist.',
  });
});

async function handleRdapObjectLookup(
  c: Context,
  type: z.infer<typeof rdapObjectTypeSchema>,
  handle: string,
) {
  if (type !== 'domain' && !isDummyRdapObjectsEnabled()) {
    return rdapError(c, {
      errorCode: 501,
      title: 'Not Implemented',
      description: `RDAP object type "${type}" is not implemented yet.`,
    });
  }

  switch (type) {
    case 'domain': {
      return handleDomainLookup(c, handle);
    }
    case 'nameserver': {
      return handleNameserverLookup(c, handle);
    }
    case 'entity': {
      return handleEntityLookup(c, handle);
    }
    case 'ip': {
      return handleIpLookup(c, handle);
    }
    case 'autnum': {
      return handleAutnumLookup(c, handle);
    }
  }
}

async function handleDomainLookup(c: Context, handle: string) {
  const lookupResult = await lookupRdapDomain(handle);
  if (!lookupResult.ok) {
    return rdapError(c, lookupResult.error);
  }

  return rdapResponse(c, {
    ...lookupResult.rdapDomain,
    links: [buildSelfLink(c)],
  });
}

export async function lookupRdapDomain(
  handle: string,
): Promise<RdapDomainLookupResult> {
  const domainName = validateDomainHandle(handle);
  if (!domainName) {
    return {
      ok: false,
      error: {
        errorCode: 400,
        title: 'Bad Request',
        description:
          'Invalid domain handle. Provide a valid domain with at least one dot.',
      },
    };
  }

  const registrar = getConfiguredCentralnicRegistrar();
  if (!registrar) {
    return {
      ok: false,
      normalizedDomainName: domainName,
      error: {
        errorCode: 503,
        title: 'Service Unavailable',
        description: 'CentralNic registrar is not configured.',
      },
    };
  }

  try {
    const registration = await registrar.getDomainDetails(domainName);
    const domainStatus = await registrar
      .getDomainStatus(domainName)
      .catch(() => []);

    return {
      ok: true,
      normalizedDomainName: domainName,
      rdapDomain: {
        ...rdapResponseCommon(),
        notices: defaultNotices(),
        objectClassName: 'domain',
        ldhName: registration.domainName,
        unicodeName: safeUnicodeDomainName(registration.domainName),
        port43: PORT_43,
        status: EppStatuses.fromArray(domainStatus).getRDAPStatuses(),
        events: buildDomainEvents(registration),
        nameservers: (registration.nameservers ?? []).map((nameserver) => {
          const ldhName = nameserver.replace(TRAILING_DOT_REGEX, '');
          return {
            objectClassName: 'nameserver' as const,
            ldhName,
            unicodeName: safeUnicodeDomainName(ldhName),
          };
        }),
        entities: buildDomainEntities(registration.domainName, registration),
      },
    };
  } catch (error) {
    const mapped = mapRdapLookupError(error);
    if (mapped.errorCode === 404) {
      _logger.warn({ domainName, error }, 'RDAP domain not found');
    } else {
      _logger.error({ domainName, error }, 'RDAP domain lookup failed');
    }

    return {
      ok: false,
      normalizedDomainName: domainName,
      error: mapped,
    };
  }
}

function handleNameserverLookup(c: Context, handle: string) {
  const ldhName = handle.toLowerCase().replace(TRAILING_DOT_REGEX, '');
  return rdapResponse(c, {
    ...rdapResponseCommon(),
    objectClassName: 'nameserver',
    handle: `dummy-ns-${ldhName}`,
    ldhName,
    unicodeName: safeUnicodeDomainName(ldhName),
    status: ['active'],
    links: [buildSelfLink(c)],
  });
}

function handleEntityLookup(c: Context, handle: string) {
  return rdapResponse(c, {
    ...rdapResponseCommon(),
    objectClassName: 'entity',
    handle,
    roles: ['registrant'],
    vcardArray: [
      'vcard',
      [
        ['version', {}, 'text', '4.0'],
        ['fn', {}, 'text', 'Redacted for Privacy'],
      ],
    ],
    links: [buildSelfLink(c)],
  });
}

function handleIpLookup(c: Context, handle: string) {
  return rdapResponse(c, {
    ...rdapResponseCommon(),
    objectClassName: 'ip network',
    handle: `dummy-ip-${handle}`,
    name: 'Dummy IP Network',
    type: 'ALLOCATED UNSPECIFIED',
    country: 'US',
    ipVersion: handle.includes(':') ? 'v6' : 'v4',
    links: [buildSelfLink(c)],
  });
}

function handleAutnumLookup(c: Context, handle: string) {
  const parsedAutnum = Number.parseInt(handle, 10);
  const autnum = Number.isFinite(parsedAutnum) ? parsedAutnum : 64512;

  return rdapResponse(c, {
    ...rdapResponseCommon(),
    objectClassName: 'autnum',
    handle: String(autnum),
    startAutnum: autnum,
    endAutnum: autnum,
    name: `AS${autnum}`,
    type: 'ALLOCATED UNSPECIFIED',
    country: 'US',
    links: [buildSelfLink(c)],
  });
}

function rdapResponseCommon() {
  return {
    rdapConformance: [...RDAP_CONFORMANCE],
    lang: 'en',
  };
}

function defaultNotices() {
  return [
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
          type: 'text/html',
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
          type: 'text/html',
        },
      ],
    },
  ];
}

function buildSelfLink(c: Context) {
  return {
    value: c.req.url,
    rel: 'self',
    href: c.req.url,
    type: RDAP_CONTENT_TYPE,
  };
}

function rdapResponse(
  c: Context,
  payload: unknown,
  status: RdapStatusCode = 200,
) {
  return c.body(JSON.stringify(payload), status, {
    'access-control-allow-origin': '*',
    'content-type': RDAP_CONTENT_TYPE,
  });
}

function rdapHead(c: Context, status: RdapStatusCode = 200) {
  return c.body(null, status, {
    'access-control-allow-origin': '*',
    'content-type': RDAP_CONTENT_TYPE,
  });
}

export type RdapErrorData = {
  errorCode: Exclude<RdapStatusCode, 200>;
  title: string;
  description: string;
};

function rdapError(c: Context, errorData: RdapErrorData) {
  return rdapResponse(
    c,
    {
      ...rdapResponseCommon(),
      errorCode: errorData.errorCode,
      title: errorData.title,
      description: [errorData.description],
    },
    errorData.errorCode,
  );
}

function validateDomainHandle(handle: string): PunycodeDomainName | null {
  try {
    const normalized = toPunycodeDomainName(handle.toLowerCase().trim());
    if (!normalized.includes('.')) {
      return null;
    }
    return normalized;
  } catch {
    return null;
  }
}

function safeUnicodeDomainName(domainName: string) {
  try {
    return toUnicodeDomainName(domainName);
  } catch {
    return domainName;
  }
}

function mapRdapLookupError(error: unknown): RdapErrorData {
  const message = error instanceof Error ? error.message : String(error);
  const lowercase = message.toLowerCase();

  if (message.includes('2303') || lowercase.includes('does not exist')) {
    return {
      errorCode: 404,
      title: 'Not Found',
      description: 'The requested domain object does not exist.',
    };
  }

  if (
    lowercase.includes('credentials not set') ||
    lowercase.includes('not configured')
  ) {
    return {
      errorCode: 503,
      title: 'Service Unavailable',
      description: 'RDAP service is temporarily unavailable.',
    };
  }

  return {
    errorCode: 502,
    title: 'Bad Gateway',
    description: 'Failed to retrieve domain data from the upstream registrar.',
  };
}

function getConfiguredCentralnicRegistrar() {
  if (!config.CENTRALNIC_KEY) {
    return null;
  }
  return getCentralnicRegistrar(config.CENTRALNIC_KEY, undefined);
}

function isDummyRdapObjectsEnabled() {
  return config.RDAP_ENABLE_DUMMY_OBJECTS;
}

function buildDomainEvents(registration: {
  creationTime?: Date | string;
  expirationTime?: Date | string;
}) {
  const events = [] as { eventAction: string; eventDate: string }[];
  const createdAt = toIsoDateTime(registration.creationTime);
  const expiresAt = toIsoDateTime(registration.expirationTime);

  if (createdAt) {
    events.push({
      eventAction: 'registration',
      eventDate: createdAt,
    });
  }
  if (expiresAt) {
    events.push({
      eventAction: 'expiration',
      eventDate: expiresAt,
    });
  }

  events.push({
    eventAction: 'last update of RDAP database',
    eventDate: new Date().toISOString(),
  });

  return events;
}

function toIsoDateTime(input: Date | string | undefined) {
  if (!input) {
    return null;
  }

  if (input instanceof Date) {
    if (Number.isNaN(input.getTime())) {
      return null;
    }
    return input.toISOString();
  }

  const parsedDate = new Date(input);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }
  return parsedDate.toISOString();
}

function buildDomainEntities(
  domainName: string,
  registration: {
    contacts?: {
      registrantContact?: {
        firstName?: string | null;
        lastName?: string | null;
        organizationName?: string | null;
        email?: string | null;
        phoneNumber?: string | null;
      };
      adminContact?: {
        firstName?: string | null;
        lastName?: string | null;
        organizationName?: string | null;
        email?: string | null;
        phoneNumber?: string | null;
      };
      technicalContact?: {
        firstName?: string | null;
        lastName?: string | null;
        organizationName?: string | null;
        email?: string | null;
        phoneNumber?: string | null;
      };
      billingContact?: {
        firstName?: string | null;
        lastName?: string | null;
        organizationName?: string | null;
        email?: string | null;
        phoneNumber?: string | null;
      };
    };
  },
) {
  const entities: Array<Record<string, unknown>> = [];

  entities.push(
    createEntityObject({
      handle: `${domainName}-registrant`,
      role: 'registrant',
      displayName: contactDisplayName(
        registration.contacts?.registrantContact,
        'Redacted for Privacy',
      ),
      email: registration.contacts?.registrantContact?.email,
      phoneNumber: registration.contacts?.registrantContact?.phoneNumber,
    }),
  );

  if (registration.contacts?.adminContact) {
    entities.push(
      createEntityObject({
        handle: `${domainName}-admin`,
        role: 'administrative',
        displayName: contactDisplayName(
          registration.contacts.adminContact,
          'Administrative Contact',
        ),
        email: registration.contacts.adminContact.email,
        phoneNumber: registration.contacts.adminContact.phoneNumber,
      }),
    );
  }

  if (registration.contacts?.technicalContact) {
    entities.push(
      createEntityObject({
        handle: `${domainName}-tech`,
        role: 'technical',
        displayName: contactDisplayName(
          registration.contacts.technicalContact,
          'Technical Contact',
        ),
        email: registration.contacts.technicalContact.email,
        phoneNumber: registration.contacts.technicalContact.phoneNumber,
      }),
    );
  }

  if (registration.contacts?.billingContact) {
    entities.push(
      createEntityObject({
        handle: `${domainName}-billing`,
        role: 'billing',
        displayName: contactDisplayName(
          registration.contacts.billingContact,
          'Billing Contact',
        ),
        email: registration.contacts.billingContact.email,
        phoneNumber: registration.contacts.billingContact.phoneNumber,
      }),
    );
  }

  entities.push(
    createEntityObject({
      handle: String(config.CENTRALNIC_KEY ?? 'centralnic'),
      role: 'registrar',
      displayName: 'CentralNic',
    }),
  );

  return entities;
}

function contactDisplayName(
  contact:
    | {
        firstName?: string | null;
        lastName?: string | null;
        organizationName?: string | null;
      }
    | undefined,
  fallback: string,
) {
  if (!contact) {
    return fallback;
  }

  if (contact.organizationName) {
    return contact.organizationName;
  }

  const fullName = [contact.firstName, contact.lastName]
    .filter((value) => Boolean(value?.trim()))
    .join(' ')
    .trim();
  return fullName || fallback;
}

function createEntityObject(input: {
  handle: string;
  role: 'registrant' | 'technical' | 'administrative' | 'billing' | 'registrar';
  displayName: string;
  email?: string | null;
  phoneNumber?: string | null;
}) {
  const vcard = [
    ['version', {}, 'text', '4.0'],
    ['fn', {}, 'text', input.displayName],
  ] as Array<[string, Record<string, string>, string, string]>;

  if (input.email) {
    vcard.push(['email', {}, 'text', input.email]);
  }
  if (input.phoneNumber) {
    vcard.push(['tel', { type: 'voice' }, 'uri', `tel:${input.phoneNumber}`]);
  }

  return {
    objectClassName: 'entity',
    handle: input.handle,
    roles: [input.role],
    vcardArray: ['vcard', vcard],
  };
}
