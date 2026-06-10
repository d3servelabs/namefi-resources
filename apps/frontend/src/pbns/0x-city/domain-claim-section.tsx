'use client';

import { DomainClaim } from '@/components/domain-claim';
import { useInteractionLoggers } from '@/components/providers/analytics';
import { InteractionLoggingEventName } from '@/lib/analytics-events';
import { useRouter } from 'next/navigation';
import { type FC, useCallback } from 'react';

export const DomainClaimSection: FC = () => {
  const { logEventWithInteractionLoggers } = useInteractionLoggers();
  const router = useRouter();

  const logBeginCheckout = useCallback(() => {
    logEventWithInteractionLoggers({
      name: InteractionLoggingEventName.BeginCheckout,
      properties: {},
    });
  }, [logEventWithInteractionLoggers]);

  return (
    <section
      id="claim"
      className="flex flex-col items-center gradient-border-bottom"
    >
      <div className="relative my-20 w-[80%]">
        <div className="relative gradient-border-mask">
          <div className="absolute top-0 left-0 right-0 h-[400px] w-full bg-[radial-gradient(54.3%_55.57%_at_50%_0%,rgba(79,70,229,0.20)_0%,rgba(79,70,229,0.00)_100%)] pointer-events-none" />
          <DomainClaim
            domain="0x.city"
            onClaim={() => {
              logBeginCheckout();
              router.push('/cart');
            }}
          />
        </div>
      </div>
    </section>
  );
};
