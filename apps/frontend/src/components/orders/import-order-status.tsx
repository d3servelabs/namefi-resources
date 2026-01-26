'use client';

import { useMemo } from 'react';
import { Info, Clock, Mail, ArrowRight, Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { OrderItemSelect } from '@namefi-astra/db';
import {
  itemTypeSchema,
  orderStatusSchema,
} from '@namefi-astra/common/shared-schemas';

interface ImportOrderStatusProps {
  items: OrderItemSelect[];
  className?: string;
}

const importSteps = [
  {
    id: 'submitted',
    label: 'Transfer request submitted',
    description: 'We have initiated the transfer with your authorization code.',
  },
  {
    id: 'waiting',
    label: 'Waiting for approval',
    description:
      'Your old registrar will send you an email to confirm the transfer. This typically takes 5-7 days unless you expedite it.',
  },
  {
    id: 'completing',
    label: 'Completing transfer',
    description:
      'Once approved, we will finalize the transfer and mint your domain NFT.',
  },
];

export function ImportOrderStatus({
  items,
  className,
}: ImportOrderStatusProps) {
  const importItems = useMemo(
    () =>
      items.filter(
        (item) =>
          item.type === itemTypeSchema.enum.IMPORT &&
          item.status !== orderStatusSchema.enum.FAILED &&
          item.status !== orderStatusSchema.enum.CANCELLED,
      ),
    [items],
  );

  if (importItems.length === 0) {
    return null;
  }

  const domainLabel =
    importItems.length === 1
      ? importItems[0].normalizedDomainName
      : `${importItems.length} domains`;

  return (
    <div className={cn('space-y-6', className)}>
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Importing {domainLabel}</h2>
        <p className="text-muted-foreground">
          Domain transfers typically take 5-7 days to complete
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-background/60 p-6 shadow-sm">
        <div className="flex items-start gap-3 mb-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <Info className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="space-y-2">
            <p className="text-sm font-medium text-blue-200">
              What to expect during the import process
            </p>
            <ul className="text-sm text-blue-200/80 space-y-1">
              <li className="flex items-start gap-2">
                <Mail className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>
                  You will receive an email from your old registrar asking you
                  to confirm the transfer
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>
                  The process takes 5-7 days by default, but you can expedite it
                  by approving the transfer in your old registrar&apos;s
                  dashboard
                </span>
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>
                  Once the transfer is approved, we will automatically complete
                  the process and mint your domain NFT
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground">
            Import Progress
          </h3>
          <ol className="space-y-4">
            {importSteps.map((step, index) => {
              const isActive = index === 1;
              const isCompleted = index === 0;

              return (
                <li key={step.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium',
                        isCompleted
                          ? 'border-green-500 bg-green-500/20 text-green-400'
                          : isActive
                            ? 'border-primary bg-primary/20 text-primary animate-pulse'
                            : 'border-muted-foreground/30 text-muted-foreground/50',
                      )}
                    >
                      {isCompleted ? (
                        <Check className="h-4 w-4" aria-label="Completed" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    {index < importSteps.length - 1 && (
                      <div
                        className={cn(
                          'w-0.5 flex-1 mt-2',
                          isCompleted
                            ? 'bg-green-500/50'
                            : 'bg-muted-foreground/20',
                        )}
                      />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <p
                      className={cn(
                        'font-medium',
                        isCompleted
                          ? 'text-green-400'
                          : isActive
                            ? 'text-foreground'
                            : 'text-muted-foreground/70',
                      )}
                    >
                      {step.label}
                    </p>
                    <p
                      className={cn(
                        'text-sm mt-1',
                        isActive
                          ? 'text-muted-foreground'
                          : 'text-muted-foreground/50',
                      )}
                    >
                      {step.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      {importItems.length > 0 && (
        <div className="rounded-2xl border border-border bg-background/60 p-6 shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">
            {importItems.length === 1
              ? 'Domain being imported'
              : 'Domains being imported'}
          </h3>
          <div className="space-y-2">
            {importItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
              >
                <span className="font-medium text-lg">
                  {item.normalizedDomainName}
                </span>
                <span className="text-sm text-muted-foreground px-2 py-1 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                  Transferring
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function hasImportItems(items: OrderItemSelect[]): boolean {
  return items.some((item) => item.type === itemTypeSchema.enum.IMPORT);
}

export function isImportOnlyOrder(items: OrderItemSelect[]): boolean {
  return (
    items.length > 0 &&
    items.every((item) => item.type === itemTypeSchema.enum.IMPORT)
  );
}
