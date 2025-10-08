'use client';

import { cn } from '@/lib/cn';
import { useRef } from 'react';

interface ControlledGlareCardProps {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  onHoverChange?: (isHovered: boolean) => void;
  /**
   * Controls the intensity of the 3D rotation effect
   * @default 0.4
   * @range 0-1 (0 = no rotation, 1 = maximum rotation)
   */
  rotateIntensity?: number;
  /**
   * Controls the intensity of the background movement
   * @default 1
   * @range 0-2 (0 = no movement, 2 = double movement)
   */
  backgroundMovement?: number;
  /**
   * Controls the opacity of the glare effect on hover
   * @default 0.6
   * @range 0-1 (0 = no glare, 1 = full glare)
   */
  glareOpacity?: number;
  /**
   * Controls the intensity of the glare gradient
   * @default { inner: 0.8, mid: 0.65, midStop: 20 }
   */
  glareGradient?: {
    /** Inner glare opacity (0-1) */
    inner?: number;
    /** Mid glare opacity (0-1) */
    mid?: number;
    /** Mid gradient stop percentage (0-100) */
    midStop?: number;
  };
  /**
   * Controls the diagonal repeating gradient pattern
   * @default { spacing: 10, intensity: 1 }
   */
  diagonalPattern?: {
    /** Spacing between diagonal lines (percentage, higher = wider spacing) */
    spacing?: number;
    /** Intensity of the diagonal lines (0-1, affects opacity) */
    intensity?: number;
  };
  /**
   * Controls the rainbow gradient effect
   * @default { enabled: true, intensity: 1 }
   */
  rainbowEffect?: {
    /** Enable/disable rainbow effect */
    enabled?: boolean;
    /** Intensity multiplier for rainbow colors (0-2) */
    intensity?: number;
  };
}

