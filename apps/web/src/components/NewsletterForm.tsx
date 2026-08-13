'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

export function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || status === 'loading') return;
    setStatus('loading');
    setErrorMsg('');
    try {
      await api.newsletter.subscribe(email.trim());
      setStatus('success');
      setEmail('');
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(
        err?.message?.includes('already subscribed')
          ? "You're already subscribed!"
          : 'Something went wrong — please try again.',
      );
    }
  };

  if (status === 'success') {
    return <p className="text-sm font-medium text-marigold-600">✓ You're subscribed! Watch your inbox for deals.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        className="w-full rounded-card border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/50 outline-none focus-visible:outline-2 focus-visible:outline-marigold sm:w-64"
        aria-label="Email address"
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        className="rounded-card bg-marigold px-6 py-2.5 text-sm font-semibold text-ink-700 transition hover:bg-marigold-600 disabled:opacity-60"
      >
        {status === 'loading' ? 'Subscribing…' : 'Subscribe'}
      </button>
      {status === 'error' && <p className="text-xs text-chili-400 sm:absolute sm:mt-10">{errorMsg}</p>}
    </form>
  );
}
