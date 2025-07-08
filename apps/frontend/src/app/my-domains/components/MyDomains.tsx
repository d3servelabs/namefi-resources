'use client';

import NetworkLogo from '@/components/NetworkLogo';
import { TruncatedTextWithHover } from '@/components/TruncatedTextWithHover';
import { AuthRequired } from '@/components/auth-required';
import { EmptyPlaceholder } from '@/components/empty-placeholder';
import { Table, Td, Th, Thead, Tr } from '@/components/table';
import { Button } from '@/components/ui/shadcn/button';
import { Card, CardContent } from '@/components/ui/shadcn/card';
import { Input } from '@/components/ui/shadcn/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import { TableBody } from '@/components/ui/shadcn/table';
import { useAuth } from '@/hooks/useAuth';
import { useEmailPrompt } from '@/hooks/useEmailPrompt';
import { config } from '@/lib/env';
import { cn } from '@/lib/utils';
import { useTRPC } from '@/utils/trpc';
import { NAMEFI_NFT_CONTRACT_ADDRESS, getChain } from '@namefi-astra/utils';
import { useSuspenseQuery } from '@tanstack/react-query';
import { ExternalLink, Search, SearchIcon, Settings } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  type FC,
  type HTMLAttributes,
  Suspense,
  useMemo,
  useState,
} from 'react';
import {
  EmailRequiredModal,
  DNS_MANAGEMENT_EMAIL_REQUIRED,
} from '@/components/modals/EmailRequiredModal';

function useGetDomains() {
  const trpc = useTRPC();

  const { data } = useSuspenseQuery(
    trpc.users.getCurrentUserDomains.queryOptions(),
  );

  const domains = useMemo(() => {
    return (
      data?.map(
        ({
          normalizedDomainName,
          chainId,
          ownerAddress,
          tokenId,
          expirationDate,
        }) => ({
          id: normalizedDomainName,
          normalizedDomainName,
          chainId,
          ownerAddress,
          tokenId,
          expirationDate,
        }),
      ) || []
    );
  }, [data]);

  return domains;
}

const LoadingSkeletons: FC = () => (
  <div className="flex flex-col gap-4">
    <Card>
      <CardContent>
        <Table className="w-full">
          <Thead>
            <Tr>
              <Th>Chain</Th>
              <Th>Wallet</Th>
              <Th>Domain Name</Th>
              <Th>Expires On</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <TableBody>
            {[...new Array(3)].map((_, index) => (
              <Tr key={index}>
                <Td>
                  <Skeleton className="h-6 w-6" />
                </Td>
                <Td>
                  <Skeleton className="h-6 w-24" />
                </Td>
                <Td className="font-medium">
                  <Skeleton className="h-6 w-28" />
                </Td>
                <Td>
                  <Skeleton className="h-6 w-24" />
                </Td>
                <Td className="text-right">
                  <Skeleton className="h-6 w-32" />
                </Td>
              </Tr>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  </div>
);

const MyDomainsEmptyPlaceholder: FC<HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement>) => {
  return (
    <EmptyPlaceholder className={cn('', className)} {...rest}>
      <div className="flex size-20 items-center justify-center rounded-full bg-muted">
        <SearchIcon className="size-10 text-muted-foreground" />
      </div>
      <EmptyPlaceholder.Title>No domains found</EmptyPlaceholder.Title>
      <EmptyPlaceholder.Description>
        Start the search for your next domain by clicking the button below
      </EmptyPlaceholder.Description>
      <Button variant="outline">
        <Link href={'/'} aria-label="Button to go to the search page">
          Search Page
        </Link>
      </Button>
    </EmptyPlaceholder>
  );
};

function MyDomainsTable() {
  const domains = useGetDomains();
  const [chainFilter, setChainFilter] = useState<number | undefined>(undefined);
  const [filter, setFilter] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const { hasEmail } = useEmailPrompt();
  const router = useRouter();

  const filteredDomains = useMemo(() => {
    return domains.filter(
      (domain) =>
        domain.normalizedDomainName
          .toLowerCase()
          .includes(filter.toLowerCase()) &&
        (chainFilter === undefined || domain.chainId === chainFilter),
    );
  }, [domains, filter, chainFilter]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter(e.target.value);
  };

  const handleManageDnsClick = (domainName: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (!hasEmail) {
      setSelectedDomain(domainName);
      setShowEmailModal(true);
    } else {
      router.push(`/domain/${domainName}`);
    }
  };

  if (domains.length === 0) {
    return <MyDomainsEmptyPlaceholder />;
  }

  return (
    <>
      <EmailRequiredModal
        isOpen={showEmailModal}
        onOpenChange={setShowEmailModal}
        title={DNS_MANAGEMENT_EMAIL_REQUIRED.title}
        description={DNS_MANAGEMENT_EMAIL_REQUIRED.description}
        actionText={DNS_MANAGEMENT_EMAIL_REQUIRED.actionText}
      />
      <Card>
        <CardContent>
          <div className="flex justify-end mb-4 gap-2">
            <Select
              value={chainFilter?.toString() ?? '-1'}
              onValueChange={(value) =>
                setChainFilter(
                  !value || value === '-1' ? undefined : Number.parseInt(value),
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select chain" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={'-1'}>All</SelectItem>
                {config.ALLOWED_CHAINS.map((chainId) => (
                  <SelectItem key={chainId} value={chainId.toString()}>
                    {getChain(chainId)?.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative w-64 ">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-zinc-500" />
              <Input
                placeholder="Search domains..."
                value={filter ?? ''}
                onChange={handleFilterChange}
                className="pl-8"
              />
            </div>
          </div>
          <Table className="w-full">
            <Thead>
              <Tr>
                <Th>Chain</Th>
                <Th>Wallet</Th>
                <Th>Domain Name</Th>
                <Th>Expires On</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <TableBody>
              {filteredDomains.map((item) => (
                <Tr key={item.id}>
                  <Td>
                    <NetworkLogo network={item.chainId} className="w-6 h-6" />
                  </Td>
                  <Td>
                    <TruncatedTextWithHover maxLength={12}>
                      {item.ownerAddress}
                    </TruncatedTextWithHover>
                  </Td>
                  <Td className="font-medium">
                    <Link
                      href={`/domain/${item.normalizedDomainName}`}
                      aria-label={`Settings for ${item.normalizedDomainName}`}
                    >
                      {item.normalizedDomainName}
                    </Link>
                  </Td>
                  <Td>
                    {item.expirationDate ? (
                      <span className="text-sm">
                        {new Date(item.expirationDate).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </Td>
                  <Td className="text-right">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={(e) =>
                          handleManageDnsClick(item.normalizedDomainName, e)
                        }
                        aria-label={`Settings for ${item.normalizedDomainName}`}
                      >
                        <Settings /> Manage DNS
                      </Button>
                      <Button variant="outline" asChild={true}>
                        <Link
                          href={`https://basescan.org/nft/${NAMEFI_NFT_CONTRACT_ADDRESS}/${item.tokenId ?? ''}`}
                          aria-label={`View NFT for ${item.normalizedDomainName}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink /> View NFT
                        </Link>
                      </Button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}

export default function MyDomains() {
  const { isAuthenticated, isLoading } = useAuth();

  if (!(isLoading || isAuthenticated)) {
    return <AuthRequired />;
  }

  return (
    <div className="container mx-auto py-8 px-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">My Domains</h2>
      </div>
      {isLoading ? (
        <LoadingSkeletons />
      ) : (
        <Suspense fallback={<LoadingSkeletons />}>
          <MyDomainsTable />
        </Suspense>
      )}
    </div>
  );
}
