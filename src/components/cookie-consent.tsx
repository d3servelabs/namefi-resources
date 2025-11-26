'use client';

import { Cookie } from 'lucide-react';
import type { HTMLMotionProps } from 'motion/react';
import { motion } from 'motion/react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { forwardRef, useCallback } from 'react';
import { Button } from '@/components/ui/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import { cn } from '@/lib/cn';

interface CookieConsentProps extends Omit<HTMLMotionProps<'div'>, 'ref'> {
  variant?: 'default' | 'small' | 'mini';
  position?: 'bottom-left' | 'bottom-center' | 'bottom-right';
  onAcceptCallback?: () => void;
  onDeclineCallback?: () => void;
  description?: ReactNode;
}

export const CookieConsent = forwardRef<HTMLDivElement, CookieConsentProps>(
  (
    {
      variant = 'default',
      position = 'bottom-right',
      onAcceptCallback = () => {},
      onDeclineCallback = () => {},
      className,
      description = (
        <>
          We use cookies to ensure you get the best experience on our website.{' '}
          For more information on how we use cookies, please see our{' '}
          <Link
            href="https://namefi.io/tos"
            className="underline underline-offset-4 text-primary"
            target="_blank"
            rel="noreferrer noopener"
          >
            Terms &amp; Conditions
          </Link>
          .
        </>
      ),
      ...props
    },
    ref,
  ) => {
    const handleAccept = useCallback(() => {
      onAcceptCallback();
    }, [onAcceptCallback]);

    const handleDecline = useCallback(() => {
      onDeclineCallback();
    }, [onDeclineCallback]);

    const containerClasses = cn('fixed z-50', className);

    const commonWrapperProps: Omit<HTMLMotionProps<'div'>, 'ref'> = {
      className: cn(
        containerClasses,
        variant === 'mini'
          ? position === 'bottom-center'
            ? 'left-0 right-0 bottom-4 w-full sm:max-w-3xl sm:left-1/2 sm:right-auto sm:-translate-x-1/2'
            : position === 'bottom-left'
              ? 'left-0 right-0 bottom-4 w-full sm:max-w-3xl sm:left-4 sm:right-auto'
              : 'left-0 right-0 bottom-4 w-full sm:max-w-3xl sm:right-4 sm:left-auto'
          : position === 'bottom-center'
            ? 'bottom-0 left-0 right-0 sm:bottom-4 w-full sm:max-w-md sm:left-1/2 sm:right-auto sm:-translate-x-1/2'
            : position === 'bottom-left'
              ? 'bottom-0 left-0 right-0 sm:bottom-4 w-full sm:max-w-md sm:left-4 sm:right-auto'
              : 'bottom-0 left-0 right-0 sm:bottom-4 w-full sm:max-w-md sm:right-4 sm:left-auto',
      ),
      ...props,
    };

    const motionProps: Omit<HTMLMotionProps<'div'>, 'ref'> = {
      initial: { y: 64, opacity: 0 },
      animate: { y: 0, opacity: 1 },
      exit: { y: 64, opacity: 0 },
      transition: { duration: 0.35 },
    };

    if (variant === 'default') {
      return (
        <motion.div ref={ref} {...commonWrapperProps} {...motionProps}>
          <Card className="m-3 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg">We use cookies</CardTitle>
              <Cookie className="h-5 w-5" />
            </CardHeader>
            <CardContent className="space-y-2">
              <CardDescription className="text-sm">
                {description}
              </CardDescription>
              <p className="text-xs text-muted-foreground">
                By clicking <span className="font-medium">"Accept"</span>, you
                agree to our use of cookies.
              </p>
            </CardContent>
            <CardFooter className="flex gap-2 pt-2">
              <Button
                onClick={handleDecline}
                variant="secondary"
                className="flex-1"
              >
                Decline
              </Button>
              <Button onClick={handleAccept} className="flex-1">
                Accept
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      );
    }

    if (variant === 'small') {
      return (
        <motion.div ref={ref} {...commonWrapperProps} {...motionProps}>
          <Card className="m-3 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 h-0 px-4">
              <CardTitle className="text-base">Cookie Notice</CardTitle>
              <Cookie className="h-4 w-4" />
            </CardHeader>
            <CardContent className="pt-0 pb-2 px-4">
              <CardDescription className="text-sm">
                {description}
              </CardDescription>
            </CardContent>
            <CardFooter className="flex gap-2 h-0 py-2 px-4">
              <Button
                onClick={handleDecline}
                variant="secondary"
                size="sm"
                className="flex-1 rounded-full"
              >
                Decline
              </Button>
              <Button
                onClick={handleAccept}
                size="sm"
                className="flex-1 rounded-full"
              >
                Accept
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      );
    }

    if (variant === 'mini') {
      return (
        <motion.div ref={ref} {...commonWrapperProps} {...motionProps}>
          <Card className="mx-3 p-0 py-3 shadow-lg">
            <CardContent className="sm:flex grid gap-4 p-0 px-3.5">
              <CardDescription className="text-xs sm:text-sm flex-1">
                {description}
              </CardDescription>
              <div className="flex items-center gap-2 justify-end sm:gap-3">
                <Button
                  onClick={handleDecline}
                  size="sm"
                  variant="secondary"
                  className="text-xs h-7"
                >
                  Decline
                </Button>
                <Button
                  onClick={handleAccept}
                  size="sm"
                  className="text-xs h-7"
                >
                  Accept
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      );
    }

    return null;
  },
);

CookieConsent.displayName = 'CookieConsent';
