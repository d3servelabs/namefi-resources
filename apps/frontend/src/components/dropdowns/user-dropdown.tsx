'use client';

import { HeaderActionButton } from '@/components/header-action-button';
import { UserWalletAvatar } from '@/components/user-avatar';
import { useAuth } from '@/hooks/use-auth';
import { abbreviation, shortage } from '@/lib/string';
import { getUserDisplaySafeIdentifier } from '@/lib/user';
import { getAuthDisplayProfileSafeIdentifier } from '@/components/providers/auth-display-profile';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@namefi-astra/ui/components/shadcn/dropdown-menu';
import { useSidebar } from '@namefi-astra/ui/components/shadcn/sidebar';
import { cn } from '@namefi-astra/ui/lib/cn';
import { Loader2Icon, MoreHorizontalIcon, WalletIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { AnimatePresence, motion } from 'motion/react';
import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ForwardedRef,
  type HTMLAttributes,
} from 'react';
import type { HeaderActionVariant } from '@/components/header-action-button';
import { SignInChooserDialog } from '@/components/dialogs/sign-in-chooser';
import { shouldShowUserDropdownLoading } from './user-dropdown-state';

export type UserDropdownProps = HTMLAttributes<HTMLDivElement> & {
  forceExpanded?: boolean;
  disableBackdropBlur?: boolean;
};

type UserDropdownFullComponent =
  typeof import('@/components/dropdowns/user-dropdown-full-runtime').UserDropdownMenuRuntime;

let userDropdownMenuPromise: Promise<UserDropdownFullComponent> | null = null;

function loadUserDropdownMenu(): Promise<UserDropdownFullComponent> {
  userDropdownMenuPromise ??= import(
    '@/components/dropdowns/user-dropdown-full-runtime'
  )
    .then((mod) => mod.UserDropdownMenuRuntime)
    .catch((error) => {
      userDropdownMenuPromise = null;
      throw error;
    });
  return userDropdownMenuPromise;
}

type SignedOutButtonProps = {
  actionVariant: HeaderActionVariant;
  disableBackdropBlur: boolean;
  isExpanded: boolean;
  stretch: boolean;
};

type LoginButtonProps = SignedOutButtonProps & {
  onLogin: () => void;
  onLoginIntent: () => void;
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
    const t = useTranslations('common');
    const { state: sidebarState, isMobile } = useSidebar();
    const {
      isLoading,
      isPrivyUserLoading,
      isAuthenticated,
      privyUser,
      unsafeDisplayProfile,
      preloadLoginRuntime,
    } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [hasOpenedMenu, setHasOpenedMenu] = useState(false);
    const [hasRequestedMenu, setHasRequestedMenu] = useState(false);
    const [UserDropdownMenu, setUserDropdownMenu] =
      useState<UserDropdownFullComponent | null>(null);
    const [isSignInChooserOpen, setIsSignInChooserOpen] = useState(false);

    useEffect(() => {
      if (isAuthenticated) return;

      setIsMenuOpen(false);
      setHasOpenedMenu(false);
      setHasRequestedMenu(false);
      setUserDropdownMenu(null);
    }, [isAuthenticated]);

    const requestMenu = useCallback(() => {
      if (isLoading || !isAuthenticated || UserDropdownMenu) return;
      setHasRequestedMenu(true);
      void loadUserDropdownMenu()
        .then((Component) => {
          setUserDropdownMenu(() => Component);
        })
        .catch(() => {
          setHasRequestedMenu(false);
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

    const handleLoginRequest = useCallback(() => {
      setIsSignInChooserOpen(true);
    }, []);

    const isExpanded = useMemo(() => {
      return forceExpanded || sidebarState !== 'collapsed' || isMobile;
    }, [forceExpanded, sidebarState, isMobile]);

    const shouldStretch = useMemo(
      () => !forceExpanded && sidebarState !== 'collapsed' && !isMobile,
      [forceExpanded, sidebarState, isMobile],
    );

    const actionVariant = isExpanded ? 'pill' : 'icon';
    const name =
      getUserDisplaySafeIdentifier(privyUser) ??
      getAuthDisplayProfileSafeIdentifier(unsafeDisplayProfile);
    const displayLabel = name ?? t('account.label');
    const avatarAddress =
      privyUser?.wallet?.address ?? unsafeDisplayProfile?.walletAddress ?? null;
    const avatarFallback = name
      ? abbreviation(name.replace('0x', ''), true)
      : undefined;
    const isAvatarIdentityLoading =
      isAuthenticated && isPrivyUserLoading && !avatarAddress;
    const expandedAvatarPaddingClass = isExpanded ? 'ps-1 pe-4' : undefined;
    const hasDisplayName = Boolean(name);
    const shouldShowLoading = shouldShowUserDropdownLoading({
      hasDisplayName,
      isAuthenticated,
      isDbUserLoading: isLoading,
      isPrivyUserLoading,
    });

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
          {shouldShowLoading || isAuthenticated ? (
            isAuthenticated && !shouldShowLoading ? (
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
                      <UserWalletAvatar
                        address={avatarAddress}
                        fallback={avatarFallback}
                        enableWalletImage={true}
                        eager={true}
                        imageSizes="32px"
                        isLoading={isAvatarIdentityLoading}
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
                          <UserDropdownLabel value={displayLabel} />
                        </motion.span>
                        <motion.span
                          className="ms-auto"
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
                        <Loader2Icon className="me-2 h-4 w-4 animate-spin" />
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
              onLogin={handleLoginRequest}
              onLoginIntent={preloadLoginRuntime}
            />
          )}
        </AnimatePresence>
        <SignInChooserDialog
          open={isSignInChooserOpen}
          onOpenChange={setIsSignInChooserOpen}
        />
      </div>
    );
  },
);

UserDropdown.displayName = 'UserDropdown';

function UserDropdownLabel({ value }: { value: string }) {
  return (
    <span className="inline-block overflow-hidden align-bottom">
      <span className="inline-block">{shortage(value, 11)}</span>
    </span>
  );
}

function LoadingButton({
  actionVariant,
  disableBackdropBlur,
  isExpanded,
  stretch,
}: SignedOutButtonProps) {
  const t = useTranslations('common');
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
        {isExpanded && <span>{t('actions.loading')}</span>}
      </HeaderActionButton>
    </motion.div>
  );
}

function SignedOutButton({
  actionVariant,
  disableBackdropBlur,
  isExpanded,
  stretch,
  onLogin,
  onLoginIntent,
}: LoginButtonProps) {
  const t = useTranslations('common');
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
        onClick={onLogin}
        onFocus={onLoginIntent}
        onMouseEnter={onLoginIntent}
        data-testid="nav.user-menu.sign-in"
      >
        <WalletIcon className="size-5" />
        {isExpanded && <span>{t('actions.signIn')}</span>}
      </HeaderActionButton>
    </motion.div>
  );
}
