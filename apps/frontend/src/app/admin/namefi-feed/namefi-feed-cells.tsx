'use client';

import { PermissionGate } from '@/components/access/PermissionGate';
import type { adminNamefiFeedContract } from '@namefi-astra/common/contract/admin/admin-namefi-feed-contract';
import type { InferContractOutputs } from '@namefi-astra/common/contract/trpc-contract';
import { Badge } from '@namefi-astra/ui/components/shadcn/badge';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { Switch } from '@namefi-astra/ui/components/shadcn/switch';
import { Permission } from '@namefi-astra/utils/permissions';
import { format } from 'date-fns';
import { Pencil, Trash2 } from 'lucide-react';

type NamefiFeedOverview = InferContractOutputs<
  typeof adminNamefiFeedContract
>['getOverview'];
export type DigestTarget = NamefiFeedOverview['digestTargets'][number];
type DigestTargetType = DigestTarget['targetType'];

/**
 * Human-readable channel name for a digest target. Module-level pure helper so
 * the desktop "Channel" column and the mobile card render the exact same label.
 */
export function channelLabel(value: DigestTargetType) {
  switch (value) {
    case 'slack':
      return 'Slack';
    case 'telegram_group':
      return 'Telegram';
    case 'discord_channel':
      return 'Discord';
  }
}

/**
 * Flattens a target's channel-specific config into a single destination string
 * (chat/thread id, channel/guild id, …). Pure helper shared by the desktop
 * "Destination" column, the search index, and the mobile card.
 */
export function getTargetDestination(target: DigestTarget) {
  const config = target.config as Record<string, unknown>;
  if (target.targetType === 'telegram_group') {
    const thread =
      typeof config.messageThreadId === 'number'
        ? ` / thread ${config.messageThreadId}`
        : '';
    return `${config.chatId ?? '-'}${thread}`;
  }
  if (target.targetType === 'discord_channel') {
    const guild =
      typeof config.guildId === 'string' ? ` / ${config.guildId}` : '';
    return `${config.channelId ?? '-'}${guild}`;
  }
  return String(config.channelId ?? '-');
}

/**
 * Formats an ISO timestamp for display, tolerating null/invalid values. Shared
 * by every table column and the mobile card so dates read identically.
 */
export function formatDate(value: string | null) {
  if (!value) {
    return '-';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }
  return format(date, 'yyyy-MM-dd HH:mm');
}

/**
 * "Enabled" status pill plus the write-gated toggle. Extracted so the desktop
 * column and the mobile card flip the same switch through the same `onToggle`
 * handler — one source, no forked logic.
 */
export function TargetEnabledCell({
  target,
  isMutating,
  onToggle,
}: {
  target: DigestTarget;
  isMutating: boolean;
  onToggle: (target: DigestTarget, enabled: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Badge variant={target.enabled ? 'outline' : 'secondary'}>
        {target.enabled ? 'Enabled' : 'Disabled'}
      </Badge>
      <PermissionGate permissions={[Permission.WRITE_NAMEFI_FEED]}>
        <Switch
          checked={target.enabled}
          disabled={isMutating}
          onCheckedChange={(checked) => onToggle(target, checked)}
          aria-label={`Toggle ${target.label}`}
          data-testid={`admin.namefi-feed.target.row.toggle-enabled.${target.id}`}
        />
      </PermissionGate>
    </div>
  );
}

/**
 * Write-gated Edit/Delete actions for a digest target. Extracted so the desktop
 * column and the mobile card invoke the same `onEdit`/`onDelete` handlers.
 */
export function TargetActionsCell({
  target,
  isMutating,
  onEdit,
  onDelete,
}: {
  target: DigestTarget;
  isMutating: boolean;
  onEdit: (target: DigestTarget) => void;
  onDelete: (target: DigestTarget) => void;
}) {
  return (
    <PermissionGate permissions={[Permission.WRITE_NAMEFI_FEED]}>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          aria-label={`Edit ${target.label}`}
          disabled={isMutating}
          onClick={() => onEdit(target)}
          data-testid={`admin.namefi-feed.target.row.edit.${target.id}`}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="destructive"
          size="icon"
          aria-label={`Delete ${target.label}`}
          disabled={isMutating}
          onClick={() => onDelete(target)}
          data-testid={`admin.namefi-feed.target.row.delete.${target.id}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </PermissionGate>
  );
}
