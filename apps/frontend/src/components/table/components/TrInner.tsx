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
import { type Context, TABLE_TESTID_ROOT } from '../utils';

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

    const root = data.testId ?? TABLE_TESTID_ROOT;
    // Header rows live under `.head-row`; body rows under `.row`. Body rows still
    // share one default id — pass `data-testid` per row (keyed by the row's data)
    // to make individual rows uniquely targetable.
    const rowTestId = inside ? `${root}.head-row` : `${root}.row`;

    return (
      <tr ref={ref} data-testid={rowTestId} {...rest}>
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
