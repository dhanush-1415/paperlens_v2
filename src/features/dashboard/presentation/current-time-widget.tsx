'use client';

import { useEffect, useState } from 'react';
import { Text } from '@/shared/ui';

export function CurrentTimeWidget() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    const initTimer = setTimeout(() => setTime(new Date()), 0);
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => { clearTimeout(initTimer); clearInterval(timer); };
  }, []);

  if (!time) {
    return (
      <div className="flex flex-col items-end opacity-0">
        <div className="text-3xl font-bold tracking-tight text-brand-primary">--:--:-- --</div>
        <Text size="xs" tone="secondary" className="font-medium tracking-wider uppercase mt-1">LOADING...</Text>
      </div>
    );
  }

  const timeStr = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="flex flex-col items-end">
      <div className="text-3xl font-bold tracking-tight text-brand-primary drop-shadow-sm font-mono">
        {timeStr}
      </div>
      <Text size="xs" tone="secondary" className="font-medium tracking-wider uppercase mt-1">
        {dateStr}
      </Text>
    </div>
  );
}
