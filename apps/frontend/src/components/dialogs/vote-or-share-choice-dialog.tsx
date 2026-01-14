'use client';

import { useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/shadcn/dialog';
import { Button } from '@/components/ui/shadcn/button';
import { LogIn, Share2 } from 'lucide-react';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';

interface VoteOrShareChoiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  domainName: NamefiNormalizedDomain | null;
  onChooseLogin: () => void;
  onChooseShare: () => void;
}

export function VoteOrShareChoiceDialog({
  isOpen,
  onClose,
  domainName,
  onChooseLogin,
  onChooseShare,
}: VoteOrShareChoiceDialogProps) {
  // No need for wrapper - just call onChooseLogin directly

  const handleChooseShare = useCallback(() => {
    onChooseShare();
    onClose();
  }, [onChooseShare, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Vote for {domainName || 'domain'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-muted-foreground">
            To vote for this domain, you can either sign in to cast your vote,
            or share the domain to support it and earn rewards.
          </p>

          <div className="space-y-3">
            <Button onClick={onChooseLogin} className="w-full" size="lg">
              <LogIn className="w-4 h-4 mr-2" />
              Sign in to Vote
            </Button>

            <Button
              onClick={handleChooseShare}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share Domain Instead
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Both options help support the domain and make you eligible for
            rewards!
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
