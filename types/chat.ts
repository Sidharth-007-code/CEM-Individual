export interface ChatMessage {
  id?: string;
  senderId: string;
  senderName?: string;
  text: string;
  createdAt: any;
}

export interface Conversation {
  id: string;
  participantIds: string[];
  participantNames?: Record<string, string>;
  listingId: string;
  listingTitle?: string;
  lastMessage?: string;
  updatedAt: any;
}

