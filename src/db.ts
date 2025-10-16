// src/db.ts
import Dexie, { type EntityTable } from 'dexie';

interface Conversation {
  id: number;
  title: string;
  timestamp: number;
}
interface Message {
  id: number;
  conversationId: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isStreaming: boolean;
}

interface Analysis {
  id: number;
  conversationId: number;
  topic: string;
  status: 'analyzing' | 'complete';
  ideas: string[];
}

const db = new Dexie('MangleDatabase') as Dexie & {
  conversations: EntityTable<
    Conversation,
    'id'
  >;
  messages: EntityTable<
    Message,
    'id'
  >;
  analysis: EntityTable<
    Analysis,
    'id'
  >;
};

db.version(1).stores({
  conversations: '++id, title, timestamp',
  messages: '++id, conversationId, role, timestamp, isStreaming',
  analysis: '++id, conversationId, topic, status'
});

// Optional helper to initialize a conversation if needed
export async function ensureConversation({ id, title }: { id?: number, title?: string }) {
  if (id) {
    const found = await db.conversations.get(id);
    if (found) return found;
  }
  const timestamp = Date.now();
  const convId = await db.conversations.add({
    title: title || 'New conversation',
    timestamp
  });
  return db.conversations.get(convId);
}

export type { Conversation, Message };
export { db };
