import { Button } from '@/components/ui/shadcn/button';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/shadcn/form';
import { Input } from '@/components/ui/shadcn/input';
import { Textarea } from '@/components/ui/shadcn/textarea';
import { Badge } from '@/components/ui/shadcn/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/shadcn/select';
import { useTRPC } from '@/lib/trpc';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useResizeObserver } from 'usehooks-ts';
import { useCallback, useMemo, useRef } from 'react';
import { cn } from '@/lib/cn';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';

export interface DomainFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  fixedDomain?: NamefiNormalizedDomain;
  placeholder?: string;
  selectOnly?: boolean;
  onlyDomainsWithLogos?: boolean;
}

export function DomainField<T extends FieldValues>({
  control,
  name,
  fixedDomain,
  placeholder = 'Enter your domain (e.g., example.com)',
  selectOnly = false,
  onlyDomainsWithLogos = false,
}: DomainFieldProps<T>) {
  if (fixedDomain) {
    return (
      <div className="mb-6">
        <div className="w-full h-14 px-6 text-lg rounded-2xl border border-gray-200 bg-gray-50 flex items-center text-gray-700">
          {fixedDomain}
        </div>
      </div>
    );
  }

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <DomainFieldWithSuggestions
          value={(field.value as string) ?? ''}
          onChange={field.onChange}
          onBlur={field.onBlur}
          name={field.name}
          placeholder={placeholder}
          selectOnly={selectOnly}
          onlyDomainsWithLogos={onlyDomainsWithLogos}
          required
        />
      )}
    />
  );
}

function DomainFieldWithSuggestions({
  value,
  onChange,
  onBlur,
  name,
  placeholder,
  required,
  selectOnly = false,
  onlyDomainsWithLogos = false,
}: {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  name: string;
  placeholder: string;
  required?: boolean;
  selectOnly?: boolean;
  onlyDomainsWithLogos?: boolean;
}) {
  const trpc = useTRPC();
  const { isAuthenticated } = useAuth();

  const { data: userDomains } = useQuery({
    ...trpc.users.getCurrentUserDomains.queryOptions(),
    enabled: isAuthenticated,
    staleTime: 60_000,
  });

  const { data: generationDomains } = useQuery({
    ...trpc.ai.getUserDomains.queryOptions(),
    enabled: isAuthenticated,
    staleTime: 60_000,
  });

  const domainOptions = useMemo(() => {
    if (onlyDomainsWithLogos) {
      const generatedWithLogos = (generationDomains ?? [])
        .filter((d) => (d.logoCount ?? 0) > 0)
        .map((d) => d.domain);
      const seen = new Set<string>();
      return generatedWithLogos.filter((d) => {
        if (seen.has(d)) return false;
        seen.add(d);
        return true;
      });
    }
    const owned = (userDomains ?? []).map((d) => d.normalizedDomainName);
    const generated = (generationDomains ?? []).map((d) => d.domain);
    const list = [...owned, ...generated];
    // Deduplicate while preserving order
    const seen = new Set<string>();
    return list.filter((d) => {
      if (seen.has(d)) return false;
      seen.add(d);
      return true;
    });
  }, [userDomains, generationDomains, onlyDomainsWithLogos]);

  const inputRef = useRef<HTMLInputElement>(null);
  const { width = 0 } = useResizeObserver({
    // @ts-ignore - upstream lib typing issue
    ref: inputRef,
    box: 'border-box',
  });

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (selectOnly) return;
      onChange(e.target.value);
    },
    [onChange, selectOnly],
  );

  const handleSelectChange = useCallback(
    (newValue: string) => {
      onChange(newValue);
    },
    [onChange],
  );

  return (
    <FormItem className="mb-6">
      <FormControl>
        <div className="relative">
          <Input
            name={name}
            value={value}
            onChange={handleInputChange}
            onBlur={onBlur}
            type="text"
            placeholder={placeholder}
            ref={inputRef}
            className={cn(
              'w-full h-14 px-6 text-lg rounded-2xl',
              domainOptions.length > 0 && 'pr-10',
            )}
            required={required}
            disabled={selectOnly}
          />
          {domainOptions.length > 0 && (
            <Select value="" onValueChange={handleSelectChange}>
              <SelectTrigger className="absolute right-3 top-1/2 -translate-y-1/2 border-none dark:bg-transparent" />
              <SelectContent
                align="end"
                alignOffset={-12}
                position="popper"
                side="bottom"
                sideOffset={10}
                style={{ width: width ? `${width}px` : undefined }}
              >
                {domainOptions.map((domain) => (
                  <SelectItem key={domain} value={domain}>
                    {domain}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </FormControl>

      <FormMessage />
    </FormItem>
  );
}

interface DescriptionFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label?: string;
  placeholder?: string;
  rows?: number;
}

export function DescriptionField<T extends FieldValues>({
  control,
  name,
  label = 'Describe your brand (optional)',
  placeholder = 'Tell us more about your brand vision',
  rows = 4,
}: DescriptionFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="mt-6">
          <FormLabel className="text-gray-700 font-medium">{label}</FormLabel>
          <FormControl>
            <Textarea
              {...field}
              placeholder={placeholder}
              className="w-full resize-none"
              rows={rows}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

interface ControlButton {
  key: string;
  label: string;
  badge?: string;
  onClick: () => void;
  isActive: boolean;
}

interface ControlPanelProps {
  buttons: ControlButton[];
  className?: string;
}

export function ControlPanel({ buttons, className }: ControlPanelProps) {
  return (
    <div className={`flex flex-wrap gap-3 ${className || ''}`}>
      {buttons.map((button) => (
        <Button
          key={button.key}
          type="button"
          variant={button.isActive ? 'default' : 'outline'}
          size="sm"
          onClick={button.onClick}
          className="rounded-full"
        >
          {button.label}
          {button.badge && (
            <Badge variant="secondary" className="ml-1">
              {button.badge}
            </Badge>
          )}
        </Button>
      ))}
    </div>
  );
}
