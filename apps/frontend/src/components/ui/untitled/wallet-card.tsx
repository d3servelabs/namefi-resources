'use client';

import { cn } from '@/lib/cn';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/shadcn/dialog';
import { NetworkLogo } from '@/components/network-logo';
import { WalletIcon } from '@web3icons/react';

export type WalletProvider =
  | 'metamask'
  | 'walletconnect'
  | 'coinbase'
  | 'rainbow'
  | 'argent'
  | 'trust'
  | 'ledger'
  | 'safe'
  | 'alfa1'
  | 'alphawallet'
  | 'argentx'
  | 'backpack'
  | 'clave'
  | 'coin98'
  | 'enkrypt'
  | 'imtoken'
  | 'kraken'
  | 'myetherwallet'
  | 'obvious'
  | 'okx'
  | 'phantom'
  | 'pillar'
  | 'portal'
  | 'rabby'
  | 'ronin'
  | 'sender'
  | 'sequence'
  | 'soul'
  | 'squads'
  | 'tokenpocket'
  | 'trezor'
  | 'unipass'
  | 'venly'
  | 'wallet3'
  | 'xdefi'
  | 'zengo'
  | 'zerion'
  | 'atomic'
  | 'bitbox'
  | 'bluewallet'
  | 'exodus'
  | 'glow'
  | 'keplr'
  | 'kukai'
  | 'solflare'
  | 'temple'
  | 'litprotocol'
  | 'unknown';

export interface WalletNetwork {
  chainId: number;
  name: string;
  logo?: React.ReactNode;
}

export interface WalletCardProps {
  address: string;
  ensName?: string;
  provider?: WalletProvider;
  networks?: WalletNetwork[];
  className?: string;
  onNetworksClick?: () => void;
  bottomContent?: React.ReactNode;
}

// Helper function to create radial gradient with more saturated center
function createRadialGradient(baseColor: string): string {
  return `radial-gradient(circle at center, ${baseColor} 0%, color-mix(in srgb, ${baseColor} 70%, black) 100%)`;
}

const providerStyles: Record<
  WalletProvider,
  {
    backgroundColor?: string;
    background?: string;
    textColor: string;
    walletId: string;
    backgroundIconVariant?: 'branded' | 'mono';
    cornerIconVariant?: 'branded' | 'mono';
    showBackgroundIcon?: boolean;
  }
