import { Button } from '@/components/ui/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import { ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { useCallback } from 'react';

export interface UnauthorizedProps {
  title?: string;
  description?: string;
  authUrl?: string;
  homeUrl?: string;
}

export function Unauthorized({
  title = 'Unauthorized Access',
  description = "You don't have permission to access this page. Please sign in or return to the home page.",
  authUrl = '/',
  homeUrl = '/',
}: UnauthorizedProps) {
  const handleAuth = useCallback(() => {
    //
  }, []);

  const handleHome = useCallback(() => {
    //
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <Card className="mx-auto max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <ShieldAlert className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-xl sm:text-2xl">{title}</CardTitle>
          <CardDescription className="mt-2">{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0">
            <Button onClick={handleAuth} className="w-full" asChild={true}>
              <Link href={authUrl}>Sign In</Link>
            </Button>
            <Button
              onClick={handleHome}
              variant="outline"
              className="w-full"
              asChild={true}
            >
              <Link href={homeUrl}>Go to Home</Link>
            </Button>
          </div>
        </CardContent>
        <CardFooter className="text-center text-sm text-muted-foreground">
          If you believe this is an error, please contact support.
        </CardFooter>
      </Card>
    </div>
  );
}
