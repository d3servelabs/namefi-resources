'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import { type User, usePrivy } from '@privy-io/react-auth';
import { Mail, Users2 } from 'lucide-react';
import { useCallback } from 'react';
import { TwitterIcon } from 'react-share';
import { toast } from 'sonner';
import { Account } from './account';

export interface AccountsProps {
  user: User;
}

export const Accounts = ({ user }: AccountsProps) => {
  const { linkEmail, linkTwitter, unlinkEmail, unlinkTwitter } = usePrivy();

  const handleLinkEmail = useCallback(() => {
    try {
      linkEmail();
    } catch (error) {
      toast.error('Failed to link email', {
        description: `Please try again. ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }, [linkEmail]);

  const handleUnlinkEmail = useCallback(
    async (email?: string) => {
      if (!email) {
        return;
      }

      try {
        await unlinkEmail(email);
        toast.success('Email unlinked successfully');
      } catch (error) {
        toast.error('Failed to unlink email', {
          description: `Please try again. ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    },
    [unlinkEmail],
  );

  const handleLinkTwitter = useCallback(() => {
    try {
      linkTwitter();
    } catch (error) {
      toast.error('Failed to link Twitter account', {
        description: `Please try again. ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }, [linkTwitter]);

  const handleUnlinkTwitter = useCallback(
    async (subject: string) => {
      if (!subject) {
        return;
      }

      try {
        await unlinkTwitter(subject);
        toast.success('Twitter account unlinked', {
          description: 'Your account has been successfully unlinked.',
        });
      } catch (error) {
        toast.error('Failed to unlink Twitter account', {
          description: `Please try again. ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    },
    [unlinkTwitter],
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Users2 className="h-5 w-5 text-primary" />
            <CardTitle>Linked Accounts</CardTitle>
          </div>

          <CardDescription>Manage your accounts</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 lg:grid-cols-2">
          <Account
            title="Email"
            icon={<Mail className="h-5 w-5" />}
            isLinked={!!user.email?.address}
            linkedValue={user.email?.address}
            verified={!!user.email?.address}
            onLink={handleLinkEmail}
            onUnlink={() => handleUnlinkEmail(user.email?.address)}
          />

          <Account
            title="Twitter"
            icon={<TwitterIcon className="h-5 w-5" />}
            isLinked={!!user.twitter?.username}
            linkedValue={
              user.twitter?.username ? `@${user.twitter.username}` : undefined
            }
            verified={!!user.twitter?.username}
            onLink={handleLinkTwitter}
            onUnlink={() => handleUnlinkTwitter(user.twitter?.subject ?? '')}
          />
        </div>
      </CardContent>
    </Card>
  );
};
