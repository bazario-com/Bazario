'use client';

import { useEffect, useState } from 'react';

interface Announcement {
  id: string;
  message: string;
  type: string;
}

const TYPE_STYLES: Record<string, string> = {
  SALE: 'bg-marigold text-ink',
  VENDOR_SPOTLIGHT: 'bg-ink text-white',
  INFO: 'bg-surface text-ink border-b border-line',
};

export function AnnouncementBar() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_URL;
    fetch(`${base}/announcements/active`)
      .then((res) => res.json())
      .then(setAnnouncements)
      .catch(() => setAnnouncements([]));
  }, []);

  useEffect(() => {
    if (announcements.length < 2) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % announcements.length);
    }, 6000);
    return () => clearInterval(id);
  }, [announcements.length]);

  if (announcements.length === 0) return null;

  const current = announcements[index];

  return (
    <div className={`px-4 py-2 text-center text-sm font-medium ${TYPE_STYLES[current.type] ?? TYPE_STYLES.INFO}`}>
      {current.message}
    </div>
  );
}
