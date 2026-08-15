'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';

interface RewardsTransaction {
  id: string;
  points: number;
  type: 'EARNED' | 'REDEEMED' | 'ADJUSTED';
  reason: string | null;
  createdAt: string;
}

interface RewardsData {
  pointsBalance: number;
  lifetimePoints: number;
  recentTransactions: RewardsTransaction[];
}

const NEXT_MILESTONE = 2000;

export default function RewardsPage() {
  const { user, authFetch, loading: authLoading } = useAuth();
  const [rewards, setRewards] = useState<RewardsData | null>(null);

  useEffect(() => {
    if (!user) return;
    authFetch('/rewards/me')
      .then((res) => (res.ok ? res.json() : null))
      .then(setRewards)
      .catch(() => setRewards(null));
  }, [user, authFetch]);

  if (authLoading) return null;
  if (!user) {
    return (
      <div className="py-16 text-center">
        <h1 className="mb-2 text-xl font-bold">Log in to see your rewards</h1>
        <Link href="/login" className="rounded-card bg-marigold px-6 py-3 font-semibold text-ink-700">Log in</Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-ink-700">Your Rewards</h1>

      {rewards === null ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : (
        <>
          <div className="rounded-card bg-ink-700 p-6 text-white">
            <p className="text-sm text-white/70">Points Balance</p>
            <p className="font-display text-3xl font-extrabold">{rewards.pointsBalance}</p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-marigold"
                style={{ width: `${Math.min(100, (rewards.pointsBalance / NEXT_MILESTONE) * 100)}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-white/60">
              {rewards.pointsBalance} / {NEXT_MILESTONE} points to your next milestone
            </p>
            <p className="mt-4 text-xs text-white/50">Lifetime points earned: {rewards.lifetimePoints}</p>
          </div>

          <h2 className="mb-3 mt-8 text-sm font-bold text-ink-700">Recent Activity</h2>
          {rewards.recentTransactions.length === 0 ? (
            <p className="rounded-card bg-surface p-6 text-center text-sm text-muted shadow-card">
              You'll see your points activity here once you start earning.
            </p>
          ) : (
            <ul className="space-y-2">
              {rewards.recentTransactions.map((tx) => (
                <li key={tx.id} className="flex items-center justify-between rounded-card bg-surface p-3 shadow-card">
                  <div>
                    <p className="text-sm font-medium text-ink-700">{tx.reason ?? tx.type}</p>
                    <p className="text-xs text-muted">{new Date(tx.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-sm font-semibold ${tx.points >= 0 ? 'text-marigold-600' : 'text-chili-600'}`}>
                    {tx.points >= 0 ? '+' : ''}{tx.points}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
