'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

// Deliberately relative, NOT process.env.NEXT_PUBLIC_API_URL — this file is
// browser-only ('use client'), and routing auth calls through this site's
// own origin (proxied to the real API via next.config.js rewrites) makes
// the refresh-token cookie first-party. Browsers increasingly block
// third-party cookies by default, which broke sessions on reload when this
// pointed at the cross-subdomain api.shopina.pk URL directly.
const API_BASE_URL = '/api/v1';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ accessToken: string; user: AuthUser }>;
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    referralCode?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  authFetch: (path: string, init?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// The access token is intentionally kept ONLY in memory (React state), never
// in localStorage/sessionStorage — that would be readable by any injected
// script (XSS). The refresh token lives in an httpOnly cookie the browser
// sends automatically; JS never touches it directly.
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const applyAuthResult = (result: { accessToken: string; user: AuthUser }) => {
    setAccessToken(result.accessToken);
    setUser(result.user);
  };

  const silentRefresh = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('no session');
      const data = await res.json();
      applyAuthResult(data);
    } catch {
      setAccessToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    silentRefresh();
  }, [silentRefresh]);

  const login = async (email: string, password: string) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message ?? 'Login failed');
    }
    const data = await res.json();
    applyAuthResult(data);
    return data;
  };

  const register = async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    referralCode?: string;
  }) => {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message ?? 'Registration failed');
    }
    applyAuthResult(await res.json());
  };

  const logout = async () => {
    await fetch(`${API_BASE_URL}/auth/logout`, { method: 'POST', credentials: 'include' });
    setAccessToken(null);
    setUser(null);
  };

  // Wraps authenticated requests with a single automatic retry-after-refresh
  // if the access token has expired mid-session.
  const authFetch = async (path: string, init: RequestInit = {}): Promise<Response> => {
    const doFetch = (token: string | null) =>
      fetch(`${API_BASE_URL}${path}`, {
        ...init,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...init.headers,
        },
      });

    let res = await doFetch(accessToken);
    if (res.status === 401) {
      const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (refreshRes.ok) {
        const data = await refreshRes.json();
        applyAuthResult(data);
        res = await doFetch(data.accessToken);
      }
    }
    return res;
  };

  return (
    <AuthContext.Provider
      value={{ user, accessToken, loading, login, register, logout, authFetch }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
