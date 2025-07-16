'use client';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/shadcn/tabs';
import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { SocialAccounts } from './social-accounts';
import { Footer } from './footer';
import { Header } from './header';
import { Wallets } from './wallets';
import { ContactDetails } from './contact-details';
import { useQueryState, parseAsStringEnum } from 'nuqs';

enum TabValues {
  WALLETS = 'wallets',
  ACCOUNTS = 'accounts',
  CONTACT_DETAILS = 'contact-details',
}

const defaultTab = TabValues.ACCOUNTS;

export default function Profile() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useQueryState(
    'tab',
    parseAsStringEnum<TabValues>(Object.values(TabValues))
      .withOptions({
        clearOnDefault: false,
      })
      .withDefault(defaultTab),
  );

  const { ready, authenticated, user } = usePrivy();

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (ready && !authenticated) {
      router.push('/');
    } else if (ready) {
      setIsLoading(false);
    }
  }, [ready, authenticated, router]);

  useEffect(() => {
    if (activeTab === defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [activeTab, setActiveTab]);

  const handleTabChange = useCallback(
    (value: string) => {
      setActiveTab(value as TabValues);
    },
    [setActiveTab],
  );

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

      <Tabs value={activeTab.toString()} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-3 lg:w-auto">
          <TabsTrigger value={TabValues.WALLETS}>Wallets</TabsTrigger>
          <TabsTrigger value={TabValues.ACCOUNTS}>Accounts</TabsTrigger>
          <TabsTrigger value={TabValues.CONTACT_DETAILS}>
            Contact Details
          </TabsTrigger>
        </TabsList>

        <TabsContent value={TabValues.WALLETS} className="mt-6">
          <Wallets />
        </TabsContent>

        <TabsContent value={TabValues.ACCOUNTS} className="mt-6">
          <SocialAccounts user={user} />
        </TabsContent>

        <TabsContent value={TabValues.CONTACT_DETAILS} className="mt-6">
          <ContactDetails />
        </TabsContent>
      </Tabs>

      <Footer user={user} className="hidden" />
    </div>
  );
}
