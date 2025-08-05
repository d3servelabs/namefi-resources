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
import { useTRPC } from '@/lib/trpc';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useState,
  useMemo,
} from 'react';
import { toast } from 'sonner';
import { usePendingToast } from '../../hooks/use-pending-toast';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  type NamefiNormalizedDomain,
  namefiNormalizedDomainSchema,
} from '@namefi-astra/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useInteractionLoggers } from '@/components/providers/analytics';
import { InteractionLoggingEventName } from '@/lib/analytics-events';

interface SubmitDomainDialogProps {
  children: ReactNode;
  onSuccess?: () => void;
  redirectOnSuccess?: boolean;
  extension?: string;
}

const createSubmitDomainSchema = (extension?: string) =>
  z.object({
    domainName: z
      .string()
      .refine((val) => val.includes('.'), {
        message:
          'Domain name must be a single level domain (e.g. example.com) or higher (e.g. sub.example.com)',
      })
      .refine((val) => namefiNormalizedDomainSchema.safeParse(val).success, {
        message: 'Invalid domain name',
      })
      .refine((val) => !extension || val.endsWith(`.${extension}`), {
        message: extension
          ? `Domain must end with .${extension}`
          : 'Invalid domain extension',
      }),
  });
export const SubmitDomainDialog = ({
  children,
  onSuccess,
  extension,
  redirectOnSuccess = true,
}: SubmitDomainDialogProps) => {
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const { logEventWithInteractionLoggers } = useInteractionLoggers();

  const submitDomainSchema = useMemo(
    () => createSubmitDomainSchema(extension),
    [extension],
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<z.infer<typeof submitDomainSchema>>({
    resolver: zodResolver(submitDomainSchema),
    defaultValues: {
      domainName: '' as NamefiNormalizedDomain,
    },
    mode: 'onChange',
  });
  const router = useRouter();

  const domainName = watch('domainName');
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const submitDomainMutation = useMutation(
    trpc.hunt.submitDomain.mutationOptions({
      onSuccess: (data) => {
        // Invalidate relevant queries since submission now auto-upvotes
        queryClient.invalidateQueries({
          queryKey: trpc.hunt.getTrendingDomains.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.hunt.getMySubmittedDomains.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.hunt.getMyUpvotedDomains.queryKey(),
        });

        setIsSubmitDialogOpen(false);
        const currentDomain = domainName.trim();
        reset();

        // Show different messages based on whether it's a new submission or existing domain
        if (data.message === 'Domain already exists') {
          toast.success('Domain already exists.');
        } else {
          toast.success('Domain submitted and upvoted successfully!');
          // Track the auto-upvote that happens on domain submission
          logEventWithInteractionLoggers({
            name: InteractionLoggingEventName.Vote,
            properties: {
              domainName: currentDomain,
              action: 'add',
            },
          });
        }

        onSuccess?.();
        if (redirectOnSuccess) {
          router.push(`/hunt/domains/${encodeURIComponent(currentDomain)}`);
        }
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to submit domain');
      },
    }),
  );

  const handleSubmitDomain = useCallback(
    (data: z.infer<typeof submitDomainSchema>) => {
      const domainName = data.domainName;
      if (!domainName.trim()) {
        toast.error('Please enter a domain name');
        return;
      }
      submitDomainMutation.mutate({ domainName: domainName.trim() });
    },
    [submitDomainMutation],
  );

  const handleInputKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit(handleSubmitDomain)();
      }
    },
    [handleSubmit, handleSubmitDomain],
  );

  const handleCancel = useCallback(() => {
    setIsSubmitDialogOpen(false);
    reset();
  }, [reset]);

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
              onKeyDown={handleInputKeyDown}
              placeholder={extension ? `example.${extension}` : 'example.com'}
              {...register('domainName')}
            />
            {errors.domainName && (
              <p className="text-sm text-red-500">
                {errors.domainName.message}
              </p>
            )}
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
              onClick={handleSubmit(handleSubmitDomain)}
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
