'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

function RegisterForm() {
  const { register } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    referralCode: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) setForm((f) => ({ ...f, referralCode: ref }));
  }, [searchParams]);

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register({
        ...form,
        referralCode: form.referralCode.trim() || undefined,
      });
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="mb-6 text-2xl font-bold">Create your Shopina account</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="firstName" className="mb-1 block text-sm font-medium">
              First name
            </label>
            <input
              id="firstName"
              required
              value={form.firstName}
              onChange={update('firstName')}
              className="w-full rounded-card border border-line px-4 py-2.5 focus-visible:outline-2 focus-visible:outline-marigold"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="mb-1 block text-sm font-medium">
              Last name
            </label>
            <input
              id="lastName"
              required
              value={form.lastName}
              onChange={update('lastName')}
              className="w-full rounded-card border border-line px-4 py-2.5 focus-visible:outline-2 focus-visible:outline-marigold"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={form.email}
            onChange={update('email')}
            className="w-full rounded-card border border-line px-4 py-2.5 focus-visible:outline-2 focus-visible:outline-marigold"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={12}
            value={form.password}
            onChange={update('password')}
            className="w-full rounded-card border border-line px-4 py-2.5 focus-visible:outline-2 focus-visible:outline-marigold"
          />
          <p className="mt-1 text-xs text-muted">
            At least 12 characters, with an uppercase letter, lowercase letter, number and symbol.
          </p>
        </div>

        <div>
          <label htmlFor="referralCode" className="mb-1 block text-sm font-medium">
            Referral code <span className="font-normal text-muted">(optional)</span>
          </label>
          <input
            id="referralCode"
            value={form.referralCode}
            onChange={update('referralCode')}
            placeholder="e.g. SHOPAB12"
            className="w-full rounded-card border border-line px-4 py-2.5 uppercase focus-visible:outline-2 focus-visible:outline-marigold"
          />
        </div>

        {error && <p className="text-sm text-chili">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-card bg-marigold px-6 py-3 font-semibold text-ink transition hover:bg-marigold-600 disabled:opacity-60"
        >
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-ink hover:text-marigold-600">
          Log in
        </Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}
