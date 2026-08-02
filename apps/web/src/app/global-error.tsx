'use client';

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  return (
    <html>
      <body style={{ padding: 20, fontFamily: 'monospace', fontSize: 14, whiteSpace: 'pre-wrap' }}>
        <h2>Error caught:</h2>
        <p>{error.message}</p>
        <h3>Stack:</h3>
        <p>{error.stack}</p>
        <h3>Digest:</h3>
        <p>{error.digest}</p>
      </body>
    </html>
  );
}
