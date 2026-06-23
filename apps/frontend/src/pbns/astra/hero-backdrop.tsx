'use client';

import { motion, useScroll, useTransform } from 'motion/react';
import type { RefObject } from 'react';

/**
 * Purely decorative animated glow/halo behind the landing hero. It is extracted
 * into its own module and mounted via `dynamic(..., { ssr: false })` so its
 * framer-motion subtree and ~5 infinite animation loops do NOT run during the
 * homepage's initial hydration — that work used to compete with the app shell
 * (sidebar, search, sign-in) for the main thread, delaying interactivity.
 *
 * It renders nothing meaningful for first paint (it is `aria-hidden`, behind all
 * content at `-z-10`), so deferring it to just after hydration has no functional
 * impact; the glow simply fades in a beat later.
 */
export function HeroBackdrop({
  heroRef,
}: {
  heroRef: RefObject<HTMLDivElement | null>;
}) {
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end center'],
  });

  const glowScale = useTransform(scrollYProgress, [0, 1], [1, 0.92]);
  const haloOpacity = useTransform(scrollYProgress, [0, 0.4], [1, 0]);

  return (
    <motion.div
      aria-hidden
      className="absolute inset-0 -z-10"
      style={{ opacity: haloOpacity }}
    >
      <motion.div
        animate={{ rotate: [0, 3, -3, 0] }}
        transition={{
          duration: 12,
          repeat: Number.POSITIVE_INFINITY,
          ease: 'easeInOut',
        }}
        className="absolute inset-0"
      >
        <motion.div
          className="absolute left-1/2 top-1/3 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-brand-primary/20 blur-3xl"
          style={{ scale: glowScale }}
        />
        <motion.div
          className="absolute left-[10%] top-1/2 h-[340px] w-[340px] -translate-y-1/2 rounded-full bg-emerald-500/15 blur-[110px]"
          animate={{ y: [0, -20, 20, 0] }}
          transition={{
            duration: 10,
            repeat: Number.POSITIVE_INFINITY,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute right-[12%] top-[65%] h-[420px] w-[420px] rounded-full bg-sky-500/20 blur-[120px]"
          animate={{ y: [0, 30, -30, 0] }}
          transition={{
            duration: 14,
            repeat: Number.POSITIVE_INFINITY,
            ease: 'easeInOut',
          }}
        />
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.08] via-transparent to-transparent" />
    </motion.div>
  );
}

export default HeroBackdrop;
