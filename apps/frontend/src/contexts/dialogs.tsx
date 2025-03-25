'use client';

import { Button } from '@/components/ui/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/shadcn/dialog';
import { Input } from '@/components/ui/shadcn/input';
import { Label } from '@/components/ui/shadcn/label';
import { Loader2 } from 'lucide-react';
import type React from 'react';
import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';

export type DialogType = 'alert' | 'confirm' | 'prompt' | 'custom';

export type FormField = {
  id: string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  placeholder?: string;
  defaultValue?: string;
  required?: boolean;
  validation?: (value: string) => string | null;
};

export type DialogOptions = {
  type: DialogType;
  id?: string;
  title?: string;
  description?: string;
  content?: ReactNode;
  actions?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  defaultValue?: string;
  fields?: FormField[];
  isLoading?: boolean;
  preventClose?: boolean;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  onSubmit?: (value: string | Record<string, string>) => void | Promise<void>;
  onClose?: () => void;
};

type DialogState = {
  id: string;
  isOpen: boolean;
  values: Record<string, string>;
  errors: Record<string, string | null>;
  isSubmitting: boolean;
} & DialogOptions;

type DialogContextType = {
  open: (options: DialogOptions) => string;
  close: (id?: string) => void;
  update: (id: string, options: Partial<DialogState>) => void;
  closeAll: () => void;
  dialogs: DialogState[];
};

const DialogContext = createContext<DialogContextType>({
  open: () => '',
  close: () => {},
  update: () => {},
  closeAll: () => {},
  dialogs: [],
});

export const DialogsProvider = ({ children }: { children: ReactNode }) => {
  const id = useRef(0);

  const [dialogs, setDialogs] = useState<DialogState[]>([]);

  const generateId = useCallback(() => {
    id.current += 1;
    return `dialog-${id.current}`;
  }, []);

  const open = useCallback(
    (options: DialogOptions): string => {
      const id = options.id || generateId();

      const initialValues = options.fields
        ? options.fields.reduce(
            (acc, field) => {
              acc[field.id] = field.defaultValue || '';
              return acc;
            },
            {} as Record<string, string>,
          )
        : { value: options.defaultValue || '' };

      setDialogs((prev) => [
        ...prev,
        {
          ...options,
          id,
          isOpen: true,
          values: initialValues,
          errors: {},
          isSubmitting: false,
        },
      ]);

      return id;
    },
    [generateId],
  );

  const close = useCallback(
    (id?: string) => {
      if (id) {
        setDialogs((prev) => prev.filter((dialog) => dialog.id !== id));
      } else if (dialogs.length > 0) {
        setDialogs((prev) => prev.slice(0, -1));
      }
    },
    [dialogs.length],
  );

  const update = useCallback((id: string, options: Partial<DialogState>) => {
    setDialogs((prev) =>
      prev.map((dialog) =>
        dialog.id === id ? { ...dialog, ...options } : dialog,
      ),
    );
  }, []);

  const closeAll = useCallback(() => {
    setDialogs([]);
  }, []);

  return (
    <DialogContext.Provider
      value={{
        open,
        close,
        update,
        closeAll,
        dialogs,
      }}
    >
      {children}
      {dialogs.map((dialog) => (
        <DialogComponent
          key={dialog.id}
          dialog={dialog}
          onClose={() => {
            if (!(dialog.preventClose || dialog.isSubmitting)) {
              if (dialog.onClose) {
                dialog.onClose();
              }
              close(dialog.id);
            }
          }}
          onUpdate={(updates) => update(dialog.id, updates)}
        />
      ))}
    </DialogContext.Provider>
  );
};

type DialogComponentProps = {
  dialog: DialogState;
  onClose: () => void;
  onUpdate: (updates: Partial<DialogState>) => void;
};

