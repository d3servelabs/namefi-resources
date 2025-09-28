'use client';

import { Button } from '@/components/ui/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/shadcn/dialog';
import { type User, usePrivy } from '@privy-io/react-auth';
import { GithubIcon, Users2 } from 'lucide-react';
import { useCallback, useState } from 'react';
import { TwitterIcon } from 'react-share';
import { toast } from 'sonner';
import { Account } from './account';
import { useAuth } from '@/hooks/use-auth';

export interface SocialAccountsProps {
  user: User;
}

export const SocialAccounts = ({ user }: SocialAccountsProps) => {
  const { isImpersonating } = useAuth();
  const [isUnlinkGitHubDialogOpen, setIsUnlinkGitHubDialogOpen] =
    useState(false);

  const [isUnlinkTwitterDialogOpen, setIsUnlinkTwitterDialogOpen] =
    useState(false);
  const { linkGithub, linkTwitter, unlinkGithub, unlinkTwitter } = usePrivy();

  const handleLinkGitHub = useCallback(() => {
    if (isImpersonating) {
      alert(
        'You are impersonating a user, so you cannot link a GitHub account',
      );
      return;
    }
    try {
      linkGithub();
    } catch (error) {
      toast.error('Failed to link GitHub account', {
        description: `Please try again. ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }, [linkGithub, isImpersonating]);

  const handleUnlinkGitHub = useCallback(
    async (subject: string) => {
      if (isImpersonating) {
        alert(
          'You are impersonating a user, so you cannot unlink a GitHub account',
        );
        return;
      }
      if (!subject) {
        setIsUnlinkGitHubDialogOpen(false);
        return;
      }

      try {
        await unlinkGithub(subject);
        setIsUnlinkGitHubDialogOpen(false);
        toast.success('GitHub account unlinked', {
          description: 'Your account has been successfully unlinked.',
        });
      } catch (error) {
        setIsUnlinkGitHubDialogOpen(false);
        toast.error('Failed to unlink GitHub account', {
          description: `Please try again. ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    },
    [unlinkGithub, isImpersonating],
  );

  const handleLinkTwitter = useCallback(() => {
    if (isImpersonating) {
      alert(
        'You are impersonating a user, so you cannot link a Twitter account',
      );
      return;
    }
    try {
      linkTwitter();
    } catch (error) {
      toast.error('Failed to link Twitter account', {
        description: `Please try again. ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }, [linkTwitter, isImpersonating]);

  const handleUnlinkTwitter = useCallback(
    async (subject: string) => {
      if (isImpersonating) {
        alert(
          'You are impersonating a user, so you cannot unlink a Twitter account',
        );
        return;
      }
      if (!subject) {
        setIsUnlinkTwitterDialogOpen(false);
        return;
      }

      try {
        await unlinkTwitter(subject);
        setIsUnlinkTwitterDialogOpen(false);
        toast.success('Twitter account unlinked', {
          description: 'Your account has been successfully unlinked.',
        });
      } catch (error) {
        setIsUnlinkTwitterDialogOpen(false);
        toast.error('Failed to unlink Twitter account', {
          description: `Please try again. ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    },
    [unlinkTwitter, isImpersonating],
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Users2 className="h-5 w-5 text-primary" />
            <CardTitle>Social Accounts</CardTitle>
          </div>

          <CardDescription>Manage your social media accounts</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 lg:grid-cols-2">
          <Account
            title="Twitter"
            icon={<TwitterIcon className="h-5 w-5" />}
            isLinked={!!user.twitter?.username}
            linkedValue={
              user.twitter?.username ? `@${user.twitter.username}` : undefined
            }
            verified={!!user.twitter?.username}
            onLink={handleLinkTwitter}
            onUnlink={() => setIsUnlinkTwitterDialogOpen(true)}
          />

          <Account
            title="GitHub"
            icon={<GithubIcon className="h-5 w-5" />}
            isLinked={!!user.github?.username}
            linkedValue={
              user.github?.username ? `${user.github.username}` : undefined
            }
            verified={!!user.github?.username}
            onLink={handleLinkGitHub}
            onUnlink={() => setIsUnlinkGitHubDialogOpen(true)}
          />
        </div>
      </CardContent>

      {/* GitHub Dialog */}
      <Dialog
        open={isUnlinkGitHubDialogOpen}
        onOpenChange={setIsUnlinkGitHubDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unlink GitHub</DialogTitle>
            <DialogDescription>
              Are you sure you want to continue?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsUnlinkGitHubDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleUnlinkGitHub(user.github?.subject ?? '')}
            >
              Unlink
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Twitter Dialog */}
      <Dialog
        open={isUnlinkTwitterDialogOpen}
        onOpenChange={setIsUnlinkTwitterDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unlink Twitter</DialogTitle>
            <DialogDescription>
              Are you sure you want to continue?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsUnlinkTwitterDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleUnlinkTwitter(user.twitter?.subject ?? '')}
            >
              Unlink
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
