---
name: WalletConnect (wc)
description: Allows Agent to create and manage WalletConnect sessions for signing EIP-712 typed data with mobile wallets.
---
# WalletConnect (wc)

Standalone WalletConnect session management without MCP configuration. This skill provides scripts to create persistent WalletConnect sessions for signing EIP-712 typed data with mobile wallets.

## Key Features

- **Session Persistence**: Sessions are saved to `sessions.json` and survive restarts
- **No MCP Required**: Works as standalone scripts without MCP server setup
- **Simple CLI**: Easy-to-use command-line interface
- **Mobile Wallet Support**: Connect via QR code scanning
- **Multiple Chains**: Supports Base, Base Sepolia, Ethereum Mainnet, and Sepolia

## Quick Start

1. **Install dependencies:**
   ```bash
   cd .<agent>/skills/wc
   bun install
   ```

2. **Connect wallet:**
   ```bash
   bun run scripts/connect-wallet.ts
   ```
   Scan the QR code with your mobile wallet (MetaMask, Rainbow, etc.)

3. **Check session status:**
   ```bash
   bun run scripts/get-session.ts
   ```

4. **Sign typed data:**
   ```bash
   echo '{"domain":{"name":"Namefi","version":"1"},"types":{"Message":[{"name":"content","type":"string"}]},"primaryType":"Message","message":{"content":"Hello"}}' | bun run scripts/sign-typed-data.ts
   ```

5. **Disconnect:**
   ```bash
   bun run scripts/disconnect.ts
   ```

## Scripts

### connect-wallet.ts

Creates a new WalletConnect session and saves it to `sessions.json`.

**Usage:**
```bash
bun run scripts/connect-wallet.ts [--chainId=<chain_id>]
```

**Options:**
- `--chainId`: Chain ID to connect to (default: 84532 - Base Sepolia)

**Supported Chains:**
- `1` - Ethereum Mainnet
- `11155111` - Sepolia Testnet
- `8453` - Base
- `84532` - Base Sepolia (default)

**Example:**
```bash
# Connect to Base Sepolia (default)
bun run scripts/connect-wallet.ts

# Connect to Base Mainnet
bun run scripts/connect-wallet.ts --chainId=8453
```

**Output:**
- Displays QR code in terminal
- Shows WalletConnect URI for manual pairing
- Waits for wallet approval
- Saves session to `sessions.json`

**Error Handling:**
- Returns error if already connected (disconnect first)
- Validates chain ID is supported
- Timeout if user doesn't approve within WalletConnect's default timeout

### sign-typed-data.ts

Signs EIP-712 typed data using the stored session.

**Usage:**
```bash
echo '<json>' | bun run scripts/sign-typed-data.ts
```

**Input Format (stdin):**
JSON object with the following structure:
```json
{
  "domain": {
    "name": "string",
    "version": "string",
    "chainId": 84532,
    "verifyingContract": "0x..."
  },
  "types": {
    "TypeName": [
      { "name": "field1", "type": "string" },
      { "name": "field2", "type": "uint256" }
    ]
  },
  "primaryType": "TypeName",
  "message": {
    "field1": "value1",
    "field2": 123
  }
}
```

**Output (stdout):**
```json
{
  "signature": "0x...",
  "address": "0x...",
  "primaryType": "TypeName"
}
```

**Example - Namefi Domain Parking:**
```bash
cat <<'EOF' | bun run scripts/sign-typed-data.ts
{
  "domain": {
    "name": "Namefi",
    "version": "1",
    "chainId": 84532
  },
  "types": {
    "ToggleDomainParking": [
      { "name": "normalizedDomainName", "type": "string" },
      { "name": "enableParking", "type": "bool" },
      { "name": "overrideExistingRecords", "type": "bool" },
      { "name": "nonce", "type": "string" }
    ]
  },
  "primaryType": "ToggleDomainParking",
  "message": {
    "normalizedDomainName": "example.com",
    "enableParking": true,
    "overrideExistingRecords": false,
    "nonce": "0x..."
  }
}
EOF
```

**Error Handling:**
- Returns error if no active session exists
- Validates input JSON format
- Checks for required fields (domain, types, primaryType, message)
- Handles session expiration

### get-session.ts

Checks the current session status.

**Usage:**
```bash
bun run scripts/get-session.ts
```

**Output (no session):**
```json
{
  "connected": false
}
```

**Output (active session):**
```json
{
  "connected": true,
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "chainId": 84532,
  "chainName": "Base Sepolia",
  "peerName": "MetaMask",
  "createdAt": 1710259200000
}
```

**Use Cases:**
- Check if a session exists before attempting to sign
- Display current wallet connection status
- Verify session details (address, chain, wallet app)

### disconnect.ts

Ends the current WalletConnect session and clears `sessions.json`.

**Usage:**
```bash
bun run scripts/disconnect.ts
```

