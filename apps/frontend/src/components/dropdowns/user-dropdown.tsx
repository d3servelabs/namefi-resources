'use client';

import { HeaderActionButton } from '@/components/header-action-button';
import { CurrentUserAvatar } from '@/components/user-avatar';
import { useAuth, useLogin } from '@/hooks/use-auth';
import { shortage } from '@/lib/string';
import { getUserDisplayName } from '@/lib/user';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@namefi-astra/ui/components/shadcn/dropdown-menu';
import { useSidebar } from '@namefi-astra/ui/components/shadcn/sidebar';
import { cn } from '@namefi-astra/ui/lib/cn';
import { Loader2Icon, MoreHorizontalIcon, WalletIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import {
  forwardRef,
  useCallback,
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
  typeof import('@/components/dropdowns/user-dropdown-full').UserDropdownMenu;

let userDropdownMenuPromise: Promise<UserDropdownFullComponent> | null = null;

function loadUserDropdownMenu(): Promise<UserDropdownFullComponent> {
  userDropdownMenuPromise ??= import(
    '@/components/dropdowns/user-dropdown-full'
  ).then((mod) => mod.UserDropdownMenu);
  return userDropdownMenuPromise;
}

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
    const { isLoading, isAuthenticated, privyUser } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [hasOpenedMenu, setHasOpenedMenu] = useState(false);
    const [hasRequestedMenu, setHasRequestedMenu] = useState(false);
    const [UserDropdownMenu, setUserDropdownMenu] =
      useState<UserDropdownFullComponent | null>(null);

    const requestMenu = useCallback(() => {
      if (isLoading || !isAuthenticated || UserDropdownMenu) return;
      setHasRequestedMenu(true);
      void loadUserDropdownMenu().then((Component) => {
        setUserDropdownMenu(() => Component);
      });
    }, [isAuthenticated, isLoading, UserDropdownMenu]);

    const handleMenuOpenChange = useCallback(
      (nextOpen: boolean) => {
        setIsMenuOpen(nextOpen);
        if (nextOpen) {
          setHasOpenedMenu(true);
          requestMenu();
        }
      },
      [requestMenu],
    );

    const isExpanded = useMemo(() => {
      return forceExpanded || sidebarState !== 'collapsed' || isMobile;
    }, [forceExpanded, sidebarState, isMobile]);

    const shouldStretch = useMemo(
      () => !forceExpanded && sidebarState !== 'collapsed' && !isMobile,
      [forceExpanded, sidebarState, isMobile],
    );

    const actionVariant = isExpanded ? 'pill' : 'icon';
    const name = getUserDisplayName(privyUser);
    const expandedAvatarPaddingClass = isExpanded ? 'pl-1 pr-4' : undefined;

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
            isAuthenticated && !isLoading ? (
              <motion.div
                key="user-authed"
                initial={{ opacity: 0, y: -12 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.32, ease: 'easeOut' },
                }}
                exit={{
                  opacity: 0,
                  y: -12,
                  transition: { duration: 0.22, ease: 'easeIn' },
                }}
                layout
              >
                <DropdownMenu
                  open={isMenuOpen}
                  onOpenChange={handleMenuOpenChange}
                >
                  <DropdownMenuTrigger
                    render={
                      <HeaderActionButton
                        actionVariant={actionVariant}
                        disableBackdropBlur={disableBackdropBlur}
                        stretch={shouldStretch}
                        className={expandedAvatarPaddingClass}
                      />
                    }
                  >
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        transition: { duration: 0.28, ease: 'easeOut' },
                      }}
                      className="shrink-0"
                      layout
                    >
                      <CurrentUserAvatar
                        enableAdminLookupButtons={
                          hasOpenedMenu && Boolean(UserDropdownMenu)
                        }
                      />
                    </motion.div>
                    {isExpanded && (
                      <>
                        <motion.span
                          className="hidden text-sm md:block"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{
                            opacity: 1,
                            y: 0,
                            transition: {
                              duration: 0.24,
                              ease: 'easeOut',
                              delay: 0.03,
                            },
                          }}
                          layout
                        >
                          {shortage(name, 11)}
                        </motion.span>
                        <motion.span
                          className="ml-auto"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{
                            opacity: 1,
                            y: 0,
                            transition: {
                              duration: 0.24,
                              ease: 'easeOut',
                              delay: 0.05,
                            },
                          }}
                          layout
                        >
                          <MoreHorizontalIcon className="h-5 w-5" />
                        </motion.span>
                      </>
                    )}
                  </DropdownMenuTrigger>

                  {UserDropdownMenu && hasOpenedMenu ? (
                    <UserDropdownMenu />
                  ) : isMenuOpen && hasRequestedMenu ? (
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem disabled>
                        <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                        <span>Loading...</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  ) : null}
                </DropdownMenu>
              </motion.div>
            ) : (
              <LoadingButton
                actionVariant={actionVariant}
                disableBackdropBlur={disableBackdropBlur}
                isExpanded={isExpanded}
                stretch={shouldStretch}
              />
            )
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
