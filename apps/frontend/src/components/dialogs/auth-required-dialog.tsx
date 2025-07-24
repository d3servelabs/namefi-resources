'use client';

import { UserDropdown } from '@/components/dropdowns/user-dropdown';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/shadcn/dialog';
import { useAuth } from '@/hooks/use-auth';
import {
  type MouseEvent,
  type ReactElement,
  cloneElement,
  useCallback,
  useState,
} from 'react';

interface AuthRequiredDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

export const AuthRequiredDialog = ({
  isOpen,
  onClose,
  title = 'Sign in required',
  description = 'You need to sign in to continue. Join the community to discover and vote for the best domains!',
}: AuthRequiredDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <UserDropdown />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface AuthGuardProps {
  children: ReactElement<{ onClick?: (event: MouseEvent) => void }>;
  title?: string;
  description?: string;
  fallbackAction?: () => void;
}

/**
 * AuthGuard component that wraps buttons/elements requiring authentication.
 *
 * If user is authenticated, the wrapped element behaves normally.
 * If user is not authenticated, it shows a login dialog when clicked.
 *
 * @example
 * ```tsx
 * // Simple usage
 * <AuthGuard>
 *   <Button onClick={handleVote}>Vote</Button>
 * </AuthGuard>
 *
 * // With custom title and description
 * <AuthGuard
 *   title="Sign in to vote"
 *   description="You need to sign in to vote for domains."
 * >
 *   <Button onClick={handleVote}>Vote</Button>
 * </AuthGuard>
 *
 * // With custom fallback action
 * <AuthGuard fallbackAction={() => router.push('/login')}>
 *   <Button onClick={handleSubmit}>Submit</Button>
 * </AuthGuard>
 * ```
 *
 * @param children - The element to wrap (typically a Button)
 * @param title - Custom title for the auth dialog
 * @param description - Custom description for the auth dialog
 * @param fallbackAction - Custom action to run instead of showing dialog
 */
export const AuthGuard = ({
  children,
  title = 'Sign in required',
  description = 'You need to sign in to continue. Join the community to discover and vote for the best domains!',
  fallbackAction,
}: AuthGuardProps) => {
  const { isAuthenticated } = useAuth();
  const [showDialog, setShowDialog] = useState(false);

  const handleClick = useCallback(
    (event: MouseEvent) => {
      if (!isAuthenticated) {
        event.preventDefault();
        event.stopPropagation();
        if (fallbackAction) {
          fallbackAction();
        } else {
          setShowDialog(true);
        }
        return;
      }

      // If authenticated, let the original onClick handler run
    },
    [isAuthenticated, fallbackAction],
  );

  // Clone the child element and add our auth check to its onClick
  const wrappedElement = cloneElement(children, {
    onClick: (event: MouseEvent) => {
      handleClick(event);
      // Only call original onClick if user is authenticated
      if (isAuthenticated && children.props.onClick) {
        children.props.onClick(event);
      }
    },
  });

  return (
    <>
      {wrappedElement}
      <AuthRequiredDialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        title={title}
        description={description}
      />
    </>
  );
};
