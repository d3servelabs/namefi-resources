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
const ORDERS_FILTER_CONFIG: Record<string, DrizzlerFilterFieldConfig> = {
  domainName: {
    id: 'domainName',
    columnId: 'domainName',
    label: 'Domain name',
    type: 'text',
    allowedOperators: ['ilike', 'like', 'eq'],
    maxConditions: 1,
  },
  orderId: {
    id: 'orderId',
    columnId: 'orderId',
    label: 'Order ID',
    type: 'text',
    allowedOperators: ['eq'],
    maxConditions: 1,
  },
  nftReceivingWalletAddress: {
    id: 'nftReceivingWalletAddress',
    columnId: 'nftReceivingWalletAddress',
    label: 'NFT receiving wallet',
    type: 'text',
    allowedOperators: ['eq'],
    maxConditions: 1,
  },
  nftReceivingChainId: {
    id: 'nftReceivingChainId',
    columnId: 'nftReceivingChainId',
    label: 'NFT receiving chain id',
    type: 'number',
    allowedOperators: ['eq'],
    maxConditions: 1,
  },
  orderStatuses: {
    id: 'orderStatuses',
    columnId: 'orderStatuses',
    label: 'Order status',
    type: 'select',
    allowedOperators: ['eq', 'inArray'],
    options: orderStatusValues.map((status) => ({
      value: status,
      label: status.replace(/_/g, ' '),
    })),
    defaultLogicalOperator: 'or',
  },
};

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
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [sortPopoverOpen, setSortPopoverOpen] = useState(false);
  const pbn = useMemo(() => {
    if (typeof window !== 'undefined' && window !== undefined) {
      const url = new URL(window.location.href);
      const hostname = url.hostname;
      return hostname.replace(/\.(astra|poweredby).namefi.(dev|io)$/, '');
    }
    return 'current parent domain';
  }, []);

  const sortLabel = useMemo(() => {
    const fieldLabel = sort.sortBy === 'date' ? 'Date' : 'Price';
    const dirLabel = sort.sortDirection === 'asc' ? 'asc' : 'desc';
    return `${fieldLabel} · ${dirLabel}`;
  }, [sort]);

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
        <Filter className="h-4 w-4 mr-2" />
        Filters
        {activeFilterCount > 0 && (
          <Badge variant="secondary" className="ml-2">
            {activeFilterCount}
          </Badge>
        )}
      </Button>

      <Popover open={sortPopoverOpen} onOpenChange={setSortPopoverOpen}>
        <PopoverTrigger
          render={
            <Button type="button" variant="outline" size="sm">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              Sort: {sortLabel}
            </Button>
          }
        />
        <PopoverContent align="start" className="w-64 p-3">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">Sort by</Label>
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
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="price">Price</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">Direction</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={flipDirection}
              >
                {sort.sortDirection === 'asc' ? (
                  <>
                    <ArrowUp className="h-4 w-4 mr-2" />
                    Ascending
                  </>
                ) : (
                  <>
                    <ArrowDown className="h-4 w-4 mr-2" />
                    Descending
                  </>
                )}
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {showPbnToggle && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground ml-1">
          <Switch
            id="orders-show-only-curret-pbn"
            checked={!showAllParents}
            onCheckedChange={(checked) => onShowAllParentsChange(!checked)}
          />
          <Label
            htmlFor="orders-show-only-curret-pbn"
            className="cursor-pointer font-normal text-muted-foreground"
          >
            Only <code>{pbn}</code> domains
          </Label>
        </div>
      )}

      {activeFilterCount > 0 && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="ml-auto"
        >
          <RotateCcw className="h-3.5 w-3.5 mr-1" />
          Reset
        </Button>
      )}

      <DrizzlerFilterPanel
        open={filterPanelOpen}
        onOpenChange={setFilterPanelOpen}
        filterState={drizzlerState}
        filterConfig={ORDERS_FILTER_CONFIG}
        onFilterStateChange={onDrizzlerStateChange}
        onClearAll={onReset}
      />
    </div>
  );
}
