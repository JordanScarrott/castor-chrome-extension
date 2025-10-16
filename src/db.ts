// src/db.ts
import Dexie, { type EntityTable } from 'dexie';

interface Conversation {
  id: number;
  title: string;
  timestamp: Date;
}

interface Message {
  id: number;
  conversationId: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming: boolean;
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
};

db.version(1).stores({
  conversations: '++id, title, timestamp',
  messages: '++id, conversationId, role, content, timestamp, isStreaming',
});

export type { Conversation, Message };
export { db };
