'use client';

import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@namefi-astra/ui/components/shadcn/checkbox';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';
import { AddressWithChain } from '@/components/address-with-chain';
import { DnsStatusCell } from '@/components/domain-and-dns-managment/cells/dns-status-cell';
import { ActionsCell } from './cells/actions-cell';
import { AutoEnsCell } from './cells/auto-ens-cell';
import { DateTokenizedCell } from './cells/date-tokenized-cell';
import { DomainNameCell } from './cells/domain-name-cell';
import { RenewalCell } from './cells/renewal-cell';
import { RenewPricingCell } from './cells/renew-pricing-cell';
import type { DomainRow } from './types';
import {
  getCustomRenewalPrice,
  getRenewalPriceUsdPerYearForDomain,
} from './utils';

export interface RenewModalDomain {
  normalizedDomainName: string;
  expirationDate: Date | string | null | undefined;
}

export interface UseMyDomainsColumnsArgs {
  selectedDomainIds: Set<NamefiNormalizedDomain>;
  pageSelectionState: { allSelected: boolean; someSelected: boolean };
  togglingAutoRenew: Set<string>;
  togglingAutoEns: Set<string>;
  renewalPriceUsdPerYearByTld: Map<string, number | null>;
  isMobile: boolean;
  /** Total number of domains in this table, shown in the "Domain Name" header. */
  domainCount: number;
  onToggleAllCurrentPage: (selectAll: boolean) => void;
  onRowSelectionChange: (
    domainName: NamefiNormalizedDomain,
    checked: boolean,
  ) => void;
  onToggleAutoRenew: (
    domainName: string,
    enabled: boolean,
    position: { x: number; y: number } | null,
  ) => void;
  onToggleAutoEns: (domainName: string, enabled: boolean) => void;
  onOpenRenewModal: (domain: RenewModalDomain) => void;
  onListForSaleClick: (domainName: string) => void;
}

