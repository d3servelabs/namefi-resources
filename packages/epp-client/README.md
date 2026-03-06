# EPP Client (RFC 5730) for Node/TypeScript

> Alpha / work-in-progress. Core protocol models, XML codec, and transport framing are available; higher-level client APIs are coming next.

## What this is
- Typed EPP (RFC 5730) AST in TypeScript that mirrors our internal spec (`epp-rfc5730-guide.md`).
- XML codec (encode/decode) for greeting, hello, login, logout, poll, and generic responses using `fast-xml-parser`.
- TCP/TLS transport helpers with length-prefixed framing.
- Designed to stay spec-first and extensible for domain/host/contact mappings.

## Install
```bash
# from repo root
bun add @namefi-astra/epp-client
# or npm/pnpm/yarn as usual
```

Requirements: Node 22+, TypeScript strict mode recommended, bun for scripts in this repo.

## Quickstart (low-level)
Today you can work at the protocol/transport level while the high-level client lands.

```ts
import {
  connectEpp,
  readFrame,
  sendFrame,
  encodeEppMessage,
  decodeEppMessage,
  type EppHelloCommand,
} from '@namefi-astra/epp-client';

// 1) Connect over TLS
const conn = await connectEpp({ host: 'epp.example.net', port: 700, tls: true });

// 2) Send <hello/>
const helloCmd: EppHelloCommand = { kind: 'hello' };
const xml = encodeEppMessage({ kind: 'command', command: helloCmd });
await sendFrame(conn, xml);

// 3) Read greeting/response
const resXml = await readFrame(conn);
const message = decodeEppMessage(resXml);
console.log(message);
```

As soon as the higher-level `EppClient` wrapper is added, this will shrink to `client.hello()` / `client.login()` calls.

## High-level functional client (no-throw)
The functional client keeps session state (connects, stores greeting, can auto-login), returns discriminated results, and logs XML/parsed traffic when asked.

```ts
import {
  createEppClient,
  sendCommand,
  loginCommand,
  checkCommand,
  helloCommand,
  type CommandResult,
} from '@namefi-astra/epp-client';

// Optional: domain codec (object-specific builder)
const domainCodec = {
  encodeCommand: (cmd) => {
    if (cmd.kind !== 'check') return {};
    return {
      check: {
        'domain:check': {
          '@_xmlns:domain': 'urn:ietf:params:xml:ns:domain-1.0',
          'domain:name': cmd.payload.obj.names,
        },
      },
    };
  },
};

const client = await createEppClient({
  connection: { host: 'epp.example.net', port: 700, tls: true },
  credentials: { clID: 'ClientX', pw: 'secret' },
  session: {
    version: '1.0',
    lang: 'en',
    services: { objURIs: ['urn:ietf:params:xml:ns:domain-1.0'] },
  },
  codec: domainCodec,
  logXml: true,      // optional: log raw XML frames (falls back to console)
  logParsed: true,   // optional: log parsed JSON payloads (falls back to console)
});

// The first call auto-refreshes session and auto-logins (if credentials+session provided)
const helloRes = await sendCommand(client, helloCommand());
if (!helloRes.ok) {
  console.error('hello failed', helloRes.error);
}

const loginRes = await sendCommand(client, loginCommand({
  clID: 'ClientX',
  pw: 'secret',
  version: '1.0',
  lang: 'en',
  services: { objURIs: ['urn:ietf:params:xml:ns:domain-1.0'] },
}));
if (!loginRes.ok) {
  console.error('login failed', loginRes.error);
}

const checkRes = await sendCommand(
  client,
  checkCommand({ obj: { names: ['example.com'] } }),
);
if (checkRes.ok) {
  // Simplified shape but with raw available
  console.log('availability:', checkRes.data.resData);
  console.log('raw response:', checkRes.raw);
} else {
  console.error('check error', checkRes.error);
}
```

Key behaviors:
- `createEppClient` holds the socket and greeting, and can auto-login on refresh when credentials+session are provided.
- `sendCommand` never throws; it returns `{ ok: true, data, raw } | { ok: false, error, raw? }`.
- `data` is simplified (resData/extension/results/trID or greeting), while `raw` keeps the full decoded envelope.
- Logging is opt-in per-client (`logXml`, `logParsed`, custom `logger`). If you set `logXml`/`logParsed` without a logger, it falls back to `console`.
- `apps/epp-client/src/cli/epp-shell.ts` provides a REPL (`bunx tsx ...`) and an inquirer UI (`bunx tsx ... interactive`) for ad-hoc testing. Commands like `check example.com` and `login $EPP_USER $EPP_PASS` are supported; use `SET FORMAT JSON|XML|YAML`, `SET PRETTY 1|0` (default 1), and `SET COLOR 1|0` (default 1, respects NO_COLOR/TTY) to tweak output.
- Object-specific XML still needs codecs; you can set a default codec at client creation and override per-call.

### Built-in codecs for the functional client
- `createJsonCommandCodec()` – maps `payload.obj` (or the full transfer payload) directly under the command element; use plain JSON shaped like the inner command XML.
- `createZodCommandCodec({ ...schemas })` – same mapping, but validates those payloads with your Zod schemas.

```ts
import { createEppClient, createJsonCommandCodec, createZodCommandCodec } from '@namefi-astra/epp-client';
import { z } from 'zod';

const codec = createJsonCommandCodec(); // or createZodCommandCodec({ check: z.object({ /* ... */ }) })

const client = await createEppClient({
  connection: { host: 'epp.example.net', port: 700, tls: true },
  codec,
});
```

See `examples/domain-check-zod.ts` for a Zod-backed domain check using the functional client.

## Design (layers)
- `protocol/`: RFC 5730-aligned envelopes, commands, responses, result codes, and client-facing interfaces.
- `xml/`: Pure encode/decode from AST ↔ XML with correct namespaces.
- `transport/`: TCP/TLS connect + 32-bit big-endian framing.
- `client/` (planned): Functional API orchestration (hello/login/logout/check/info/poll/transform).
- `mappings/` (planned): Object-specific builders/parsers (domain/host/contact) layered on top.

## Command coverage (current)
- Implemented: greeting, hello, login, logout, poll (request/ack) envelopes; generic responses with result codes and transaction IDs.
- Hooks: `CommandCodecOptions` lets you plug in object-specific codecs until first-party mappings land.

## Specification sources
- Internal guide: `epp-rfc5730-guide.md` (source of truth for AST).
- RFCs: 5730 (core), 5731 (domain), 5732 (host), 5733 (contact).
- XML schemas: listed in `AGENTS.md` and RFC appendices.

## Scripts
From `apps/epp-client/`:
```bash
bun run typecheck   # tsgo --noEmit
bun run build       # tsup bundle
bun run test        # (tests to be added)
```

## Roadmap
1) High-level `EppClient` with session management (connect, greeting, hello/login/logout, sendRaw).  
2) Object mappings for domain/host/contact (check/info/create/update/delete/renew/transfer).  
3) Error model & pending-operation handling.  
4) Unit/integration tests (framing, codec, client happy/error paths).  
5) Optional JSON Schema/OpenAPI generation.

## Contributing / expectations
- Keep changes aligned with `epp-rfc5730-guide.md` and RFC 5730 semantics.
- Prefer pure functions and explicit data flow; avoid inventing registry-specific behavior in core.
- Namespace correctness and result-code handling are critical; non-success codes should surface as typed errors once the client wrapper is in place.
