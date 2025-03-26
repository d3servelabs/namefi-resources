'use client';

import { Button } from '@/components/ui/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/shadcn/dialog';
import { Plus } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { DnsRecordForm } from '../DnsRecordForm';
import {
  type DnsRecordFormValues,
  dnsRecordToFormValues,
  formValuesToDnsRecord,
} from '../schemas';
import { useDialogStore } from '../stores/dialog';

const DEFAULT_DOMAIN = '.example.com';

export function RecordDialog() {
  const { recordFormDialog, closeRecordFormDialog } = useDialogStore();
  const { isOpen, mode, records, preselectedType } = recordFormDialog;

  const [forms, setForms] = useState<
    Array<{ values: DnsRecordFormValues; isValid: boolean }>
  >([]);
  const [formErrors, setFormErrors] = useState<boolean>(false);

  // Initialize forms when dialog opens
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && records.length > 0) {
        // For edit mode, populate with existing records
        const initialForms = records.map((record) => ({
          values: dnsRecordToFormValues(record),
          isValid: true,
        }));
        setForms(initialForms);
      } else {
        // For add mode, start with one empty form
        const defaultValues: DnsRecordFormValues = {
          type: preselectedType || 'A',
          name: '',
          domain: DEFAULT_DOMAIN,
          rdata: '',
          ttl: 3600,
        };
        setForms([{ values: defaultValues, isValid: false }]);
      }
      setFormErrors(false);
    }
  }, [isOpen, mode, records, preselectedType]);

  // Memoize the default form values
  const defaultFormValues = useMemo(
    () => ({
      type: preselectedType || 'A',
      name: '',
      domain: DEFAULT_DOMAIN,
      rdata: '',
      ttl: 3600,
    }),
    [preselectedType],
  );

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

        // console.log('CHANGED!!!');

        const newForms = [...prevForms];
        newForms[index] = { values, isValid };
        return newForms;
      });
    },
    [],
  );

  const handleCancel = useCallback(() => {
    closeRecordFormDialog('cancel', {
      success: false,
      originalRecords: records,
      updatedRecords: [],
      message: `${mode === 'add' ? 'Add' : 'Edit'} operation cancelled`,
    });
  }, [closeRecordFormDialog, records, mode]);

  // Memoize the handleSubmit function
  const handleSubmit = useCallback(() => {
    // Check if all forms are valid
    console.log('>>> forms', forms);

    const allFormsValid = forms.every((form) => form.isValid);

    if (!allFormsValid) {
      setFormErrors(true);
      return;
    }

    // Convert forms back to DnsRecord format
    const processedRecords = forms.map((form, index) => {
      const originalRecord =
        index < records.length ? records[index] : undefined;
      return formValuesToDnsRecord(form.values, originalRecord);
    });

    closeRecordFormDialog(mode === 'add' ? 'add' : 'save', {
      success: true,
      originalRecords: records,
      updatedRecords: processedRecords,
      message: `Successfully ${mode === 'add' ? 'added' : 'saved'} ${processedRecords.length} record(s)`,
    });
  }, [forms, records, mode, closeRecordFormDialog]);

  // Memoize the dialog title
  const dialogTitle = useMemo(
    () => (
      <DialogTitle className="text-xl">
        {mode === 'add' ? 'Add DNS Record' : 'Edit DNS Record'}
      </DialogTitle>
    ),
    [mode],
  );

  // Memoize the error message
  const errorMessage = useMemo(
    () =>
      formErrors && (
        <div className="text-red-500 text-sm mb-4">
          Please complete all required fields marked with *
        </div>
      ),
    [formErrors],
  );

  // Memoize the footer buttons
  const footerButtons = useMemo(
    () => (
      <>
        <Button
          variant="link"
          className="text-emerald-500 hover:text-emerald-400 p-0"
          onClick={addMoreRecord}
          type="button"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add more record
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={handleCancel} type="button">
            Cancel
          </Button>
          <Button
            className="bg-emerald-500 hover:bg-emerald-600 text-white"
            onClick={handleSubmit}
            type="button"
            disabled={forms.length === 0}
          >
            {mode === 'add' ? 'Add' : 'Save'} record
          </Button>
        </div>
      </>
    ),
    [addMoreRecord, handleCancel, handleSubmit, forms.length, mode],
  );

  const handleValues = useCallback(
    (index: number) => (values: DnsRecordFormValues, isValid: boolean) =>
      updateFormValues(index, values, isValid),
    [updateFormValues],
  );

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          handleCancel();
        }
      }}
    >
      <DialogContent className="sm:max-w-[600px] bg-zinc-950 border-zinc-800">
        <DialogHeader>{dialogTitle}</DialogHeader>

        {errorMessage}

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
          {footerButtons}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
