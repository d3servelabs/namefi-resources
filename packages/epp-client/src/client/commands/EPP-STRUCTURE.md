# EPP Protocol Structure

This document provides an overview of the Extensible Provisioning Protocol (EPP) structure
as implemented in this package.

## Overview

EPP is an XML-based protocol for provisioning and managing domain names, contacts, and hosts
at domain registries. It's defined in RFC 5730-5734.

## EPP Objects

EPP manages three main object types:

| Object  | Namespace                           | RFC  | Description                     |
|---------|-------------------------------------|------|---------------------------------|
| Domain  | `urn:ietf:params:xml:ns:domain-1.0` | 5731 | Domain name registrations       |
| Contact | `urn:ietf:params:xml:ns:contact-1.0`| 5733 | Contact information for domains |
| Host    | `urn:ietf:params:xml:ns:host-1.0`   | 5732 | Nameserver host objects         |

## EPP Commands

### Query Commands (read-only)
- **check** - Determine if objects can be provisioned
- **info** - Retrieve detailed information about an object
- **poll** - Retrieve and acknowledge service messages

### Transform Commands (modify state)
- **create** - Create a new object
- **delete** - Delete an existing object
- **renew** - Extend a domain registration (domain only)
- **transfer** - Manage object transfers between registrars
- **update** - Modify an existing object

### Session Commands
- **login** - Establish a session with credentials
- **logout** - End the current session
- **hello** - Request server greeting/capabilities

## EPP Message Structure

```
┌─────────────────────────────────────────┐
│ EPP Envelope                            │
│ ┌─────────────────────────────────────┐ │
│ │ Command                             │ │
│ │ ┌─────────────────────────────────┐ │ │
│ │ │ Object-specific content         │ │ │
│ │ │ (domain:create, contact:info)   │ │ │
│ │ └─────────────────────────────────┘ │ │
│ │ ┌─────────────────────────────────┐ │ │
│ │ │ Extension (optional)            │ │ │
│ │ │ (fee, secDNS, rgp, etc.)        │ │ │
│ │ └─────────────────────────────────┘ │ │
│ │ ┌─────────────────────────────────┐ │ │
│ │ │ clTRID (client transaction ID)  │ │ │
│ │ └─────────────────────────────────┘ │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## Extension Points

EPP supports extensions at three levels:

1. **Protocol Extensions** - New commands or response elements
2. **Object Extensions** - Additional data for existing objects (e.g., DNSSEC)
3. **Command-Response Extensions** - Per-command extensions (e.g., fee information)

### Common Extensions

| Extension | Namespace                              | Purpose                    |
|-----------|----------------------------------------|----------------------------|
| secDNS    | `urn:ietf:params:xml:ns:secDNS-1.1`    | DNSSEC key management      |
| fee       | `urn:ietf:params:xml:ns:fee-1.0`       | Fee information            |
| rgp       | `urn:ietf:params:xml:ns:rgp-1.0`       | Redemption grace period    |
| idn       | `urn:ietf:params:xml:ns:idn-1.0`       | IDN table selection        |
| launch    | `urn:ietf:params:xml:ns:launch-1.0`    | Launch phase operations    |

## Directory Structure

```
commands/
├── helpers/           # Shared utilities
│   ├── xml-utils.ts   # XML text node helpers
│   ├── namespaces.ts  # Namespace constants
│   ├── base-fields.ts # Common command options
│   └── index.ts
├── session/           # Session commands
│   ├── login.ts
│   ├── logout.ts
│   ├── poll.ts
│   └── index.ts
├── domain/            # Domain commands
│   ├── types.ts       # Type definitions
│   ├── check.ts
│   ├── info.ts
│   ├── create.ts
│   ├── delete.ts
│   ├── renew.ts
│   ├── transfer.ts
│   ├── update.ts
│   └── index.ts
├── contact/           # Contact commands
│   ├── types.ts
│   ├── check.ts
│   ├── info.ts
│   ├── create.ts
│   ├── delete.ts
│   ├── update.ts
│   └── index.ts
├── host/              # Host commands
│   ├── types.ts
│   ├── check.ts
│   ├── info.ts
│   ├── create.ts
│   ├── delete.ts
│   ├── update.ts
│   └── index.ts
├── envelope/          # EPP envelope builders
│   └── index.ts
└── index.ts           # Main exports
```

## Usage Example

```typescript
import {
  buildLoginCommand,
  buildDomainCheckCommand,
  buildEppEnvelopeFromCommand,
  DOMAIN_NS,
  CONTACT_NS,
  HOST_NS,
} from "./commands";

// Build a login command
const loginCmd = buildLoginCommand({
  clID: "registrar-id",
  pw: "secret",
  objURIs: [DOMAIN_NS, CONTACT_NS, HOST_NS],
});

// Wrap in envelope for XML encoding
const envelope = buildEppEnvelopeFromCommand(loginCmd);

// Check domain availability
const checkCmd = buildDomainCheckCommand(["example.com", "example.net"]);
const checkEnvelope = buildEppEnvelopeFromCommand(checkCmd);
```

## References

- [RFC 5730](https://tools.ietf.org/html/rfc5730) - EPP Core Protocol
- [RFC 5731](https://tools.ietf.org/html/rfc5731) - EPP Domain Name Mapping
- [RFC 5732](https://tools.ietf.org/html/rfc5732) - EPP Host Mapping
- [RFC 5733](https://tools.ietf.org/html/rfc5733) - EPP Contact Mapping
- [RFC 5734](https://tools.ietf.org/html/rfc5734) - EPP Transport over TCP
