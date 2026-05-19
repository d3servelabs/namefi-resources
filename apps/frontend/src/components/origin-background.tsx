'use client';

import Image from 'next/image';
import { useOrigin } from '@/components/providers/origin';
import { usePathname } from 'next/navigation';
import { isLandingPath } from '@/lib/origin/keys';

const OriginBackground = () => {
  const origin = useOrigin();
  const pathname = usePathname();

  if (!origin.config.background) {
    return null;
  }

  // Note: only show the background on the landing page
  if (!isLandingPath(pathname)) {
    return null;
  }

  return (
    <div className="fixed inset-0 -z-10">
      <Image
        src={origin.config.background.image}
        alt={origin.config.background.alt}
        fill={true}
        className="object-cover"
        priority={true}
        quality={100}
      />
    </div>
  );
};

export default OriginBackground;
