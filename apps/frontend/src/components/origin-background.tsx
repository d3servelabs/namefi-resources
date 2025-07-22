'use client';

import Image from 'next/image';
import { useOrigin } from '../providers/originProvider';

const OriginBackground = () => {
  const origin = useOrigin();

  if (origin.isLoading || !origin.originInfo.config.background) {
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
