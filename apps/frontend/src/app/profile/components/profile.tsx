'use client';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/shadcn/tabs';
import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Accounts } from './accounts';
import { Footer } from './footer';
import { Header } from './header';
import { Wallets } from './wallets';

export default function Profile() {
  const router = useRouter();

  const { ready, authenticated, user } = usePrivy();

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (ready && !authenticated) {
      router.push('/');
    } else if (ready) {
      setIsLoading(false);
    }
  }, [ready, authenticated, router]);

  if (isLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="w-full gap-8 flex flex-col p-4">
      <Header user={user} />

      <Tabs defaultValue="accounts">
        <TabsList className="grid w-full grid-cols-2 lg:w-auto">
          <TabsTrigger value="wallets">Wallets</TabsTrigger>
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
        </TabsList>

        <TabsContent value="wallets" className="mt-6">
          <Wallets />
        </TabsContent>

        <TabsContent value="accounts" className="mt-6">
          <Accounts user={user} />
        </TabsContent>
      </Tabs>

      <Footer user={user} className="hidden" />
    </div>
  );
}
