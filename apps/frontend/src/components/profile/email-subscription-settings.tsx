'use client';

import { Card, CardContent } from '@/components/ui/shadcn/card';
import { Switch } from '@/components/ui/shadcn/switch';
import { Label } from '@/components/ui/shadcn/label';
import { useTRPC } from '@/lib/trpc';
import { Bell } from 'lucide-react';
import { useCallback } from 'react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';

interface EmailSubscriptionSettingsProps {
  hasEmail: boolean;
}

export const EmailSubscriptionSettings = ({
  hasEmail,
}: EmailSubscriptionSettingsProps) => {
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
            ? 'Subscribed to email updates'
            : 'Unsubscribed from email updates',
          {
            description: data.optIn
              ? 'You will now receive our newsletter and important updates.'
              : 'You have been removed from our mailing list.',
          },
        );
        // Invalidate and refetch the opt-in status
        refetch();
      },
      onError: (error) => {
        toast.error('Failed to update email preferences', {
          description: `Please try again. ${error.message}`,
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
            Email Preferences
          </span>
        </div>
        <CardContent className="pt-2 pb-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label
                htmlFor="email-subscription-opt-in"
                className={`text-sm font-medium ${!hasEmail ? 'text-muted-foreground' : ''}`}
              >
                Newsletter & Updates
              </Label>
              <div className="text-sm text-muted-foreground">
                {hasEmail
                  ? 'Receive our newsletter and important product updates'
                  : 'Link an email account to subscribe to updates'}
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
