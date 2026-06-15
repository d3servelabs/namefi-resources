'use client';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@namefi-astra/ui/components/shadcn/tabs';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { SocialAccounts } from './social-accounts';
import { Footer } from './footer';
import { Header } from './header';
import { Wallets } from './wallets';
import { ContactDetails } from './contact-details';
import { Security } from './security/security';
import { useQueryState, parseAsStringEnum } from 'nuqs';
import { useAuth } from '@/hooks/use-auth';
import { PageShell } from '@/components/page-shell';
import { AuthRequired } from '../auth-required';

enum TabValues {
  WALLETS = 'wallets',
  ACCOUNTS = 'accounts',
  CONTACT_DETAILS = 'contact-details',
  SECURITY = 'security',
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

  const {
    rawPrivyUser: user,
    ready,
    isAuthenticated: authenticated,
    isLoading,
    unsafeDisplayProfile,
  } = useAuth();

  const handleTabChange = useCallback(
    (value: string) => {
      setActiveTab(value as TabValues);
    },
    [setActiveTab],
  );

  if (!ready || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (ready && !isLoading && !authenticated) {
    return <AuthRequired />;
  }

  return (
    <PageShell padding="compact" className="gap-8 flex flex-col">
      <Header user={user} unsafeDisplayProfile={unsafeDisplayProfile} />

      <Tabs value={activeTab.toString()} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value={TabValues.WALLETS}>Wallets</TabsTrigger>
          <TabsTrigger value={TabValues.ACCOUNTS}>Accounts</TabsTrigger>
          <TabsTrigger value={TabValues.CONTACT_DETAILS}>
            Contact Details
          </TabsTrigger>
          <TabsTrigger value={TabValues.SECURITY}>Security</TabsTrigger>
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

        <TabsContent value={TabValues.SECURITY} className="mt-6">
          <Security />
        </TabsContent>
      </Tabs>

      <Footer user={user} className="hidden" />
    </PageShell>
  );
}
