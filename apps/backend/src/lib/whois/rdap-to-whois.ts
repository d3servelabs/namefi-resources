import { EppStatuses } from '@namefi-astra/utils';

const ICANN_EPP_BASE_URL = 'https://icann.org/epp#';
const ICANN_WHOIS_COMPLAINT_URL = 'https://www.icann.org/wicf/';
const DEFAULT_REGISTRAR_WHOIS_SERVER = 'whois.centralnic.com';
const DEFAULT_REGISTRAR_URL = 'https://www.centralnic.com/';
const WHOIS_LINE_ENDING = '\r\n';
const STATUS_SEPARATOR_REGEX = /[\s_-]+/;

type RdapEvent = {
  eventAction?: string;
  eventDate?: string;
};

type RdapEntity = {
  roles?: string[];
  handle?: string;
  vcardArray?: unknown;
  publicIds?: Array<{
    type?: string;
    identifier?: string;
  }>;
};

type RdapNameserver = {
  ldhName?: string;
};

type WhoisConvertibleRdapDomain = {
  ldhName: string;
  handle?: string;
  port43?: string;
  status?: string[];
  events?: RdapEvent[];
  nameservers?: RdapNameserver[];
  entities?: RdapEntity[];
  secureDns?: {
    delegationSigned?: boolean;
  };
};

type WhoisSummary = {
  domainNameUpper: string;
  registryDomainId: string | null;
  registrarWhoisServer: string;
  registrarUrl: string;
  updatedDate: string;
  creationDate: string | null;
  expirationDate: string | null;
  registrarName: string;
  registrarIanaId: string | null;
  registrantName: string | null;
  registrantEmail: string | null;
  whoisStatuses: string[];
  nameservers: string[];
  dnssecValue: 'signed' | 'unsigned';
};

export function convertRdapDomainToWhois(
  rdapDomain: WhoisConvertibleRdapDomain,
) {
  const summary = buildWhoisSummary(rdapDomain);
  const lines = buildWhoisHeaderLines(summary);

  appendRegistrantLines(lines, summary);
  appendStatusLines(lines, summary.whoisStatuses);
  appendNameserverLines(lines, summary.nameservers);
  appendFooterLines(lines, summary);

  return `${lines.join(WHOIS_LINE_ENDING)}${WHOIS_LINE_ENDING}`;
}

function buildWhoisSummary(
  rdapDomain: WhoisConvertibleRdapDomain,
): WhoisSummary {
  const entities = rdapDomain.entities ?? [];
  const registrarEntity = getEntityByRole('registrar', entities);
  const registrantEntity = getEntityByRole('registrant', entities);
  const secureDns = getSecureDns(rdapDomain);
  const events = rdapDomain.events ?? [];

  const updatedDate =
    getEventDate(['last changed'], events) ??
    getEventDate(['last update of rdap database'], events) ??
    new Date().toISOString();

  return {
    domainNameUpper: rdapDomain.ldhName.toUpperCase(),
    registryDomainId: rdapDomain.handle ?? null,
    registrarWhoisServer: rdapDomain.port43 ?? DEFAULT_REGISTRAR_WHOIS_SERVER,
    registrarUrl: DEFAULT_REGISTRAR_URL,
    updatedDate,
    creationDate: getEventDate(['registration'], events),
    expirationDate: getEventDate(['expiration'], events),
    registrarName:
      getVcardTextValue(registrarEntity?.vcardArray, 'fn') ?? 'CentralNic',
    registrarIanaId: getIanaRegistrarId(registrarEntity),
    registrantName: getVcardTextValue(registrantEntity?.vcardArray, 'fn'),
    registrantEmail: getVcardTextValue(registrantEntity?.vcardArray, 'email'),
    whoisStatuses: toWhoisDomainStatusTokens(rdapDomain.status ?? []),
    nameservers: (rdapDomain.nameservers ?? [])
      .map((nameserver) => nameserver.ldhName?.toUpperCase())
      .filter((nameserver): nameserver is string => Boolean(nameserver)),
    dnssecValue: secureDns?.delegationSigned ? 'signed' : 'unsigned',
  };
}

function getSecureDns(
  rdapDomain: WhoisConvertibleRdapDomain,
): { delegationSigned?: boolean } | null {
  if (rdapDomain.secureDns) {
    return rdapDomain.secureDns;
  }

  const secureDnsFromRdap = Object.getOwnPropertyDescriptor(
    rdapDomain,
    'secureDNS',
  )?.value;
  if (!secureDnsFromRdap || typeof secureDnsFromRdap !== 'object') {
    return null;
  }

  return secureDnsFromRdap as { delegationSigned?: boolean };
}

