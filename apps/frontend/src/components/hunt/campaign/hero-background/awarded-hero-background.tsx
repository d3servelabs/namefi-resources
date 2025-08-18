'use client';

import { motion } from 'motion/react';
import { useMemo } from 'react';
import styles from './awarded-hero-background.module.css';
import Image from 'next/image';

const generateFallingLights = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    size: Math.random() * 3 + 1,
    opacity: Math.random() * 0.8 + 0.3,
    duration: Math.random() * 4 + 6,
    delay: Math.random() * 2,
  }));
};

export const AwardedHeroBackground = () => {
  const fallingLights = useMemo(() => generateFallingLights(42), []);

  return (
    <div className={styles.container}>
      {/* Base gradient background */}
      <div className={styles.baseGradient} />

      {/* Spotlight beams */}
      <motion.div
        className={styles.spotlightContainer}
        initial={{
          opacity: 0,
        }}
        animate={{
          opacity: 1,
        }}
        transition={{
          duration: 1,
          ease: 'easeOut',
        }}
      >
        <Image
          src="/assets/hunt/hero-bg-4.svg"
          alt="Spotlight beam"
          width={100}
          height={100}
          className={styles.spotlightImage}
        />
      </motion.div>

      {/* Falling light particles */}
      <div className={styles.fallingLightsContainer}>
        {fallingLights.map((light) => (
          <motion.div
            key={light.id}
            className={styles.fallingLight}
            style={{
              left: `${light.x}%`,
              width: `${light.size}px`,
              height: `${light.size}px`,
            }}
            initial={{
              top: '-10px',
              opacity: light.opacity,
            }}
            animate={{
              top: '80%',
              opacity: 0,
            }}
            transition={{
              duration: light.duration,
              repeat: Number.POSITIVE_INFINITY,
              delay: light.delay,
              ease: 'linear',
            }}
          />
        ))}
      </div>

      {/* Bottom gradient mask */}
      <div className={styles.bottomMask} />
    </div>
  );
};