function DialogComponent({ dialog, onClose, onUpdate }: DialogComponentProps) {
  const handleValueChange = (id: string, value: string) => {
    const newValues = { ...dialog.values, [id]: value };

    if (dialog.fields) {
      const field = dialog.fields.find((f) => f.id === id);
      if (field?.validation) {
        const error = field.validation(value);
        const newErrors = { ...dialog.errors, [id]: error };
        onUpdate({ values: newValues, errors: newErrors });
        return;
      }
    }

    onUpdate({ values: newValues });
  };

  const handleConfirm = async () => {
    if (dialog.isSubmitting) {
      return;
    }

    if (dialog.onConfirm) {
      onUpdate({ isSubmitting: true });
      try {
        await dialog.onConfirm();
      } finally {
        onUpdate({ isSubmitting: false });
        onClose();
      }
    } else {
      onClose();
    }
  };

  const handleCancel = () => {
    if (dialog.isSubmitting) {
      return;
    }
    if (dialog.onCancel) {
      dialog.onCancel();
    }
    onClose();
  };

  const validateFields = (
    fields: FormField[],
    values: Record<string, string>,
  ): {
    hasErrors: boolean;
    errors: Record<string, string | null>;
  } => {
    const newErrors: Record<string, string | null> = {};
    let hasErrors = false;

    for (const field of fields) {
      if (field.validation) {
        const error = field.validation(values[field.id] || '');
        newErrors[field.id] = error;
        if (error) {
          hasErrors = true;
        }
      }
    }

    return { hasErrors, errors: newErrors };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (dialog.isSubmitting) {
      return;
    }

    if (dialog.fields) {
      const { hasErrors, errors } = validateFields(
        dialog.fields,
        dialog.values,
      );

      if (hasErrors) {
        onUpdate({ errors });
        return;
      }
    }

    if (dialog.onSubmit) {
      onUpdate({ isSubmitting: true });
      try {
        const submitValue = dialog.fields
          ? dialog.values
          : dialog.values.value || '';

        await dialog.onSubmit(submitValue);
      } finally {
        onUpdate({ isSubmitting: false });
        onClose();
      }
    } else {
      onClose();
    }
  };

  const renderLoadingButton = (_text: string) => (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      <span>Loading...</span>
    </>
  );

  const renderAlertDialog = () => (
    <>
      <DialogHeader>
        <DialogTitle>{dialog.title || 'Alert'}</DialogTitle>
        {dialog.description && (
          <DialogDescription>{dialog.description}</DialogDescription>
        )}
      </DialogHeader>
      <DialogFooter className="mt-4">
        <Button onClick={handleConfirm} disabled={dialog.isSubmitting}>
          {dialog.isSubmitting
            ? renderLoadingButton('Loading')
            : dialog.confirmText || 'OK'}
        </Button>
      </DialogFooter>
    </>
  );

  const renderConfirmDialog = () => (
    <>
      <DialogHeader>
        <DialogTitle>{dialog.title || 'Confirm'}</DialogTitle>
        {dialog.description && (
          <DialogDescription>{dialog.description}</DialogDescription>
        )}
      </DialogHeader>
      <DialogFooter className="mt-4 flex justify-between sm:justify-end gap-2">
        <Button
          variant="outline"
          onClick={handleCancel}
          disabled={dialog.isSubmitting}
        >
          {dialog.cancelText || 'Cancel'}
        </Button>
        <Button onClick={handleConfirm} disabled={dialog.isSubmitting}>
          {dialog.isSubmitting
            ? renderLoadingButton('Loading')
            : dialog.confirmText || 'Confirm'}
        </Button>
      </DialogFooter>
    </>
  );

  const renderPromptFields = () => {
    if (dialog.fields) {
      return dialog.fields.map((field) => (
        <div key={field.id} className="grid gap-2">
          <Label htmlFor={field.id}>
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Input
            id={field.id}
            type={field.type || 'text'}
            placeholder={field.placeholder}
            value={dialog.values[field.id] || ''}
            onChange={(e) => handleValueChange(field.id, e.target.value)}
            required={field.required}
            className={dialog.errors[field.id] ? 'border-destructive' : ''}
          />
          {dialog.errors[field.id] && (
            <p className="text-destructive text-sm">
              {dialog.errors[field.id]}
            </p>
          )}
        </div>
      ));
    }

    return (
      <div className="grid gap-2">
        <Label htmlFor="prompt-input">{dialog.title || 'Input'}</Label>
        <Input
          id="prompt-input"
          value={dialog.values.value || ''}
          onChange={(e) => handleValueChange('value', e.target.value)}
          autoFocus={true}
        />
      </div>
    );
  };

  const renderPromptDialog = () => (
    <>
      <DialogHeader>
        <DialogTitle>{dialog.title || 'Prompt'}</DialogTitle>
        {dialog.description && (
          <DialogDescription>{dialog.description}</DialogDescription>
        )}
      </DialogHeader>
      <form onSubmit={handleSubmit}>
        <div className="grid gap-4 py-4">{renderPromptFields()}</div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={dialog.isSubmitting}
          >
            {dialog.cancelText || 'Cancel'}
          </Button>
          <Button type="submit" disabled={dialog.isSubmitting}>
            {dialog.isSubmitting
              ? renderLoadingButton('Loading')
              : dialog.confirmText || 'Submit'}
          </Button>
        </DialogFooter>
      </form>
    </>
  );

  const renderCustomDialog = () => (
    <>
      {dialog.title && (
        <DialogHeader>
          <DialogTitle>{dialog.title}</DialogTitle>
          {dialog.description && (
            <DialogDescription>{dialog.description}</DialogDescription>
          )}
        </DialogHeader>
      )}
      {dialog.content}
      {dialog.actions && (
        <div className="mt-4 flex justify-end gap-2">
          {dialog.isSubmitting ? (
            <Button disabled={true}>{renderLoadingButton('Loading')}</Button>
          ) : (
            dialog.actions
          )}
        </div>
      )}
    </>
  );

  const renderDialogContent = () => {
    switch (dialog.type) {
      case 'alert':
        return renderAlertDialog();
      case 'confirm':
        return renderConfirmDialog();
      case 'prompt':
        return renderPromptDialog();
      default:
        return renderCustomDialog();
    }
  };

  return (
    <Dialog
      open={dialog.isOpen}
      onOpenChange={(open) =>
        !(open || dialog.preventClose || dialog.isSubmitting) && onClose()
      }
    >
      <DialogContent>{renderDialogContent()}</DialogContent>
    </Dialog>
  );
}

export const useDialogContext = () => useContext(DialogContext);

export type DialogHookResult = {
  id: string;
  close: () => void;
};

export const useAlert = () => {
  const { open, close } = useDialogContext();
  return (options: Omit<DialogOptions, 'type'>): DialogHookResult => {
    const id = open({ ...options, type: 'alert' });
    return { id, close: () => close(id) };
  };
};

export const useConfirm = () => {
  const { open, close } = useDialogContext();
  return (options: Omit<DialogOptions, 'type'>): DialogHookResult => {
    const id = open({ ...options, type: 'confirm' });
    return { id, close: () => close(id) };
  };
};

export const usePrompt = () => {
  const { open, close } = useDialogContext();
  return (options: Omit<DialogOptions, 'type'>): DialogHookResult => {
    const id = open({ ...options, type: 'prompt' });
    return { id, close: () => close(id) };
  };
};

export const useDialog = () => {
  const { open, close } = useDialogContext();
  return (options: Omit<DialogOptions, 'type'>): DialogHookResult => {
    const id = open({ ...options, type: 'custom' });
    return { id, close: () => close(id) };
  };
};

export const useDialogs = () => useDialogContext();
