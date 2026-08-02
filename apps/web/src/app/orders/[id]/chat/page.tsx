'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import ChatThread from '@/components/ChatThread';
import type { Conversation } from '@/lib/messaging-types';

export default function OrderChatPage() {
  const { id: orderId } = useParams<{ id: string }>();
  const { user, authFetch, loading: authLoading } = useAuth();
  const router = useRouter();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [escalating, setEscalating] = useState(false);

  useEffect(() => {
    if (!user) return;
    authFetch('/conversations', {
      method: 'POST',
      body: JSON.stringify({ orderId, type: 'CUSTOMER_VENDOR' }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Could not open conversation');
        return res.json();
      })
      .then(setConversation)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, orderId]);

  const handleEscalate = async () => {
    if (!conversation) return;
    setEscalating(true);
    await authFetch(`/conversations/${conversation.id}/escalate`, { method: 'PATCH' });
    setEscalating(false);
    alert('Admin has been notified and will review this conversation.');
  };

  if (authLoading || loading) return null;

  if (!user) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p>Please log in to view this conversation.</p>
      </div>
    );
  }

  if (error || !conversation) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="text-chili-600">{error ?? 'Conversation not found'}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <button onClick={() => router.back()} className="mb-4 text-sm text-gray-500">
        ← Back
      </button>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Order Chat</h1>
        <button
          onClick={handleEscalate}
          disabled={escalating || conversation.escalated}
          className="rounded-card border border-chili-600 px-3 py-1.5 text-xs font-semibold text-chili-600 disabled:opacity-50"
        >
          {conversation.escalated ? 'Admin notified' : escalating ? 'Notifying…' : 'Contact Admin'}
        </button>
      </div>
      <ChatThread conversationId={conversation.id} />
    </div>
  );
}
