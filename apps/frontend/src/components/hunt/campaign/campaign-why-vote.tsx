'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';

export const CampaignWhyVote = () => {
  const t = useTranslations('hunt');
  const benefits = [
    {
      icon: (
        <Image
          src="/assets/hunt/benefits-gift.svg"
          alt="Gift box"
          width={48}
          height={48}
        />
      ),
      title: t('whyVote.priorityClaimTitle'),
      description: t('whyVote.priorityClaimDescription'),
    },
    {
      icon: (
        <Image
          src="/assets/hunt/benefits-nfsc.svg"
          alt="NFSC token"
          width={48}
          height={48}
        />
      ),
      title: t('whyVote.weeklyNfscTitle'),
      description: t('whyVote.weeklyNfscDescription'),
    },
    {
      icon: (
        <Image
          src="/assets/hunt/benefits-launch.svg"
          alt="Launch"
          width={48}
          height={48}
        />
      ),
      title: t('whyVote.launchTitle'),
      description: t('whyVote.launchDescription'),
    },
  ];

  return (
    <section className="container mx-auto py-10 px-4">
      {/* Header */}
      <div className="text-center my-4 flex items-center justify-center gap-2">
        <div className="w-24 h-24 relative">
          <Image
            src="/assets/hunt/gift-box.png"
            alt="Gift box"
            fill
            sizes="96px"
            className="object-contain"
          />
        </div>
        <h2 className="text-3xl font-semibold text-white">
          {t('whyVote.title')}
        </h2>
      </div>

      {/* Benefits Grid */}
      <div className="grid lg:grid-cols-3 gap-3">
        {benefits.map((benefit, index) => (
          <div
            key={index}
            className="bg-white/10 border border-white/10 rounded-lg p-6 flex items-center gap-6"
          >
            <div className="flex-shrink-0 w-12 h-12">{benefit.icon}</div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white">
                {benefit.title}
              </h3>
              <p className="text-white/50 text-sm">{benefit.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
