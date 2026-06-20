'use client';

import { ChevronRight, ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';

export const CampaignHowItWorks = () => {
  const t = useTranslations('hunt');
  const Steps = [
    {
      title: t('howItWorks.voteTitle'),
      description: t('howItWorks.voteDescription'),
    },
    {
      title: t('howItWorks.winTitle'),
      description: t('howItWorks.winDescription'),
    },
    {
      title: t('howItWorks.celebrateTitle'),
      description: t('howItWorks.celebrateDescription'),
    },
  ];

  return (
    <section className="container mx-auto p-2">
      <div className="backdrop-blur-[100px] border border-white/10 rounded-xl px-4 py-5">
        <div className="flex flex-col lg:flex-row items-center gap-4">
          {Steps.map((step, index) => (
            <>
              <div className="flex flex-col items-center text-center flex-1 px-2">
                <h3 className="text-xl font-semibold text-white">
                  {step.title}
                </h3>
                <p className="text-base text-white/50">{step.description}</p>
              </div>
              {index < Steps.length - 1 && (
                <>
                  <ChevronRight className="w-6 h-6 text-white/30 hidden lg:block rtl:-scale-x-100" />
                  <ChevronDown className="w-6 h-6 text-white/30 block lg:hidden" />
                </>
              )}
            </>
          ))}
        </div>
      </div>
    </section>
  );
};
