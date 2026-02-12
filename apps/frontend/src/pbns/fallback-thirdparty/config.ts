import type { OriginConfig } from '@/lib/origin/types';
import { Landing } from './landing';

export const originConfig = ({ hostname }: { hostname: string }) => {
  const parentDomain = hostname
    .replace('.localhost', '')
    .replace('astra.namefi.io', '')
    .replace('poweredby.namefi.io', '');

  return {
    metadata: {
      title: `${parentDomain} - Powered by Namefi`,
      description: `Buy and sell ${parentDomain} domains with ease`,
      icons: [{ rel: 'icon', url: '/favicon.ico' }],
    },
    logo: {
      alt: `${parentDomain} Logo`,
      title: `${parentDomain}`,
      type: 'lottie',
      lottie: '/lottie/namefi_to_nfi.json',
      width: 66,
      height: 19.8,
    },
    pbnLogo: {
      image: '/powered-by-namefi.svg',
      monoImage: '/logotype-mono.svg',
    },
    landingPage: {
      component: Landing,
      headerIsBlurred: true,
    },
    theme: 'fallback-thirdparty',
  } satisfies OriginConfig;
};
