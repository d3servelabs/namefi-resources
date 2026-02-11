import { MultipleLinesArrayErrorMessage } from '@/components/multiple-lines-array-error-message';
import { Button } from '@/components/ui/shadcn/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/shadcn/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/shadcn/dialog';
import { useTRPC } from '@/lib/trpc';
import type { DnsRecordSelect } from '@namefi-astra/db';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';
import type { RecordType } from '@namefi-astra/zod-dns';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { TRPCClientError } from '@trpc/client';
import { CircleCheck, CircleX, Loader2, Plus } from 'lucide-react';
import {
  type ReactElement,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { toast } from 'sonner';
import {
  type DnsRecordFormValues,
  dnsRecordToFormValues,
  formValuesToDnsRecord,
} from '../schemas';
import { DnsRecordForm } from './dns-record-form';
import { useFeedback } from '@/components/providers/feedback';
import { feedbackTriggerSchema } from '@/lib/feedback-triggers';

const PARKING_CONFLICT_ERROR_CODE = 'DNS_PARKING_CONFLICT';
const CNAME_CONFLICT_ERROR_CODE = 'DNS_CNAME_CONFLICT';
const CNAME_MANAGED_CONFLICT_ERROR_CODE = 'DNS_CNAME_MANAGED_CONFLICT';

export type AddEditRecordsDialogProps = {
  records?: DnsRecordSelect[];
  mode: 'add' | 'edit';
  isOpen: boolean;
  preselectedType?: RecordType;
  zoneName: NamefiNormalizedDomain;
  onCancelClicked?: () => void;
  onSubmitSettled?: () => void;
  children?: ReactNode;
  onOpenChange?: (open: boolean) => void;
  readOnly?: boolean;
  warningMessage?: string;
};

export function AddEditRecordsDialog({
  records,
  mode,
  isOpen,
  preselectedType,
  zoneName,
  onCancelClicked,
  onSubmitSettled,
  children,
  onOpenChange,
  readOnly,
  warningMessage,
}: AddEditRecordsDialogProps) {
  // Memoize the default form values
  const defaultFormValues = useMemo(
    () => ({
      type: preselectedType || 'A',
      name: '',
      domain: zoneName,
      rdata: '',
      ttl: 60,
    }),
    [preselectedType, zoneName],
  );

  const [forms, setForms] = useState<
    Array<{ values: DnsRecordFormValues; isValid: boolean }>
  >([]);
  const [formErrors, setFormErrors] = useState<boolean>(false);
  const [pendingParkingConflictRecords, setPendingParkingConflictRecords] =
    useState<ReturnType<typeof formValuesToDnsRecord>[] | null>(null);
  const [
    pendingManagedCnameConflictRecords,
    setPendingManagedCnameConflictRecords,
  ] = useState<ReturnType<typeof formValuesToDnsRecord>[] | null>(null);
  const [isCnameConflictDialogOpen, setIsCnameConflictDialogOpen] =
    useState(false);

  // Initialize forms when dialog opens
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && records && records.length > 0) {
        // For edit mode, populate with existing records
        const initialForms = records.map((record) => ({
          values: dnsRecordToFormValues(record),
          isValid: true,
        }));
        setForms(initialForms);
      } else {
        // For add mode, start with one empty form
        setForms([{ values: defaultFormValues, isValid: false }]);
      }
      setFormErrors(false);
      setPendingParkingConflictRecords(null);
      setPendingManagedCnameConflictRecords(null);
      setIsCnameConflictDialogOpen(false);
    } else {
      setPendingParkingConflictRecords(null);
      setPendingManagedCnameConflictRecords(null);
      setIsCnameConflictDialogOpen(false);
    }
  }, [isOpen, mode, records, defaultFormValues]);

  // Memoize the addMoreRecord function
  const addMoreRecord = useCallback(() => {
    setForms((prevForms) => [
      ...prevForms,
      {
        values: defaultFormValues,
        isValid: false,
      },
    ]);
  }, [defaultFormValues]);

  // Memoize the removeRecord function
  const removeRecord = useCallback(
    (index: number) => {
      if (forms.length === 1) {
        return;
      }
      setForms((prevForms) => prevForms.filter((_, i) => i !== index));
    },
    [forms.length],
  );

  // Memoize the updateFormValues function
  const updateFormValues = useCallback(
    (index: number, values: DnsRecordFormValues, isValid: boolean) => {
      setForms((prevForms) => {
        if (
          JSON.stringify(prevForms[index]) ===
          JSON.stringify({ values, isValid })
        ) {
          return prevForms;
        }

        const newForms = [...prevForms];
        newForms[index] = { values, isValid };
        return newForms;
      });
    },
    [],
  );

  const trpc = useTRPC();

  const createRecords = useMutation(
    trpc.dnsRecords.createRecords.mutationOptions(),
  );

  const updateRecords = useMutation(
    trpc.dnsRecords.updateRecords.mutationOptions(),
  );
  const updateDomainPreferencesAndConfig = useMutation(
    trpc.domainConfig.updateDomainPreferencesAndConfig.mutationOptions(),
  );

  const queryClient = useQueryClient();
  const { data: domainPreferencesAndConfig } = useQuery(
    trpc.domainConfig.getDomainPreferencesAndConfig.queryOptions(
      {
        domainName: zoneName,
      },
      {
        enabled:
          pendingParkingConflictRecords !== null ||
          pendingManagedCnameConflictRecords !== null,
      },
    ),
  );
  const { requestFeedback } = useFeedback();
  const isForwardingEnabled = Boolean(
    domainPreferencesAndConfig?.forwardTo?.trim(),
  );

  const invalidateDnsRecordsQuery = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: trpc.dnsRecords.getRecords.queryKey({ zoneName }),
    });
  }, [queryClient, trpc.dnsRecords.getRecords.queryKey, zoneName]);

  const submitAddRecords = useCallback(
    async (newRecords: ReturnType<typeof formValuesToDnsRecord>[]) => {
      await createRecords.mutateAsync({
        zoneName,
        records: newRecords,
      });

      toast.success(
        `${newRecords.length} ${
          newRecords.length === 1 ? 'Record' : 'Records'
        } saved successfully`,
        {
          duration: 10_000,
          dismissible: true,
          icon: <CircleCheck className="h-4 w-4" />,
          richColors: true,
        },
      );

      await invalidateDnsRecordsQuery();
      requestFeedback(feedbackTriggerSchema.enum.MILESTONE_DNS_UPDATED);
      onOpenChange?.(false);
    },
    [
      createRecords,
      zoneName,
      invalidateDnsRecordsQuery,
      onOpenChange,
      requestFeedback,
    ],
  );

  const handleError = useCallback((error: unknown) => {
    if (error instanceof TRPCClientError) {
      const zodFlattenedError = error.data?.zodError;
      if (zodFlattenedError) {
        if (
          zodFlattenedError.formErrors &&
          zodFlattenedError.formErrors.length > 0
        ) {
          toast.error(
            <MultipleLinesArrayErrorMessage
              lines={zodFlattenedError.formErrors}
            />,
            {
              duration: 10_000,
              dismissible: true,
              icon: <CircleX className="h-4 w-4" />,
              richColors: true,
            },
          );
          return;
        }
        if (
          zodFlattenedError.fieldErrors?.records &&
          zodFlattenedError.fieldErrors.records.length > 0
        ) {
          toast.error(
            <MultipleLinesArrayErrorMessage
              lines={zodFlattenedError.fieldErrors.records.map(
                (e: string, i: number) => `Record ${i + 1}: ${e}`,
              )}
            />,
            {
              duration: 10_000,
              dismissible: true,
              icon: <CircleX className="h-4 w-4" />,
              richColors: true,
            },
          );
          return;
        }

        toast.error('Undetermined Error, please contact support', {
          duration: 10_000,
          dismissible: true,
          icon: <CircleX className="h-4 w-4" />,
          richColors: true,
        });
        return;
      }

      toast.error(error.message);
      return;
    }

    toast.error('Something went wrong. Please try again.');
  }, []);

  const isParkingConflictError = useCallback((error: unknown) => {
    return (
      error instanceof TRPCClientError &&
      error.message.includes(PARKING_CONFLICT_ERROR_CODE)
    );
  }, []);

  const isCnameConflictError = useCallback((error: unknown) => {
    return (
      error instanceof TRPCClientError &&
      error.message.includes(CNAME_CONFLICT_ERROR_CODE)
    );
  }, []);

  const isManagedCnameConflictError = useCallback((error: unknown) => {
    return (
      error instanceof TRPCClientError &&
      error.message.includes(CNAME_MANAGED_CONFLICT_ERROR_CODE)
    );
  }, []);

  const handleSubmit = useCallback(async () => {
    const allFormsValid = forms.every((form) => form.isValid);

    if (!allFormsValid) {
      setFormErrors(true);
      return;
    }

    const newRecords = forms.map((form) => formValuesToDnsRecord(form.values));

    try {
      if (mode === 'edit') {
        if (!records || records.length === 0) {
          return;
        }
        const updatedRecords = forms.map((form, index) => {
          const originalRecord = records[index];
          return {
            ...originalRecord,
            ...formValuesToDnsRecord(form.values, originalRecord),
          };
        });

        await updateRecords.mutateAsync({
          zoneName,
          records: updatedRecords,
        });

        toast.success(
          `${updatedRecords.length} ${
            updatedRecords.length === 1 ? 'Record' : 'Records'
          } updated successfully`,
          {
            duration: 10_000,
            dismissible: true,
            icon: <CircleCheck className="h-4 w-4" />,
            richColors: true,
          },
        );

        await invalidateDnsRecordsQuery();
        requestFeedback(feedbackTriggerSchema.enum.MILESTONE_DNS_UPDATED);
        onOpenChange?.(false);
        return;
      }

      await submitAddRecords(newRecords);
    } catch (error) {
      if (mode === 'add' && isManagedCnameConflictError(error)) {
        setPendingManagedCnameConflictRecords(newRecords);
        return;
      }
      if (mode === 'add' && isCnameConflictError(error)) {
        setIsCnameConflictDialogOpen(true);
        return;
      }
      if (mode === 'add' && isParkingConflictError(error)) {
        setPendingParkingConflictRecords(newRecords);
        return;
      }
      handleError(error);
    } finally {
      onSubmitSettled?.();
    }
  }, [
    forms,
    mode,
    records,
    zoneName,
    updateRecords,
    invalidateDnsRecordsQuery,
    requestFeedback,
    onOpenChange,
    submitAddRecords,
    isManagedCnameConflictError,
    isCnameConflictError,
    isParkingConflictError,
    handleError,
    onSubmitSettled,
  ]);

  const handleDisableParkingAndContinue = useCallback(async () => {
    if (!pendingParkingConflictRecords) {
      return;
    }

    try {
      await updateDomainPreferencesAndConfig.mutateAsync({
        domainName: zoneName,
        domainPreferencesAndConfig: {
          autoParkEnabled: false,
          forwardTo: '',
        },
      });

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: trpc.dnsRecords.getRecords.queryKey({
            zoneName,
          }),
        }),
        queryClient.invalidateQueries({
          queryKey: trpc.domainConfig.getDomainPreferencesAndConfig.queryKey({
            domainName: zoneName,
          }),
        }),
        queryClient.invalidateQueries({
          queryKey: trpc.users.getCurrentUserDomains.queryKey(),
        }),
      ]);

      await submitAddRecords(pendingParkingConflictRecords);
      setPendingParkingConflictRecords(null);
    } catch (error) {
      handleError(error);
    } finally {
      onSubmitSettled?.();
    }
  }, [
    pendingParkingConflictRecords,
    updateDomainPreferencesAndConfig,
    queryClient,
    trpc.dnsRecords.getRecords.queryKey,
    zoneName,
    trpc.domainConfig.getDomainPreferencesAndConfig.queryKey,
    trpc.users.getCurrentUserDomains.queryKey,
    submitAddRecords,
    handleError,
    onSubmitSettled,
  ]);

  const handleDisableManagedRecordsAndContinue = useCallback(async () => {
    if (!pendingManagedCnameConflictRecords) {
      return;
    }

    try {
      await updateDomainPreferencesAndConfig.mutateAsync({
        domainName: zoneName,
        domainPreferencesAndConfig: {
          autoParkEnabled: false,
          autoEnsEnabled: false,
          forwardTo: '',
        },
      });

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: trpc.dnsRecords.getRecords.queryKey({
            zoneName,
          }),
        }),
        queryClient.invalidateQueries({
          queryKey: trpc.domainConfig.getDomainPreferencesAndConfig.queryKey({
            domainName: zoneName,
          }),
        }),
        queryClient.invalidateQueries({
          queryKey: trpc.users.getCurrentUserDomains.queryKey(),
        }),
      ]);

      await submitAddRecords(pendingManagedCnameConflictRecords);
      setPendingManagedCnameConflictRecords(null);
    } catch (error) {
      handleError(error);
    } finally {
      onSubmitSettled?.();
    }
  }, [
    pendingManagedCnameConflictRecords,
    updateDomainPreferencesAndConfig,
    queryClient,
    trpc.dnsRecords.getRecords.queryKey,
    zoneName,
    trpc.domainConfig.getDomainPreferencesAndConfig.queryKey,
    trpc.users.getCurrentUserDomains.queryKey,
    submitAddRecords,
    handleError,
    onSubmitSettled,
  ]);

  const handleValues = useCallback(
    (index: number) => (values: DnsRecordFormValues, isValid: boolean) => {
      updateFormValues(index, values, isValid);
    },
    [updateFormValues],
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {children ? <DialogTrigger render={children as ReactElement} /> : false}
      <DialogContent className="sm:max-w-[900px] bg-zinc-950 border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {mode === 'add' ? 'Add DNS Record' : 'Edit DNS Record'}
          </DialogTitle>
        </DialogHeader>

        {warningMessage && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 p-4 rounded-md text-sm mb-4">
            {warningMessage}
          </div>
        )}

        {formErrors && (
          <div className="text-red-500 text-sm mb-4">
            Please complete all required fields marked with *
          </div>
        )}

        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
          {forms.map((form, index) => (
            <div key={index} className="mb-6">
              {index > 0 && <div className="border-t border-zinc-800 my-4" />}
              <DnsRecordForm
                defaultValues={form.values}
                onRemove={
                  forms.length > 1 ? () => removeRecord(index) : undefined
                }
                showRemoveButton={forms.length > 1}
                onValuesChange={handleValues(index)}
                index={index}
                disabled={readOnly}
              />
            </div>
          ))}
        </div>

        {mode === 'add' && !readOnly && (
          <Button
            variant="ghost"
            onClick={addMoreRecord}
            type="button"
            className="w-full h-11 border border-dashed border-zinc-700 text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add more record
          </Button>
        )}

        <DialogFooter className="flex items-center justify-end gap-2">
          <div className="flex gap-2">
            <Button
              variant="destructive"
              onClick={() => {
                onCancelClicked?.();
                onOpenChange?.(false);
              }}
              type="button"
            >
              {readOnly ? 'Close' : 'Cancel'}
            </Button>
            {!readOnly && (
              <Button
                onClick={handleSubmit}
                type="button"
                disabled={
                  forms.length === 0 ||
                  createRecords.isPending ||
                  updateRecords.isPending ||
                  updateDomainPreferencesAndConfig.isPending
                }
              >
                {createRecords.isPending ||
                updateRecords.isPending ||
                updateDomainPreferencesAndConfig.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                {mode === 'add' ? 'Add' : 'Save'} record
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>

      <AlertDialog
        open={isCnameConflictDialogOpen}
        onOpenChange={setIsCnameConflictDialogOpen}
      >
        <AlertDialogContent className="bg-zinc-950 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle>
              CNAME conflicts with other records
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 text-zinc-400">
              <p>
                CNAME records cannot share the same name with other record
                types.
              </p>
              <p>
                Delete the conflicting records first, then add this CNAME again.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => setIsCnameConflictDialogOpen(false)}
            >
              Understood
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={pendingManagedCnameConflictRecords !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingManagedCnameConflictRecords(null);
          }
        }}
      >
        <AlertDialogContent className="bg-zinc-950 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Disable managed records and continue?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 text-zinc-400">
              <p>
                This CNAME conflicts only with managed records on this domain.
              </p>
              <p>
                Continue to disable Parking
                {isForwardingEnabled ? ', Forwarding,' : ''} and AutoENS, then
                add this CNAME.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={updateDomainPreferencesAndConfig.isPending}
              onClick={() => setPendingManagedCnameConflictRecords(null)}
            >
              Keep managed records
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={updateDomainPreferencesAndConfig.isPending}
              onClick={(event) => {
                event.preventDefault();
                void handleDisableManagedRecordsAndContinue();
              }}
            >
              {updateDomainPreferencesAndConfig.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Disabling...
                </>
              ) : (
                'Disable and continue'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={pendingParkingConflictRecords !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingParkingConflictRecords(null);
          }
        }}
      >
        <AlertDialogContent className="bg-zinc-950 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle>Disable parking and continue?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 text-zinc-400">
              <p>
                This record conflicts with managed parking records. To continue,
                parking must be disabled first.
              </p>
              {isForwardingEnabled && (
                <p className="text-amber-500">
                  Disabling parking here also disables forwarding.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={updateDomainPreferencesAndConfig.isPending}
              onClick={() => setPendingParkingConflictRecords(null)}
            >
              Keep parking enabled
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={updateDomainPreferencesAndConfig.isPending}
              onClick={(event) => {
                event.preventDefault();
                void handleDisableParkingAndContinue();
              }}
            >
              {updateDomainPreferencesAndConfig.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Disabling...
                </>
              ) : (
                'Disable and continue'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