export function useMyDomainsColumns({
  selectedDomainIds,
  pageSelectionState,
  togglingAutoRenew,
  togglingAutoEns,
  renewalPriceUsdPerYearByTld,
  isMobile,
  domainCount,
  onToggleAllCurrentPage,
  onRowSelectionChange,
  onToggleAutoRenew,
  onToggleAutoEns,
  onOpenRenewModal,
  onListForSaleClick,
}: UseMyDomainsColumnsArgs): ColumnDef<DomainRow>[] {
  return useMemo<ColumnDef<DomainRow>[]>(
    () => [
      {
        id: 'select',
        header: () => (
          <Checkbox
            checked={pageSelectionState.allSelected}
            indeterminate={
              pageSelectionState.someSelected && !pageSelectionState.allSelected
            }
            onCheckedChange={(value) => onToggleAllCurrentPage(value === true)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => {
          const domainName = row.getValue(
            'normalizedDomainName',
          ) as NamefiNormalizedDomain;
          return (
            <Checkbox
              checked={selectedDomainIds.has(domainName)}
              onCheckedChange={(value) =>
                onRowSelectionChange(domainName, value === true)
              }
              aria-label="Select row"
            />
          );
        },
        size: 50,
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: 'normalizedDomainName',
        header: `Domain Name (${domainCount})`,
        cell: ({ row }) => (
          <DomainNameCell
            domainName={row.getValue('normalizedDomainName') as string}
            nftState={row.original.nftState}
            pendingNftStates={row.original.pendingNftStates}
            actionMenuProps={{
              domainName: row.getValue('normalizedDomainName') as string,
              expirationDate: row.getValue('expirationDate') as
                | Date
                | string
                | null
                | undefined,
              chainId: row.original.chainId ?? null,
              tokenId: row.original.tokenId,
              orderId: row.original.orderId ?? null,
              isMobile: isMobile,
              onListForSaleClick: onListForSaleClick,
            }}
          />
        ),
      },
      {
        id: 'account',
        header: 'Account',
        cell: ({ row }) => (
          <AddressWithChain
            address={row.original.ownerAddress ?? null}
            chainId={row.original.chainId ?? null}
          />
        ),
        size: 200,
      },
      {
        accessorKey: 'expirationDate',
        header: 'Renewal',
        cell: ({ row }) => {
          const domainName = row.getValue('normalizedDomainName') as string;
          const customPrice = getCustomRenewalPrice(domainName ?? '');
          const resolvedPrice =
            customPrice ??
            getRenewalPriceUsdPerYearForDomain(
              domainName,
              renewalPriceUsdPerYearByTld,
            );
          return (
            <RenewalCell
              domainName={domainName}
              expirationDate={
                row.getValue('expirationDate') as
                  | Date
                  | string
                  | null
                  | undefined
              }
              autoRenewEnabled={row.original.autoRenewEnabled ?? false}
              isToggling={togglingAutoRenew.has(domainName)}
              onToggleAutoRenew={onToggleAutoRenew}
              onOpenRenewModal={onOpenRenewModal}
              renewPricingCellProps={{
                domainName,
                resolvedPrice,
              }}
            />
          );
        },
        size: 180,
      },
      {
        id: 'autoEns',
        header: 'AutoENS',
        cell: ({ row }) => {
          const domainName = row.getValue('normalizedDomainName') as string;
          return (
            <AutoEnsCell
              domainName={domainName}
              expirationDate={
                row.getValue('expirationDate') as
                  | Date
                  | string
                  | null
                  | undefined
              }
              autoEnsEnabled={row.original.autoEnsEnabled ?? false}
              isToggling={togglingAutoEns.has(domainName)}
              onToggleAutoEns={onToggleAutoEns}
            />
          );
        },
        size: 100,
      },
      {
        accessorKey: 'dateTokenized',
        header: 'Date Tokenized',
        cell: ({ row }) => (
          <DateTokenizedCell
            dateTokenized={
              row.getValue('dateTokenized') as Date | string | null | undefined
            }
          />
        ),
        size: 140,
        enableSorting: true,
      },
      // {
      //   id: 'renewPricing',
      //   header: 'Renew (USD/yr)',
      //   accessorFn: (row) => {
      //     const customPrice = getCustomRenewalPrice(
      //       row.normalizedDomainName ?? '',
      //     );
      //     if (customPrice !== null) return customPrice;
      //     return getRenewalPriceUsdPerYearForDomain(
      //       row.normalizedDomainName,
      //       renewalPriceUsdPerYearByTld,
      //     );
      //   },
      //   cell: ({ row }) => (
      //     <RenewPricingCell
      //       domainName={row.original.normalizedDomainName ?? ''}
      //       resolvedPrice={row.getValue('renewPricing') as number | null}
      //     />
      //   ),
      //   size: 140,
      //   enableSorting: true,
      // },
      {
        id: 'dnsStatus',
        header: 'DNS Records',
        cell: ({ row }) => {
          const domainName = row.getValue(
            'normalizedDomainName',
          ) as NamefiNormalizedDomain;
          const status = row.original.dnsStatus;
          const chainId = row.original.chainId ?? null;

          if (!status || !chainId)
            return <span className="text-muted-foreground">-</span>;

          return (
            <DnsStatusCell
              domainName={domainName}
              status={status}
              autoEnsEnabled={row.original.autoEnsEnabled ?? false}
              nftChainId={chainId}
            />
          );
        },
        size: 200,
      },
      // {
      //   id: 'actions',
      //   header: 'Actions',
      //   cell: ({ row }) => (
      //     <ActionsCell
      //       domainName={row.getValue('normalizedDomainName') as string}
      //       expirationDate={
      //         row.getValue('expirationDate') as Date | string | null | undefined
      //       }
      //       chainId={row.original.chainId ?? null}
      //       tokenId={row.original.tokenId}
      //       orderId={row.original.orderId ?? null}
      //       isMobile={isMobile}
      //       onListForSaleClick={onListForSaleClick}
      //     />
      //   ),
      //   size: 280,
      //   enableSorting: false,
      // },
    ],
    [
      pageSelectionState,
      selectedDomainIds,
      togglingAutoRenew,
      togglingAutoEns,
      renewalPriceUsdPerYearByTld,
      isMobile,
      domainCount,
      onToggleAllCurrentPage,
      onRowSelectionChange,
      onToggleAutoRenew,
      onToggleAutoEns,
      onOpenRenewModal,
      onListForSaleClick,
    ],
  );
}
