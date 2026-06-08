'use client';

import { Button } from '@namefi-astra/ui/components/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@namefi-astra/ui/components/shadcn/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@namefi-astra/ui/components/shadcn/popover';
import { useSidebar } from '@namefi-astra/ui/components/shadcn/sidebar';
import { cn } from '@namefi-astra/ui/lib/cn';
import { AlertCircle, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import {
  FORCE_HEADER_MISSING_EMAIL_WARNING_FLAG,
  useBooleanOpenFeatureFlag,
} from '@/lib/openfeature-flags';

export function HeaderMissingEmailWarning() {
  const forceHeaderMissingEmailWarning = useBooleanOpenFeatureFlag(
    FORCE_HEADER_MISSING_EMAIL_WARNING_FLAG,
  );
  const { privyUser, ready, isAuthenticated } = useAuth();
  const canShowPrompt =
    forceHeaderMissingEmailWarning ||
    (ready && isAuthenticated && !privyUser?.email?.address);
  const { isMobile } = useSidebar();
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  if (!canShowPrompt) {
    return null;
  }

  const handleAddEmail = () => {
    setIsDialogOpen(false);
    setIsPopoverOpen(false);
    router.push('/profile?tab=contact-details&highlight=email');
  };

  const triggerButton = (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-full px-2.75 py-2.75 text-xs font-medium transition-colors',
        'bg-amber-500/10 text-amber-600 border border-amber-500/20',
        'hover:bg-amber-500/20 hover:border-amber-500/30',
        'dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
        'dark:hover:bg-amber-500/20 dark:hover:border-amber-500/30',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50',
      )}
      onClick={() => {
        if (isMobile) {
          setIsDialogOpen(true);
        }
      }}
    >
      <AlertCircle className="size-4 shrink-0" />
      <span className="hidden sm:inline">No Contact Email</span>
    </button>
  );

  if (isMobile) {
    return (
      <>
        {triggerButton}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
                <Mail className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <DialogTitle className="text-center">
                No Contact Email
              </DialogTitle>
              <DialogDescription className="text-center">
                Add your email to receive important notifications about your
                orders, domains, and account updates.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-center mt-6">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="w-full sm:w-auto"
              >
                Later
              </Button>
              <Button onClick={handleAddEmail} className="w-full sm:w-auto">
                Add Email to Profile
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger render={triggerButton} />
      <PopoverContent className="w-80" align="end">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/10">
              <Mail className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1 space-y-1">
              <h4 className="font-semibold text-sm">No Contact Email</h4>
              <p className="text-sm text-muted-foreground">
                Add your email to receive important notifications about your
                orders, domains, and account updates.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPopoverOpen(false)}
              className="flex-1"
            >
              Later
            </Button>
            <Button size="sm" onClick={handleAddEmail} className="flex-1">
              Add Email
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
