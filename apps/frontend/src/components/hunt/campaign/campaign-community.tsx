'use client';

import Image from 'next/image';
import { ShareIcon, CheckIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const CommunityExternalLink = ({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) => {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center w-12 h-12 bg-[#0A0A0A] hover:bg-white/10 text-white rounded-lg transition-colors border border-white/10"
    >
      {children}
    </a>
  );
};

export const CampaignCommunity = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  return (
    <section className="container mx-auto py-20">
      <div className="flex flex-col lg:flex-row gap-4 justify-around items-center relative">
        {/* Join Community Section */}
        <div className="flex-1 flex flex-col gap-8 py-10 px-4 max-w-90">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-white mb-2">
              Join the Community
            </h2>
            <p className="text-base text-white/50">
              Connect with fellow hunters - vote together on upcoming domains.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-1">
            <CommunityExternalLink href="https://discord.namefi.gg/">
              <Image
                src="/assets/hunt/community-discord.svg"
                alt="Discord"
                width={16}
                height={16}
              />
            </CommunityExternalLink>

            <CommunityExternalLink href="https://twitter.com/namefi_io">
              <Image
                src="/assets/hunt/community-twitter.svg"
                alt="Twitter"
                width={16}
                height={16}
                className="fill-current text-white"
              />
            </CommunityExternalLink>

            <CommunityExternalLink href="https://t.me/namefi">
              <Image
                src="/assets/hunt/community-telegram.svg"
                alt="Telegram"
                width={16}
                height={16}
              />
            </CommunityExternalLink>
          </div>
        </div>

        {/* Separator */}
        <div className="absolute left-1/2 top-0 bottom-0 hidden lg:block w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />

        {/* Share Section */}
        <div className="flex-1 flex flex-col gap-8 py-10 px-4 max-w-90">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-white mb-2">
              Share the hunt
            </h2>
            <p className="text-base text-white/50">
              Invite your friends - earn one raffle entry for every vote.
            </p>
          </div>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center justify-center gap-2 px-4 py-3 min-w-30 w-full rounded-md border border-[#262626] bg-[#0A0A0A]"
            >
              <span className="text-sm font-medium">
                {copied ? 'Copied!' : 'Invite Friends'}
              </span>
              {copied ? (
                <CheckIcon className="w-4 h-4 text-green-400" />
              ) : (
                <ShareIcon className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
