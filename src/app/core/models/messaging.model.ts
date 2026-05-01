export interface ConversationItem {
  id: string;
  subject: string;
  participantNames: string[];
  lastMessage: string | null;
  lastMessageAt: string | null;
  createdAt: string;
}

export interface MessageItem {
  id: string;
  senderId: string;
  senderName: string;
  body: string;
  attachmentUrl: string | null;
  sentAt: string;
}

export interface CreateConversationRequest {
  subject: string;
  participantIds: string[];
  firstMessage: string;
}
