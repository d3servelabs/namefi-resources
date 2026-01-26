'use client';

import { cn } from '@/lib/cn';
import {
  type FC,
  type CSSProperties,
  useCallback,
  useEffect,
  useRef,
} from 'react';

/**
 * Bulk auto-renew toggle with three states: off, mixed, on.
 *
 * Uses CSS transitions instead of motion/react to reduce the initial
 * client module graph for /domains.
 */

export type BulkAutoRenewState = 'off' | 'mixed' | 'on';

export interface BulkAutoRenewToggleProps {
  state: BulkAutoRenewState;
  onStateChange: (
    newState: 'off' | 'on',
    position: { x: number; y: number } | null,
  ) => void;
  disabled?: boolean;
  isLoading?: boolean;
  ariaLabel: string;
}

export const BulkAutoRenewToggle: FC<BulkAutoRenewToggleProps> = ({
  state,
  onStateChange,
  disabled = false,
  isLoading = false,
  ariaLabel,
}) => {
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLInputElement>) => {
      if (disabled || isLoading) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const midpoint = rect.width / 2;

      // UX: Click position determines state (left=off, right=on)
      // This allows users to explicitly choose the desired state
      // rather than cycling through states, which is clearer for bulk actions
      // when domains have mixed auto-renew states
      const newState = clickX < midpoint ? 'off' : 'on';

      // Calculate position for potential celebration
      let position: { x: number; y: number } | null = null;
      if (newState === 'on') {
        position = {
          x: (rect.left + rect.width / 2) / window.innerWidth,
          y: (rect.top + rect.height / 2) / window.innerHeight,
        };
      }

      onStateChange(newState, position);
    },
    [onStateChange, disabled, isLoading],
  );

  // Keyboard handler for accessibility
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (disabled || isLoading) return;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          onStateChange('off', null);
          break;
        case 'ArrowRight':
          e.preventDefault();
          onStateChange('on', null);
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          // Toggle: if on -> off, otherwise (off or mixed) -> on
          onStateChange(state === 'on' ? 'off' : 'on', null);
          break;
      }
    },
    [onStateChange, disabled, isLoading, state],
  );

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!inputRef.current) return;
    inputRef.current.indeterminate = state === 'mixed';
  }, [state]);

  // Determine thumb position: off=left (0), mixed=center (8px), on=right (28px)
  const getThumbTransform = () => {
    if (isLoading) return undefined; // Will use animation instead
    switch (state) {
      case 'off':
        return 'translateX(0)';
      case 'mixed':
        return 'translateX(8px)'; // Center position for 36px toggle with 14px thumb
      case 'on':
        return 'translateX(28px)';
    }
  };

  // Get animation based on state to match static positions
  const getLoadingAnimation = () => {
    switch (state) {
      case 'on':
        return 'oscillateOn 0.8s ease-in-out infinite';
      case 'mixed':
        return 'oscillateMixed 0.8s ease-in-out infinite';
      case 'off':
        return 'oscillateOff 0.8s ease-in-out infinite';
    }
  };

  // Determine thumb style based on loading state
  const thumbStyle: CSSProperties = isLoading
    ? {
        animation: getLoadingAnimation(),
      }
    : {
        transform: getThumbTransform(),
      };

  // Track background color based on state (ghost for ON, muted yellow for OFF)
  const getTrackBackground = () => {
    switch (state) {
      case 'on':
        return 'rgba(34, 197, 94, 0.08)'; // Green ghost (ultra subtle)
      case 'mixed':
        return 'rgba(234, 179, 8, 0.25)'; // Yellow muted
      case 'off':
        return 'rgba(234, 179, 8, 0.25)'; // Yellow muted
    }
  };

  // Thumb color based on state
  const getThumbColor = () => {
    switch (state) {
      case 'on':
        return 'rgba(34, 197, 94, 0.5)'; // Semi-transparent green (ghost)
      case 'mixed':
        return '#ca8a04'; // Dark yellow/amber
      case 'off':
        return '#ca8a04'; // Dark yellow
    }
  };

  // Show text labels only when not in mixed state
  const showTextLabels = state !== 'mixed';

  return (
    <label
      className={cn(
        'relative inline-flex h-7 shrink-0 cursor-pointer items-center rounded-full border-0 transition-all duration-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background',
        'active:scale-95', // CSS-based tap animation
        showTextLabels ? 'w-14' : 'w-9', // Wider when showing text labels
        (disabled || isLoading) && 'cursor-not-allowed opacity-50',
      )}
      style={{ background: getTrackBackground() }}
    >
      <input
        ref={inputRef}
        type="checkbox"
        checked={state === 'on'}
        aria-checked={state === 'mixed' ? 'mixed' : state === 'on'}
        aria-label={ariaLabel}
        disabled={disabled || isLoading}
        onClick={(event) => {
          event.preventDefault();
          handleClick(event);
        }}
        onKeyDown={handleKeyDown}
        readOnly={true}
        className="absolute inset-0 opacity-0"
      />
      {/* ON/OFF text labels - only show when not mixed */}
      {showTextLabels && (
        <>
          <span
            className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-semibold leading-none tracking-wider transition-colors duration-300 pointer-events-none"
            style={{
              color:
                state === 'on' ? 'rgba(255, 255, 255, 0.7)' : 'transparent',
            }}
          >
            ON
          </span>
          <span
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-semibold leading-none tracking-wider transition-colors duration-300 pointer-events-none"
            style={{
              color:
                state === 'off' ? 'rgba(255, 255, 255, 0.7)' : 'transparent',
            }}
          >
            OFF
          </span>
        </>
      )}

      {/* Thumb */}
      <span
        className="pointer-events-none absolute block rounded-full shadow-lg ring-0 transition-all duration-300 ease-out"
        style={{
          ...thumbStyle,
          width: state === 'mixed' ? '14px' : '22px', // Smaller thumb for mixed state
          height: state === 'mixed' ? '14px' : '22px',
          top: state === 'mixed' ? '7px' : '3px', // Center vertically for mixed (28-14)/2 = 7px
          left: '3px',
          background: getThumbColor(),
        }}
      />
    </label>
  );
};
