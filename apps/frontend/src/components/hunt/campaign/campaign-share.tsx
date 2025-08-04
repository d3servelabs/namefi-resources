'use client';

import { Share2, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface CampaignShareProps {
  campaignKey: string;
  campaignName?: string;
}

export const CampaignShare = ({
  campaignKey,
  campaignName,
}: CampaignShareProps) => {
  const [copied, setCopied] = useState(false);
  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/hunt/campaigns/${campaignKey}`
      : '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: campaignName || 'Campaign',
          text: `Check out this campaign: ${campaignName || 'Campaign'}`,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled sharing
      }
    } else {
      // Fallback to copy
      handleCopy();
    }
  };

  return (
    <section className="py-16 px-4 sm:px-8">
      <div className="container mx-auto">
        <div className="bg-white/5 backdrop-blur-[100px] border border-white/10 rounded-xl p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">
              Share the Hunt
            </h2>
            <p className="text-white/50">
              Invite your friends—earn one raffle entry for every vote.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              type="button"
              onClick={handleShare}
              className="flex items-center justify-center gap-3 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg transition-colors"
            >
              <Share2 className="w-5 h-5" />
              <span>Share Campaign</span>
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center justify-center gap-3 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg transition-colors border border-white/20"
            >
              {copied ? (
                <Check className="w-5 h-5 text-green-400" />
              ) : (
                <Copy className="w-5 h-5" />
              )}
              <span>{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
