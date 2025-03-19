'use client';

import animationData from '@/../public/namefi_to_nfi.json';
import { useTRPC } from '@/utils/trpc';
import { useLogin, useLogout, usePrivy } from '@privy-io/react-auth';
import { useQuery } from '@tanstack/react-query';
import type { LottieRefCurrentProps } from 'lottie-react';
import { useMemo, useRef, useState } from 'react';
import { LazyLottie } from './lazyLottie';
import { Button } from './ui/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/shadcn/dialog';

function ButtonSkeleton() {
  return <div className="h-9 w-[74px] rounded-md bg-muted animate-pulse" />;
}

export function Header() {
  const {
    authenticated: privyAuthenticated,
    ready,
    user: privyUser,
  } = usePrivy();
  const [showConfirm, setShowConfirm] = useState(false);
  const trpc = useTRPC();
  const lottieRef = useRef<LottieRefCurrentProps>(null);

  const userQuery = useQuery({
    ...trpc.users.getUser.queryOptions(),
    enabled: !!privyAuthenticated,
  });

  const authenticated = useMemo(
    () =>
      privyAuthenticated &&
      privyUser &&
      userQuery.isSuccess &&
      userQuery.data.privyUserId === privyUser?.id,
    [
      privyAuthenticated,
      privyUser,
      userQuery.isSuccess,
      userQuery?.data?.privyUserId,
    ],
  );

  const disableLogout = !ready || (ready && !authenticated);
  const disableLogin = !ready || !!(ready && authenticated);

  const { logout } = useLogout({
    onSuccess: () => {
      userQuery.refetch();
    },
  });

  const { login } = useLogin({
    onComplete: () => {
      userQuery.refetch();
    },
    onError: () => {
      userQuery.refetch();
    },
  });

  const handleMouseEnter = () => {
    if (lottieRef.current) {
      lottieRef.current.setDirection(1);
      lottieRef.current.play();
    }
  };

  const handleMouseLeave = () => {
    if (lottieRef.current) {
      lottieRef.current.setDirection(-1);
      lottieRef.current.play();
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container max-w-full flex h-14 items-center">
        <div className="mr-4 flex">
          <a
            className="mr-6 flex items-center space-x-2"
            href="/"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <LazyLottie
              id="nfi-to-namefi"
              lottieRef={lottieRef}
              getJson={() => Promise.resolve(animationData)}
              loop={false}
              autoplay={false}
              style={{ width: 80, height: 24 }}
            />
          </a>
        </div>

        <div className="flex flex-1 items-center justify-end space-x-2">
          {ready ? (
            authenticated ? (
              <>
                <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
                  <DialogTrigger asChild={true}>
                    <Button variant="ghost">Sign Out</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Sign Out</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to sign out?
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button
                        variant="ghost"
                        onClick={() => setShowConfirm(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        disabled={disableLogout}
                        onClick={() => {
                          logout();
                          setShowConfirm(false);
                        }}
                      >
                        Sign Out
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            ) : (
              <Button disabled={disableLogin} onClick={login}>
                Sign In
              </Button>
            )
          ) : (
            <ButtonSkeleton />
          )}
        </div>
      </div>
    </header>
  );
}
