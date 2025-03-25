'use client';

import { combineProviders } from 'react-combine-providers';

import { BreadcrumbsProvider } from './breadcrumbs';
import { ConstantsProvider } from './constants';
import { DialogsProvider } from './dialogs';

const provider = combineProviders();

for (const contentProvider of [
  BreadcrumbsProvider,
  ConstantsProvider,
  DialogsProvider,
]) {
  provider.push(contentProvider);
}

// Master provider is used to provide the context to all components
export const Contexts = provider.master();

export { useBreadcrumbs } from './breadcrumbs';
export { useConstants } from './constants';
export {
  useAlert,
  useConfirm,
  usePrompt,
  useDialog,
  useDialogs,
} from './dialogs';
