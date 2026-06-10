'use client';

import { HeaderActionButton } from '@/components/header-action-button';
import { useAuth, useLogin } from '@/hooks/use-auth';
import { useSidebar } from '@namefi-astra/ui/components/shadcn/sidebar';
import { cn } from '@namefi-astra/ui/lib/cn';
import { Loader2Icon, WalletIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import {
  forwardRef,
  useEffect,
  useMemo,
  useState,
  type ForwardedRef,
  type HTMLAttributes,
} from 'react';
import type { HeaderActionVariant } from '@/components/header-action-button';

export type UserDropdownProps = HTMLAttributes<HTMLDivElement> & {
  forceExpanded?: boolean;
  disableBackdropBlur?: boolean;
};

type UserDropdownFullComponent =
  typeof import('@/components/dropdowns/user-dropdown-full').UserDropdownFull;

type SignedOutButtonProps = {
  actionVariant: HeaderActionVariant;
  disableBackdropBlur: boolean;
  isExpanded: boolean;
  stretch: boolean;
};

export const UserDropdown = forwardRef<HTMLDivElement, UserDropdownProps>(
  function UserDropdown(
    {
      forceExpanded = true,
      disableBackdropBlur = false,
      className,
      ...rest
    }: UserDropdownProps,
    ref: ForwardedRef<HTMLDivElement>,
  ) {
    const { state: sidebarState, isMobile } = useSidebar();
    const { isLoading, isAuthenticated } = useAuth();
    const [UserDropdownFull, setUserDropdownFull] =
      useState<UserDropdownFullComponent | null>(null);

    useEffect(() => {
      if (isLoading || !isAuthenticated || UserDropdownFull) return;

      let isCancelled = false;
      void import('@/components/dropdowns/user-dropdown-full').then((mod) => {
        if (!isCancelled) {
          setUserDropdownFull(() => mod.UserDropdownFull);
        }
      });

      return () => {
        isCancelled = true;
      };
    }, [isAuthenticated, isLoading, UserDropdownFull]);

    const isExpanded = useMemo(() => {
      return forceExpanded || sidebarState !== 'collapsed' || isMobile;
    }, [forceExpanded, sidebarState, isMobile]);

    const shouldStretch = useMemo(
      () => !forceExpanded && sidebarState !== 'collapsed' && !isMobile,
      [forceExpanded, sidebarState, isMobile],
    );

    const actionVariant = isExpanded ? 'pill' : 'icon';

    if (UserDropdownFull) {
      return (
        <UserDropdownFull
          ref={ref}
          forceExpanded={forceExpanded}
          disableBackdropBlur={disableBackdropBlur}
          className={className}
          {...rest}
        />
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          !isExpanded && !shouldStretch && 'flex justify-center',
          className,
        )}
        {...rest}
      >
        <AnimatePresence initial={false} mode="popLayout">
          {isLoading || isAuthenticated ? (
            <LoadingButton
              actionVariant={actionVariant}
              disableBackdropBlur={disableBackdropBlur}
              isExpanded={isExpanded}
              stretch={shouldStretch}
            />
          ) : (
            <SignedOutButton
              actionVariant={actionVariant}
              disableBackdropBlur={disableBackdropBlur}
              isExpanded={isExpanded}
              stretch={shouldStretch}
            />
          )}
        </AnimatePresence>
      </div>
    );
  },
);

UserDropdown.displayName = 'UserDropdown';

function LoadingButton({
  actionVariant,
  disableBackdropBlur,
  isExpanded,
  stretch,
}: SignedOutButtonProps) {
  return (
    <motion.div
      key="user-loading"
      initial={{ opacity: 0, y: -12 }}
      animate={{
        opacity: 1,
        y: 0,
        transition: { duration: 0.28, ease: 'easeOut' },
      }}
      exit={{
        opacity: 0,
        y: -12,
        transition: { duration: 0.2, ease: 'easeIn' },
      }}
      layout
    >
      <HeaderActionButton
        actionVariant={actionVariant}
        disableBackdropBlur={disableBackdropBlur}
        stretch={stretch}
        className={cn(!isExpanded && 'text-white/90')}
        disabled={true}
      >
        <Loader2Icon className="size-5 animate-spin" />
        {isExpanded && <span>Loading...</span>}
      </HeaderActionButton>
    </motion.div>
  );
}

function SignedOutButton({
  actionVariant,
  disableBackdropBlur,
  isExpanded,
  stretch,
}: SignedOutButtonProps) {
  const { login: handleConnect } = useLogin();

  return (
    <motion.div
      key="user-signedout"
      initial={{ opacity: 0, y: -12 }}
      animate={{
        opacity: 1,
        y: 0,
        transition: { duration: 0.3, ease: 'easeOut' },
      }}
      exit={{
        opacity: 0,
        y: -12,
        transition: { duration: 0.22, ease: 'easeIn' },
      }}
      layout
    >
      <HeaderActionButton
        actionVariant={actionVariant}
        disableBackdropBlur={disableBackdropBlur}
        stretch={stretch}
        onClick={() => {
          void handleConnect();
        }}
      >
        <WalletIcon className="size-5" />
        {isExpanded && <span>Sign In</span>}
      </HeaderActionButton>
    </motion.div>
  );
}
