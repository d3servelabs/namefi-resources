'use client';

import type { ReactNode } from 'react';
import { BreadcrumbsProvider } from './breadcrumbs';
import { ConstantsProvider } from './constants';
import { DialogsProvider } from './dialogs';

export const Contexts = ({ children }: { children: ReactNode }) => {
  return (
    <ConstantsProvider>
      <BreadcrumbsProvider>
        <DialogsProvider>{children}</DialogsProvider>
      </BreadcrumbsProvider>
    </ConstantsProvider>
  );
};

export { useBreadcrumbs } from './breadcrumbs';
export { useConstants } from './constants';
export {
  useAlert,
  useConfirm,
  usePrompt,
  useDialog,
  useDialogs,
} from './dialogs';