**Process:**
1. Loads session from `sessions.json`
2. Sends disconnect request to WalletConnect
3. Removes local session file
4. Notifies user of disconnection

**Output:**
```
Disconnecting session for 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb (MetaMask)...
✓ Session disconnected and cleared.
```

**Error Handling:**
- Gracefully handles missing sessions
- Continues cleanup even if WalletConnect disconnect fails
- Always removes local session file

## Session Storage

Sessions are stored in `sessions.json` with the following structure:

```json
{
  "active": {
    "topic": "abc123...",
    "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "chainId": 84532,
    "peerName": "MetaMask",
    "createdAt": 1710259200000
  }
}
```

**Session Persistence:**
- Only one active session at a time
- Sessions survive script restarts
- Sessions can be resumed using the stored `topic`
- File is automatically created on first connection
- File is removed on disconnect

## Integration with namefi-eip712-auth

This skill works seamlessly with the `namefi-eip712-auth` skill for authenticated Namefi API requests.

**Example Workflow:**

1. **Connect wallet:**
   ```bash
   cd .<agent>/skills/wc
   bun run scripts/connect-wallet.ts
   ```

2. **Check connection:**
   ```bash
   bun run scripts/get-session.ts
   ```

3. **Use with namefi-eip712-auth to make authenticated API call:**
   The `namefi-eip712-auth` skill can use this session to sign authentication payloads for Namefi API requests that require EIP-712 signatures.

4. **Disconnect when done:**
   ```bash
   bun run scripts/disconnect.ts
   ```

## NPM Scripts

Convenience scripts are available in `package.json`:

```bash
bun run connect      # Connect wallet
bun run status       # Check session status
bun run sign         # Sign typed data (reads from stdin)
bun run disconnect   # Disconnect session
```

**Example:**
```bash
cd .claude/skills/wc
bun run status
```

## Troubleshooting

### "Already connected" error
**Solution:** Disconnect first: `bun run scripts/disconnect.ts`

### "No active session" error
**Solution:** Connect wallet first: `bun run scripts/connect-wallet.ts`

### "Session not found" error
**Cause:** Session may have expired on WalletConnect side
**Solution:** Reconnect: `bun run scripts/disconnect.ts && bun run scripts/connect-wallet.ts`

### QR code doesn't display properly
**Cause:** Terminal doesn't support QR code rendering
**Solution:** Copy the URI manually and paste into your wallet app

### Wrong chain connected
**Solution:** Disconnect and reconnect with desired chain:
```bash
bun run scripts/disconnect.ts
bun run scripts/connect-wallet.ts --chainId=8453
```

## Environment Variables

**WALLETCONNECT_PROJECT_ID** (optional)
Custom WalletConnect project ID. Defaults to Namefi's project ID if not set.

**Example:**
```bash
export WALLETCONNECT_PROJECT_ID="your-project-id"
bun run scripts/connect-wallet.ts
```

## Technical Details

### Session Resumption

WalletConnect sessions are not connection-based but topic-based. This means:
- The SignClient can be re-initialized with a stored topic
- Sessions persist across script executions
- No need to re-approve on every script run
- Topic acts as a session identifier

### Provider Implementation

The scripts create a custom viem provider that:
- Wraps WalletConnect's SignClient
- Handles standard Ethereum JSON-RPC methods
- Routes signing requests through WalletConnect
- Manages chain and account information locally

### Security Considerations

- **Session File**: `sessions.json` contains the session topic but not private keys
- **Local Only**: Sessions are stored locally and not shared
- **Wallet Control**: User must approve all signing requests on their wallet
- **Timeout**: WalletConnect sessions expire automatically after inactivity

## Comparison with MCP Approach

| Feature | MCP Server | Standalone Scripts |
|---------|------------|-------------------|
| Setup | Requires MCP config | Just copy directory |
| Persistence | In-memory only | File-based, survives restarts |
| Dependencies | MCP SDK + WalletConnect | WalletConnect only |
| Usage | MCP tool calls | Direct script execution |
| Debugging | Harder (stdio protocol) | Easier (direct output) |
| Session Management | Manual re-connect | Automatic resumption |

## Development

### Adding Support for New Chains

Edit the `CHAIN_BY_ID` constant in each script:

```typescript
import { polygon } from 'viem/chains';

const CHAIN_BY_ID: Record<number, Chain> = {
  // ... existing chains
  [polygon.id]: polygon,
};
```

### Customizing Metadata

Edit the `metadata` object in `SignClient.init()`:

```typescript
const signClient = await SignClient.init({
  projectId: PROJECT_ID,
  metadata: {
    name: 'Your App Name',
    description: 'Your app description',
    url: 'https://your-app.com',
    icons: ['https://your-app.com/icon.png'],
  },
});
```

## License

Part of the Namefi Astra project.
