'use client';

import { cn } from '@namefi-astra/ui/lib/cn';
import { useTranslations } from 'next-intl';
import { Children, type HTMLAttributes, forwardRef } from 'react';
import { Consumer, type Context, TABLE_TESTID_ROOT } from '../utils';
import { Td } from './Td';
import { Tr } from './Tr';

type Props = HTMLAttributes<HTMLTableSectionElement>;

export const Tbody = forwardRef<HTMLTableSectionElement, Props>(
  ({ className, children, ...rest }, ref) => {
    const t = useTranslations('shared');
    return (
      <Consumer>
        {(data: Context) => (
          <tbody
            ref={ref}
            className={cn('', data.classes?.tbody, className)}
            data-testid={`${data.testId ?? TABLE_TESTID_ROOT}.body`}
            {...rest}
          >
            {Children.count(children) ? (
              children
            ) : (
              <Tr>
                <Td colSpan={Object.keys(data.headers).length}>
                  {t('table.empty')}
                </Td>
              </Tr>
            )}
          </tbody>
        )}
      </Consumer>
    );
  },
);

Tbody.displayName = 'Tbody';