export const ControlledGlareCard = ({
  children,
  className,
  containerClassName,
  onHoverChange,
  rotateIntensity = 0.4,
  backgroundMovement = 1,
  glareOpacity = 0.6,
  glareGradient = { inner: 0.8, mid: 0.65, midStop: 20 },
  diagonalPattern = { spacing: 10, intensity: 1 },
  rainbowEffect = { enabled: true, intensity: 1 },
}: ControlledGlareCardProps) => {
  const isPointerInside = useRef(false);
  const refElement = useRef<HTMLDivElement>(null);
  const state = useRef({
    glare: {
      x: 50,
      y: 50,
    },
    background: {
      x: 50,
      y: 50,
    },
    rotate: {
      x: 0,
      y: 0,
    },
  });

  const containerStyle = {
    '--m-x': '50%',
    '--m-y': '50%',
    '--r-x': '0deg',
    '--r-y': '0deg',
    '--bg-x': '50%',
    '--bg-y': '50%',
    '--duration': '300ms',
    '--foil-size': '100%',
    '--opacity': '0',
    '--radius': '16px',
    '--easing': 'ease',
    '--transition': 'var(--duration) var(--easing)',
  } as React.CSSProperties;

  // Extract diagonal pattern settings
  const diagSpacing = diagonalPattern.spacing ?? 10;
  const diagIntensity = diagonalPattern.intensity ?? 1;

  // Extract rainbow effect settings
  const rainbowEnabled = rainbowEffect.enabled ?? true;
  const rainbowIntensity = rainbowEffect.intensity ?? 1;

  // Calculate diagonal gradient stops based on spacing
  const diagStop1 = (3.8 * diagSpacing) / 10;
  const diagStop2 = (4.5 * diagSpacing) / 10;
  const diagStop3 = (5.2 * diagSpacing) / 10;
  const diagEnd = diagSpacing;
  const diagRepeat = diagSpacing * 1.2;

  // Calculate opacity for diagonal lines based on intensity
  const diagOpacity = Math.min(60 * diagIntensity, 100);

  // Build rainbow gradient with intensity
  const rainbowGradient = rainbowEnabled
    ? `repeating-linear-gradient( 0deg,rgba(255,119,115,${rainbowIntensity}) calc(var(--step) * 1),rgba(255,237,95,${rainbowIntensity}) calc(var(--step) * 2),rgba(168,255,95,${rainbowIntensity}) calc(var(--step) * 3),rgba(131,255,247,${rainbowIntensity}) calc(var(--step) * 4),rgba(120,148,255,${rainbowIntensity}) calc(var(--step) * 5),rgba(216,117,255,${rainbowIntensity}) calc(var(--step) * 6),rgba(255,119,115,${rainbowIntensity}) calc(var(--step) * 7) ) 0% var(--bg-y)/200% 700% no-repeat`
    : 'none';

  const backgroundStyle = {
    '--step': '5%',
    '--foil-svg': `url("data:image/svg+xml,%3Csvg width='26' height='26' viewBox='0 0 26 26' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M2.99994 3.419C2.99994 3.419 21.6142 7.43646 22.7921 12.153C23.97 16.8695 3.41838 23.0306 3.41838 23.0306' stroke='white' stroke-width='5' stroke-miterlimit='3.86874' stroke-linecap='round' style='mix-blend-mode:darken'/%3E%3C/svg%3E")`,
    '--pattern': 'var(--foil-svg) center/100% no-repeat',
    '--rainbow': rainbowGradient,
    '--diagonal': `repeating-linear-gradient( 128deg,#0e152e 0%,hsl(180,10%,${diagOpacity}%) ${diagStop1}%,hsl(180,10%,${diagOpacity}%) ${diagStop2}%,hsl(180,10%,${diagOpacity}%) ${diagStop3}%,#0e152e ${diagEnd}%,#0e152e ${diagRepeat}% ) var(--bg-x) var(--bg-y)/300% no-repeat`,
    '--shade':
      'radial-gradient( farthest-corner circle at var(--m-x) var(--m-y),rgba(255,255,255,0.1) 12%,rgba(255,255,255,0.15) 20%,rgba(255,255,255,0.25) 120% ) var(--bg-x) var(--bg-y)/300% no-repeat',
    backgroundBlendMode: 'hue, hue, hue, overlay',
  } as React.CSSProperties;

  const updateStyles = () => {
    if (refElement.current) {
      const { background, rotate, glare } = state.current;
      refElement.current?.style.setProperty('--m-x', `${glare.x}%`);
      refElement.current?.style.setProperty('--m-y', `${glare.y}%`);
      refElement.current?.style.setProperty('--r-x', `${rotate.x}deg`);
      refElement.current?.style.setProperty('--r-y', `${rotate.y}deg`);
      refElement.current?.style.setProperty('--bg-x', `${background.x}%`);
      refElement.current?.style.setProperty('--bg-y', `${background.y}%`);
    }
  };

  // Calculate divisors based on backgroundMovement prop
  const bgXDivisor = 4 / backgroundMovement;
  const bgYDivisor = 3 / backgroundMovement;
  const bgXOffset = 12.5 * backgroundMovement;
  const bgYOffset = 16.67 * backgroundMovement;

  // Glare gradient values with defaults
  const glareInner = glareGradient.inner ?? 0.8;
  const glareMid = glareGradient.mid ?? 0.65;
  const glareMidStop = glareGradient.midStop ?? 20;

  return (
    <div
      style={containerStyle}
      className={cn(
        'relative isolate [contain:layout_style] [perspective:600px] transition-transform duration-[var(--duration)] ease-[var(--easing)] will-change-transform',
        containerClassName,
      )}
      ref={refElement}
      onPointerMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const position = {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        };
        const percentage = {
          x: (100 / rect.width) * position.x,
          y: (100 / rect.height) * position.y,
        };
        const delta = {
          x: percentage.x - 50,
          y: percentage.y - 50,
        };

        const { background, rotate, glare } = state.current;
        background.x = 50 + percentage.x / bgXDivisor - bgXOffset;
        background.y = 50 + percentage.y / bgYDivisor - bgYOffset;
        rotate.x = -(delta.x / 3.5);
        rotate.y = delta.y / 2;
        rotate.x *= rotateIntensity;
        rotate.y *= rotateIntensity;
        glare.x = percentage.x;
        glare.y = percentage.y;

        updateStyles();
      }}
      onPointerEnter={() => {
        isPointerInside.current = true;
        onHoverChange?.(true);
        if (refElement.current) {
          setTimeout(() => {
            if (isPointerInside.current) {
              refElement.current?.style.setProperty('--duration', '0s');
            }
          }, 300);
        }
      }}
      onPointerLeave={() => {
        isPointerInside.current = false;
        onHoverChange?.(false);
        if (refElement.current) {
          refElement.current.style.removeProperty('--duration');
          refElement.current?.style.setProperty('--r-x', '0deg');
          refElement.current?.style.setProperty('--r-y', '0deg');
        }
      }}
    >
      <div
        className="h-full grid will-change-transform origin-center transition-transform duration-[var(--duration)] ease-[var(--easing)] [transform:rotateY(var(--r-x))_rotateX(var(--r-y))] rounded-[var(--radius)] border border-slate-800 hover:[--duration:200ms] hover:[--easing:linear] hover:filter-none overflow-hidden"
        style={{
          // @ts-ignore - CSS custom property
          '--opacity': glareOpacity,
        }}
      >
        <div className="w-full h-full grid [grid-area:1/1] mix-blend-soft-light [clip-path:inset(0_0_0_0_round_var(--radius))]">
          <div className={cn('h-full w-full bg-slate-950', className)}>
            {children}
          </div>
        </div>
        <div
          className="w-full h-full grid [grid-area:1/1] mix-blend-soft-light [clip-path:inset(0_0_1px_0_round_var(--radius))] opacity-[var(--opacity)] transition-opacity transition-background duration-[var(--duration)] ease-[var(--easing)] will-change-background pointer-events-none"
          style={{
            background: `radial-gradient(farthest-corner circle at var(--m-x) var(--m-y), rgba(255,255,255,${glareInner}) 10%, rgba(255,255,255,${glareMid}) ${glareMidStop}%, rgba(255,255,255,0) 90%)`,
          }}
        />
        <div
          className="w-full h-full grid [grid-area:1/1] mix-blend-color-dodge opacity-[var(--opacity)] will-change-background transition-opacity [clip-path:inset(0_0_1px_0_round_var(--radius))] [background-blend-mode:hue_hue_hue_overlay] [background:var(--pattern),_var(--rainbow),_var(--diagonal),_var(--shade)] relative after:content-[''] after:grid-area-[inherit] after:bg-repeat-[inherit] after:bg-attachment-[inherit] after:bg-origin-[inherit] after:bg-clip-[inherit] after:bg-[inherit] after:mix-blend-exclusion after:[background-size:var(--foil-size),_200%_400%,_800%,_200%] after:[background-position:center,_0%_var(--bg-y),_calc(var(--bg-x)*_-1)_calc(var(--bg-y)*_-1),_var(--bg-x)_var(--bg-y)] after:[background-blend-mode:soft-light,_hue,_hard-light] pointer-events-none"
          style={{ ...backgroundStyle }}
        />
        {/* Interaction layer - above all glare effects with pointer events enabled */}
        <div className="w-full h-full grid [grid-area:1/1] relative z-10 pointer-events-none [&>*]:pointer-events-auto" />
      </div>
    </div>
  );
};
