'use client';

/**
 * Floating Action Panel for bulk domain operations.
 *
 * This component is lazy-loaded via next/dynamic to keep motion/react
 * and @number-flow/react out of the initial /domains client bundle.
 * It only loads when the user selects domains (selectedDomainCount > 0).
 */

import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { Separator } from '@namefi-astra/ui/components/shadcn/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@namefi-astra/ui/components/shadcn/tooltip';
import {
  BulkAutoRenewToggle,
  type BulkAutoRenewState,
} from '@/components/my-domains/bulk-auto-renew-toggle';
import { motion, AnimatePresence, MotionConfig } from 'motion/react';
import NumberFlow, { useCanAnimate } from '@number-flow/react';
import {
  CalendarPlus,
  Globe,
  Hexagon,
  Link as LinkIcon,
  X,
} from 'lucide-react';
import type { CSSProperties, FC } from 'react';

interface RenewableDomain {
  normalizedDomainName: string | null;
  expirationDate: Date | string | null | undefined;
}

export interface FloatingActionPanelProps {
  selectedDomainCount: number;
  bulkAutoRenewState: BulkAutoRenewState;
  onBulkAutoRenewToggle: (
    newState: 'off' | 'on',
    position: { x: number; y: number } | null,
  ) => void;
  isTogglingAutoRenew: boolean;
  onClearSelection: () => void;
  renewableDomainsCount: number;
  renewableDomains: RenewableDomain[];
  onRenewNow: (
    domains: Array<{
      normalizedDomainName: string;
      expirationDate: Date | string | null | undefined;
    }>,
  ) => void;
  onBatchAction: (action: 'ns' | 'web' | 'mx' | 'ens' | 'forward') => void;
}

const FloatingActionPanel: FC<FloatingActionPanelProps> = ({
  selectedDomainCount,
  bulkAutoRenewState,
  onBulkAutoRenewToggle,
  isTogglingAutoRenew,
  onClearSelection,
  renewableDomainsCount,
  renewableDomains,
  onRenewNow,
  onBatchAction,
}) => {
  const canAnimate = useCanAnimate();

  const handleRenewNow = () => {
    if (renewableDomainsCount === 0) return;
    const validDomains = renewableDomains.filter(
      (domain) => domain.normalizedDomainName,
    );
    if (validDomains.length === 0) return;
    onRenewNow(
      validDomains.map((domain) => ({
        normalizedDomainName: domain.normalizedDomainName ?? '',
        expirationDate: domain.expirationDate,
      })),
    );
  };

  return (
    <AnimatePresence>
      {selectedDomainCount > 0 && (
        <motion.div
          initial={{ y: 100, scale: 0.95 }}
          animate={{ y: 0, scale: 1 }}
          exit={{ y: 100, scale: 0.95 }}
          transition={{
            type: 'spring',
            damping: 20,
            stiffness: 300,
            duration: 0.4,
          }}
          layout
          className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="backdrop-blur-2xl bg-background/30 border border-border/50 rounded-2xl shadow-2xl shadow-black/20"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            }}
          >
            <div className="px-6 py-4">
              <MotionConfig
                transition={{
                  layout: canAnimate
                    ? { duration: 0.9, bounce: 0, type: 'spring' }
                    : { duration: 0 },
                }}
              >
                <div className="flex items-center gap-6">
                  {/* Selection Count */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/20 border border-primary/30 rounded-full flex items-center justify-center">
                      <NumberFlow
                        value={selectedDomainCount}
                        className="text-primary font-bold text-sm"
                        style={
                          {
                            '--number-flow-char-height': '0.85em',
                            '--number-flow-mask-height': '0.3em',
                          } as CSSProperties
                        }
                      />
                    </div>
                    <span className="font-semibold text-foreground text-sm">
                      selected
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onClearSelection}
                      className="h-6 w-6 rounded-full hover:bg-muted"
                      aria-label="Clear selection"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <Separator
                    orientation="vertical"
                    className="h-8! bg-foreground/30"
                  />

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {/* Auto-Renew Toggle */}
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-muted/30" />
                        }
                      >
                        <span className="text-xs text-muted-foreground">
                          Auto
                        </span>
                        <BulkAutoRenewToggle
                          state={bulkAutoRenewState}
                          onStateChange={onBulkAutoRenewToggle}
                          disabled={selectedDomainCount === 0}
                          isLoading={isTogglingAutoRenew}
                          ariaLabel={`Bulk auto-renew for ${selectedDomainCount} domain${selectedDomainCount !== 1 ? 's' : ''}`}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        {bulkAutoRenewState === 'mixed'
                          ? 'Mixed states - click left to disable all, right to enable all'
                          : bulkAutoRenewState === 'on'
                            ? 'Auto-renew enabled - click left to disable'
                            : 'Auto-renew disabled - click right to enable'}
                      </TooltipContent>
                    </Tooltip>

                    <Separator
                      orientation="vertical"
                      className="h-4 bg-border mx-1"
                    />

                    {/* Renew Now */}
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleRenewNow}
                            className="h-8 w-8 hover:bg-muted"
                            disabled={renewableDomainsCount === 0}
                            aria-label={`Renew ${renewableDomainsCount} domain${renewableDomainsCount !== 1 ? 's' : ''}`}
                          />
                        }
                      >
                        <CalendarPlus className="w-4 h-4" />
                      </TooltipTrigger>
                      <TooltipContent>
                        Renew {renewableDomainsCount} domain
                        {renewableDomainsCount !== 1 ? 's' : ''}
                      </TooltipContent>
                    </Tooltip>

                    <Separator
                      orientation="vertical"
                      className="h-4 bg-border mx-1"
                    />

                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onBatchAction('web')}
                            className="h-8 w-8"
                            aria-label="Set Web Records"
                          />
                        }
                      >
                        <Globe className="w-4 h-4" />
                      </TooltipTrigger>
                      <TooltipContent>Set Web Records</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onBatchAction('forward')}
                            className="h-8 w-8"
                            aria-label="Set URL Forwarding"
                          />
                        }
                      >
                        <LinkIcon className="w-4 h-4" />
                      </TooltipTrigger>
                      <TooltipContent>Set URL Forwarding</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onBatchAction('ens')}
                            className="h-8 w-8"
                            aria-label="Set ENS Record"
                          />
                        }
                      >
                        <Hexagon className="w-4 h-4" />
                      </TooltipTrigger>
                      <TooltipContent>Set ENS Record</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </MotionConfig>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FloatingActionPanel;