> = {
  metamask: {
    background: createRadialGradient('#F6851B'),
    textColor: 'text-white',
    walletId: 'metamask',
    cornerIconVariant: 'branded',
    backgroundIconVariant: 'branded',
  },
  walletconnect: {
    background: createRadialGradient('#3B99FC'),
    textColor: 'text-white',
    walletId: 'wallet-connect',
    backgroundIconVariant: 'mono',
  },
  coinbase: {
    background: createRadialGradient('#0052FF'),
    textColor: 'text-white',
    walletId: 'coinbase',
    backgroundIconVariant: 'branded',
    cornerIconVariant: 'branded',
  },
  rainbow: {
    background:
      'linear-gradient(135deg, #FF5E5B 0%, #FFC700 25%, #47E66B 50%, #00B9F1 75%, #7B5BFF 100%)',
    textColor: 'text-white',
    walletId: 'rainbow',
    backgroundIconVariant: 'branded',
    showBackgroundIcon: false,
  },
  argent: {
    background: createRadialGradient('#FF875B'),
    textColor: 'text-white',
    walletId: 'argent',
    backgroundIconVariant: 'branded',
  },
  argentx: {
    background: createRadialGradient('#FF875B'),
    textColor: 'text-white',
    walletId: 'argent',
    backgroundIconVariant: 'branded',
  },
  trust: {
    background: createRadialGradient('#3375BB'),
    textColor: 'text-white',
    walletId: 'trust',
    backgroundIconVariant: 'branded',
  },
  ledger: {
    background: createRadialGradient('#1A1A1A'),
    textColor: 'text-white',
    walletId: 'ledger',
    backgroundIconVariant: 'mono',
  },
  safe: {
    background: createRadialGradient('#12FF80'),
    textColor: 'text-black',
    walletId: 'safe',
    backgroundIconVariant: 'branded',
  },
  alfa1: {
    background: createRadialGradient('#6366F1'),
    textColor: 'text-white',
    walletId: 'unknown',
    backgroundIconVariant: 'branded',
  },
  alphawallet: {
    background: createRadialGradient('#4E9BF5'),
    textColor: 'text-white',
    walletId: 'alpha-wallet',
    backgroundIconVariant: 'branded',
  },
  backpack: {
    background: createRadialGradient('#E33E3F'),
    textColor: 'text-white',
    walletId: 'backpack',
    backgroundIconVariant: 'branded',
  },
  clave: {
    background: createRadialGradient('#6366F1'),
    textColor: 'text-white',
    walletId: 'clave',
    backgroundIconVariant: 'branded',
  },
  coin98: {
    background: createRadialGradient('#D9B432'),
    textColor: 'text-black',
    walletId: 'coin98',
    backgroundIconVariant: 'mono',
  },
  enkrypt: {
    background: createRadialGradient('#8B5CF6'),
    textColor: 'text-white',
    walletId: 'enkrypt',
    backgroundIconVariant: 'branded',
  },
  imtoken: {
    background: createRadialGradient('#11C4D1'),
    textColor: 'text-white',
    walletId: 'imtoken',
    backgroundIconVariant: 'branded',
  },
  kraken: {
    background: createRadialGradient('#5741D9'),
    textColor: 'text-white',
    walletId: 'kraken',
    backgroundIconVariant: 'branded',
  },
  myetherwallet: {
    background: createRadialGradient('#05C0A5'),
    textColor: 'text-white',
    walletId: 'myetherwallet',
    backgroundIconVariant: 'branded',
  },
  obvious: {
    background: createRadialGradient('#6366F1'),
    textColor: 'text-white',
    walletId: 'unknown',
    backgroundIconVariant: 'branded',
  },
  okx: {
    background: createRadialGradient('#1A1A1A'),
    textColor: 'text-white',
    walletId: 'okx',
    backgroundIconVariant: 'mono',
  },
  phantom: {
    background: createRadialGradient('#AB9FF2'),
    textColor: 'text-white',
    walletId: 'phantom',
    backgroundIconVariant: 'mono',
  },
  pillar: {
    background: createRadialGradient('#00A3FF'),
    textColor: 'text-white',
    walletId: 'pillar',
    backgroundIconVariant: 'branded',
  },
  portal: {
    background: createRadialGradient('#6366F1'),
    textColor: 'text-white',
    walletId: 'portal',
    backgroundIconVariant: 'branded',
  },
  rabby: {
    background: createRadialGradient('#8697FF'),
    textColor: 'text-white',
    walletId: 'rabby',
    backgroundIconVariant: 'branded',
  },
  ronin: {
    background: createRadialGradient('#1273EA'),
    textColor: 'text-white',
    walletId: 'ronin',
    backgroundIconVariant: 'branded',
  },
  sender: {
    background: createRadialGradient('#6366F1'),
    textColor: 'text-white',
    walletId: 'sender',
    backgroundIconVariant: 'branded',
  },
  sequence: {
    background: createRadialGradient('#1A1A1A'),
    textColor: 'text-white',
    walletId: 'sequence',
    backgroundIconVariant: 'branded',
  },
  soul: {
    background: createRadialGradient('#6366F1'),
    textColor: 'text-white',
    walletId: 'soul',
    backgroundIconVariant: 'branded',
  },
  squads: {
    background: createRadialGradient('#6366F1'),
    textColor: 'text-white',
    walletId: 'squads',
    backgroundIconVariant: 'branded',
  },
  tokenpocket: {
    background: createRadialGradient('#2980FE'),
    textColor: 'text-white',
    walletId: 'token-pocket',
    backgroundIconVariant: 'branded',
  },
  trezor: {
    background: createRadialGradient('#0F6148'),
    textColor: 'text-white',
    walletId: 'trezor',
    backgroundIconVariant: 'branded',
  },
  unipass: {
    background: createRadialGradient('#6366F1'),
    textColor: 'text-white',
    walletId: 'unipass',
    backgroundIconVariant: 'branded',
  },
  venly: {
    background: createRadialGradient('#3B5998'),
    textColor: 'text-white',
    walletId: 'venly',
    backgroundIconVariant: 'branded',
  },
  wallet3: {
    background: createRadialGradient('#6366F1'),
    textColor: 'text-white',
    walletId: 'wallet3',
    backgroundIconVariant: 'branded',
  },
  xdefi: {
    background: createRadialGradient('#16CEB9'),
    textColor: 'text-white',
    walletId: 'xdefi',
    backgroundIconVariant: 'branded',
  },
  zengo: {
    background: createRadialGradient('#6366F1'),
    textColor: 'text-white',
    walletId: 'zengo',
    backgroundIconVariant: 'branded',
  },
  zerion: {
    background: createRadialGradient('#2962EF'),
    textColor: 'text-white',
    walletId: 'zerion',
    backgroundIconVariant: 'branded',
  },
  atomic: {
    background: createRadialGradient('#1E90FF'),
    textColor: 'text-white',
    walletId: 'atomic',
    backgroundIconVariant: 'branded',
  },
  bitbox: {
    background: createRadialGradient('#0D47A1'),
    textColor: 'text-white',
    walletId: 'bitbox',
    backgroundIconVariant: 'branded',
  },
  bluewallet: {
    background: createRadialGradient('#0C8AE4'),
    textColor: 'text-white',
    walletId: 'bluewallet',
    backgroundIconVariant: 'branded',
  },
  exodus: {
    background: createRadialGradient('#0B46F9'),
    textColor: 'text-white',
    walletId: 'exodus',
    backgroundIconVariant: 'branded',
  },
  glow: {
    background: createRadialGradient('#AB5CFF'),
    textColor: 'text-white',
    walletId: 'glow',
    backgroundIconVariant: 'branded',
  },
  keplr: {
    background: createRadialGradient('#1B1E36'),
    textColor: 'text-white',
    walletId: 'keplr',
    backgroundIconVariant: 'branded',
  },
  kukai: {
    background: createRadialGradient('#3B82F6'),
    textColor: 'text-white',
    walletId: 'kukai',
    backgroundIconVariant: 'branded',
  },
  solflare: {
    background: createRadialGradient('#FC8C03'),
    textColor: 'text-white',
    walletId: 'solflare',
    backgroundIconVariant: 'branded',
  },
  temple: {
    background: createRadialGradient('#FFA500'),
    textColor: 'text-white',
    walletId: 'temple',
    backgroundIconVariant: 'branded',
    cornerIconVariant: 'branded',
  },
  litprotocol: {
    background: createRadialGradient('#FF6B00'),
    textColor: 'text-white',
    walletId: 'litprotocol',
    backgroundIconVariant: 'branded',
  },
  unknown: {
    background: createRadialGradient('#6B7280'),
    textColor: 'text-white',
    walletId: 'unknown',
    backgroundIconVariant: 'branded',
  },
};

