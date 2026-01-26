/**
 * Lazy-loaded confetti celebration helper.
 *
 * This module defers loading of canvas-confetti until a celebration is actually
 * triggered, keeping it out of the initial client module graph for /domains.
 * This reduces Turbopack compile time and filesystem cache writes.
 */

export const triggerCelebrationAtPosition = async (x: number, y: number) => {
  try {
    // Lazy load confetti on each use (module is cached by bundler)
    const confetti = (await import('canvas-confetti')).default;
    const colors = ['#22c55e', '#4ade80', '#86efac', '#bbf7d0', '#dcfce7'];

    // Small burst from the toggle position
    confetti({
      particleCount: 30,
      spread: 50,
      origin: { x, y },
      colors,
      startVelocity: 15,
      gravity: 0.6,
      scalar: 0.5,
      ticks: 40,
      shapes: ['circle'],
      drift: 0,
    });
  } catch (error) {
    console.error('Failed to load confetti', error);
  }
};
