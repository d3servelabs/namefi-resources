'use client';

import { useState, useRef, forwardRef } from 'react';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { Input } from '@namefi-astra/ui/components/shadcn/input';
import { Label } from '@namefi-astra/ui/components/shadcn/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@namefi-astra/ui/components/shadcn/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@namefi-astra/ui/components/shadcn/select';
import { useTRPC } from '@/lib/trpc';
import { toast } from 'sonner';
import { BrushCleaningIcon, CheckCircle2, XCircle } from 'lucide-react';
import dynamic from 'next/dynamic';
import type {
  AltchaVerifierRef,
  AltchaProps,
} from '@/components/newsletter/altcha-verifier';
import { useIsClient } from 'usehooks-ts';
import { useMutation } from '@tanstack/react-query';

const AltchaVerifierDynamic = dynamic(
  () => import('@/components/newsletter/altcha-verifier'),
  {
    ssr: false,
    loading: () => <div className="h-12 rounded-md bg-muted animate-pulse" />,
  },
);

const AltchaVerifier = forwardRef<AltchaVerifierRef, AltchaProps>(
  (props, ref) => (
    <AltchaVerifierDynamic {...props} ref={ref as unknown as never} />
  ),
);

const DNS_RECORD_TYPES = [
  'ALL',
  'A',
  'AAAA',
  'CNAME',
  'MX',
  'TXT',
  'NS',
  'SOA',
  'PTR',
  'SRV',
  'CAA',
  'DS',
  'TLSA',
  'SSHFP',
  'HTTPS',
  'SVCB',
  'NAPTR',
  'SPF',
] as const;

export default function DnsCacheFlushPage() {
  const isClient = useIsClient();
  const [zone, setZone] = useState('');
  const [recordType, setRecordType] = useState<string>('ALL');
  const [results, setResults] = useState<any[] | null>(null);

  const altchaRef = useRef<AltchaVerifierRef>(null);
  const trpc = useTRPC();

  const flushMutation = useMutation(
    trpc.dnsCache.flushCache.mutationOptions({
      onSuccess: (data) => {
        setResults(data.results);
        toast.success('Cache Flush Complete', {
          description: data.message,
        });
      },
      onError: (error) => {
        toast.error('Cache Flush Failed', {
          description: error.message,
        });
      },
    }),
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!zone) {
      toast.error('Zone is required');
      return;
    }

    flushMutation.mutate({
      zone,
      recordType: recordType === 'ALL' ? undefined : (recordType as any),
      altcha: altchaRef.current?.value || null,
    });
  };

  if (!isClient) return null;

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BrushCleaningIcon className="w-5 h-5" />
            DNS Cache Flush
          </CardTitle>
          <CardDescription>
            Flush DNS caches across configured servers for a specific zone and
            record type
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="zone">Zone/Domain</Label>
              <Input
                id="zone"
                placeholder="example.com"
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                disabled={flushMutation.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recordType">Record Type</Label>
              <Select
                value={recordType}
                onValueChange={(value) => {
                  if (!value) return;
                  setRecordType(value);
                }}
                disabled={flushMutation.isPending}
              >
                <SelectTrigger id="recordType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DNS_RECORD_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <AltchaVerifier ref={altchaRef} expire={120_000} />

            <Button
              type="submit"
              className="w-full"
              disabled={flushMutation.isPending}
            >
              {flushMutation.isPending ? (
                <>
                  <BrushCleaningIcon className="w-4 h-4 me-2 animate-spin" />
                  Flushing Cache...
                </>
              ) : (
                <>
                  <BrushCleaningIcon className="w-4 h-4 me-2" />
                  Flush DNS Cache
                </>
              )}
            </Button>
          </form>

          {results && results.length > 0 && (
            <div className="mt-6 space-y-2">
              <h3 className="font-semibold">Results:</h3>
              {results.map((result, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-md border"
                >
                  <span className="font-medium">{result.serverName}</span>
                  <div className="flex items-center gap-2">
                    {result.success ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                        <span className="text-sm text-green-600">Success</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 text-red-500" />
                        <span className="text-sm text-red-600">
                          {result.error || 'Failed'}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
