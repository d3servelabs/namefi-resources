'use client';

import { DrizzlerFilterPanel } from '@/components/table/filters/components/drizzler-filter-panel';
import type {
  DrizzlerFilterFieldConfig,
  DrizzlerFilterState,
} from '@/components/table/filters/types';
import { Badge } from '@namefi-astra/ui/components/shadcn/badge';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { Label } from '@namefi-astra/ui/components/shadcn/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@namefi-astra/ui/components/shadcn/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@namefi-astra/ui/components/shadcn/select';
import { Switch } from '@namefi-astra/ui/components/shadcn/switch';
import { orderStatusValues } from '@namefi-astra/common/shared-schemas';
import type { OrderStatus } from '@namefi-astra/common/shared-schemas';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Filter,
  RotateCcw,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';

export type OrdersSortState = {
  sortBy: 'date' | 'price';
  sortDirection: 'asc' | 'desc';
};

export type OrdersFilters = {
  domainName?: string;
  orderStatuses?: OrderStatus[];
  orderId?: string;
  nftReceivingWalletAddress?: string;
  nftReceivingChainId?: number;
};

interface OrdersToolbarProps {
  drizzlerState: DrizzlerFilterState;
  onDrizzlerStateChange: (next: DrizzlerFilterState) => void;
  /** Active-filter count derived from the *debounced* state, so the badge
   *  doesn't flash while the user is typing. */
  activeFilterCount: number;
  sort: OrdersSortState;
  onSortChange: (next: OrdersSortState) => void;
  showPbnToggle: boolean;
  showAllParents: boolean;
  onShowAllParentsChange: (next: boolean) => void;
  onReset: () => void;
}

/**
 * Drizzler field configs for the orders filter panel. Each `columnId` matches
 * the key the parent reads off the resulting state via
 * `drizzlerStateToOrdersFilters` — we don't run `buildWhereClause` on the
 * backend, so `columnId` is essentially a label/mapping key here, not an SQL
 * column name. Keep them in sync if you add a field.
 */
function buildOrdersFilterConfig(
  t: ReturnType<typeof useTranslations<'orders'>>,
): Record<string, DrizzlerFilterFieldConfig> {
  return {
    domainName: {
      id: 'domainName',
      columnId: 'domainName',
      label: t('toolbar.filterDomainName'),
      type: 'text',
      allowedOperators: ['ilike', 'like', 'eq'],
      maxConditions: 1,
    },
    orderId: {
      id: 'orderId',
      columnId: 'orderId',
      label: t('toolbar.filterOrderId'),
      type: 'text',
      allowedOperators: ['eq'],
      maxConditions: 1,
    },
    nftReceivingWalletAddress: {
      id: 'nftReceivingWalletAddress',
      columnId: 'nftReceivingWalletAddress',
      label: t('toolbar.filterNftReceivingWallet'),
      type: 'text',
      allowedOperators: ['eq'],
      maxConditions: 1,
    },
    nftReceivingChainId: {
      id: 'nftReceivingChainId',
      columnId: 'nftReceivingChainId',
      label: t('toolbar.filterNftReceivingChainId'),
      type: 'number',
      allowedOperators: ['eq'],
      maxConditions: 1,
    },
    orderStatuses: {
      id: 'orderStatuses',
      columnId: 'orderStatuses',
      label: t('toolbar.filterOrderStatus'),
      type: 'select',
      allowedOperators: ['eq', 'inArray'],
      // Status enum values are kept verbatim; only the humanized whitespace
      // form is shown (the underlying status code stays unchanged).
      options: orderStatusValues.map((status) => ({
        value: status,
        label: status.replace(/_/g, ' '),
      })),
      defaultLogicalOperator: 'or',
    },
  };
}

/**
 * Project the Drizzler filter state down to the simple `getMyOrders` input
 * shape. Each field takes the first condition (or, for `orderStatuses`,
 * unions all `eq`/`inArray` condition values) — the panel itself caps text
 * fields at `maxConditions: 1` so multi-condition input on those is not
 * possible.
 */
