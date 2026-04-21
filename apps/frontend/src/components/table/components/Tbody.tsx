'use client';

import { cn } from '@namefi-astra/ui/lib/cn';
import { Children, type HTMLAttributes, forwardRef } from 'react';
import { Consumer, type Context } from '../utils';
import { Td } from './Td';
import { Tr } from './Tr';

type Props = HTMLAttributes<HTMLTableSectionElement>;

export const Tbody = forwardRef<HTMLTableSectionElement, Props>(
  ({ className, children, ...rest }, ref) => (
    <Consumer>
      {(data: Context) => (
        <tbody
          ref={ref}
          className={cn('', data.classes?.tbody, className)}
          data-testid="tbody"
          {...rest}
        >
          {Children.count(children) ? (
            children
          ) : (
            <Tr>
              <Td colSpan={Object.keys(data.headers).length}>No data</Td>
            </Tr>
          )}
        </tbody>
      )}
    </Consumer>
  ),
);

Tbody.displayName = 'Tbody';
