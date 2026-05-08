'use client';

/**
 * Shared preference-field primitives.
 *
 * Lifted out of `apps/frontend/src/app/admin/domain-preferences/page.tsx`
 * so the admin domain-details modal can render the same per-field UX
 * (toggle with "Not set" amber label, forward-to text input with the
 * same fallback). The page still owns its draft/dirty/save logic;
 * this module contains only the leaf field components and the
 * "Not set" defaults / styling helpers.
 */

import { Switch } from '@namefi-astra/ui/components/shadcn/switch';
import { Input } from '@namefi-astra/ui/components/shadcn/input';

/**
 * Defaults applied to render the on/off state of a `null` (never-set)
 * preference. Saving doesn't write these — the row save logic excludes
 * fields that haven't been explicitly toggled by the admin.
 */
export const NOT_SET_DEFAULTS = {
  autoRenewEnabled: false,
  autoEnsEnabled: true,
  autoParkEnabled: false,
  forwardTo: '',
} as const;

export const NOT_SET_TEXT_CLASSNAME = 'text-xs text-amber-600';

export function PreferenceToggle({
  value,
  isNotSet,
  disabled,
  onChange,
}: {
  value: boolean;
  isNotSet: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
}) {
  const checked = value;
  const label = isNotSet ? 'Not set' : checked ? 'Enabled' : 'Disabled';

  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={checked}
        onCheckedChange={(next) => onChange(Boolean(next))}
        disabled={disabled}
      />
      <span
        className={
          isNotSet ? NOT_SET_TEXT_CLASSNAME : 'text-xs text-muted-foreground'
        }
      >
        {label}
      </span>
    </div>
  );
}

export function ForwardToField({
  value,
  disabled,
  isNotSet,
  onChange,
}: {
  value: string;
  disabled: boolean;
  isNotSet: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="min-w-[180px]">
      <Input
        value={value}
        placeholder="Not set"
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
      {isNotSet && value === '' ? (
        <div className={`${NOT_SET_TEXT_CLASSNAME} mt-1`}>Not set</div>
      ) : null}
    </div>
  );
}

export function NotSetText() {
  return <span className={NOT_SET_TEXT_CLASSNAME}>Not set</span>;
}
