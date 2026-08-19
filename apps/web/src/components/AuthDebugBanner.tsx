'use client';

import { useEffect, useState } from 'react';

// TEMPORARY — diagnosing a session-persistence bug. Remove once fixed.
export function AuthDebugBanner() {
  const [info, setInfo] = useState<any>(null);

  useEffect(() => {
    const check = () => setInfo((window as any).__authDebug);
    const interval = setInterval(check, 500);
    return () => clearInterval(interval);
  }, []);

  if (!info) return null;

  return (
    <div style={{ background: '#000', color: '#0f0', fontSize: '10px', padding: '8px', wordBreak: 'break-all', fontFamily: 'monospace' }}>
      <strong>AUTH DEBUG:</strong> status={String(info.status)} ok={String(info.ok)} time={info.time}
      <br />
      cookies visible to JS: {info.cookiesVisible || '(none — expected, httpOnly)'}
      <br />
      body: {info.body}
      {info.caughtError && <><br />caught error: {info.caughtError}</>}
    </div>
  );
}
