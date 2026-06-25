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
import { useOpenSignInFromQuery } from '@/hooks/use-login-from-query';
import { useSearchParams } from 'next/navigation';
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

    // Pre-hydration fallback for the native-link Sign in control: open the
    // chooser when the URL carries ?login=1 (module-guarded to a single instance).
    useOpenSignInFromQuery(handleLoginRequest);

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
        {shouldShowLoading || isAuthenticated ? (
          isAuthenticated && !shouldShowLoading ? (
            <div key="user-authed">
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
                  <div className="shrink-0">
                    <UserWalletAvatar
                      address={avatarAddress}
                      fallback={avatarFallback}
                      enableWalletImage={true}
                      eager={true}
                      imageSizes="32px"
                      isLoading={isAvatarIdentityLoading}
                    />
                  </div>
                  {isExpanded && (
                    <>
                      <span className="hidden text-sm md:block">
                        <UserDropdownLabel value={displayLabel} />
                      </span>
                      <span className="ms-auto">
                        <MoreHorizontalIcon className="h-5 w-5" />
                      </span>
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
            </div>
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
    <div key="user-loading">
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
    </div>
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
  // Preserve any existing query params (e.g. ?query=…) when the pre-hydration
  // native link navigates — append login=1 instead of replacing the whole query
  // string. (Post-hydration the onClick preventDefaults, so this only matters
  // for the native pre-hydration navigation.)
  const searchParams = useSearchParams();
  const loginHref = useMemo(() => {
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    params.set('login', '1');
    return `?${params.toString()}`;
  }, [searchParams]);
  return (
    <div key="user-signedout">
      <HeaderActionButton
        // Native link so Sign in is usable at first paint, before the heavy app
        // tree hydrates: pre-hydration a tap performs a native navigation to
        // ?login=1, which useOpenSignInFromQuery turns into the sign-in chooser
        // once auth is ready. After hydration, onClick opens the chooser inline
        // (no nav). onTouchStart/onFocus preload the wallet runtime on intent.
        render={
          // biome-ignore lint/a11y/useAnchorContent: base-ui's render prop injects the button's icon + "Sign in" label as the anchor children at runtime; aria-label also set for the icon-only variant.
          <a href={loginHref} rel="nofollow" aria-label={t('actions.signIn')} />
        }
        actionVariant={actionVariant}
        disableBackdropBlur={disableBackdropBlur}
        stretch={stretch}
        onClick={(event) => {
          event.preventDefault();
          onLogin();
        }}
        onFocus={onLoginIntent}
        onMouseEnter={onLoginIntent}
        onTouchStart={onLoginIntent}
        data-testid="nav.user-menu.sign-in"
      >
        <WalletIcon className="size-5" />
        {isExpanded && <span>{t('actions.signIn')}</span>}
      </HeaderActionButton>
    </div>
  );
}