function formatAddress(address: string, ensName?: string): string {
  if (ensName) return ensName;
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function NetworkLogosDisplay({
  networks,
  maxVisible = 4,
  onExpandClick,
}: {
  networks: WalletNetwork[];
  maxVisible?: number;
  onExpandClick?: () => void;
}) {
  const visibleNetworks = networks.slice(0, maxVisible);
  const remainingCount = Math.max(0, networks.length - maxVisible);

  return (
    <div className="flex items-center -space-x-2">
      {visibleNetworks.map((network, index) => (
        <div
          key={network.chainId}
          className="relative rounded-full opacity-90 saturate-70 blur-[.5px] aspect-square w-6 h-6"
          style={{ zIndex: visibleNetworks.length - index }}
        >
          {network.logo || (
            <NetworkLogo network={network.chainId} className="w-6 h-6" />
          )}
        </div>
      ))}
      {remainingCount > 0 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onExpandClick?.();
          }}
          className="relative flex items-center justify-center w-6 h-6 rounded-full bg-muted border-2 border-background text-xs font-medium hover:bg-muted-foreground/20 transition-colors opacity-90 saturate-70 blur-[.5px]"
          style={{ zIndex: 0 }}
        >
          +{remainingCount}
        </button>
      )}
    </div>
  );
}