export function drizzlerStateToOrdersFilters(
  state: DrizzlerFilterState,
): OrdersFilters {
  const out: OrdersFilters = {};

  const firstString = (fieldId: string): string | undefined => {
    const v = state.columnFilters[fieldId]?.conditions[0]?.value;
    return typeof v === 'string' && v.trim() ? v.trim() : undefined;
  };

  const firstNumber = (fieldId: string): number | undefined => {
    const v = state.columnFilters[fieldId]?.conditions[0]?.value;
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v === 'string' && v.trim() && Number.isFinite(Number(v))) {
      return Number(v);
    }
    return undefined;
  };

  out.domainName = firstString('domainName');
  out.orderId = firstString('orderId');
  out.nftReceivingWalletAddress = firstString('nftReceivingWalletAddress');

  // Chain ids are positive integers; drop anything else so it never trips
  // the contract's `.int().positive()` validation and errors the query.
  const chainId = firstNumber('nftReceivingChainId');
  out.nftReceivingChainId =
    chainId !== undefined && Number.isInteger(chainId) && chainId > 0
      ? chainId
      : undefined;

  const statusField = state.columnFilters.orderStatuses;
  if (statusField) {
    const set = new Set<OrderStatus>();
    for (const cond of statusField.conditions) {
      if (typeof cond.value === 'string') {
        // Validate against the enum so a stale URL value can't slip past.
        if ((orderStatusValues as readonly string[]).includes(cond.value)) {
          set.add(cond.value as OrderStatus);
        }
      } else if (Array.isArray(cond.value)) {
        for (const v of cond.value) {
          if (
            typeof v === 'string' &&
            (orderStatusValues as readonly string[]).includes(v)
          ) {
            set.add(v as OrderStatus);
          }
        }
      }
    }
    if (set.size > 0) out.orderStatuses = Array.from(set);
  }

  return out;
}

export function OrdersToolbar({
  drizzlerState,
  onDrizzlerStateChange,
  activeFilterCount,
  sort,
  onSortChange,
  showPbnToggle,
  showAllParents,
  onShowAllParentsChange,
  onReset,
}: OrdersToolbarProps) {
  const t = useTranslations('orders');
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [sortPopoverOpen, setSortPopoverOpen] = useState(false);
  const filterConfig = useMemo(() => buildOrdersFilterConfig(t), [t]);
  const pbn = useMemo(() => {
    if (typeof window !== 'undefined' && window !== undefined) {
      const url = new URL(window.location.href);
      const hostname = url.hostname;
      return hostname.replace(/\.(astra|poweredby).namefi.(dev|io)$/, '');
    }
    return 'current parent domain';
  }, []);

  const sortLabel = useMemo(() => {
    const fieldLabel =
      sort.sortBy === 'date' ? t('toolbar.sortDate') : t('toolbar.sortPrice');
    const dirLabel =
      sort.sortDirection === 'asc'
        ? t('toolbar.sortDirAsc')
        : t('toolbar.sortDirDesc');
    return `${fieldLabel} · ${dirLabel}`;
  }, [sort, t]);

  const flipDirection = () => {
    onSortChange({
      ...sort,
      sortDirection: sort.sortDirection === 'asc' ? 'desc' : 'asc',
    });
  };

  return (
    <div className="flex items-center flex-wrap gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setFilterPanelOpen(true)}
      >
        <Filter className="h-4 w-4 me-2" />
        {t('toolbar.filters')}
        {activeFilterCount > 0 && (
          <Badge variant="secondary" className="ms-2">
            {activeFilterCount}
          </Badge>
        )}
      </Button>

      <Popover open={sortPopoverOpen} onOpenChange={setSortPopoverOpen}>
        <PopoverTrigger
          render={
            <Button type="button" variant="outline" size="sm">
              <ArrowUpDown className="h-4 w-4 me-2" />
              {t('toolbar.sort', { label: sortLabel })}
            </Button>
          }
        />
        <PopoverContent align="start" className="w-64 p-3">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">
                {t('toolbar.sortBy')}
              </Label>
              <Select
                value={sort.sortBy}
                onValueChange={(value) =>
                  onSortChange({
                    ...sort,
                    sortBy: value as OrdersSortState['sortBy'],
                  })
                }
              >
                <SelectTrigger size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">{t('toolbar.sortDate')}</SelectItem>
                  <SelectItem value="price">
                    {t('toolbar.sortPrice')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">
                {t('toolbar.direction')}
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={flipDirection}
              >
                {sort.sortDirection === 'asc' ? (
                  <>
                    <ArrowUp className="h-4 w-4 me-2" />
                    {t('toolbar.ascending')}
                  </>
                ) : (
                  <>
                    <ArrowDown className="h-4 w-4 me-2" />
                    {t('toolbar.descending')}
                  </>
                )}
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {showPbnToggle && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground ms-1">
          <Switch
            id="orders-show-only-curret-pbn"
            checked={!showAllParents}
            onCheckedChange={(checked) => onShowAllParentsChange(!checked)}
          />
          <Label
            htmlFor="orders-show-only-curret-pbn"
            className="cursor-pointer font-normal text-muted-foreground"
          >
            {t.rich('toolbar.onlyCurrentPbn', {
              domain: pbn,
              code: (chunks) => <code>{chunks}</code>,
            })}
          </Label>
        </div>
      )}

      {activeFilterCount > 0 && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="ms-auto"
        >
          <RotateCcw className="h-3.5 w-3.5 me-1" />
          {t('toolbar.reset')}
        </Button>
      )}

      <DrizzlerFilterPanel
        open={filterPanelOpen}
        onOpenChange={setFilterPanelOpen}
        filterState={drizzlerState}
        filterConfig={filterConfig}
        onFilterStateChange={onDrizzlerStateChange}
        onClearAll={onReset}
      />
    </div>
  );
}
