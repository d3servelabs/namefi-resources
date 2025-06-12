# DNS Tools

DNS utilities created by [Namefi](https://namefi.io) Team.

## Installation

```bash
npm install @namefi-astra/dns-tools
```

## CLI Usage

### Create DS Record

The package includes a command-line tool for generating DS (Delegation Signer) records from DNSKEY information.

```bash
# Install globally
npm install -g @namefi-astra/dns-tools

# Run the command
dns-tools create-ds --domain example.com --pubkey "your-public-key" --keyTag 12345

# For help and options
dns-tools create-ds --help
```

#### Options

- `-d, --domain <domain>` - Domain name (required)
- `-p, --pubkey <pubkey>` - Public key (required)
- `-k, --keyTag <keyTag>` - Key tag number (required)
- `-a, --algorithm <algorithm>` - Algorithm (default: 13)
- `--protocol <protocol>` - Protocol (default: 3)
- `-t, --ttl <ttl>` - TTL (default: 3600)
- `-f, --flags <flags>` - DNSKEY flags (default: 257 KSK)
- `--digestType <digestType>` - Digest type (default: 2 SHA-256)

### Parse DNSKEY Record

The tool can also parse a full DNSKEY record string and generate a DS record from it:

```bash
# Parse DNSKEY record to create DS record
dns-tools create-ds-from-dnskey --keyTag 1234 --record "example.com. 3600 IN DNSKEY 257 3 13 your-public-key"  
```

#### Options

- `-r, --record <record>` - Full DNSKEY record string (required)
- `-t, --ttl <ttl>` - Override TTL from the record (optional)
- `--digestType <digestType>` - Digest type (default: 2 SHA-256)
- `-k, --keyTag <keyTag>` - Key tag number (required)


## API Usage

1. Generate a DS Record

```ts
import { getDsRecordFromKey } from '@namefi-astra/dns-tools';

const dsRecord = getDsRecordFromKey(
  'example.com',
  'your-public-key',
  12345,
  13, // algorithm
  3,  // protocol
  3600, // ttl
);

console.log(dsRecord);
// example.com.	3600	IN	DS	12345 13 2 abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890
```