'use client';

import { format, formatDistanceToNow } from 'date-fns';
import {
  Edit,
  ExternalLink,
  MoreHorizontal,
  Pause,
  Play,
  Settings,
} from 'lucide-react';
import { getDomainLevelLabel } from '@namefi-astra/utils/parse-domain-name';
import { Badge } from '@namefi-astra/ui/components/shadcn/badge';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@namefi-astra/ui/components/shadcn/dropdown-menu';
import { AutoTruncateTextV2 } from '@/components/auto-truncate-text-v2';

// Shared row type + cell logic so the desktop table columns and the mobile
// card render identical values from the same source (switch layout, reuse
// logic). Every formatter here is a pure function of the row data.

export type PoweredByNamefiDomainRow = {
  normalizedDomainName: string;
  additionalAllowedHostnames: string[] | null;
  additionalReservedNames: string[] | null;
  durationConstraints: {
    minDurationInYears: number;
    maxDurationInYears: number;
  };
  costPerYearInUsdCents: number;
  metadata: unknown;
  ownerId: string | null;
  enabled: boolean;
  startRolloutAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

/** Domain name, character-truncated to fit narrow surfaces. */
export function DomainNameCell({ name }: { name: string }) {
  return (
    <AutoTruncateTextV2
      initialCharactersCountToDisplay={32}
      minCharactersToDisplay={16}
      className="font-medium"
    >
      {name}
    </AutoTruncateTextV2>
  );
}

/**
 * TLD / SLD / 3LD / 4LD / 5LD+ marker for a PBN parent. The label is
 * computed client-side from `parseDomainName`; see the notes in
 * `packages/utils/src/parse-domain-name.ts` for why we don't expose this
 * as a server-sortable column.
 */
export function DomainLevelBadge({ name }: { name: string }) {
  const label = getDomainLevelLabel(name);
  const variant: 'default' | 'secondary' | 'outline' =
    label === 'TLD' ? 'outline' : label === 'SLD' ? 'default' : 'secondary';
  return <Badge variant={variant}>{label}</Badge>;
}

/** Enabled / Disabled status badge. */
export function EnabledBadge({ enabled }: { enabled: boolean }) {
  return (
    <Badge variant={enabled ? 'default' : 'secondary'}>
      {enabled ? 'Enabled' : 'Disabled'}
    </Badge>
  );
}

/** Cost per year, formatted from USD cents to a `$X.XX` string. */
export function CostCell({
  costPerYearInUsdCents,
}: {
  costPerYearInUsdCents: number;
}) {
  return (
    <span className="tabular-nums">
      ${(costPerYearInUsdCents / 100).toFixed(2)}
    </span>
  );
}

/** Min–max allowed registration duration, in years. */
export function DurationCell({
  durationConstraints,
}: {
  durationConstraints: PoweredByNamefiDomainRow['durationConstraints'];
}) {
  return (
    <span className="text-muted-foreground">
      {durationConstraints.minDurationInYears}–
      {durationConstraints.maxDurationInYears} yr
    </span>
  );
}

/** Rollout start: absolute date + relative distance, or "Not started". */
export function RolloutStartedCell({
  startRolloutAt,
}: {
  startRolloutAt: Date | null;
}) {
  if (!startRolloutAt) {
    return <span className="text-muted-foreground">Not started</span>;
  }
  return (
    <div className="text-sm">
      <div>{format(new Date(startRolloutAt), 'yyyy-MM-dd')}</div>
      <div className="text-muted-foreground text-xs">
        {formatDistanceToNow(new Date(startRolloutAt), { addSuffix: true })}
      </div>
    </div>
  );
}

/** A timestamp rendered as a muted relative distance (e.g. "3 days ago"). */
export function RelativeDateCell({ date }: { date: Date }) {
  return (
    <span className="text-sm text-muted-foreground">
      {formatDistanceToNow(new Date(date), { addSuffix: true })}
    </span>
  );
}

export interface DomainActionsMenuProps {
  domain: PoweredByNamefiDomainRow;
  toggleDomainEnabledPending: boolean;
  startRolloutPending: boolean;
  onToggleEnabled: (domain: PoweredByNamefiDomainRow) => void;
  onStartRollout: (domain: PoweredByNamefiDomainRow) => void;
  onEditCostAndDuration: (domain: PoweredByNamefiDomainRow) => void;
  onEditHostnames: (domain: PoweredByNamefiDomainRow) => void;
  onOpenDnsConfiguration: (domain: PoweredByNamefiDomainRow) => void;
}

/**
 * The per-row actions dropdown. Shared verbatim by the desktop "Actions"
 * column and the mobile card so both expose the exact same operations
 * (enable/disable, start rollout, edit cost, edit hostnames, DNS config,
 * visit domain) wired to the same handlers.
 */
export function DomainActionsMenu({
  domain,
  toggleDomainEnabledPending,
  startRolloutPending,
  onToggleEnabled,
  onStartRollout,
  onEditCostAndDuration,
  onEditHostnames,
  onOpenDnsConfiguration,
}: DomainActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        data-testid={`admin.powered-by.row.${domain.normalizedDomainName}.actions`}
        render={<Button variant="ghost" size="sm" />}
      >
        <MoreHorizontal className="h-4 w-4" />
      </DropdownMenuTrigger>
      {/*
        The project's base DropdownMenuContent pins
        `w-(--anchor-width)` (i.e. the trigger's width). The
        trigger here is a 32px icon button, which clips every
        label. Override with auto width + a comfortable minimum
        so items never truncate, and cap at the viewport on
        mobile.
      */}
      <DropdownMenuContent
        align="end"
        className="w-auto min-w-56 max-w-[calc(100vw-2rem)]"
      >
        {/* Enable/Disable Toggle */}
        <DropdownMenuItem
          data-testid={`admin.powered-by.row.${domain.normalizedDomainName}.toggle-enabled`}
          onClick={() => onToggleEnabled(domain)}
          disabled={toggleDomainEnabledPending}
        >
          {domain.enabled ? (
            <>
              <Pause className="h-4 w-4 me-2" />
              Disable
            </>
          ) : (
            <>
              <Play className="h-4 w-4 me-2" />
              Enable
            </>
          )}
        </DropdownMenuItem>

        {/* Start Rollout (only if not started) */}
        {!domain.startRolloutAt && (
          <DropdownMenuItem
            data-testid={`admin.powered-by.row.${domain.normalizedDomainName}.start-rollout`}
            onClick={() => onStartRollout(domain)}
            disabled={startRolloutPending}
          >
            <Play className="h-4 w-4 me-2" />
            Start Rollout
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {/* Edit Cost and Duration */}
        <DropdownMenuItem
          data-testid={`admin.powered-by.row.${domain.normalizedDomainName}.edit-cost-duration`}
          onClick={() => onEditCostAndDuration(domain)}
        >
          <Edit className="h-4 w-4 me-2" />
          Edit Cost & Duration
        </DropdownMenuItem>

        {/* Edit additionalAllowedHostnames */}
        <DropdownMenuItem
          data-testid={`admin.powered-by.row.${domain.normalizedDomainName}.edit-hostnames`}
          onClick={() => onEditHostnames(domain)}
        >
          <Edit className="h-4 w-4 me-2" />
          Edit Additional Hostnames
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Configuration Dialog */}
        <DropdownMenuItem
          data-testid={`admin.powered-by.row.${domain.normalizedDomainName}.dns-configuration`}
          onClick={() => onOpenDnsConfiguration(domain)}
        >
          <Settings className="h-4 w-4 me-2" />
          DNS Configuration
        </DropdownMenuItem>

        {/* Visit Domain */}
        <DropdownMenuItem
          data-testid={`admin.powered-by.row.${domain.normalizedDomainName}.visit`}
          onClick={() =>
            window.open(`https://${domain.normalizedDomainName}`, '_blank')
          }
        >
          <ExternalLink className="h-4 w-4 me-2" />
          Visit Domain
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
