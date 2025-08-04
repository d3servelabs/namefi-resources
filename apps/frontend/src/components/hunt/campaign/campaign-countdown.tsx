'use client';

import { useEffect, useState } from 'react';

interface CampaignCountdownProps {
  endDate?: Date;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const TimeUnit = ({ value, label }: { value: number; label: string }) => (
  <div className="flex flex-col items-center bg-white/3 rounded-lg p-1 w-12">
    <span className="text-xl font-semibold text-white mb-0.5">
      {value.toString().padStart(2, '0')}
    </span>
    <span className="text-xs scale-50 text-white/30 uppercase font-semibold leading-none text-center">
      {label}
    </span>
  </div>
);

const TimeDivider = () => (
  <span className="text-white/30 text-sm font-medium mx-1">:</span>
);

export const CampaignCountdown = ({ endDate }: CampaignCountdownProps) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    if (!endDate) return;

    const calculateTimeLeft = () => {
      const difference = endDate.getTime() - Date.now();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [endDate]);

  return (
    <div className="flex flex-col items-center gap-2 px-8">
      <p className="text-xs text-white/50 my-2">Voting ends in</p>
      <div className="flex items-center gap-1 px-4">
        <TimeUnit value={timeLeft.days} label="days" />
        <TimeDivider />
        <TimeUnit value={timeLeft.hours} label="hours" />
        <TimeDivider />
        <TimeUnit value={timeLeft.minutes} label="minutes" />
        <TimeDivider />
        <TimeUnit value={timeLeft.seconds} label="seconds" />
      </div>
    </div>
  );
};
