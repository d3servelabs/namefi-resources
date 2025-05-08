import { MultipleLinesArrayErrorMessage } from '@/components/MultipleLinesArrayErrorMessage';
import { Button } from '@/components/ui/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/shadcn/dialog';
import { useTRPC } from '@/utils/trpc';
import type { DnsRecordSelect } from '@namefi-astra/db';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import type { RecordType } from '@namefi-astra/zod-dns';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { TRPCClientError } from '@trpc/client';
import { CircleCheck, CircleX, Loader2, Plus } from 'lucide-react';
import {
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
import { DnsRecordForm } from './DnsRecordForm';

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

  const queryClient = useQueryClient();

  const handleSubmit = useCallback(async () => {
    const allFormsValid = forms.every((form) => form.isValid);

    if (!allFormsValid) {
      setFormErrors(true);
      return;
    }

    try {
      if (mode === 'edit') {
        if (!records || records.length === 0) {
          return;
        }
        // Convert forms back to DnsRecord format
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
      } else if (mode === 'add') {
        const newRecords = forms.map((form) => {
          return formValuesToDnsRecord(form.values);
        });
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
      }

      await queryClient.invalidateQueries({
        queryKey: trpc.dnsRecords.getRecords.queryKey({ zoneName }),
      });

      onOpenChange?.(false);
    } catch (error) {
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
          } else if (
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
          } else {
            toast.error('Undetermined Error, please contact support', {
              duration: 10_000,
              dismissible: true,
              icon: <CircleX className="h-4 w-4" />,
              richColors: true,
            });
          }
        } else {
          toast.error(error.message);
        }
      }
    } finally {
      onSubmitSettled?.();
    }
  }, [
    zoneName,
    updateRecords,
    createRecords,
    onSubmitSettled,
    forms,
    mode,
    records,
    queryClient,
    onOpenChange,
    trpc.dnsRecords.getRecords.queryKey,
  ]);

  const handleValues = useCallback(
    (index: number) => (values: DnsRecordFormValues, isValid: boolean) => {
      updateFormValues(index, values, isValid);
    },
    [updateFormValues],
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {children ? (
        <DialogTrigger asChild={true}>{children}</DialogTrigger>
      ) : (
        false
      )}
      <DialogContent className="sm:max-w-[900px] bg-zinc-950 border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {mode === 'add' ? 'Add DNS Record' : 'Edit DNS Record'}
          </DialogTitle>
        </DialogHeader>

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
              />
            </div>
          ))}
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between gap-2">
          {mode === 'add' && (
            <Button
              variant="secondary"
              className="p-0"
              onClick={addMoreRecord}
              type="button"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add more record
            </Button>
          )}
          <div className="flex gap-2">
            <Button
              variant="destructive"
              onClick={() => {
                onCancelClicked?.();
                onOpenChange?.(false);
              }}
              type="button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              type="button"
              disabled={
                forms.length === 0 ||
                createRecords.isPending ||
                updateRecords.isPending
              }
            >
              {createRecords.isPending || updateRecords.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              {mode === 'add' ? 'Add' : 'Save'} record
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
