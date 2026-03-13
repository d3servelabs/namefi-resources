# WalletConnect Skill (wc)

Standalone WalletConnect session management for signing EIP-712 typed data with mobile wallets.

## Quick Start

```bash
# Install dependencies (first time only)
bun install

# Connect wallet and sign in one session
bun run scripts/connect-wallet.ts  # Scan QR code, approve
# Keep terminal open, then in another terminal:
echo '{"domain":{...},"types":{...},"primaryType":"...","message":{...}}' | \
  bun run scripts/sign-typed-data.ts
```

## Important Limitation

**Sessions do not persist across script executions.** WalletConnect v2 uses in-memory storage, so you must:
1. Connect wallet
2. Sign data (in same process/terminal session)
3. Disconnect

Each new signing operation requires a fresh connection.

## What's This?

This skill provides WalletConnect functionality through executable scripts. The `sessions.json` file stores session metadata (topic, address) for reference, but cannot restore the actual WalletConnect session.

## Key Features

- **QR Code Support**: Connect via mobile wallet scanning
- **Multiple Chains**: Base, Base Sepolia, Ethereum Mainnet, Sepolia
- **Simple Scripts**: Direct execution without MCP setup
- **Metadata Tracking**: sessions.json tracks connection info

## Workflows

### Single Signing Operation
```bash
# Terminal 1: Start connection
bun run scripts/connect-wallet.ts
# Scan QR code, keep terminal open

# Terminal 2: Sign while connection is active
echo '{...}' | bun run scripts/sign-typed-data.ts

# Terminal 1: Disconnect when done
# Ctrl+C or let it timeout
bun run scripts/disconnect.ts
```

### Check Session Status
```bash
bun run scripts/get-session.ts
```
Returns metadata from `sessions.json` (address, chainId, etc.) but does not indicate if the WalletConnect session is actually active.

## Documentation

See [SKILL.md](./SKILL.md) for:
- Detailed script usage
- EIP-712 signing examples
- Troubleshooting guide

See [TESTING-SUMMARY.md](./TESTING-SUMMARY.md) for:
- Technical details on session persistence limitation
- Alternative approaches for production use
- Architecture decisions

## Why Sessions Don't Persist

WalletConnect v2 SignClient:
- Stores session keys in internal in-memory storage
- Topic alone is insufficient to restore a session
- Requires symmetric encryption keys that aren't easily serializable
- No documented filesystem storage driver for Node.js/Bun

**For Production**: Consider:
1. Using the existing MCP server (`packages/walletconnect-mcp`)
2. Implementing a long-running daemon process
3. Accepting reconnection for each operation

## Files

```
.<agent>/skills/wc/
├── README.md               # This file
├── SKILL.md               # Complete API documentation
├── TESTING-SUMMARY.md     # Technical findings
├── package.json           # Dependencies
├── sessions.json          # Session metadata (gitignored)
└── scripts/
    ├── connect-wallet.ts     # Create WalletConnect session
    ├── sign-typed-data.ts    # Sign EIP-712 data
    ├── get-session.ts        # Check session metadata
    ├── disconnect.ts         # End session
    └── lib/
        ├── create-sign-client.ts  # SignClient factory
        └── session-store.ts       # Metadata storage
```

## NPM Scripts

```bash
bun run connect      # Connect wallet
bun run status       # Check session metadata
bun run sign         # Sign typed data (reads from stdin)
bun run disconnect   # Disconnect session
```

## Status

**Current State**: Functional for same-process operations
- ✅ Connect wallet with QR code
- ✅ Sign EIP-712 typed data
- ✅ Check session metadata
- ✅ Disconnect session
- ❌ Session persistence across processes

**Recommendation**: Use for interactive workflows where user can keep connection open, or accept reconnection overhead for automated scripts.
