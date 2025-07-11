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
import type { Control, FieldPath, FieldValues } from 'react-hook-form';

interface DomainFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  fixedDomain?: string;
  placeholder?: string;
}

export function DomainField<T extends FieldValues>({
  control,
  name,
  fixedDomain,
  placeholder = 'Enter your domain (e.g., example.com)',
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
        <FormItem className="mb-6">
          <FormControl>
            <Input
              {...field}
              type="text"
              placeholder={placeholder}
              className="w-full h-14 px-6 text-lg rounded-2xl"
              required
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
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
    <div className={`flex flex-wrap gap-4 ${className || ''}`}>
      {buttons.map((button) => (
        <Button
          key={button.key}
          type="button"
          variant={button.isActive ? 'default' : 'outline'}
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
