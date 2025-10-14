'use client';

import { WalletCard, type WalletProvider } from './wallet-card';
import { ConnectedNFSCWalletCard } from './connected-nfsc-wallet-card';
import { ControlledGlareCard } from '@/components/ui/aceternity/controlled-glare-card';

export function WalletCardDemo() {
  const demoAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0';
  const demoEnsName = 'vitalik.eth';

  const demoNetworks = [
    { chainId: 1, name: 'Ethereum' },
    { chainId: 8453, name: 'Base' },
    { chainId: 10, name: 'Optimism' },
    { chainId: 137, name: 'Polygon' },
    { chainId: 42161, name: 'Arbitrum' },
  ];

  // All supported wallet providers
  const allWallets: Array<{ provider: WalletProvider; label: string }> = [
    { provider: 'metamask', label: 'MetaMask' },
    { provider: 'walletconnect', label: 'WalletConnect' },
    { provider: 'coinbase', label: 'Coinbase' },
    { provider: 'rainbow', label: 'Rainbow' },
    { provider: 'argent', label: 'Argent' },
    { provider: 'trust', label: 'Trust Wallet' },
    { provider: 'ledger', label: 'Ledger' },
    { provider: 'safe', label: 'Safe' },
    { provider: 'alphawallet', label: 'Alpha Wallet' },
    { provider: 'argentx', label: 'Argent X' },
    { provider: 'backpack', label: 'Backpack' },
    { provider: 'clave', label: 'Clave' },
    { provider: 'coin98', label: 'Coin98' },
    { provider: 'enkrypt', label: 'Enkrypt' },
    { provider: 'imtoken', label: 'imToken' },
    { provider: 'kraken', label: 'Kraken' },
    { provider: 'myetherwallet', label: 'MyEtherWallet' },
    { provider: 'okx', label: 'OKX' },
    { provider: 'phantom', label: 'Phantom' },
    { provider: 'pillar', label: 'Pillar' },
    { provider: 'portal', label: 'Portal' },
    { provider: 'rabby', label: 'Rabby' },
    { provider: 'ronin', label: 'Ronin' },
    { provider: 'sender', label: 'Sender' },
    { provider: 'sequence', label: 'Sequence' },
    { provider: 'tokenpocket', label: 'TokenPocket' },
    { provider: 'trezor', label: 'Trezor' },
    { provider: 'unipass', label: 'UniPass' },
    { provider: 'venly', label: 'Venly' },
    { provider: 'wallet3', label: 'Wallet3' },
    { provider: 'xdefi', label: 'XDEFI' },
    { provider: 'zengo', label: 'Zengo' },
    { provider: 'zerion', label: 'Zerion' },
    { provider: 'atomic', label: 'Atomic' },
    { provider: 'exodus', label: 'Exodus' },
    { provider: 'glow', label: 'Glow' },
    { provider: 'keplr', label: 'Keplr' },
    { provider: 'solflare', label: 'Solflare' },
    { provider: 'temple', label: 'Temple' },
  ];

  return (
    <div className="space-y-8 p-8">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Wallet Cards</h2>
        <p className="text-muted-foreground">
          Wallet card components for displaying connected crypto wallets
        </p>
      </div>

      {/* Featured Wallets */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Featured Wallets</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* MetaMask */}
          <WalletCard
            address={demoAddress}
            ensName={demoEnsName}
            provider="metamask"
            networks={demoNetworks}
          />

          {/* WalletConnect */}
          <WalletCard
            address={demoAddress}
            provider="walletconnect"
            networks={demoNetworks.slice(0, 3)}
          />

          {/* Rainbow */}
          <WalletCard
            address="0x1234567890123456789012345678901234567890"
            provider="rainbow"
            networks={demoNetworks}
          />

          {/* Coinbase */}
          <WalletCard
            address="0xabcdef1234567890abcdef1234567890abcdef12"
            provider="coinbase"
            networks={[demoNetworks[0]]}
          />

          {/* Phantom */}
          <WalletCard
            address="0x9876543210987654321098765432109876543210"
            provider="phantom"
            networks={demoNetworks.slice(0, 2)}
          />

          {/* Safe */}
          <WalletCard
            address="0xfedcba0987654321fedcba0987654321fedcba09"
            provider="safe"
            networks={demoNetworks}
          />
        </div>
      </div>

      {/* All Wallet Types */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">All Supported Wallets</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {allWallets.map(({ provider, label }) => (
            <div key={provider} className="space-y-2">
              <ControlledGlareCard
                rotateIntensity={0.3}
                backgroundMovement={0.8}
                glareOpacity={0.4}
                glareGradient={{ inner: 0.5, mid: 0.3, midStop: 25 }}
                diagonalPattern={{ spacing: 15, intensity: 0.6 }}
                rainbowEffect={{ enabled: true, intensity: 0.7 }}
              >
                <WalletCard
                  address={demoAddress}
                  provider={provider}
                  networks={demoNetworks.slice(0, 2)}
                />
              </ControlledGlareCard>
              <p className="text-center text-sm text-muted-foreground">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Wallet Cards with Glare Effect */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">With Glare Effect</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ControlledGlareCard
            rotateIntensity={0.3}
            backgroundMovement={0.8}
            glareOpacity={0.4}
            glareGradient={{ inner: 0.5, mid: 0.3, midStop: 25 }}
            diagonalPattern={{ spacing: 15, intensity: 0.6 }}
            rainbowEffect={{ enabled: true, intensity: 0.7 }}
          >
            <WalletCard
              address={demoAddress}
              ensName={demoEnsName}
              provider="metamask"
              networks={demoNetworks}
            />
          </ControlledGlareCard>

          <ControlledGlareCard
            rotateIntensity={0.25}
            backgroundMovement={0.6}
            glareOpacity={0.3}
            glareGradient={{ inner: 0.4, mid: 0.2, midStop: 20 }}
            diagonalPattern={{ spacing: 20, intensity: 0.5 }}
            rainbowEffect={{ enabled: true, intensity: 0.5 }}
          >
            <WalletCard
              address={demoAddress}
              provider="rainbow"
              networks={demoNetworks.slice(0, 3)}
            />
          </ControlledGlareCard>
        </div>
      </div>

      {/* NFSC Wallet Cards */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">
          NFSC Wallet Cards (with Balance)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ConnectedNFSCWalletCard
            address={demoAddress as `0x${string}`}
            ensName={demoEnsName}
            provider="metamask"
          />

          <ConnectedNFSCWalletCard
            address="0x1234567890123456789012345678901234567890"
            provider="phantom"
          />
        </div>
      </div>

      {/* Different Sizes */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Different Sizes</h3>
        <div className="flex flex-wrap gap-6">
          <div className="w-2/12">
            <ControlledGlareCard
              rotateIntensity={0.3}
              backgroundMovement={0.8}
              glareOpacity={0.4}
              glareGradient={{ inner: 0.5, mid: 0.3, midStop: 25 }}
              diagonalPattern={{ spacing: 15, intensity: 0.6 }}
              rainbowEffect={{ enabled: true, intensity: 0.7 }}
            >
              <WalletCard
                address={demoAddress}
                ensName={demoEnsName}
                provider="metamask"
                networks={demoNetworks}
              />
            </ControlledGlareCard>
          </div>
          <div className="w-4/12">
            <ControlledGlareCard
              rotateIntensity={0.3}
              backgroundMovement={0.8}
              glareOpacity={0.4}
              glareGradient={{ inner: 0.5, mid: 0.3, midStop: 25 }}
              diagonalPattern={{ spacing: 15, intensity: 0.6 }}
              rainbowEffect={{ enabled: true, intensity: 0.7 }}
            >
              <WalletCard
                address={demoAddress}
                provider="coinbase"
                networks={demoNetworks}
              />
            </ControlledGlareCard>
          </div>
          <div className="w-5/12">
            <ControlledGlareCard
              rotateIntensity={0.3}
              backgroundMovement={0.8}
              glareOpacity={0.4}
              glareGradient={{ inner: 0.5, mid: 0.3, midStop: 25 }}
              diagonalPattern={{ spacing: 15, intensity: 0.6 }}
              rainbowEffect={{ enabled: true, intensity: 0.7 }}
            >
              <WalletCard
                address={demoAddress}
                provider="rainbow"
                networks={demoNetworks}
              />
            </ControlledGlareCard>
          </div>
        </div>
      </div>
    </div>
  );
}
