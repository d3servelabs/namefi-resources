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
}: DnsRecordFormProps) {
  const form = useForm<DnsRecordFormValues>({
    resolver,
    defaultValues,
    mode: 'all',
  });
  // Watch for form changes and notify parent
  const values = form.watch();
  const isValid = form.formState.isValid;

  useEffect(() => {
    const sanitizedValues = sanitizeDnsRecord(values);
    onValuesChange(sanitizedValues, isValid);
  }, [values, isValid, onValuesChange]);

  // Memoize the value placeholder based on type
  const valuePlaceholder = useMemo(() => {
    const type = form.getValues('type');
    return type === 'A' ? '192.168.1.1' : 'example.com';
  }, [form]);

  const zoneName = useMemo(() => form.getValues('domain') ?? '', [form]);

  return (
    <Form {...form}>
      <div className="flex flex-row flex-wrap *:px-2 gap-y-2">
        <div className="w-2/12">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm text-zinc-400">
                  Type <span className="text-red-500">*</span>
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
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
        </div>
        <div className="w-2/12">
          <FormField
            control={form.control}
            name="ttl"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm text-zinc-400">TTL</FormLabel>
                <div className="flex">
                  <Select
                    onValueChange={(value) =>
                      field.onChange(Number.parseInt(value))
                    }
                    defaultValue={field.value.toString()}
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
                  {showRemoveButton && onRemove && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-2"
                      onClick={onRemove}
                      type="button"
                      aria-label={`Remove record ${index + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <FormMessage className="text-xs text-red-500" />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <div
              style={{
                width: `clamp(${zoneName.length + 20}ch, ${Math.max(zoneName.length + (field.value?.length ?? 0), 1)}ch, calc(100% * 8/12))`,
              }}
            >
              <FormItem>
                <FormLabel className="text-sm text-zinc-400">Name</FormLabel>
                <div className="flex flex-row flex-nowrap">
                  <FormControl>
                    <Input
                      placeholder="www or @"
                      className="bg-zinc-900 border-zinc-800 rounded-r-none"
                      {...field}
                    />
                  </FormControl>
                  <Input
                    className="w-fit bg-zinc-900 border-zinc-800 border-l-0 rounded-l-none text-zinc-500"
                    style={{
                      width: `clamp(20ch, ${Math.max(zoneName.length + 20, 1)}ch, 100%)`,
                    }}
                    value={zoneName}
                    readOnly={true}
                  />
                </div>
                <FormMessage className="text-xs text-red-500" />
              </FormItem>
            </div>
          )}
        />

        <FormField
          control={form.control}
          name="rdata"
          render={({ field }) => (
            <div
              style={{
                width: `clamp(20ch, ${Math.max(field.value.length, 1)}ch, calc(100%))`,
              }}
            >
              <FormItem>
                <FormLabel className="text-sm text-zinc-400">
                  Value <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={valuePlaceholder}
                    className="bg-zinc-900 border-zinc-800"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-xs text-red-500" />
              </FormItem>
            </div>
          )}
        />
      </div>
    </Form>
  );
}
