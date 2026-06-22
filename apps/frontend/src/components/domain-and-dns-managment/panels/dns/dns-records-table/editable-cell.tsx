import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { Input } from '@namefi-astra/ui/components/shadcn/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@namefi-astra/ui/components/shadcn/select';
import type { DnsRecordSelect } from '@namefi-astra/common/contract/entity-schemas';
import type { Column, Row } from '@tanstack/react-table';
import { Check, X } from 'lucide-react';
import { type KeyboardEvent, useEffect, useRef, useState } from 'react';
import { isManagedDnsRecord } from './managed-records';

export interface EditableCellProps {
  value: string;
  row: Row<DnsRecordSelect>;
  column: Column<DnsRecordSelect>;
  onSave: (value: string) => void;
  options?: { value: string; label: string }[];
  isSelectInput?: boolean;
  enabled?: boolean;
}

export const EditableCell = ({
  value: initialValue,
  row,
  column,
  onSave,
  options,
  isSelectInput = false,
  enabled = true,
}: EditableCellProps) => {
  // Stable, collision-free testid suffix for this cell (column + row id), so
  // the per-record editable controls each have a unique handle.
  const testIdSuffix = `${column.id}.${row.id}`;
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (enabled) {
      if (e.key === 'Enter') {
        onSave(value);
        setIsEditing(false);
      } else if (e.key === 'Escape') {
        setValue(initialValue);
        setIsEditing(false);
      }
    }
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSelectChange = (newValue: string | null) => {
    if (!newValue) return;
    setValue(newValue);
    onSave(newValue);
    setIsEditing(false);
  };

  if (isEditing) {
    if (isSelectInput && options) {
      return (
        <Select defaultValue={value} onValueChange={handleSelectChange}>
          <SelectTrigger
            data-testid={`dnsManagement.records.cell-select.${testIdSuffix}`}
            className="h-8 w-full bg-zinc-900 border-zinc-700"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    return (
      <div className="flex items-center gap-1">
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            onSave(value);
            setIsEditing(false);
          }}
          data-testid={`dnsManagement.records.cell-input.${testIdSuffix}`}
          className="h-8 bg-zinc-900 border-zinc-700"
        />
        <div className="flex">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-green-500"
            data-testid={`dnsManagement.records.cell-save.${testIdSuffix}`}
            onClick={() => {
              onSave(value);
              setIsEditing(false);
            }}
          >
            <Check className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-red-500"
            data-testid={`dnsManagement.records.cell-cancel.${testIdSuffix}`}
            onClick={() => {
              setValue(initialValue);
              setIsEditing(false);
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      className="cursor-pointer hover:bg-zinc-800 p-1 rounded"
      data-testid={`dnsManagement.records.cell-value.${testIdSuffix}`}
      onClick={() => {
        if (enabled) {
          if (isManagedDnsRecord(row.original)) {
            return;
          }
          setIsEditing(true);
        }
      }}
    >
      {initialValue}
    </button>
  );
};
