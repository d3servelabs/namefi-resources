'use client';

import { cn } from '@/lib/cn';
import {
  Children,
  type HTMLAttributes,
  type ReactElement,
  cloneElement,
  forwardRef,
  isValidElement,
} from 'react';
import { Consumer, type Context } from '../utils';

type Props = HTMLAttributes<HTMLTableSectionElement>;

export const Thead = forwardRef<HTMLTableSectionElement, Props>(
  ({ className, children, ...rest }, ref) => {
    return (
      <Consumer>
        {(data: Context) => (
          <thead
            ref={ref}
            className={cn('', data.classes?.thead, className)}
            data-testid="thead"
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
