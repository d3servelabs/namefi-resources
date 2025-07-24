import { Button } from '@/components/ui/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/shadcn/dialog';
import { Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface EmailRequiredModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  actionText?: string;
  actionHref?: string;
  dismissible?: boolean;
  onGoBack?: () => void;
}

export const DNS_MANAGEMENT_EMAIL_REQUIRED = {
  title: 'Email Required for DNS Management',
  description:
    'To manage DNS records, you need to add a valid email to your profile. This helps us send important notifications about DNS changes and domain updates.',
  actionText: 'Add Email to Profile',
} as const;

export function EmailRequiredModal({
  isOpen,
  onOpenChange,
  title = 'Email Required',
  description = 'You need to add a valid email to your profile to continue.',
  actionText = 'Add Email',
  actionHref = '/profile?tab=contact-details',
  dismissible = true,
  onGoBack,
}: EmailRequiredModalProps) {
  const router = useRouter();

  const handleAddEmail = () => {
    if (dismissible) {
      onOpenChange(false);
    }
    router.push(actionHref);
  };

  const handleSecondaryAction = () => {
    if (onGoBack) {
      onGoBack();
    } else {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={dismissible ? onOpenChange : undefined}>
      <DialogContent className="sm:max-w-[425px]" showCloseButton={dismissible}>
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Mail className="h-6 w-6 text-muted-foreground" />
          </div>
          <DialogTitle className="text-center">{title}</DialogTitle>
          <DialogDescription className="text-center">
            {description}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-center mt-6">
          <Button variant="outline" onClick={handleSecondaryAction}>
            {onGoBack ? 'Go Back' : 'Cancel'}
          </Button>
          <Button onClick={handleAddEmail} className="w-full sm:w-auto">
            {actionText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
