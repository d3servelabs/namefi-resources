'use client';

import { Button } from '@/components/ui/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/shadcn/dialog';
import { Input } from '@/components/ui/shadcn/input';
import { Label } from '@/components/ui/shadcn/label';
import { useTRPC } from '@/utils/trpc';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  type ChangeEvent,
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useState,
} from 'react';
import { toast } from 'sonner';
import { usePendingToast } from './usePendingToast';

interface SubmitDomainDialogProps {
  children: ReactNode;
  onSuccess?: () => void;
}

export const SubmitDomainDialog = ({
  children,
  onSuccess,
}: SubmitDomainDialogProps) => {
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [domainName, setDomainName] = useState('');
  const router = useRouter();

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const submitDomainMutation = useMutation(
    trpc.hunt.submitDomain.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.hunt.getTrendingDomains.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.hunt.getMySubmittedDomains.queryKey(),
        });
        setIsSubmitDialogOpen(false);
        const currentDomain = domainName.trim();
        setDomainName('');
        toast.success('Domain submitted successfully!');
        onSuccess?.();
        router.push(`/hunt/domains/${encodeURIComponent(currentDomain)}`);
      },
      onError: (error) => {
        const currentDomain = domainName.trim();
        toast.error(error.message || 'Failed to submit domain');

        // If domain already exists, navigate to its detail page
        if (error.message?.includes('already been submitted')) {
          setIsSubmitDialogOpen(false);
          setDomainName('');
          router.push(`/hunt/domains/${encodeURIComponent(currentDomain)}`);
        }
      },
    }),
  );

  const handleSubmitDomain = useCallback(() => {
    if (!domainName.trim()) {
      toast.error('Please enter a domain name');
      return;
    }
    submitDomainMutation.mutate({ domainName: domainName.trim() });
  }, [domainName, submitDomainMutation]);

  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setDomainName(e.target.value);
  }, []);

  const handleInputKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handleSubmitDomain();
      }
    },
    [handleSubmitDomain],
  );

  const handleCancel = useCallback(() => {
    setIsSubmitDialogOpen(false);
    setDomainName('');
  }, []);

  usePendingToast(submitDomainMutation.isPending, 'Submitting domain...');

  return (
    <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
      <DialogTrigger asChild={true}>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit a new domain</DialogTitle>
        </DialogHeader>
        <div className="space-y-8">
          <div className="flex flex-col gap-4">
            <Label htmlFor="domain-name">Domain Name</Label>
            <Input
              id="domain-name"
              placeholder="example.com"
              value={domainName}
              onChange={handleInputChange}
              onKeyDown={handleInputKeyDown}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button
              className="cursor-pointer"
              onClick={handleSubmitDomain}
              disabled={submitDomainMutation.isPending}
            >
              {submitDomainMutation.isPending ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
