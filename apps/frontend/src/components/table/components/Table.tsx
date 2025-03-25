'use client';

import { cn } from '@/lib/utils';
import {
  type CSSProperties,
  type HTMLAttributes,
  type TableHTMLAttributes,
  forwardRef,
  useMemo,
} from 'react';
import { useMediaQuery } from 'react-responsive';
import styled from 'styled-components';
import type { Classes } from '../types';
import { type Context, Provider, style2string } from '../utils';

interface Props extends TableHTMLAttributes<HTMLTableElement> {
  pivot?: HTMLAttributes<HTMLDivElement>;
  screen?: number;
  classes?: Partial<Classes>;
  hasHeader?: boolean;
  hasFooter?: boolean;
  hasPivot?: boolean;
  styles?: CSSProperties;
}

const Wrapper = styled.table<Props>`
  table,
  thead,
  tfoot,
  tbody,
  th,
  td,
  tr {
    ${(props) => style2string(props.styles)}
  }

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

    tbody tr {
    }

    tbody tr:not(:last-child) {
      border-bottom: none;
    }

    td.pivoted {
      display: flex;
      gap: 0.75rem;
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
    classes = {},
    hasHeader = true,
    hasFooter = true,
    hasPivot = true,
    children,
    className,
    ...rest
  },
  ref,
) {
  const mobile = useMediaQuery({ query: `(max-width: ${screen}px)` });

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
    }),
    [mobile, pivot, screen, classes, hasHeader, hasFooter, hasPivot],
  );

  return (
    <Provider value={value}>
      <Wrapper
        data-testid="table"
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
