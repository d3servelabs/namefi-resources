'use client';

import { useSkipAuth } from '@/hooks/use-skip-auth';
import { X, Unlock } from 'lucide-react';
import { Button } from './ui/shadcn/button';

export default function SkipAuthBanner() {
  const {
    isSkipAuthActive,
    isBannerDismissed,
    dismissBanner,
    disableSkipAuth,
    mockUser,
  } = useSkipAuth();

  if (!isSkipAuthActive || isBannerDismissed) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="rounded-md bg-amber-500 text-amber-950 shadow-lg border border-amber-600 px-3 py-2 flex items-center gap-2">
        <Unlock className="h-4 w-4" />
        <span className="text-sm font-medium">Auth Skipped (Dev Mode)</span>
        <span className="text-xs opacity-80">{mockUser.email}</span>
        {/* Two X buttons with different icon sizes for visual hierarchy:
            - Larger X (h-4 w-4): "Disable skip auth" - permanent action, clears localStorage
            - Smaller X (h-3 w-3): "Dismiss banner" - temporary, banner returns on navigation */}
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 hover:bg-amber-600 text-amber-950"
          onClick={disableSkipAuth}
          title="Disable skip auth"
          aria-label="Disable skip auth"
          type="button"
        >
          <X className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 hover:bg-amber-600 text-amber-950"
          onClick={dismissBanner}
          title="Dismiss banner"
          aria-label="Dismiss banner"
          type="button"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
