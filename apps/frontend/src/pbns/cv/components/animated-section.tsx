import { type ReactNode, useRef } from 'react';
import { motion, useInView } from 'motion/react';

interface AnimatedSectionProps {
  children: ReactNode;
  /** Delay before animation starts (in seconds) */
  delay?: number;
  /** Duration of the animation (in seconds) */
  duration?: number;
  /** Whether this section should animate on scroll or immediately */
  triggerOnScroll?: boolean;
  /** Custom animation variants */
  variant?:
    | 'fade-up'
    | 'fade-up-gentle'
    | 'fade-in'
    | 'fade-in-soft'
    | 'slide-up'
    | 'scale-fade'
    | 'scale-fade-gentle';
  /** Stagger children animations */
  staggerChildren?: number;
  /** Class name for the container */
  className?: string;
  /** Custom easing curve */
  customEase?: number[];
}

// Smooth, liquid-like animation variants
const variants = {
  'fade-up': {
    hidden: {
      opacity: 0,
      y: 30,
      scale: 0.98,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
    },
  },
  'fade-up-gentle': {
    hidden: {
      opacity: 0,
      y: 20,
    },
    visible: {
      opacity: 1,
      y: 0,
    },
  },
  'fade-in': {
    hidden: {
      opacity: 0,
      scale: 0.99,
    },
    visible: {
      opacity: 1,
      scale: 1,
    },
  },
  'fade-in-soft': {
    hidden: {
      opacity: 0,
    },
    visible: {
      opacity: 1,
    },
  },
  'slide-up': {
    hidden: {
      opacity: 0,
      y: 50,
    },
    visible: {
      opacity: 1,
      y: 0,
    },
  },
  'scale-fade': {
    hidden: {
      opacity: 0,
      scale: 0.94,
      y: 25,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
    },
  },
  'scale-fade-gentle': {
    hidden: {
      opacity: 0,
      scale: 0.97,
      y: 15,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
    },
  },
};

// Snappy, responsive transition settings
const getTransition = () => ({
  type: 'spring',
  damping: 25,
  stiffness: 150,
  mass: 0.8,
});

export const AnimatedSection = ({
  children,
  delay = 0,
  triggerOnScroll = true,
  variant = 'fade-up',
  staggerChildren,
  className,
}: AnimatedSectionProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, {
    once: true,
    margin: '-10% 0px -10% 0px', // Trigger when 10% of the element is visible
    amount: 0.1,
  });

  const shouldAnimate = triggerOnScroll ? isInView : true;

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={shouldAnimate ? 'visible' : 'hidden'}
      variants={{
        hidden: variants[variant].hidden,
        visible: {
          ...variants[variant].visible,
          transition: staggerChildren
            ? {
                ...getTransition(),
                staggerChildren,
                delayChildren: delay,
              }
            : getTransition(),
        },
      }}
    >
      {children}
    </motion.div>
  );
};

// Child component for staggered animations
export const AnimatedChild = ({
  children,
  className,
  variant = 'fade-up',
}: {
  children: ReactNode;
  className?: string;
  variant?:
    | 'fade-up'
    | 'fade-up-gentle'
    | 'fade-in'
    | 'fade-in-soft'
    | 'slide-up'
    | 'scale-fade'
    | 'scale-fade-gentle';
  duration?: number;
  delay?: number;
  customEase?: number[];
}) => {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: variants[variant].hidden,
        visible: {
          ...variants[variant].visible,
          transition: getTransition(),
        },
      }}
    >
      {children}
    </motion.div>
  );
};
