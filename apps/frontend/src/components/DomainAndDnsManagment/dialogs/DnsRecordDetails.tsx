'use client';

import { Button } from '@/components/ui/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/shadcn/dialog';
import { Input } from '@/components/ui/shadcn/input';
import { Label } from '@/components/ui/shadcn/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select';

interface DnsRecordDetailsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record?: {
    type: string;
    name: string;
    value: string;
    ttl: string;
    notes: string;
  };
}

export function DnsRecordDetails({
  open,
  onOpenChange,
  record,
}: DnsRecordDetailsProps) {
  if (!record) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-zinc-900 border-zinc-800 text-secondary-foreground">
        <DialogHeader>
          <DialogTitle>{record.type} Record Details</DialogTitle>
          <DialogDescription className="text-zinc-400">
            View and edit the details of this DNS record.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right">
              Type
            </Label>
            <Select defaultValue={record.type}>
              <SelectTrigger
                id="type"
                className="col-span-3 bg-zinc-800 border-zinc-700"
              >
                <SelectValue placeholder="Select record type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A">A</SelectItem>
                <SelectItem value="AAAA">AAAA</SelectItem>
                <SelectItem value="CNAME">CNAME</SelectItem>
                <SelectItem value="MX">MX</SelectItem>
                <SelectItem value="TXT">TXT</SelectItem>
                <SelectItem value="NS">NS</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              defaultValue={record.name}
              className="col-span-3 bg-zinc-800 border-zinc-700"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="value" className="text-right">
              Value
            </Label>
            <Input
              id="value"
              defaultValue={record.value}
              className="col-span-3 bg-zinc-800 border-zinc-700"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="ttl" className="text-right">
              TTL
            </Label>
            <Select defaultValue={record.ttl}>
              <SelectTrigger
                id="ttl"
                className="col-span-3 bg-zinc-800 border-zinc-700"
              >
                <SelectValue placeholder="Select TTL" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="300">5 minutes</SelectItem>
                <SelectItem value="1200">20 minutes</SelectItem>
                <SelectItem value="3600">1 hour</SelectItem>
                <SelectItem value="86400">1 day</SelectItem>
                <SelectItem value="604800">1 week</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className="bg-brand-primary-500 hover:bg-brand-primary-600">
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
