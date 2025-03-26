import type { DnsRecordSelect } from '@namefi-astra/db/types';
import { create } from 'zustand';

export type DialogAction = 'add' | 'edit' | 'delete' | 'save' | 'cancel';

export type DialogData = {
  success: boolean;
  message: string;
  originalRecords: DnsRecordSelect[];
  updatedRecords: DnsRecordSelect[];
};

export type DialogCallback = (action: DialogAction, data?: DialogData) => void;

export type DialogMode = 'add' | 'edit';

interface DialogState {
  deleteDialog: {
    isOpen: boolean;
    records: DnsRecordSelect[];
    callback?: DialogCallback;
  };
  recordFormDialog: {
    isOpen: boolean;
    mode: DialogMode;
    records: DnsRecordSelect[];
    callback?: DialogCallback;
    preselectedType?: string;
  };
  openDeleteDialog: (
    records: DnsRecordSelect[],
    callback?: DialogCallback,
  ) => void;
  openDeleteDialogSingle: (
    record: DnsRecordSelect,
    callback?: DialogCallback,
  ) => void;
  closeDeleteDialog: (action?: DialogAction, data?: DialogData) => void;
  openAddDialog: (callback?: DialogCallback, preselectedType?: string) => void;
  openEditDialog: (
    records: DnsRecordSelect[],
    callback?: DialogCallback,
  ) => void;
  openEditDialogSingle: (
    record: DnsRecordSelect,
    callback?: DialogCallback,
  ) => void;
  closeRecordFormDialog: (action?: DialogAction, data?: DialogData) => void;
}

export const useDialogStore = create<DialogState>((set, get) => ({
  deleteDialog: {
    isOpen: false,
    records: [],
    callback: undefined,
  },
  recordFormDialog: {
    isOpen: false,
    mode: 'edit',
    records: [],
    callback: undefined,
    preselectedType: undefined,
  },
  openDeleteDialog: (records, callback) =>
    set({
      deleteDialog: {
        isOpen: true,
        records,
        callback,
      },
    }),
  openDeleteDialogSingle: (record, callback) =>
    set({
      deleteDialog: {
        isOpen: true,
        records: [record],
        callback,
      },
    }),
  closeDeleteDialog: (action, data) => {
    const { callback } = get().deleteDialog;
    if (callback && action) {
      callback(action, data);
    }
    set({
      deleteDialog: {
        isOpen: false,
        records: [],
        callback: undefined,
      },
    });
  },
  openAddDialog: (callback, preselectedType) =>
    set({
      recordFormDialog: {
        isOpen: true,
        mode: 'add',
        records: [],
        callback,
        preselectedType,
      },
    }),
  openEditDialog: (records, callback) =>
    set({
      recordFormDialog: {
        isOpen: true,
        mode: 'edit',
        records,
        callback,
        preselectedType: undefined,
      },
    }),
  openEditDialogSingle: (record, callback) =>
    set({
      recordFormDialog: {
        isOpen: true,
        mode: 'edit',
        records: [record],
        callback,
        preselectedType: undefined,
      },
    }),
  closeRecordFormDialog: (action, data) => {
    const { callback } = get().recordFormDialog;
    if (callback && action) {
      callback(action, data);
    }
    set({
      recordFormDialog: {
        isOpen: false,
        mode: 'edit',
        records: [],
        callback: undefined,
        preselectedType: undefined,
      },
    });
  },
}));
