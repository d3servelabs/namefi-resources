'use client';

import { useState } from 'react';
import { PlusIcon } from 'lucide-react';

import type { AppRouterOutput } from '@/lib/trpc';
import type { PunycodeDomainName } from '@namefi-astra/registrars/lib/data/validations';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@namefi-astra/ui/components/shadcn/accordion';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@namefi-astra/ui/components/shadcn/dialog';

import { CustomDelegationSignerForm } from './custom-delegation-signer-form';

type DnssecStatusDetails =
  AppRouterOutput['domainConfig']['dnssec']['getDomainDnssecDetails'];

export type CustomDelegationSignerPanelProps = {
  domainName: PunycodeDomainName;
  dnssecDetails: DnssecStatusDetails;
  disableAllButtons: boolean;
};

export function CustomDelegationSignerPanel({
  domainName,
  dnssecDetails,
  disableAllButtons,
}: CustomDelegationSignerPanelProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const customSigners = (dnssecDetails.delegationSigners ?? []) as Array<{
    keyTag?: number;
    algorithm?: number;
    digestType?: number;
    digest?: string;
  }>;

  return (
    <div className="flex flex-col gap-3 w-full pt-4 border-t border-zinc-800">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-medium">Custom Delegation Signers</h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            Required when this domain runs on its own authoritative nameservers.
            Submit the DS that matches the DNSKEY your DNS provider publishes.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger
            render={
              <Button variant="default" disabled={disableAllButtons}>
                <PlusIcon className="w-4 h-4" />
                Add Delegation Signer
              </Button>
            }
          />
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Custom Delegation Signer</DialogTitle>
              <DialogDescription>
                Paste your DNSKEY/DS or auto-detect from your nameservers, then
                validate before submitting.
              </DialogDescription>
            </DialogHeader>
            <CustomDelegationSignerForm
              domainName={domainName}
              onSuccess={() => setDialogOpen(false)}
              onCancel={() => setDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {customSigners.length > 0 ? (
        <div className="overflow-x-auto rounded-md border border-zinc-800">
          <table className="w-full text-xs">
            <thead className="bg-zinc-900/60 text-zinc-400">
              <tr>
                <th className="text-left p-2">Key tag</th>
                <th className="text-left p-2">Algorithm</th>
                <th className="text-left p-2">Digest type</th>
                <th className="text-left p-2">Digest</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {customSigners.map((signer, idx) => (
                <tr
                  key={`${signer.keyTag ?? idx}-${signer.digest ?? idx}`}
                  className="border-t border-zinc-800"
                >
                  <td className="p-2">{signer.keyTag ?? '—'}</td>
                  <td className="p-2">{signer.algorithm ?? '—'}</td>
                  <td className="p-2">{signer.digestType ?? '—'}</td>
                  <td
                    className="p-2 truncate max-w-[28ch]"
                    title={signer.digest ?? ''}
                  >
                    {signer.digest ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-xs text-zinc-500 italic">
          No delegation signers associated yet.
        </p>
      )}
    </div>
  );
}
