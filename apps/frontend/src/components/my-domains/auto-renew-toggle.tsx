'use client';

import { cn } from '@namefi-astra/ui/lib/cn';
import { type FC, type CSSProperties, useCallback, useRef } from 'react';

/**
 * Auto-renew toggle component using CSS transitions instead of motion/react.
 *
 * This reduces the initial client module graph for /domains by avoiding
 * the heavy animation library import. All animations are CSS-based.
 */

export interface AutoRenewToggleProps {
  checked: boolean;
  onCheckedChange: (
    checked: boolean,
    position: { x: number; y: number } | null,
  ) => void;
  disabled?: boolean;
  isLoading?: boolean;
  ariaLabel?: string;
}

export const AutoRenewToggle: FC<AutoRenewToggleProps> = ({
  checked,
  onCheckedChange,
  disabled = false,
  isLoading = false,
  ariaLabel,
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleToggle = useCallback(() => {
    if (disabled || isLoading) return;

    const newValue = !checked;

    // Calculate position for potential celebration (passed to handler)
    let position: { x: number; y: number } | null = null;
    if (newValue && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      position = {
        x: (rect.left + rect.width / 2) / window.innerWidth,
        y: (rect.top + rect.height / 2) / window.innerHeight,
      };
    }

    onCheckedChange(newValue, position);
  }, [checked, onCheckedChange, disabled, isLoading]);

  // Determine thumb style based on loading state
  const thumbStyle: CSSProperties = isLoading
    ? {
        animation: checked
          ? 'oscillateOn 0.8s ease-in-out infinite'
          : 'oscillateOff 0.8s ease-in-out infinite',
      }
    : {
        transform: checked ? 'translateX(28px)' : 'translateX(0)',
      };

  // Ghost style for ON, muted yellow for OFF
  const trackStyle: CSSProperties = {
    background: checked
      ? 'rgba(34, 197, 94, 0.08)' // Green ghost (ultra subtle)
      : 'rgba(234, 179, 8, 0.25)', // Yellow muted
  };

  const thumbColor = checked ? 'rgba(34, 197, 94, 0.5)' : '#ca8a04'; // Semi-transparent green for ON (ghost), dark yellow for OFF

  return (
    <button
      ref={buttonRef}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel ?? 'Toggle setting'}
      disabled={disabled || isLoading}
      onClick={handleToggle}
      className={cn(
        'relative inline-flex h-7 w-14 shrink-0 cursor-pointer items-center rounded-full border-0 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'active:scale-95', // CSS-based tap animation
        (disabled || isLoading) && 'cursor-not-allowed opacity-50',
      )}
      style={trackStyle}
    >
      {/* ON/OFF text labels */}
      <span
        className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-semibold leading-none tracking-wider transition-colors duration-300 pointer-events-none"
        style={{
          color: checked ? 'rgba(255, 255, 255, 0.7)' : 'transparent',
        }}
      >
        ON
      </span>
      <span
        className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-semibold leading-none tracking-wider transition-colors duration-300 pointer-events-none"
        style={{
          color: checked ? 'transparent' : 'rgba(255, 255, 255, 0.7)',
        }}
      >
        OFF
      </span>

      {/* Thumb */}
      <span
        className="pointer-events-none absolute block rounded-full shadow-lg ring-0 transition-transform duration-300 ease-out"
        style={{
          ...thumbStyle,
          width: '22px',
          height: '22px',
          top: '3px',
          left: '3px',
          background: thumbColor,
        }}
      />
    </button>
  );
};