function buildWhoisHeaderLines(summary: WhoisSummary) {
  return [
    `Domain Name: ${summary.domainNameUpper}`,
    summary.registryDomainId
      ? `Registry Domain ID: ${summary.registryDomainId}`
      : null,
    `Registrar WHOIS Server: ${summary.registrarWhoisServer}`,
    `Registrar URL: ${summary.registrarUrl}`,
    `Updated Date: ${summary.updatedDate}`,
    summary.creationDate ? `Creation Date: ${summary.creationDate}` : null,
    summary.expirationDate
      ? `Registry Expiry Date: ${summary.expirationDate}`
      : null,
    `Registrar: ${summary.registrarName}`,
    summary.registrarIanaId
      ? `Registrar IANA ID: ${summary.registrarIanaId}`
      : null,
  ].filter((line): line is string => Boolean(line));
}

function appendRegistrantLines(lines: string[], summary: WhoisSummary) {
  if (summary.registrantName) {
    lines.push(`Registrant Name: ${summary.registrantName}`);
  }
  if (summary.registrantEmail) {
    lines.push(`Registrant Email: ${summary.registrantEmail}`);
  }
}

function appendStatusLines(lines: string[], whoisStatuses: string[]) {
  for (const status of whoisStatuses) {
    lines.push(`Domain Status: ${status} ${ICANN_EPP_BASE_URL}${status}`);
  }
}

function appendNameserverLines(lines: string[], nameservers: string[]) {
  for (const nameserver of nameservers) {
    lines.push(`Name Server: ${nameserver}`);
  }
}

function appendFooterLines(lines: string[], summary: WhoisSummary) {
  lines.push(`DNSSEC: ${summary.dnssecValue}`);
  lines.push(
    `URL of the ICANN Whois Inaccuracy Complaint Form: ${ICANN_WHOIS_COMPLAINT_URL}`,
  );
  lines.push(`>>> Last update of WHOIS database: ${summary.updatedDate} <<<`);
}

function getEntityByRole(role: string, entities: RdapEntity[]) {
  const normalizedRole = role.toLowerCase();
  return entities.find((entity) =>
    (entity.roles ?? []).some((entityRole) =>
      entityRole.toLowerCase().includes(normalizedRole),
    ),
  );
}

function getIanaRegistrarId(entity: RdapEntity | undefined) {
  for (const publicId of entity?.publicIds ?? []) {
    if (publicId.type?.toLowerCase() === 'iana registrar id') {
      return publicId.identifier ?? null;
    }
  }
  return null;
}

function getVcardTextValue(vcardArray: unknown, propertyName: string) {
  if (!Array.isArray(vcardArray) || vcardArray.length < 2) {
    return null;
  }

  const properties = vcardArray[1];
  if (!Array.isArray(properties)) {
    return null;
  }

  const property = properties.find(
    (entry) => Array.isArray(entry) && entry[0] === propertyName,
  );
  if (
    !property ||
    !Array.isArray(property) ||
    typeof property[3] !== 'string'
  ) {
    return null;
  }

  return property[3].trim() || null;
}

function getEventDate(expectedActions: string[], events: RdapEvent[]) {
  for (const event of events) {
    if (!event.eventAction || !event.eventDate) {
      continue;
    }

    const normalizedAction = event.eventAction.toLowerCase();
    if (!expectedActions.some((action) => normalizedAction === action)) {
      continue;
    }

    const parsed = new Date(event.eventDate);
    if (Number.isNaN(parsed.getTime())) {
      continue;
    }

    return parsed.toISOString();
  }

  return null;
}

function toWhoisDomainStatusTokens(statuses: string[]) {
  const canonicalStatuses = EppStatuses.fromArray(statuses).getWhoisStatuses();
  const fallbackStatuses = statuses.map((status) => toWhoisStatusToken(status));

  return [
    ...new Set([...canonicalStatuses, ...fallbackStatuses].filter(Boolean)),
  ];
}

function toWhoisStatusToken(status: string) {
  const trimmed = status.trim();
  if (!trimmed) {
    return '';
  }

  if (!STATUS_SEPARATOR_REGEX.test(trimmed)) {
    return trimmed;
  }

  const words = trimmed
    .toLowerCase()
    .split(STATUS_SEPARATOR_REGEX)
    .filter(Boolean);
  if (words.length === 0) {
    return '';
  }

  return [
    words[0],
    ...words
      .slice(1)
      .map((word) => `${word[0]?.toUpperCase() ?? ''}${word.slice(1)}`),
  ].join('');
}
