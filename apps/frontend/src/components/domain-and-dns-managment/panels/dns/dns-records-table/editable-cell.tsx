import { Button } from '@/components/ui/shadcn/button';
import { Input } from '@/components/ui/shadcn/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select';
import type { DnsRecordSelect } from '@namefi-astra/db';
import type { Column, Row } from '@tanstack/react-table';
import { Check, X } from 'lucide-react';
import { type KeyboardEvent, useEffect, useRef, useState } from 'react';

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
  onSave,
  options,
  isSelectInput = false,
  enabled = true,
}: EditableCellProps) => {
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
          <SelectTrigger className="h-8 w-full bg-zinc-900 border-zinc-700">
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
          className="h-8 bg-zinc-900 border-zinc-700"
        />
        <div className="flex">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-green-500"
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
      onClick={() => {
        if (enabled) {
          // Don't allow editing system records
          const rdata = row.original.rdata;
          if (rdata === 'by AutoPark™' || rdata === 'by System') {
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
