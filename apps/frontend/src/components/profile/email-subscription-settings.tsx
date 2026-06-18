'use client';

import { Card, CardContent } from '@namefi-astra/ui/components/shadcn/card';
import { Switch } from '@namefi-astra/ui/components/shadcn/switch';
import { Label } from '@namefi-astra/ui/components/shadcn/label';
import { useTRPC } from '@/lib/trpc';
import { Bell } from 'lucide-react';
import { useCallback } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';

interface EmailSubscriptionSettingsProps {
  hasEmail: boolean;
}

export const EmailSubscriptionSettings = ({
  hasEmail,
}: EmailSubscriptionSettingsProps) => {
  const t = useTranslations('profile');
  const trpc = useTRPC();
  const {
    data: isOptedIn,
    isLoading,
    refetch,
  } = useQuery(trpc.users.doesUserSubscribeToEmails.queryOptions());
  const setEmailSubscriptionMutation = useMutation(
    trpc.users.setSubscribeToEmails.mutationOptions({
      onSuccess: (data) => {
        toast.success(
          data.optIn
            ? t('emailSubscription.subscribedTitle')
            : t('emailSubscription.unsubscribedTitle'),
          {
            description: data.optIn
              ? t('emailSubscription.subscribedDescription')
              : t('emailSubscription.unsubscribedDescription'),
          },
        );
        // Invalidate and refetch the opt-in status
        refetch();
      },
      onError: (error) => {
        toast.error(t('emailSubscription.updateFailure'), {
          description: t('emailSubscription.tryAgain', {
            error: error.message,
          }),
        });
      },
    }),
  );

  const handleToggleOptIn = useCallback(
    (optIn: boolean) => {
      setEmailSubscriptionMutation.mutate({ optIn });
    },
    [setEmailSubscriptionMutation],
  );

  return (
    <div className="relative">
      <Card className="pt-6">
        <div className="absolute -top-3 left-4 flex items-center gap-2 bg-card px-2 z-10">
          <Bell className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">
            {t('emailSubscription.emailPreferences')}
          </span>
        </div>
        <CardContent className="pt-2 pb-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label
                htmlFor="email-subscription-opt-in"
                className={`text-sm font-medium ${!hasEmail ? 'text-muted-foreground' : ''}`}
              >
                {t('emailSubscription.newsletterAndUpdates')}
              </Label>
              <div className="text-sm text-muted-foreground">
                {hasEmail
                  ? t('emailSubscription.newsletterDescriptionWithEmail')
                  : t('emailSubscription.newsletterDescriptionNoEmail')}
              </div>
            </div>
            <Switch
              id="email-subscription-opt-in"
              checked={hasEmail ? (isOptedIn ?? true) : false}
              onCheckedChange={handleToggleOptIn}
              disabled={
                !hasEmail || isLoading || setEmailSubscriptionMutation.isPending
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
