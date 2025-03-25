'use client';

import {
  Children,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
  cloneElement,
  forwardRef,
  isValidElement,
} from 'react';
import type { Context } from '../utils';

interface Props extends HTMLAttributes<HTMLTableRowElement> {
  data: Context;
  inside?: boolean;
}

export const TrInner = forwardRef<HTMLTableRowElement, Props>(
  ({ children, data, inside, ...rest }, ref) => {
    if (data.headers && inside) {
      Children.forEach(children, (child, index) => {
        if (isValidElement<{ children: ReactNode }>(child)) {
          data.headers[index] = child.props.children;
        }
      });
    }

    return (
      <tr ref={ref} data-testid="tr" {...rest}>
        {children
          ? Children.map(children, (child, index) =>
              child && isValidElement(child)
                ? cloneElement(child as ReactElement<{ column: number }>, {
                    key: child.key,
                    column: index,
                  })
                : child,
            )
          : children}
      </tr>
    );
  },
);

TrInner.displayName = 'TrInner';
