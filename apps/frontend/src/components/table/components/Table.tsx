'use client';

import { cn } from '@namefi-astra/ui/lib/cn';
import {
  type HTMLAttributes,
  type TableHTMLAttributes,
  forwardRef,
  useMemo,
} from 'react';
import { useMediaQuery } from 'react-responsive';
import styled from 'styled-components';
import type { Classes } from '../types';
import { TABLE_TESTID_ROOT, type Context, Provider } from '../utils';

const defaults: Classes = {
  table: 'w-full caption-bottom text-sm',
  thead: '[&_tr]:border-b',
  tfoot: 'bg-muted/50 border-t font-medium [&>tr]:last:border-b-0',
  tbody: '[&_tr:last-child]:border-0',
  th: 'text-muted-foreground h-10 px-2 text-start align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pe-0 [&>[role=checkbox]]:translate-y-[2px]',
  td: 'p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pe-0 [&>[role=checkbox]]:translate-y-[2px]',
  tr: 'hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors',

  pivot: '',
};

interface Props extends TableHTMLAttributes<HTMLTableElement> {
  pivot?: HTMLAttributes<HTMLDivElement>;
  screen?: number;
  classes?: Partial<Classes>;
  hasHeader?: boolean;
  hasFooter?: boolean;
  hasPivot?: boolean;
  /**
   * Root `data-testid` namespace. Flows through context so child primitives
   * generate hierarchical ids (`${testId}.head`, `.row`, `.cell`). Defaults to
   * `'table'`. See the `testid-hierarchy` rule.
   */
  'data-testid'?: string;
}

const Wrapper = styled.table<Props>`
  @media screen and (max-width: ${(props) => props.screen}px) {
    table,
    thead,
    tfoot,
    tbody,
    th,
    td,
    tr {
      display: block;
      width: 100%;
      max-width: 100vw;
    }

    & {
      border: none !important;
    }

    thead,
    tfoot {
      display: none;
    }

    tbody tr:not(:last-child) {
    }

    td.pivoted {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      width: 100% !important;
      border: none !important;
    }

    td .td-before {
      display: flex;
      width: 50%;
      max-width: 50%;
      min-width: 50%;
    }
  }
`;

export const Table = forwardRef<HTMLTableElement, Props>(function Table(
  {
    pivot = {},
    screen = 768,
    classes = defaults,
    hasHeader = true,
    hasFooter = true,
    hasPivot = true,
    children,
    className,
    'data-testid': testId,
    ...rest
  },
  ref,
) {
  const mobile = useMediaQuery({ query: `(max-width: ${screen}px)` });
  // Root namespace child primitives derive their hierarchical ids from.
  // `||` (not `??`) so an explicit empty `data-testid=""` also falls back to the
  // default — otherwise children would emit invalid handles like `.body`/`.row`.
  const root = testId || TABLE_TESTID_ROOT;

  const value = useMemo<Context>(
    () => ({
      mobile,
      headers: {},
      pivot,
      screen,
      classes,
      hasHeader,
      hasFooter,
      hasPivot,
      testId: root,
    }),
    [mobile, pivot, screen, classes, hasHeader, hasFooter, hasPivot, root],
  );

  return (
    <Provider value={value}>
      <Wrapper
        data-testid={root}
        className={cn('', classes?.table, className)}
        screen={screen}
        ref={ref}
        {...rest}
      >
        {children}
      </Wrapper>
    </Provider>
  );
});
