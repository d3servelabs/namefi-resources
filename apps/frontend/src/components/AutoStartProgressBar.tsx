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
const duration = 30;
export const AutoStartProgressBar = forwardRef<AutoStartProgressBar, any>(
  (_, ref) => {
    const motionValue = useMotionValue(0);
    const [value, setValue] = useState(0);
    const rounded = useTransform(motionValue, (latest) =>
      Number.parseFloat(latest.toFixed(1)),
    );

    const [scope, animate] = useAnimate();

    const init = useCallback(() => {
      const controls = animate(motionValue, 90, { duration });
      const jiggle = () => {
        return animate(motionValue, 70, {
          duration: 2,
          onComplete: () => {
            animate(motionValue, 90, { duration: 10, onComplete: jiggle });
          },
        });
      };
      controls.then(jiggle);
      return controls.stop;
    }, [animate, motionValue]);
    // Animate motionValue to the target state whenever it changes
    useEffect(() => {
      return init();
    }, [init]);

    useEffect(() => {
      rounded.on('change', setValue);
    }, [rounded]);

    useImperativeHandle(
      ref,
      () => ({
        finish: () => {
          scope.animations.forEach((animation) => {
            animation.stop();
          });
          animate(motionValue, 100, { duration: 1 });
        },
        reset: () => {
          animate(motionValue, 0, { duration: 1, onComplete: init });
        },
      }),
      [scope, motionValue, init, animate],
    );

    return <Progress value={value} />;
  },
);
