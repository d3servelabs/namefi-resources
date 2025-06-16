'use client';

import { LoadingButton } from '@/components/buttons/LoadingButton';
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
import { Skeleton } from '@/components/ui/shadcn/skeleton';
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
import {
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query';
import { Info, RotateCw, SaveIcon } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useCallback, useMemo, useState } from 'react';
import React from 'react';
import { type SubmitHandler, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Nameservers Management
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
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
};

export type DomainNameserversFormProps = {
  domainName: PunycodeDomainName;
  nameservers: Nameserver[];
};
export type DomainNameserversFormData = {
  nameservers: Nameserver[];
};

const NameserversPanelForm = React.memo(
  function NameserversPanelForm({
    domainName,
    nameservers,
  }: DomainNameserversFormProps) {
    const trpc = useTRPC();

    const trpcClient = useTRPCClient();

    const queryClient = useQueryClient();
    const { data: domainDnssecDetails, isLoading: isDnssecLoading } = useQuery(
      trpc.domainConfig.dnssec.getDomainDnssecDetails.queryOptions({
        domainName,
      }),
    );

    const [isLoading, setIsLoading] = useState(false);

    const handleResetToNamefi = useCallback(() => {
      setIsLoading(true);

      // Simulate API call
      setTimeout(() => {
        setIsLoading(false);

        toast('Nameservers reset', {
          description: 'Your nameservers have been reset to Namefi defaults.',
        });
      }, 1000);
    }, []);

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
          trpc.domainConfig.dnssec.getDomainDnssecDetails.queryKey({
            domainName,
          }),
        ],
      });
    };

    const values = watch();

    const shouldReduceMotion = useReducedMotion();

    const handleUpdateNameserver = useCallback(
      (index: number, value: string) => {
        setFieldValue(`nameservers.${index}`, value as any);
        trigger('nameservers');
      },
      [setFieldValue, trigger],
    );

    const handleAddNameserver = useCallback(() => {
      setFieldValue('nameservers', [...values.nameservers, '' as any]);
    }, [values, setFieldValue]);

    const handleRemoveNameserver = useCallback(
      (index: number) => {
        const newNameservers = [...values.nameservers];
        newNameservers.splice(index, 1);
        setFieldValue('nameservers', newNameservers);
      },
      [values, setFieldValue],
    );

    const resetButton = useMemo(() => {
      if (isDnssecLoading) {
        return <Skeleton className="h-6 w-24" />;
      }
      if (!domainDnssecDetails) {
        return null;
      }

      if (domainDnssecDetails.isUsingNamefiNameservers) {
        return null;
      }

      return (
        <Button
          variant="outline"
          className="bg-brand-primary-950/20 text-brand-primary-500 hover:text-brand-primary-400 hover:bg-brand-primary-950/30 border-brand-primary-800/50"
          onClick={handleResetToNamefi}
          disabled={isLoading}
        >
          {isLoading ? (
            <RotateCw className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RotateCw className="mr-2 h-4 w-4" />
          )}
          Reset to Namefi Nameservers
        </Button>
      );
    }, [handleResetToNamefi, isLoading, domainDnssecDetails, isDnssecLoading]);

    const areChanged = useMemo(() => {
      return !arrayEquals(values.nameservers, nameservers);
    }, [values, nameservers]);

    const cancelChanges = useCallback(() => {
      setFieldValue('nameservers', nameservers);
    }, [nameservers, setFieldValue]);

    return (
      <Form {...form}>
        <div className="flex flex-col gap-2">
          {resetButton}
          <AnimatePresence mode="sync" presenceAffectsLayout={true}>
            {values.nameservers.map((_, index) => (
              <motion.div
                {...(shouldReduceMotion
                  ? {}
                  : {
                      exit: { scaleY: 0, opacity: 0.2, top: '10%' },
                      animate: { scaleY: 1, opacity: 1, top: '0%' },
                      initial: { scaleY: 0, opacity: 0.2, top: '-10%' },
                      transition: {
                        duration: 0.5,
                        ease: 'easeInOut',
                        transformOrigin: 'top',
                      },
                    })}
                style={{
                  transformOrigin: 'top',
                }}
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

            <div className="flex items-center gap-2 justify-between mt-4">
              {values.nameservers.length < 4 && (
                <Button
                  variant="outline"
                  onClick={handleAddNameserver}
                  className="w-auto py-1.25 px-5 "
                >
                  Add nameserver
                </Button>
              )}
              <div className="flex items-center gap-2">
                {areChanged ? (
                  <Button variant="destructive" onClick={cancelChanges}>
                    Cancel
                  </Button>
                ) : (
                  false
                )}
                <LoadingButton
                  isLoading={isSubmitting}
                  loadingText="Saving..."
                  className={cn('w-auto py-1.25 px-5')}
                  onClick={handleSubmit(onSubmit)}
                  disabled={isSubmitting || !isValid || !areChanged}
                  variant={'default'}
                >
                  <SaveIcon width={20} height={20} /> Save Changes
                </LoadingButton>
              </div>
            </div>
          </AnimatePresence>

          <div className="text-sm text-zinc-500 mt-4">
            <p>
              Changes to nameservers can take 24-48 hours to propagate globally.
            </p>
          </div>
        </div>
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

export const NameserversPanelInner = ({
  domainName,
}: { domainName: PunycodeDomainName }) => {
  const trpc = useTRPC();

  const { data, isLoading } = useQuery(
    trpc.domainConfig.getDomainDetails.queryOptions({ domainName }),
  );
  if (isLoading) {
    return (
      <Layout>
        <div className="flex flex-col gap-2 items-start">
          <div className="flex flex-col items-start gap-1 w-full">
            <Skeleton className="h-3 w-48" />
            <div className="flex items-center gap-2 w-full">
              <Skeleton className="h-8 w-11/12" />
              <Skeleton className="h-8 w-1/12" />
            </div>
          </div>
          <div className="flex flex-col items-start gap-1 w-full">
            <Skeleton className="h-3 w-48" />
            <div className="flex items-center gap-2 w-full">
              <Skeleton className="h-8 w-11/12" />
              <Skeleton className="h-8 w-1/12" />
            </div>
          </div>

          <div className="flex items-center gap-2 justify-between w-full mt-4">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-32" />
          </div>
          <Skeleton className="h-4 w-96 mt-4" />
        </div>
      </Layout>
    );
  }
  return (
    <Layout>
      <NameserversPanelForm
        domainName={domainName}
        nameservers={data?.nameservers ?? []}
      />
    </Layout>
  );
};

export const NameserversPanel = ({
  domainName,
}: { domainName: PunycodeDomainName }) => {
  const trpc = useTRPC();
  const {
    data: { features: domainSupportedFeatures },
  } = useSuspenseQuery(
    trpc.domainConfig.getDomainSupportedFeatures.queryOptions(
      {
        normalizedDomainName: domainName,
      },
      {
        refetchInterval: 10000,
      },
    ),
  );
  const nameserversManagement = useMemo(() => {
    return (
      domainSupportedFeatures.nameserversManagement ?? {
        enabled: false,
        config: {
          showPanel: false,
          message: 'Coming Soon ...',
        },
      }
    );
  }, [domainSupportedFeatures]);
  if (!nameserversManagement.config.showPanel) {
    return false;
  }
  if (nameserversManagement.enabled) {
    return <NameserversPanelInner domainName={domainName} />;
  }
  if (nameserversManagement.config.message) {
    return (
      <Layout>
        <div
          className="text-center py-12"
          // biome-ignore lint/security/noDangerouslySetInnerHtml:
          dangerouslySetInnerHTML={{
            __html: nameserversManagement.config.message,
          }}
        />
      </Layout>
    );
  }
  return false;
};
