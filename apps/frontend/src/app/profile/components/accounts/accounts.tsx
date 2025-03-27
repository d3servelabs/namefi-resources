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
import { Input } from '@/components/ui/shadcn/input';
import { Label } from '@/components/ui/shadcn/label';
import { type User, usePrivy } from '@privy-io/react-auth';
import {
  Apple,
  Github,
  Instagram,
  Link2,
  Linkedin,
  Mail,
  Music,
  Smartphone,
  TextIcon as Telegram,
  Twitter,
  Users2,
} from 'lucide-react';
import { type ReactNode, useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Account } from './account';

export interface AccountsProps {
  user: User;
}

// Define OAuth provider types
export type OAuthProvider =
  | 'google'
  | 'twitter'
  | 'github'
  | 'discord'
  | 'apple'
  | 'farcaster'
  | 'instagram'
  | 'linkedin'
  | 'spotify'
  | 'passkey'
  | 'telegram'
  | 'tiktok';

export const Accounts = ({ user }: AccountsProps) => {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [isPhoneDialogOpen, setIsPhoneDialogOpen] = useState(false);

  const {
    linkEmail,
    unlinkEmail,
    linkPhone,
    unlinkPhone,
    linkGoogle,
    linkTwitter,
    linkGithub,
    linkDiscord,
    linkApple,
    linkFarcaster,
    linkInstagram,
    linkLinkedIn,
    linkSpotify,
    linkPasskey,
    linkTelegram,
    linkTiktok,
    unlinkGoogle,
    unlinkTwitter,
    unlinkGithub,
    unlinkDiscord,
    unlinkApple,
    unlinkFarcaster,
    unlinkInstagram,
    unlinkLinkedIn,
    unlinkSpotify,
    unlinkPasskey,
    unlinkTelegram,
    unlinkTiktok,
  } = usePrivy();

  const handleLinkEmail = useCallback(() => {
    if (!email) {
      toast.error('Please enter a valid email address.');
      return;
    }

    try {
      linkEmail();
      setIsEmailDialogOpen(false);
      setEmail('');
      toast.success('Email verification sent', {
        description: 'Please check your email to complete the linking process.',
      });
    } catch (error) {
      toast.error('Failed to link email', {
        description: `Please try again. ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }, [linkEmail, email]);

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

  const handleLinkPhone = useCallback(() => {
    if (!phone) {
      toast.error('Please enter a valid phone number.');
      return;
    }

    try {
      linkPhone();
      setIsPhoneDialogOpen(false);
      setPhone('');
      toast.success('Verification code sent', {
        description: 'Please check your phone to complete the linking process.',
      });
    } catch (error) {
      toast.error('Failed to link phone', {
        description: `Please try again. ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }, [phone, linkPhone]);

  const handleUnlinkPhone = useCallback(
    async (phone?: string) => {
      if (!phone) {
        return;
      }

      try {
        await unlinkPhone(phone);
        toast.success('Phone unlinked successfully');
      } catch (error) {
        toast.error('Failed to unlink phone', {
          description: `Please try again. ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    },
    [unlinkPhone],
  );

  // Map of OAuth providers to their link functions
  const linkFunctions = useMemo(
    () => ({
      google: linkGoogle,
      twitter: linkTwitter,
      github: linkGithub,
      discord: linkDiscord,
      apple: linkApple,
      farcaster: linkFarcaster,
      instagram: linkInstagram,
      linkedin: linkLinkedIn,
      spotify: linkSpotify,
      passkey: linkPasskey,
      telegram: linkTelegram,
      tiktok: linkTiktok,
    }),
    [
      linkGoogle,
      linkTwitter,
      linkGithub,
      linkDiscord,
      linkApple,
      linkFarcaster,
      linkInstagram,
      linkLinkedIn,
      linkSpotify,
      linkPasskey,
      linkTelegram,
      linkTiktok,
    ],
  );

  // Map of OAuth providers to their unlink functions
  const unlinkFunctions = useMemo(
    () => ({
      google: unlinkGoogle,
      twitter: unlinkTwitter,
      github: unlinkGithub,
      discord: unlinkDiscord,
      apple: unlinkApple,
      farcaster: unlinkFarcaster,
      instagram: unlinkInstagram,
      linkedin: unlinkLinkedIn,
      spotify: unlinkSpotify,
      passkey: unlinkPasskey,
      telegram: unlinkTelegram,
      tiktok: unlinkTiktok,
    }),
    [
      unlinkGoogle,
      unlinkTwitter,
      unlinkGithub,
      unlinkDiscord,
      unlinkApple,
      unlinkFarcaster,
      unlinkInstagram,
      unlinkLinkedIn,
      unlinkSpotify,
      unlinkPasskey,
      unlinkTelegram,
      unlinkTiktok,
    ],
  );

  const handleLinkOauth = useCallback(
    (provider: OAuthProvider): void => {
      try {
        linkFunctions[provider]();
        toast.success(
          `${provider.charAt(0).toUpperCase() + provider.slice(1)} account linked`,
          {
            description: 'Your account has been successfully linked.',
          },
        );
      } catch (error) {
        toast.error(`Failed to link ${provider} account`, {
          description: `Please try again. ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    },
    [linkFunctions],
  );

  const handleUnlinkOauth = useCallback(
    async (provider: OAuthProvider): Promise<void> => {
      try {
        // Special case for Farcaster which requires a number
        if (provider === 'farcaster') {
          await unlinkFarcaster(0);
        } else {
          // For all other providers, pass an empty string
          await unlinkFunctions[provider]('');
        }

        toast.success(
          `${provider.charAt(0).toUpperCase() + provider.slice(1)} account unlinked`,
          {
            description: 'Your account has been successfully unlinked.',
          },
        );
      } catch (error) {
        toast.error(`Failed to unlink ${provider} account`, {
          description: `Please try again. ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    },
    [unlinkFarcaster, unlinkFunctions],
  );

  // Provider configuration for rendering
  const oauthProviders: {
    id: OAuthProvider;
    name: string;
    icon: ReactNode;
    isLinked: boolean;
    linkedValue?: string | null;
  }[] = useMemo(
    () => [
      {
        id: 'google' as OAuthProvider,
        name: 'Google',
        // icon: <GoogleIcon className="h-5 w-5" />,
        icon: <Link2 className="h-5 w-5" />,
        isLinked: !!user.google?.email,
        linkedValue: user.google?.email,
      },
      {
        id: 'twitter' as OAuthProvider,
        name: 'Twitter',
        icon: <Twitter className="h-5 w-5" />,
        isLinked: !!user.twitter?.username,
        linkedValue: user.twitter?.username
          ? `@${user.twitter.username}`
          : undefined,
      },
      {
        id: 'github' as OAuthProvider,
        name: 'GitHub',
        icon: <Github className="h-5 w-5" />,
        isLinked: !!user.github?.username,
        linkedValue: user.github?.username,
      },
      {
        id: 'discord' as OAuthProvider,
        name: 'Discord',
        // icon: <DiscordIcon className="h-5 w-5" />,
        icon: <Link2 className="h-5 w-5" />,
        isLinked: !!user.discord?.username,
        linkedValue: user.discord?.username,
      },
      {
        id: 'apple' as OAuthProvider,
        name: 'Apple',
        icon: <Apple className="h-5 w-5" />,
        isLinked: !!user.apple?.email,
        linkedValue: user.apple?.email,
      },
      {
        id: 'farcaster' as OAuthProvider,
        name: 'Farcaster',
        // icon: <FarcasterIcon className="h-5 w-5" />,
        icon: <Link2 className="h-5 w-5" />,
        isLinked: !!user.farcaster?.fid,
        linkedValue: user.farcaster?.fid
          ? `FID: ${user.farcaster.fid}`
          : undefined,
      },
      {
        id: 'instagram' as OAuthProvider,
        name: 'Instagram',
        icon: <Instagram className="h-5 w-5" />,
        isLinked: !!user.instagram?.username,
        linkedValue: user.instagram?.username
          ? `@${user.instagram.username}`
          : undefined,
      },
      {
        id: 'linkedin' as OAuthProvider,
        name: 'LinkedIn',
        icon: <Linkedin className="h-5 w-5" />,
        isLinked: !!user.linkedin?.email,
        linkedValue: user.linkedin?.email,
      },
      {
        id: 'spotify' as OAuthProvider,
        name: 'Spotify',
        icon: <Music className="h-5 w-5" />,
        isLinked: !!user.spotify?.email,
        linkedValue: user.spotify?.email,
      },
      {
        id: 'passkey' as OAuthProvider,
        name: 'Passkey',
        // icon: <PasskeyIcon className="h-5 w-5" />,
        icon: <Link2 className="h-5 w-5" />,
        isLinked: false,
        linkedValue: undefined,
        // isLinked: !!user.passkeys?.length,
        // linkedValue: user.passkeys?.length ? `${user.passkeys.length} passkey(s)` : undefined,
      },
      {
        id: 'telegram' as OAuthProvider,
        name: 'Telegram',
        icon: <Telegram className="h-5 w-5" />,
        isLinked: !!user.telegram?.username,
        linkedValue: user.telegram?.username,
      },
      {
        id: 'tiktok' as OAuthProvider,
        name: 'TikTok',
        // icon: <TiktokIcon className="h-5 w-5" />,
        icon: <Link2 className="h-5 w-5" />,
        isLinked: !!user.tiktok?.username,
        linkedValue: user.tiktok?.username
          ? `@${user.tiktok.username}`
          : undefined,
      },
    ],
    [
      user.google?.email,
      user.twitter?.username,
      user.github?.username,
      user.discord?.username,
      user.apple?.email,
      user.farcaster?.fid,
      user.instagram?.username,
      user.linkedin?.email,
      user.spotify?.email,
      user.telegram?.username,
      user.tiktok?.username,
    ],
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Email Account */}
          <Account
            title="Email"
            icon={<Mail className="h-5 w-5" />}
            isLinked={!!user.email?.address}
            linkedValue={user.email?.address}
            verified={!!user.email?.address}
            onLink={() => setIsEmailDialogOpen(true)}
            onUnlink={() => handleUnlinkEmail(user.email?.address)}
          />

          {/* Phone Account */}
          <Account
            title="Phone"
            icon={<Smartphone className="h-5 w-5" />}
            isLinked={!!user.phone?.number}
            linkedValue={user.phone?.number}
            verified={!!user.phone?.number}
            onLink={() => setIsPhoneDialogOpen(true)}
            onUnlink={() => handleUnlinkPhone(user.phone?.number)}
          />

          {/* OAuth Providers */}
          {oauthProviders.map((provider) => (
            <Account
              key={provider.id}
              title={provider.name}
              icon={provider.icon}
              isLinked={provider.isLinked}
              linkedValue={provider.linkedValue}
              onLink={() => handleLinkOauth(provider.id)}
              onUnlink={() => handleUnlinkOauth(provider.id)}
            />
          ))}
        </div>
      </CardContent>

      {/* Email Dialog */}
      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link Email</DialogTitle>
            <DialogDescription>
              Enter your email address to link it to your account.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEmailDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleLinkEmail}>Link Email</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Phone Dialog */}
      <Dialog open={isPhoneDialogOpen} onOpenChange={setIsPhoneDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link Phone</DialogTitle>
            <DialogDescription>
              Enter your phone number to link it to your account.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (234) 567-8900"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPhoneDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleLinkPhone}>Link Phone</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