export function WalletCard({
  address,
  ensName,
  provider = 'unknown',
  networks = [],
  className,
  onNetworksClick,
  bottomContent,
}: WalletCardProps) {
  const [showNetworksModal, setShowNetworksModal] = useState(false);

  const style = providerStyles[provider];
  const displayAddress = formatAddress(address, ensName);

  const handleNetworksClick = () => {
    if (onNetworksClick) {
      onNetworksClick();
    } else {
      setShowNetworksModal(true);
    }
  };

  return (
    <>
      <div
        className={cn(
          'relative rounded-2xl p-6 overflow-hidden shadow-lg transition-transform hover:scale-[1.02] aspect-[1.586]',
          style.textColor,
          className,
        )}
        style={{
          ...(style.background
            ? { background: style.background }
            : { backgroundColor: style.backgroundColor }),
        }}
      >
        {/* Large blended wallet icon in center background */}
        <div
          className={cn(
            'absolute inset-0 flex items-center justify-center pointer-events-none',
            style.showBackgroundIcon === false && 'hidden',
          )}
        >
          <WalletIcon
            id={style.walletId}
            variant={style.backgroundIconVariant}
            size={'100%'}
            className="opacity-50 saturate-50 blur-[2px]"
          />
        </div>

        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `repeating-linear-gradient(
                45deg,
                transparent,
                transparent 10px,
                rgba(255,255,255,0.05) 10px,
                rgba(255,255,255,0.05) 20px
              )`,
            }}
          />
        </div>

        {/* Content */}
        <div className="relative h-full flex flex-col justify-between">
          {/* Top section */}
          <div className="flex justify-between items-start">
            {/* Provider icon and name */}
            <div className="flex items-center gap-2">
              <WalletIcon
                id={style.walletId}
                variant={style.cornerIconVariant ?? 'mono'}
                size={24}
              />
              <span className="font-semibold text-sm uppercase tracking-wide opacity-90">
                {provider === 'unknown'
                  ? 'Wallet'
                  : provider.replace(/([A-Z])/g, ' $1').trim()}
              </span>
            </div>

            {/* Network logos */}
            {networks.length > 0 && (
              <NetworkLogosDisplay
                networks={networks}
                onExpandClick={handleNetworksClick}
              />
            )}
          </div>

          {/* Middle section - Address */}
          <div className="flex-1 flex items-center">
            <div className="space-y-1">
              {ensName && (
                <div className="text-xs opacity-70 uppercase tracking-wider">
                  ENS NAME
                </div>
              )}
              <div
                className={cn(
                  'font-mono tracking-wider',
                  ensName ? 'text-xl font-semibold' : 'text-lg',
                )}
              >
                {displayAddress}
              </div>
              {ensName && (
                <div className="text-xs opacity-70 font-mono">
                  {formatAddress(address)}
                </div>
              )}
            </div>
          </div>

          {/* Bottom section */}
          {bottomContent || (
            <div className="flex justify-between items-end">
              <div className="text-xs opacity-70 uppercase tracking-wider">
                Ethereum Wallet
              </div>
              <div className="flex items-center gap-1 text-xs opacity-70">
                <span>Connected</span>
                <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Networks Modal */}
      <Dialog open={showNetworksModal} onOpenChange={setShowNetworksModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connected Networks</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 mt-4">
            {networks.map((network) => (
              <div
                key={network.chainId}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                {network.logo || (
                  <NetworkLogo network={network.chainId} className="w-8 h-8" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {network.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    ID: {network.chainId}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
