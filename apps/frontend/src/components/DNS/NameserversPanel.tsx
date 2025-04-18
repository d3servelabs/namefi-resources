'use client';

import { Button } from '@/components/ui/shadcn/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import { Input } from '@/components/ui/shadcn/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/shadcn/tooltip';
import { Info, RotateCw } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

interface Nameserver {
  id: string;
  value: string;
}

export function NameserversPanel() {
  const [isUsingCustom, setIsUsingCustom] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [nameservers, setNameservers] = useState<Nameserver[]>([
    { id: '1', value: 'custom1.example.com' },
    { id: '2', value: 'custom2.example.com' },
    { id: '3', value: 'custom3.example.com' },
  ]);

  const handleResetToNamefi = useCallback(() => {
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      setIsUsingCustom(false);
      setNameservers([
        { id: '1', value: 'ns1.namefi.io' },
        { id: '2', value: 'ns2.namefi.io' },
      ]);
      setIsLoading(false);

      toast('Nameservers reset', {
        description: 'Your nameservers have been reset to Namefi defaults.',
      });
    }, 1000);
  }, []);

  const handleUpdateNameserver = useCallback((id: string, value: string) => {
    setNameservers((prev) =>
      prev.map((ns) => (ns.id === id ? { ...ns, value } : ns)),
    );
  }, []);

  const handleAddNameserver = useCallback(() => {
    setNameservers((prev) => [...prev, { id: `new-${Date.now()}`, value: '' }]);
  }, []);

  const handleRemoveNameserver = useCallback((id: string) => {
    setNameservers((prev) => prev.filter((ns) => ns.id !== id));
  }, []);

  const resetButton = useMemo(
    () => (
      <Button
        variant="outline"
        className="bg-brand-primary-950/20 text-brand-primary-500 hover:text-brand-primary-400 hover:bg-brand-primary-950/30 border-brand-primary-800/50"
        onClick={handleResetToNamefi}
        disabled={isLoading || !isUsingCustom}
      >
        {isLoading ? (
          <RotateCw className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <RotateCw className="mr-2 h-4 w-4" />
        )}
        Reset to Namefi
      </Button>
    ),
    [handleResetToNamefi, isLoading, isUsingCustom],
  );

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-xl font-bold">
            {isUsingCustom
              ? 'Using Custom nameservers'
              : 'Using Namefi nameservers'}
          </CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild={true}>
                <Info className="h-4 w-4 text-zinc-500 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Nameservers direct traffic to your domain</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        {resetButton}
      </CardHeader>
      <CardContent className="space-y-4">
        {nameservers.map((ns) => (
          <div key={ns.id} className="flex items-center gap-2">
            <Input
              value={ns.value}
              onChange={(e) => handleUpdateNameserver(ns.id, e.target.value)}
              className="bg-zinc-950 border-zinc-800"
              placeholder="e.g., ns1.example.com"
            />
            {nameservers.length > 2 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveNameserver(ns.id)}
                className="text-zinc-400 hover:text-red-500"
              >
                Remove
              </Button>
            )}
          </div>
        ))}

        {nameservers.length < 4 && isUsingCustom && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddNameserver}
            className="mt-2"
          >
            Add nameserver
          </Button>
        )}

        <div className="text-sm text-zinc-500 mt-4">
          <p>
            Changes to nameservers can take 24-48 hours to propagate globally.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
