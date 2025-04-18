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
import { zodResolver } from '@hookform/resolvers/zod';
import { Trash2 } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
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
  type: 'A',
  name: '',
  domain: '.example.com',
  rdata: '',
  ttl: 3600,
};

const resolver = zodResolver(dnsRecordSchema);

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
    mode: 'onChange',
  });
  // Watch for form changes and notify parent
  const values = form.watch();
  const isValid = form.formState.isValid;

  useEffect(() => {
    onValuesChange(values, isValid);
  }, [values, isValid, onValuesChange]);

  // Memoize the value placeholder based on type
  const valuePlaceholder = useMemo(() => {
    const type = form.getValues('type');
    return type === 'A' ? '192.168.1.1' : 'example.com';
  }, [form]);

  return (
    <Form {...form}>
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-2">
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
                    <SelectTrigger className="bg-zinc-900 border-zinc-800">
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

        <div className="col-span-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm text-zinc-400">Name</FormLabel>
                <div className="flex">
                  <FormControl>
                    <Input
                      placeholder="www or @"
                      className="bg-zinc-900 border-zinc-800 rounded-r-none"
                      {...field}
                    />
                  </FormControl>
                  <Controller
                    control={form.control}
                    name="domain"
                    render={({ field }) => (
                      <Input
                        className="bg-zinc-900 border-zinc-800 border-l-0 rounded-l-none text-zinc-500"
                        value={field.value}
                        readOnly={true}
                      />
                    )}
                  />
                </div>
                <FormMessage className="text-xs text-red-500" />
              </FormItem>
            )}
          />
        </div>

        <div className="col-span-4">
          <FormField
            control={form.control}
            name="rdata"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm text-zinc-400">
                  Value <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder={valuePlaceholder}
                    className="bg-zinc-900 border-zinc-800"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-xs text-red-500" />
              </FormItem>
            )}
          />
        </div>

        <div className="col-span-2">
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
      </div>
    </Form>
  );
}
