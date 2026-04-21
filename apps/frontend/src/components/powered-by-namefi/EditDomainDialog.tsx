import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@namefi-astra/ui/components/shadcn/dialog';
import { Input } from '@namefi-astra/ui/components/shadcn/input';
import { Label } from '@namefi-astra/ui/components/shadcn/label';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@/lib/trpc';
import { toast } from 'sonner';

export function EditDomainDialog({
  open,
  onOpenChange,
  domain,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  domain: {
    normalizedDomainName: string;
    costPerYearInUsdCents: number | null;
    durationConstraints: {
      minDurationInYears: number;
      maxDurationInYears: number;
    } | null;
  };
}) {
  const trpc = useTRPC();
  const qc = useQueryClient();
  const mutation = useMutation(
    trpc.pbnOwner.updateDomain.mutationOptions({
      onSuccess: async () => {
        await qc.invalidateQueries({
          queryKey: trpc.pbnOwner.listOwnedDomains.queryKey(),
        });
        toast.success('Domain updated');
        onOpenChange(false);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit {domain.normalizedDomainName}</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget as HTMLFormElement & {
              costPerYearInUsdCents: { value: string };
              minDurationInYears: { value: string };
              maxDurationInYears: { value: string };
            };
            mutation.mutate({
              normalizedDomainName: domain.normalizedDomainName,
              costPerYearInUsdCents: Number(
                form.costPerYearInUsdCents.value || '0',
              ),
              durationConstraints: {
                minDurationInYears: Number(
                  form.minDurationInYears.value || '1',
                ),
                maxDurationInYears: Number(
                  form.maxDurationInYears.value || '1',
                ),
              },
            });
          }}
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="costPerYearInUsdCents">Price (USD cents)</Label>
              <Input
                id="costPerYearInUsdCents"
                name="costPerYearInUsdCents"
                type="number"
                defaultValue={domain.costPerYearInUsdCents ?? 0}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minDurationInYears">Min years</Label>
              <Input
                id="minDurationInYears"
                name="minDurationInYears"
                type="number"
                defaultValue={
                  domain.durationConstraints?.minDurationInYears ?? 1
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxDurationInYears">Max years</Label>
              <Input
                id="maxDurationInYears"
                name="maxDurationInYears"
                type="number"
                defaultValue={
                  domain.durationConstraints?.maxDurationInYears ?? 1
                }
              />
            </div>
          </div>
          <Button type="submit" disabled={mutation.isPending}>
            Save
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
