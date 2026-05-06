'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusIcon, Trash2Icon } from 'lucide-react';
import { toast } from 'sonner';

import { LoadingButton } from '@/components/buttons/loading-button';
import { type AppRouterOutput, useTRPC } from '@/lib/trpc';
import type { PunycodeDomainName } from '@namefi-astra/registrars/lib/data/validations';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@namefi-astra/ui/components/shadcn/alert-dialog';
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

type CustomSigner = {
  id?: string;
  keyTag?: number;
  algorithm?: number;
  digestType?: number;
  digest?: string;
  publicKey?: string;
};

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

  const customSigners = (dnssecDetails.delegationSigners ??
    []) as CustomSigner[];

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
                <th className="text-right p-2 w-10" aria-label="Actions" />
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
                  <td className="p-2 text-right">
                    <DisassociateButton
                      domainName={domainName}
                      signer={signer}
                      disabled={disableAllButtons}
                    />
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

function resolveSignerKeyId(signer: CustomSigner): string | null {
  if (signer.id) return signer.id;
  if (signer.publicKey) return signer.publicKey;
  if (typeof signer.keyTag === 'number') return String(signer.keyTag);
  return null;
}

function DisassociateButton({
  domainName,
  signer,
  disabled,
}: {
  domainName: PunycodeDomainName;
  signer: CustomSigner;
  disabled: boolean;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const keyId = resolveSignerKeyId(signer);

  const mutation = useMutation(
    trpc.domainConfig.dnssec.disassociateDelegationSigner.mutationOptions({
      async onSuccess() {
        toast.success(
          `Removed delegation signer${signer.keyTag ? ` (key tag ${signer.keyTag})` : ''}`,
        );
        await queryClient.invalidateQueries({
          queryKey: trpc.domainConfig.dnssec.getDomainDnssecDetails.queryKey({
            domainName,
          }),
        });
        setOpen(false);
      },
      onError(error) {
        toast.error(`Failed to remove delegation signer: ${error.message}`);
      },
    }),
  );

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-zinc-400 hover:text-red-400"
            disabled={disabled || !keyId}
            aria-label="Remove delegation signer"
          >
            <Trash2Icon className="w-4 h-4" />
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove delegation signer?</AlertDialogTitle>
          <AlertDialogDescription>
            This disassociates the DS at the registrar.{' '}
            {signer.keyTag ? `Key tag ${signer.keyTag}. ` : ''}If this is the
            only DS for the domain, DNSSEC validation will break globally within
            a few hours. Make sure you've already published a replacement at the
            parent or are intentionally turning DNSSEC off.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            render={
              <LoadingButton
                variant="destructive"
                isLoading={mutation.isPending}
                loadingText="Removing..."
                onClick={(event) => {
                  event.preventDefault();
                  if (!keyId) {
                    toast.error(
                      'Cannot determine which key to remove (no id, publicKey, or keyTag).',
                    );
                    return;
                  }
                  mutation.mutate({ domainName, keyId });
                }}
              >
                Remove
              </LoadingButton>
            }
          />
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
