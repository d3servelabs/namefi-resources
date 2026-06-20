'use client';

import { cn } from '@namefi-astra/ui/lib/cn';
import {
  Children,
  type HTMLAttributes,
  type ReactElement,
  cloneElement,
  forwardRef,
  isValidElement,
} from 'react';
import { Consumer, type Context, TABLE_TESTID_ROOT } from '../utils';

type Props = HTMLAttributes<HTMLTableSectionElement>;

export const Thead = forwardRef<HTMLTableSectionElement, Props>(
  ({ className, children, ...rest }, ref) => {
    return (
      <Consumer>
        {(data: Context) => (
          <thead
            ref={ref}
            className={cn('', data.classes?.thead, className)}
            data-testid={`${data.testId ?? TABLE_TESTID_ROOT}.head`}
            {...rest}
          >
            {children
              ? Children.map(children, (child) =>
                  isValidElement(child)
                    ? cloneElement(child as ReactElement<{ inside: boolean }>, {
                        inside: true,
                      })
                    : child,
                )
              : children}
          </thead>
        )}
      </Consumer>
    );
  },
);

Thead.displayName = 'Thead';
