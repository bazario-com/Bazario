'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import ChatThread from '@/components/ChatThread';
import type { Conversation } from '@/lib/messaging-types';

export default function AdminMessagesPage() {
  const { authFetch } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'escalated' | 'open'>('all');

  const load = () => {
    const params = new URLSearchParams();
    if (filter === 'escalated') params.set('escalated', 'true');
    if (filter === 'open') params.set('status', 'OPEN');
    authFetch(`/admin/conversations?${params.toString()}`)
      .then((res) => res.json())
      .then(setConversations)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setLoading(true);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const handleResolve = async (id: string) => {
    await authFetch(`/admin/conversations/${id}/resolve`, { method: 'PATCH' });
    load();
  };

  const active = conversations.find((c) => c.id === activeId);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-4 text-2xl font-bold">Messages</h1>

      <div className="mb-4 flex gap-2">
        {(['all', 'escalated', 'open'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-card px-3 py-1.5 text-sm font-medium ${
              filter === f ? 'bg-ink text-white' : 'bg-gray-100 text-ink'
            }`}
          >
            {f === 'all' ? 'All' : f === 'escalated' ? 'Escalated' : 'Open'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[320px_1fr]">
        <div className="rounded-card border border-gray-200">
          {loading && <p className="p-4 text-sm text-gray-400">Loading…</p>}
          {!loading && conversations.length === 0 && (
            <p className="p-4 text-sm text-gray-400">No conversations found.</p>
          )}
          {conversations.map((c) => {
            const lastMessage = c.messages?.[0];
            return (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={`block w-full border-b border-gray-100 p-3 text-left text-sm hover:bg-gray-50 ${
                  activeId === c.id ? 'bg-marigold-50' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">
                    {c.order ? `Order ${c.order.orderNumber}` : c.type}
                  </span>
                  {c.escalated && (
                    <span className="rounded-card bg-chili-50 px-2 py-0.5 text-[10px] font-bold text-chili-600">
                      ESCALATED
                    </span>
                  )}
                </div>
                <p className="mt-1 truncate text-xs text-gray-500">
                  {lastMessage?.body ?? (lastMessage?.imageUrl ? '📷 Image' : 'No messages yet')}
                </p>
                <p className="mt-1 text-[10px] text-gray-400">{c.status}</p>
              </button>
            );
          })}
        </div>

        <div>
          {!active && (
            <div className="flex h-64 items-center justify-center rounded-card border border-dashed border-gray-300 text-sm text-gray-400">
              Select a conversation to view
            </div>
          )}
          {active && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold">
                  {active.order ? `Order ${active.order.orderNumber}` : active.type}
                </h2>
                {active.status !== 'RESOLVED' && (
                  <button
                    onClick={() => handleResolve(active.id)}
                    className="rounded-card bg-ink px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    Mark Resolved
                  </button>
                )}
              </div>
              <ChatThread conversationId={active.id} readOnly />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
