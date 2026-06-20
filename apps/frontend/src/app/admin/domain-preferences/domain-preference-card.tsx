'use client';

import type { ReactNode } from 'react';
import { Card } from '@namefi-astra/ui/components/shadcn/card';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { AsyncButton } from '@/components/buttons/async-button';
import {
  type DomainPreferencesRow,
  DomainNameCell,
  ForwardToCell,
  type PreferenceDraft,
  PreferenceToggleCell,
  UserIdCell,
  WalletCell,
} from './domain-preferences-cells';

/**
 * One detail row of the card: label pinned to the start, value to the end — the
 * iOS grouped-list (Settings) convention, matching my-domains/domain-card.tsx.
 */
function CardRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 px-3.5 py-2.5">
      <dt className="shrink-0 pt-0.5 text-[13px] text-muted-foreground">
        {label}
      </dt>
      <dd className="flex min-w-0 flex-col items-end gap-0.5 text-right">
        {children}
      </dd>
    </div>
  );
}

interface DomainPreferenceCardProps {
  row: DomainPreferencesRow;
  draft: PreferenceDraft | undefined;
  canWrite: boolean;
  isDirty: boolean;
  isSaving: boolean;
  onDraftChange: <K extends keyof PreferenceDraft>(
    field: K,
    value: PreferenceDraft[K],
  ) => void;
  onReset: () => void;
  onSave: () => Promise<void>;
}

/**
 * Mobile card representation of a single domain-preferences row. Composes the
 * SAME shared cell components the desktop table columns use (`DomainNameCell`,
 * `UserIdCell`, `WalletCell`, `PreferenceToggleCell`, `ForwardToCell`) so the
 * values — including the draft → row → "Not set" precedence — stay identical;
 * only the layout differs: a compact iOS-style grouped list instead of a wide,
 * horizontally-scrolling table row. Editing here flows through the same draft
 * state and Reset/Save mutation as the desktop table.
 */
export function DomainPreferenceCard({
  row,
  draft,
  canWrite,
  isDirty,
  isSaving,
  onDraftChange,
  onReset,
  onSave,
}: DomainPreferenceCardProps) {
  return (
    <Card className="gap-0 overflow-hidden px-0 py-0">
      <div className="flex items-start gap-2 px-3 py-2.5">
        <div className="min-w-0 flex-1">
          <DomainNameCell domainName={row.normalizedDomainName} />
        </div>
      </div>

      <dl className="divide-y divide-border/50 border-t border-border/50">
        <CardRow label="User ID">
          <UserIdCell userId={row.userId} />
        </CardRow>

        <CardRow label="Wallet">
          <WalletCell ownerAddress={row.ownerAddress} chainId={row.chainId} />
        </CardRow>

        <CardRow label="Auto Renew">
          <PreferenceToggleCell
            row={row}
            draft={draft}
            field="autoRenewEnabled"
            disabled={!canWrite}
            onChange={(checked) => onDraftChange('autoRenewEnabled', checked)}
          />
        </CardRow>

        <CardRow label="Auto ENS">
          <PreferenceToggleCell
            row={row}
            draft={draft}
            field="autoEnsEnabled"
            disabled={!canWrite}
            onChange={(checked) => onDraftChange('autoEnsEnabled', checked)}
          />
        </CardRow>

        <CardRow label="Auto Park">
          <PreferenceToggleCell
            row={row}
            draft={draft}
            field="autoParkEnabled"
            disabled={!canWrite}
            onChange={(checked) => onDraftChange('autoParkEnabled', checked)}
          />
        </CardRow>

        <CardRow label="Forward To">
          <ForwardToCell
            row={row}
            draft={draft}
            disabled={!canWrite}
            onChange={(nextValue) => onDraftChange('forwardTo', nextValue)}
          />
        </CardRow>
      </dl>

      <div className="flex items-center justify-end gap-2 border-t border-border/50 px-3.5 py-3">
        <Button
          variant="outline"
          size="sm"
          disabled={!isDirty || !canWrite || isSaving}
          onClick={onReset}
        >
          Reset
        </Button>
        <AsyncButton
          size="sm"
          disabled={!isDirty || !canWrite || isSaving}
          onClick={onSave}
        >
          Save
        </AsyncButton>
      </div>
    </Card>
  );
}
