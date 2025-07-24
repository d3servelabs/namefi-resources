'use client';

import Image from 'next/image';
import { useOrigin } from '../providers/originProvider';
import { usePathname } from 'next/navigation';

const OriginBackground = () => {
  const origin = useOrigin();
  const pathname = usePathname();

  if (origin.isLoading || !origin.originInfo.config.background) {
    return null;
  }

  // Note: only show the background on the landing page
  if (pathname !== '/') {
    return null;
  }

  return (
    <div className="fixed inset-0 -z-10">
      <Image
        src={origin.originInfo.config.background.image}
        alt={origin.originInfo.config.background.alt}
        fill={true}
        className="object-cover"
        priority={true}
        quality={100}
      />
    </div>
  );
};

export default OriginBackground;
