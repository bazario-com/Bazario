'use client';

import { useEffect, useState } from 'react';

function getRemaining(target: number) {
  const diff = Math.max(0, target - Date.now());
  return {
    hours: Math.floor(diff / (1000 * 60 * 60)),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

// Flash sales in this pass run on a rolling "ends N hours from page load"
// window — a real campaign end-time comes with the coupons/marketing-tools
// phase. This keeps the countdown honest rather than hardcoding a fake date.
export function FlashSaleCountdown({ hoursFromNow = 6 }: { hoursFromNow?: number }) {
  const [target] = useState(() => Date.now() + hoursFromNow * 60 * 60 * 1000);
  const [remaining, setRemaining] = useState(() => getRemaining(target));

  useEffect(() => {
    const interval = setInterval(() => setRemaining(getRemaining(target)), 1000);
    return () => clearInterval(interval);
  }, [target]);

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="flex items-center gap-1.5 font-mono text-sm font-semibold text-white" aria-live="polite">
      <span className="rounded bg-ink-900 px-2 py-1">{pad(remaining.hours)}</span>:
      <span className="rounded bg-ink-900 px-2 py-1">{pad(remaining.minutes)}</span>:
      <span className="rounded bg-ink-900 px-2 py-1">{pad(remaining.seconds)}</span>
    </div>
  );
}
