/** biome-ignore-all lint/a11y/noSvgWithoutTitle: ignore */
'use client';

import { TruncatedTextWithHover } from '@/components/truncated-text-with-hover';
import { cn } from '@namefi-astra/ui/lib/cn';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { VisaIcon } from './visa-icon';

interface CreditCardProps {
  type?:
    | 'brand-dark'
    | 'brand-light'
    | 'gradient'
    | 'transparent'
    | 'gray-dark'
    | 'gray-light';
  brand?: string;
  cardNumber?: string;
  cardHolder?: string;
  cardExpiration?: string;
  width?: number;
  className?: string;
  withChip?: boolean;
  children?: ReactNode;
}

const brandLogos: Record<string, ReactNode> = {
  visa: <VisaIcon width={48} height={32} />,
  mastercard: (
    <svg
      width="48"
      height="32"
      viewBox="0 0 48 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="19" cy="16" r="8" fill="#EB001B" />
      <circle cx="29" cy="16" r="8" fill="#F79E1B" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M24 21.2A7.97 7.97 0 0027.2 16 7.97 7.97 0 0024 10.8a7.97 7.97 0 00-3.2 5.2A7.97 7.97 0 0024 21.2z"
        fill="#FF5F00"
      />
    </svg>
  ),
  amex: (
    <svg
      width="48"
      height="32"
      viewBox="0 0 48 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="4" y="8" width="40" height="16" rx="2" fill="#006FCF" />
      <path
        d="M13.75 14.5h2.5l-1.25-3-1.25 3zm6.25-3v6h2v-2h1l1 2h2.25l-1.25-2.5c.5-.25.75-.75.75-1.5 0-1-.75-2-2-2h-3.75zm2 1.5h1.5c.25 0 .5.25.5.5s-.25.5-.5.5H22v-1zm6 0l1.5 3 1.5-3h2l-2.5 4.5h-2l-2.5-4.5h2z"
        fill="white"
      />
    </svg>
  ),
  discover: (
    <svg
      width="48"
      height="32"
      viewBox="0 0 48 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="24" cy="16" r="10" fill="#FF6000" />
      <path
        d="M19 14v4h1.5c1.1 0 2-.9 2-2s-.9-2-2-2H19zm7 0c-.6 0-1 .4-1 1s.4 1 1 1 1-.4 1-1-.4-1-1-1z"
        fill="white"
      />
    </svg>
  ),
};

const cardStyles = {
  'brand-dark':
    'bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white',
  'brand-light':
    'bg-gradient-to-br from-blue-500 via-blue-400 to-blue-300 text-white',
  gradient:
    'bg-gradient-to-br from-purple-600 via-pink-500 to-red-500 text-white',
  transparent: 'bg-white/10 backdrop-blur-md border border-white/20 text-white',
  'gray-dark': 'bg-gradient-to-br from-gray-800 to-gray-900 text-gray-100',
  'gray-light': 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-800',
};

export function CreditCard({
  type = 'brand-dark',
  brand = 'visa',
  cardNumber = '**** **** **** 1234',
  cardHolder = 'CARD HOLDER',
  cardExpiration = '12/25',
  width,
  className,
  children,
  withChip = false,
}: CreditCardProps) {
  const t = useTranslations('shared');
  const normalizedBrand = brand.toLowerCase();
  const logo = brandLogos[normalizedBrand] || brandLogos.visa;

  return (
    <div
      className={cn(
        'relative rounded-xl p-6 shadow-xl transition-all duration-300 w-full aspect-[1.586]',
        cardStyles[type],
        className,
      )}
      style={width ? { width: `${width}px`, aspectRatio: 'auto' } : undefined}
    >
      {/* Card Background Pattern */}
      <div className="absolute inset-0 rounded-xl overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255, 255, 255, 0.1) 35px, rgba(255, 255, 255, 0.1) 70px)',
            }}
          />
        </div>
      </div>

      {/* Card Content */}
      <div className="relative flex flex-col h-full justify-between">
        {/* Top Section with Logo */}
        <div className="flex justify-between items-start">
          <div className="w-12 h-8 flex items-center text-current opacity-90">
            {logo}
          </div>

          {/* Chip Icon */}
          {withChip ? (
            <div className="w-10 h-8 rounded bg-gradient-to-br from-yellow-400 to-yellow-600 opacity-80" />
          ) : (
            false
          )}
        </div>

        {/* Middle Section with Card Number */}
        <div className="flex-1 flex items-center">
          <div className="font-mono text-lg tracking-wider opacity-90">
            {cardNumber}
          </div>
        </div>

        {/* Bottom Section with Card Holder and Expiry */}
        <div className="flex justify-between items-end">
          <div>
            <div className="text-xs opacity-60 uppercase mb-1">
              {t('creditCard.cardHolder')}
            </div>
            <div className="text-sm font-medium uppercase tracking-wide opacity-90">
              <TruncatedTextWithHover maxLength={20}>
                {cardHolder}
              </TruncatedTextWithHover>
            </div>
          </div>
          <div>
            <div className="text-xs opacity-60 uppercase mb-1">
              {t('creditCard.expires')}
            </div>
            <div className="text-sm font-medium opacity-90">
              {cardExpiration}
            </div>
          </div>
        </div>
      </div>

      {/* Custom Children Content */}
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}
