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
};

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
