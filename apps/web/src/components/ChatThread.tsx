'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import type { ChatMessage } from '@/lib/messaging-types';

interface ChatThreadProps {
  conversationId: string;
  readOnly?: boolean; // admin observer mode: no input box
}

export default function ChatThread({ conversationId, readOnly = false }: ChatThreadProps) {
  const { user, authFetch } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadMessages = () => {
    const path = readOnly
      ? `/admin/conversations/${conversationId}/messages`
      : `/conversations/${conversationId}/messages`;
    authFetch(path)
      .then((res) => res.json())
      .then((data) => setMessages(data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 8000); // simple polling refresh
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await authFetch(`/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ body: text.trim() }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? 'Message failed to send');
      }
      setText('');
      loadMessages();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Message failed to send');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="py-8 text-center text-sm text-gray-500">Loading conversation…</div>;
  }

  return (
    <div className="flex flex-col rounded-card border border-gray-200">
      <div className="flex-1 space-y-3 overflow-y-auto p-4" style={{ maxHeight: '60vh', minHeight: '200px' }}>
        {messages.length === 0 && (
          <p className="text-center text-sm text-gray-400">No messages yet.</p>
        )}
        {messages.map((m) => {
          const isMine = m.senderId === user?.id;
          return (
            <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] rounded-card px-3 py-2 text-sm ${
                  isMine ? 'bg-ink text-white' : 'bg-gray-100 text-ink'
                }`}
              >
                {!isMine && m.sender && (
                  <p className="mb-1 text-xs font-semibold opacity-70">
                    {m.sender.firstName} · {m.sender.role}
                  </p>
                )}
                {m.imageUrl && (
                  <img src={m.imageUrl} alt="attachment" className="mb-2 max-h-48 rounded-card" />
                )}
                {m.body && <p className="whitespace-pre-wrap">{m.body}</p>}
                <p className="mt-1 text-[10px] opacity-60">
                  {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {!readOnly && (
        <div className="border-t border-gray-200 p-3">
          {error && <p className="mb-2 text-xs text-chili-600">{error}</p>}
          <div className="flex gap-2">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type a message…"
              className="flex-1 rounded-card border border-gray-300 px-3 py-2 text-sm"
            />
            <button
              onClick={handleSend}
              disabled={sending || !text.trim()}
              className="rounded-card bg-marigold px-4 py-2 text-sm font-semibold text-ink disabled:opacity-50"
            >
              Send
            </button>
          </div>
          <p className="mt-1 text-[10px] text-gray-400">
            Sharing phone numbers or off-platform contact details is not allowed.
          </p>
        </div>
      )}
    </div>
  );
}
