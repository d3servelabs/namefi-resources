import { Button } from '@namefi-astra/ui/components/shadcn/button';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@namefi-astra/ui/components/shadcn/form';
import { Textarea } from '@namefi-astra/ui/components/shadcn/textarea';
import { Badge } from '@namefi-astra/ui/components/shadcn/badge';
import { DomainSearchCombobox } from '@/components/domain-search-combobox';
import { useDomainSearchOptions } from '@/hooks/use-domain-search-options';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';

export interface DomainFieldProps<
  T extends FieldValues,
  TTransformedValues = T,
> {
  control: Control<T, any, TTransformedValues>;
  name: FieldPath<T>;
  fixedDomain?: NamefiNormalizedDomain;
  placeholder?: string;
  selectOnly?: boolean;
  onlyDomainsWithLogos?: boolean;
}

export function DomainField<T extends FieldValues, TTransformedValues = T>({
  control,
  name,
  fixedDomain,
  placeholder = 'Enter your domain (e.g., example.com)',
  selectOnly = false,
  onlyDomainsWithLogos = false,
}: DomainFieldProps<T, TTransformedValues>) {
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
      control={control as unknown as Control<T>}
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
  const { options: domainOptions, isLoading: isDomainOptionsLoading } =
    useDomainSearchOptions({
      onlyDomainsWithLogos,
    });

  return (
    <FormItem className="mb-6">
      <FormControl>
        <DomainSearchCombobox
          name={name}
          value={value}
          onValueChange={onChange}
          onBlur={onBlur}
          options={domainOptions}
          placeholder={placeholder}
          searchPlaceholder={
            selectOnly ? 'Search brand domains...' : 'Search or enter a domain'
          }
          emptyMessage={
            selectOnly
              ? 'No generated logo domains found.'
              : 'No matching domains.'
          }
          allowCustomValue={!selectOnly}
          isLoading={isDomainOptionsLoading}
          required={required}
          disabled={
            selectOnly && !isDomainOptionsLoading && domainOptions.length === 0
          }
          triggerClassName="h-14 rounded-2xl px-6 text-lg"
        />
      </FormControl>

      <FormMessage />
    </FormItem>
  );
}

interface DescriptionFieldProps<T extends FieldValues, TTransformedValues = T> {
  control: Control<T, any, TTransformedValues>;
  name: FieldPath<T>;
  label?: string;
  placeholder?: string;
  rows?: number;
}

export function DescriptionField<
  T extends FieldValues,
  TTransformedValues = T,
>({
  control,
  name,
  label = 'Describe your brand (optional)',
  placeholder = 'Tell us more about your brand vision',
  rows = 4,
}: DescriptionFieldProps<T, TTransformedValues>) {
  return (
    <FormField
      control={control as unknown as Control<T>}
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
