export type ConversationType = 'ORDER_VERIFICATION' | 'CUSTOMER_VENDOR' | 'VENDOR_ADMIN_SUPPORT';
export type ConversationStatus = 'OPEN' | 'RESOLVED';

export interface MessageSender {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: string;
  body: string | null;
  imageUrl: string | null;
  filtered: boolean;
  readAt: string | null;
  createdAt: string;
  sender?: MessageSender;
}

export interface Conversation {
  id: string;
  orderId: string | null;
  type: ConversationType;
  status: ConversationStatus;
  escalated: boolean;
  createdAt: string;
  updatedAt: string;
  messages?: ChatMessage[];
  participants?: { user: MessageSender }[];
  order?: { id: string; orderNumber: string } | null;
}
