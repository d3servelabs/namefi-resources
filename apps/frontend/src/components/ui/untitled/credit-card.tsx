/** biome-ignore-all lint/a11y/noSvgWithoutTitle: ignore */
'use client';

import { cn } from '@/lib/cn';
import type { ReactNode } from 'react';

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
  children?: ReactNode;
}

const brandLogos: Record<string, ReactNode> = {
  visa: (
    <svg
      width="48"
      height="32"
      viewBox="0 0 48 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M19.916 10.747l-2.624 10.508h-2.835l2.624-10.508h2.835zm11.424 6.787l1.673-4.618.96 4.618h-2.633zm3.526 3.721h2.625l-2.294-10.508h-2.424a1.312 1.312 0 00-1.224.817l-4.306 10.291h3.016l.599-1.658h3.685l.348 1.658h2.655l-.68-0.6zm-9.158-3.433c.012-2.924-4.045-3.086-4.018-4.393.009-.397.388-.82 1.217-.928a5.417 5.417 0 012.769.485l.493-2.303a7.555 7.555 0 00-2.625-.48c-2.773 0-4.723 1.473-4.738 3.585-.017 1.562 1.393 2.434 2.456 2.953 1.093.532 1.46.872 1.455 1.348-.008.728-.872 1.05-1.678 1.062a5.867 5.867 0 01-2.936-.698l-.518 2.419a8.482 8.482 0 003.122.578c2.948 0 4.876-1.456 4.882-3.709l.119-.919zm-11.609-6.832l-4.653 10.508h-3.03L4.744 13.48c-.103-.402-.192-.549-.505-.719-.512-.277-1.357-.537-2.099-.699l.05-.235h3.62a1.352 1.352 0 011.344 1.14l1.227 6.517 3.03-7.657h3.044l-.356-.08z"
        fill="currentColor"
      />
    </svg>
  ),
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
}: CreditCardProps) {
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
          <div className="w-10 h-8 rounded bg-gradient-to-br from-yellow-400 to-yellow-600 opacity-80" />
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
            <div className="text-xs opacity-60 uppercase mb-1">Card Holder</div>
            <div className="text-sm font-medium uppercase tracking-wide opacity-90">
              {cardHolder}
            </div>
          </div>
          <div>
            <div className="text-xs opacity-60 uppercase mb-1">Expires</div>
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
