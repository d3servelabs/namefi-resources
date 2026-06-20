'use client';

import { Button } from '@namefi-astra/ui/components/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@namefi-astra/ui/components/shadcn/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@namefi-astra/ui/components/shadcn/dialog';
import { MOBILE_BOTTOM_SHEET_DIALOG } from '@/components/dialogs/mobile-bottom-sheet';
import { GitHubBrandIcon } from '@namefi-astra/ui/components/namefi/brand-icons';
import { type User, usePrivy } from '@privy-io/react-auth';
import { Users2 } from 'lucide-react';
import { useCallback, useState } from 'react';
import { TwitterIcon } from 'react-share';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { Account } from './account';
import { useAuth } from '@/hooks/use-auth';

export interface SocialAccountsProps {
  user: User | null | undefined;
}

export const SocialAccounts = ({ user }: SocialAccountsProps) => {
  const t = useTranslations('profile');
  const tCommon = useTranslations('common');
  const { isImpersonating, privyRuntimeReady, privyRuntimeAuthenticated } =
    useAuth();
  const canUsePrivyActions =
    privyRuntimeReady && privyRuntimeAuthenticated && Boolean(user);
  const [isUnlinkGitHubDialogOpen, setIsUnlinkGitHubDialogOpen] =
    useState(false);

  const [isUnlinkTwitterDialogOpen, setIsUnlinkTwitterDialogOpen] =
    useState(false);
  const { linkGithub, linkTwitter, unlinkGithub, unlinkTwitter } = usePrivy();

  const handleLinkGitHub = useCallback(() => {
    if (!canUsePrivyActions) return;
    if (isImpersonating) {
      alert(t('socialAccounts.impersonateLinkGithubAlert'));
      return;
    }
    try {
      linkGithub();
    } catch (error) {
      toast.error(t('socialAccounts.linkGithubFailure'), {
        description: t('socialAccounts.tryAgain', {
          error: error instanceof Error ? error.message : 'Unknown error',
        }),
      });
    }
  }, [canUsePrivyActions, linkGithub, isImpersonating, t]);

  const handleUnlinkGitHub = useCallback(
    async (subject: string) => {
      if (!canUsePrivyActions) return;
      if (isImpersonating) {
        alert(t('socialAccounts.impersonateUnlinkGithubAlert'));
        return;
      }
      if (!subject) {
        setIsUnlinkGitHubDialogOpen(false);
        return;
      }

      try {
        await unlinkGithub(subject);
        setIsUnlinkGitHubDialogOpen(false);
        toast.success(t('socialAccounts.unlinkGithubSuccess'), {
          description: t('socialAccounts.unlinkGithubSuccessDescription'),
        });
      } catch (error) {
        setIsUnlinkGitHubDialogOpen(false);
        toast.error(t('socialAccounts.unlinkGithubFailure'), {
          description: t('socialAccounts.tryAgain', {
            error: error instanceof Error ? error.message : 'Unknown error',
          }),
        });
      }
    },
    [canUsePrivyActions, unlinkGithub, isImpersonating, t],
  );

  const handleLinkTwitter = useCallback(() => {
    if (!canUsePrivyActions) return;
    if (isImpersonating) {
      alert(t('socialAccounts.impersonateLinkTwitterAlert'));
      return;
    }
    try {
      linkTwitter();
    } catch (error) {
      toast.error(t('socialAccounts.linkTwitterFailure'), {
        description: t('socialAccounts.tryAgain', {
          error: error instanceof Error ? error.message : 'Unknown error',
        }),
      });
    }
  }, [canUsePrivyActions, linkTwitter, isImpersonating, t]);

  const handleUnlinkTwitter = useCallback(
    async (subject: string) => {
      if (!canUsePrivyActions) return;
      if (isImpersonating) {
        alert(t('socialAccounts.impersonateUnlinkTwitterAlert'));
        return;
      }
      if (!subject) {
        setIsUnlinkTwitterDialogOpen(false);
        return;
      }

      try {
        await unlinkTwitter(subject);
        setIsUnlinkTwitterDialogOpen(false);
        toast.success(t('socialAccounts.unlinkTwitterSuccess'), {
          description: t('socialAccounts.unlinkTwitterSuccessDescription'),
        });
      } catch (error) {
        setIsUnlinkTwitterDialogOpen(false);
        toast.error(t('socialAccounts.unlinkTwitterFailure'), {
          description: t('socialAccounts.tryAgain', {
            error: error instanceof Error ? error.message : 'Unknown error',
          }),
        });
      }
    },
    [canUsePrivyActions, unlinkTwitter, isImpersonating, t],
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Users2 className="h-5 w-5 text-primary" />
            <CardTitle>{t('socialAccounts.title')}</CardTitle>
          </div>

          <CardDescription>{t('socialAccounts.description')}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 lg:grid-cols-2">
          <Account
            title={t('socialAccounts.twitterTitle')}
            icon={<TwitterIcon className="h-5 w-5" />}
            isLinked={!!user?.twitter?.username}
            linkedValue={
              user?.twitter?.username ? `@${user.twitter.username}` : undefined
            }
            verified={!!user?.twitter?.username}
            onLink={handleLinkTwitter}
            onUnlink={() => setIsUnlinkTwitterDialogOpen(true)}
            disabled={!canUsePrivyActions}
            data-testid="profile.social.twitter"
          />

          <Account
            title={t('socialAccounts.githubTitle')}
            icon={<GitHubBrandIcon className="h-5 w-5" />}
            isLinked={!!user?.github?.username}
            linkedValue={
              user?.github?.username ? `${user.github.username}` : undefined
            }
            verified={!!user?.github?.username}
            onLink={handleLinkGitHub}
            onUnlink={() => setIsUnlinkGitHubDialogOpen(true)}
            disabled={!canUsePrivyActions}
            data-testid="profile.social.github"
          />
        </div>
      </CardContent>

      {/* GitHub Dialog */}
      <Dialog
        open={isUnlinkGitHubDialogOpen}
        onOpenChange={setIsUnlinkGitHubDialogOpen}
      >
        <DialogContent
          className={MOBILE_BOTTOM_SHEET_DIALOG}
          data-testid="profile.social.github-unlink-dialog"
        >
          <DialogHeader>
            <DialogTitle>
              {t('socialAccounts.unlinkGithubDialogTitle')}
            </DialogTitle>
            <DialogDescription>
              {t('socialAccounts.confirmUnlink')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsUnlinkGitHubDialogOpen(false)}
              data-testid="profile.social.github-unlink-cancel"
            >
              {tCommon('actions.cancel')}
            </Button>
            <Button
              onClick={() => handleUnlinkGitHub(user?.github?.subject ?? '')}
              data-testid="profile.social.github-unlink-confirm"
            >
              {t('socialAccounts.unlink')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Twitter Dialog */}
      <Dialog
        open={isUnlinkTwitterDialogOpen}
        onOpenChange={setIsUnlinkTwitterDialogOpen}
      >
        <DialogContent
          className={MOBILE_BOTTOM_SHEET_DIALOG}
          data-testid="profile.social.twitter-unlink-dialog"
        >
          <DialogHeader>
            <DialogTitle>
              {t('socialAccounts.unlinkTwitterDialogTitle')}
            </DialogTitle>
            <DialogDescription>
              {t('socialAccounts.confirmUnlink')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsUnlinkTwitterDialogOpen(false)}
              data-testid="profile.social.twitter-unlink-cancel"
            >
              {tCommon('actions.cancel')}
            </Button>
            <Button
              onClick={() => handleUnlinkTwitter(user?.twitter?.subject ?? '')}
              data-testid="profile.social.twitter-unlink-confirm"
            >
              {t('socialAccounts.unlink')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
