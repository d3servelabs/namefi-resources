'use client';
import { Progress } from '@/components/ui/shadcn/progress';
import { useAnimate, useMotionValue, useTransform } from 'motion/react';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react';

export type AutoStartProgressBar = {
  finish: () => void;
  reset: () => void;
};
const duration = 180;
export const AutoStartProgressBar = forwardRef<AutoStartProgressBar, any>(
  (_, ref) => {
    const motionValue = useMotionValue(0);
    const [value, setValue] = useState(0);
    const rounded = useTransform(motionValue, (latest) =>
      Number.parseFloat(latest.toFixed(1)),
    );

    const [scope, animate] = useAnimate();

    const init = useCallback(() => {
      const controls = animate(motionValue, 90, {
        duration,
        damping: 30,
        stiffness: 100,
      });
      return controls.stop;
    }, [animate, motionValue]);
    // Animate motionValue to the target state whenever it changes
    useEffect(() => {
      return init();
    }, [init]);

    useEffect(() => {
      rounded.on('change', setValue);
    }, [rounded]);

    const finish = useCallback(() => {
      for (const animation of scope.animations) {
        animation.stop();
      }
      const currentValue = motionValue.get();
      setTimeout(() => {
        if (currentValue < 70) {
          animate(motionValue, 80, {
            duration: 5,
            damping: 30,
            stiffness: 100,
          }).then(() => {
            animate(motionValue, 100, { duration: 1 });
          });
        } else {
          animate(motionValue, 100, { duration: 1 });
        }
      }, 500);
    }, [animate, motionValue, scope]);

    const reset = useCallback(() => {
      animate(motionValue, 0, { duration: 0, onComplete: init });
    }, [animate, motionValue, init]);

    useImperativeHandle(
      ref,
      () => ({
        finish,
        reset,
      }),
      [finish, reset],
    );

    return <Progress value={value} />;
  },
);
