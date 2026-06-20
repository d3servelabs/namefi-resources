import { Button } from '@namefi-astra/ui/components/shadcn/button';
import type { Route } from 'next';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@namefi-astra/ui/components/shadcn/card';
import { useAuth } from '@/hooks/use-auth';
import { ShieldAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { ErrorHelpLinks } from '@/components/error-help-links';

export interface UnauthorizedProps {
  title?: string;
  description?: string;
  authUrl?: Route;
  homeUrl?: Route;
}

export function Unauthorized({
  title,
  description,
  authUrl = '/',
  homeUrl = '/',
}: UnauthorizedProps) {
  const t = useTranslations('error');
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const resolvedTitle = title ?? t('unauthorized.title');
  const resolvedDescription = description ?? t('unauthorized.description');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <Card className="mx-auto max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <ShieldAlert className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-xl sm:text-2xl">{resolvedTitle}</CardTitle>
          <CardDescription className="mt-2">
            {resolvedDescription}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-2 sm:gap-x-2 sm:space-y-0 gap-2">
            {!isAuthenticated && !isAuthLoading && (
              <Button
                render={<Link href={authUrl} />}
                nativeButton={false}
                className="w-full"
              >
                {t('actions.signIn')}
              </Button>
            )}
            <Button
              render={<Link href={homeUrl} />}
              nativeButton={false}
              variant="outline"
              className="w-full"
            >
              {t('actions.goToHome')}
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-1 text-center text-sm text-muted-foreground">
          <span>{t('unauthorized.contactSupport')}</span>
          <ErrorHelpLinks className="mt-1" />
        </CardFooter>
      </Card>
    </div>
  );
}
