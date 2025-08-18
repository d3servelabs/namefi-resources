'use client';

import { motion } from 'motion/react';
import { useMemo } from 'react';
import styles from './default-hero-background.module.css';

const generateParticles = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 1,
    opacity: Math.random() * 0.8 + 0.2,
    duration: Math.random() * 20 + 10,
    delay: Math.random() * 5,
  }));
};

const generateLightBeams = (count: number) => {
  return Array.from({ length: count }, (_, i) => {
    const baseX = Math.random() * 140 + 20;
    const baseY = Math.random() * 40 - 20;

    return {
      id: i,
      width: Math.random() * 120 + 80,
      height: Math.random() * 800 + 400,
      x: baseX,
      y: baseY,
      opacity: Math.random() * 0.5 + 0.5,
      duration: Math.random() * 8 + 4,
      delay: Math.random() * 6,
    };
  });
};

export const DefaultHeroBackground = () => {
  const particles = useMemo(() => generateParticles(42), []);
  const lightBeams = useMemo(() => generateLightBeams(6), []);

  return (
    <div className={styles.container}>
      {/* Base gradient background */}
      <div className={styles.baseGradient} />

      {/* Animated particles */}
      <div className={styles.particlesContainer}>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className={styles.particle}
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
            }}
            animate={{
              y: [0, -20, 0],
              x: [0, Math.random() * 20 - 10, 0],
              opacity: [
                particle.opacity,
                particle.opacity * 0.3,
                particle.opacity,
              ],
            }}
            transition={{
              duration: particle.duration,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: 'reverse',
              delay: particle.delay,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Animated light beams */}
      <div className={styles.lightBeamsContainer}>
        {lightBeams.map((beam) => (
          <div
            key={beam.id}
            style={{
              transform: 'rotate(45deg) scale(2)',
              transformOrigin: 'top right',
              position: 'absolute',
              width: `${beam.width}px`,
              left: `${beam.x}%`,
              top: 0,
              bottom: 0,
            }}
          >
            <motion.div
              className={styles.lightBeam}
              style={{
                width: `${beam.width}px`,
                top: 0,
                bottom: 0,
              }}
              animate={{
                opacity: [0.5, beam.opacity, 0.5],
                scaleX: [0.9, 1.1, 0.9],
                x: [0, -20, 0],
              }}
              transition={{
                duration: beam.duration,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: 'reverse',
                delay: beam.delay,
                ease: 'easeInOut',
              }}
            />
          </div>
        ))}
      </div>

      {/* Bottom gradient mask */}
      <div className={styles.bottomMask} />
    </div>
  );
};
