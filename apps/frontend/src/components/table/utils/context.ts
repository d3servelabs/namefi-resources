'use client';

import { type HTMLAttributes, type ReactNode, createContext } from 'react';
import type { Classes } from '../types';

export type Context = {
  mobile?: boolean;
  headers: Record<string, ReactNode>;
  pivot: HTMLAttributes<HTMLDivElement>;
  screen: number;
  classes: Partial<Classes>;
  hasHeader?: boolean;
  hasFooter?: boolean;
  hasPivot?: boolean;
  /**
   * Root `data-testid` namespace for this table, taken from the `data-testid`
   * passed to <Table>. Child primitives generate their own hierarchical ids
   * from it (`${testId}.head`, `.body`, `.row`, `.cell`) so every cell has a
   * stable, collision-free handle. Defaults to `'table'` when the call site
   * supplies no root. See the `testid-hierarchy` rule.
   */
  testId?: string;
};

/** Default root namespace when a <Table> is rendered without a `data-testid`. */
export const TABLE_TESTID_ROOT = 'table';

const { Provider, Consumer } = createContext<Context>({
  headers: {},
  pivot: {},
  screen: 768,
  classes: {},
  hasHeader: true,
  hasFooter: true,
  hasPivot: true,
});

export { Consumer, Provider };
