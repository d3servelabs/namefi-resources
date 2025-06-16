'use client';

import { Button } from '@/components/ui/shadcn/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/shadcn/form';
import { Input } from '@/components/ui/shadcn/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/shadcn/tooltip';
import { cn } from '@/lib/utils';
import { useTRPC, useTRPCClient } from '@/utils/trpc';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Nameserver } from '@namefi-astra/registrars/lib/abstract-registrar/data/nameservers';
import {
  type PunycodeDomainName,
  punycodeFqdnSchema,
} from '@namefi-astra/registrars/lib/data/validations';
import { toPunycodeFqdn } from '@namefi-astra/registrars/lib/data/validations';
import { namefiNormalizedDomainSchema } from '@namefi-astra/utils';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Info, Loader2, RotateCw, SaveIcon } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useCallback, useMemo, useState } from 'react';
import React from 'react';
import { type SubmitHandler, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

export type DomainNameserversFormProps = {
  domainName: PunycodeDomainName;
  nameservers: Nameserver[];
};
export type DomainNameserversFormData = {
  nameservers: Nameserver[];
};

const NameserversPanelInner = React.memo(
  function NameserversPanelInner({
    domainName,
    nameservers,
  }: DomainNameserversFormProps) {
    const [isUsingCustom, setIsUsingCustom] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    const handleResetToNamefi = useCallback(() => {
      setIsLoading(true);

      // Simulate API call
      setTimeout(() => {
        setIsUsingCustom(false);

        setIsLoading(false);

        toast('Nameservers reset', {
          description: 'Your nameservers have been reset to Namefi defaults.',
        });
      }, 1000);
    }, []);

    const trpc = useTRPC();
    const trpcClient = useTRPCClient();

    const queryClient = useQueryClient();

    const validationSchema = useMemo(
      () =>
        z.object({
          nameservers: z
            .array(
              z
                .string()
                .transform((val) => val.replace(/\.$/, '').trim())
                .pipe(namefiNormalizedDomainSchema)
                .transform((val) => `${val}.`)
                .pipe(punycodeFqdnSchema)
                .transform(toPunycodeFqdn),
            )
            .min(2)
            .max(4),
        }),
      [],
    );

    const form = useForm<DomainNameserversFormData>({
      defaultValues: {
        nameservers,
      },
      resolver: zodResolver(validationSchema),
      mode: 'all',
      reValidateMode: 'onChange',
    });

    const {
      control,
      handleSubmit,
      watch,
      formState: { isSubmitting, isValid },
      setValue: setFieldValue,
      trigger,
    } = form;

    const onSubmit: SubmitHandler<DomainNameserversFormData> = async (
      values,
    ) => {
      try {
        if (domainName) {
          await trpcClient.domainConfig.changeDomainNameservers.mutate({
            domainName,
            nameservers: values.nameservers,
          });
          toast.success('Nameservers Updated Successfully');
        }
      } catch (error: any) {
        const message = error?.response?.data?.message?.replaceAll(
          /\\(x?\d+)/g,
          (_: string, captureGroup: string) => {
            return String.fromCharCode(Number.parseInt(captureGroup, 8));
          },
        );
        toast.error(
          message.split('\n').map((s: string) => (
            <>
              {s}
              <br key={s} />
            </>
          )) ?? 'Failed to update Nameservers',
        );
      }

      await queryClient.invalidateQueries({
        queryKey: [
          trpc.domainConfig.getDomainDetails.queryKey({ domainName }),
          trpc.domainConfig.getDomainSupportedFeatures.queryKey({
            normalizedDomainName: domainName,
          }),
        ],
      });
    };

    const values = watch();

    const shouldReduceMotion = useReducedMotion();

    const handleUpdateNameserver = useCallback(
      (index: number, value: string) => {
        setFieldValue(`nameservers.${index}`, value as any);
        trigger(`nameservers.${index}`);
      },
      [setFieldValue, trigger],
    );

    const handleAddNameserver = useCallback(() => {
      setFieldValue('nameservers', [...values.nameservers, '' as any]);
      trigger('nameservers');
    }, [values.nameservers, setFieldValue, trigger]);

    const handleRemoveNameserver = useCallback(
      (index: number) => {
        const newNameservers = [...values.nameservers];
        newNameservers.splice(index, 1);
        setFieldValue('nameservers', newNameservers);
        trigger('nameservers');
      },
      [values.nameservers, setFieldValue, trigger],
    );
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

    const areChanged = useMemo(() => {
      return !arrayEquals(values.nameservers, nameservers);
    }, [values.nameservers, nameservers]);

    return (
      <Form {...form}>
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
            <AnimatePresence mode="sync" presenceAffectsLayout={true}>
              {values.nameservers.map((_, index) => (
                <motion.div
                  {...(shouldReduceMotion
                    ? {}
                    : {
                        exit: { x: '-100vw', opacity: 0 },
                        animate: { x: 0, y: 0, opacity: 1 },
                        initial: { x: '100vw', opacity: 0 },
                        transition: { duration: 0.5, ease: 'easeInOut' },
                      })}
                  key={`nameserver-motion-${index}`}
                >
                  <FormField
                    control={control}
                    name={`nameservers.${index}`}
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel className="text-sm text-zinc-400">
                          Nameserver {index + 1}{' '}
                          {index < 2 && <span className="text-red-500">*</span>}
                        </FormLabel>
                        <div className="flex items-center gap-2">
                          <FormControl>
                            <Input
                              value={field.value}
                              onChange={(e) =>
                                handleUpdateNameserver(index, e.target.value)
                              }
                              className="bg-zinc-950 border-zinc-800"
                              placeholder="e.g., ns1.example.com"
                            />
                          </FormControl>
                          {values.nameservers.length > 2 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveNameserver(index)}
                              className="text-zinc-400 hover:text-red-500"
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                        <FormMessage className="text-xs text-red-500" />
                      </FormItem>
                    )}
                  />
                </motion.div>
              ))}

              <div className="flex items-center gap-2 justify-between">
                {values.nameservers.length < 4 && (
                  <Button
                    variant="outline"
                    onClick={handleAddNameserver}
                    className="w-auto py-1.25 px-5 "
                  >
                    Add nameserver
                  </Button>
                )}
                <Button
                  className={cn(
                    'w-auto py-1.25 px-5 ',
                    isSubmitting || !isValid || !areChanged
                      ? 'opacity-50 cursor-not-allowed'
                      : '',
                  )}
                  onClick={handleSubmit(onSubmit)}
                  disabled={isSubmitting || !isValid || !areChanged}
                  variant={'default'}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <SaveIcon width={20} height={20} /> Save Changes
                    </>
                  )}
                </Button>
              </div>
            </AnimatePresence>

            <div className="text-sm text-zinc-500 mt-4">
              <p>
                Changes to nameservers can take 24-48 hours to propagate
                globally.
              </p>
            </div>
          </CardContent>
        </Card>
      </Form>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.domainName === nextProps.domainName &&
      arrayEquals(prevProps.nameservers, nextProps.nameservers)
    );
  },
);

function arrayEquals(a: Nameserver[], b: Nameserver[]) {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

export const NameserversPanel = ({
  domainName,
}: { domainName: PunycodeDomainName }) => {
  const trpc = useTRPC();
  const { data, isLoading } = useQuery(
    trpc.domainConfig.getDomainDetails.queryOptions({ domainName }),
  );
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }
  return (
    <NameserversPanelInner
      domainName={domainName}
      nameservers={data?.nameservers ?? []}
    />
  );
};
