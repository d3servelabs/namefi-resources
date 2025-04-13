import type { DnsRecordSelect } from '@namefi-astra/db/types';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
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
  normalizedDomainName: NamefiNormalizedDomain;
  openDeleteDialog: (
    normalizedDomainName: NamefiNormalizedDomain,
    records: DnsRecordSelect[],
    callback?: DialogCallback,
  ) => void;
  openDeleteDialogSingle: (
    normalizedDomainName: NamefiNormalizedDomain,
    record: DnsRecordSelect,
    callback?: DialogCallback,
  ) => void;
  closeDeleteDialog: (action?: DialogAction, data?: DialogData) => void;
  openAddDialog: (
    normalizedDomainName: NamefiNormalizedDomain,
    callback?: DialogCallback,
    preselectedType?: string,
  ) => void;
  openEditDialog: (
    normalizedDomainName: NamefiNormalizedDomain,
    records: DnsRecordSelect[],
    callback?: DialogCallback,
  ) => void;
  openEditDialogSingle: (
    normalizedDomainName: NamefiNormalizedDomain,
    record: DnsRecordSelect,
    callback?: DialogCallback,
  ) => void;
  closeRecordFormDialog: (action?: DialogAction, data?: DialogData) => void;
}

export const useDialogStore = create<DialogState>((set, get) => ({
  normalizedDomainName: '' as NamefiNormalizedDomain,
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
  openDeleteDialog: (normalizedDomainName, records, callback) =>
    set({
      normalizedDomainName,
      deleteDialog: {
        isOpen: true,
        records,
        callback,
      },
    }),
  openDeleteDialogSingle: (normalizedDomainName, record, callback) =>
    set({
      normalizedDomainName,
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
  openAddDialog: (normalizedDomainName, callback, preselectedType) =>
    set({
      normalizedDomainName,
      recordFormDialog: {
        isOpen: true,
        mode: 'add',
        records: [],
        callback,
        preselectedType,
      },
    }),
  openEditDialog: (normalizedDomainName, records, callback) =>
    set({
      normalizedDomainName,
      recordFormDialog: {
        isOpen: true,
        mode: 'edit',
        records,
        callback,
        preselectedType: undefined,
      },
    }),
  openEditDialogSingle: (normalizedDomainName, record, callback) =>
    set({
      normalizedDomainName,
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
