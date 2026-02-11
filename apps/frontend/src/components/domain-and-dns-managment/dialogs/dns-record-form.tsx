import { Button } from '@/components/ui/shadcn/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/shadcn/form';
import { Input } from '@/components/ui/shadcn/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select';
import { Textarea } from '@/components/ui/shadcn/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { type RecordType, sanitizeDnsRecord } from '@namefi-astra/zod-dns';
import { Trash2 } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  DNS_RECORD_TYPES,
  type DnsRecordFormValues,
  TTL_OPTIONS,
  dnsRecordSchema,
} from '../schemas';

interface DnsRecordFormProps {
  defaultValues?: DnsRecordFormValues;
  onValuesChange: (values: DnsRecordFormValues, isValid: boolean) => void;
  onRemove?: () => void;
  showRemoveButton?: boolean;
  index: number;
}

const DEFAULT_VALUES: DnsRecordFormValues = {
  type: 'A' as RecordType,
  name: '',
  domain: '.example.com',
  rdata: '',
  ttl: 60,
};
const SHORT_VALUE_TYPES = new Set<RecordType>(['A', 'AAAA', 'CNAME', 'NS']);

const isShortValueType = (type: RecordType) => SHORT_VALUE_TYPES.has(type);

const resolver = zodResolver(
  z
    .any()
    .transform((val) => {
      return sanitizeDnsRecord(val);
    })
    .pipe(dnsRecordSchema),
);

export function DnsRecordForm({
  defaultValues = DEFAULT_VALUES,
  onValuesChange,
  onRemove,
  showRemoveButton = false,
  index,
  disabled = false,
}: DnsRecordFormProps & { disabled?: boolean }) {
  const form = useForm<DnsRecordFormValues>({
    resolver,
    defaultValues,
    mode: 'all',
  });
  // Watch for form changes and notify parent
  const values = form.watch();
  const isValid = form.formState.isValid;
  const selectedType = (values.type ?? DEFAULT_VALUES.type) as RecordType;
  const zoneName = values.domain ?? '';

  useEffect(() => {
    const sanitizedValues = sanitizeDnsRecord(values);
    onValuesChange(sanitizedValues, isValid);
  }, [values, isValid, onValuesChange]);

  const valuePlaceholder = useMemo(() => {
    if (selectedType === 'A') {
      return '192.168.1.1';
    }

    if (selectedType === 'AAAA') {
      return '2001:db8::1';
    }

    return 'example.com';
  }, [selectedType]);

  return (
    <Form {...form}>
      <div className="grid grid-cols-1 gap-3 px-2 md:grid-cols-[minmax(7rem,0.65fr)_minmax(7rem,0.65fr)_minmax(16rem,1.25fr)_minmax(16rem,1fr)_auto] md:items-end">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm text-zinc-400">
                Type <span className="text-red-500">*</span>
              </FormLabel>
              <Select
                onValueChange={(value) => {
                  if (!value) return;
                  field.onChange(value);
                }}
                defaultValue={field.value}
                disabled={disabled}
              >
                <FormControl>
                  <SelectTrigger className="w-full bg-zinc-900 border-zinc-800">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {DNS_RECORD_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage className="text-xs text-red-500" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="ttl"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm text-zinc-400">TTL</FormLabel>
              <Select
                onValueChange={(value) => {
                  if (!value) return;
                  field.onChange(Number.parseInt(value, 10));
                }}
                defaultValue={field.value.toString()}
                disabled={disabled}
              >
                <FormControl>
                  <SelectTrigger className="bg-zinc-900 border-zinc-800">
                    <SelectValue placeholder="Select TTL" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {TTL_OPTIONS.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value.toString()}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage className="text-xs text-red-500" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm text-zinc-400">Name</FormLabel>
              <div className="flex flex-row flex-nowrap">
                <FormControl>
                  <Input
                    placeholder="www or @"
                    className="bg-zinc-900 border-zinc-800 rounded-r-none"
                    {...field}
                    disabled={disabled}
                  />
                </FormControl>
                <Input
                  className="w-fit bg-zinc-900 border-zinc-800 border-l-0 rounded-l-none text-zinc-500"
                  style={{
                    width: `clamp(12ch, ${Math.max(zoneName.length + 2, 12)}ch, 100%)`,
                  }}
                  value={zoneName}
                  readOnly={true}
                />
              </div>
              <FormMessage className="text-xs text-red-500" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="rdata"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm text-zinc-400">
                Value <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                {isShortValueType(selectedType) ? (
                  <Input
                    placeholder={valuePlaceholder}
                    className="bg-zinc-900 border-zinc-800"
                    {...field}
                    disabled={disabled}
                  />
                ) : (
                  <Textarea
                    placeholder={valuePlaceholder}
                    className="bg-zinc-900 border-zinc-800"
                    {...field}
                    disabled={disabled}
                  />
                )}
              </FormControl>
              <FormMessage className="text-xs text-red-500" />
            </FormItem>
          )}
        />

        {showRemoveButton && onRemove && (
          <div className="flex md:justify-end md:pb-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={onRemove}
              type="button"
              aria-label={`Remove record ${index + 1}`}
              disabled={disabled}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </Form>
  );
}
