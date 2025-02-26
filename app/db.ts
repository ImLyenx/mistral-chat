import Dexie, { type Table } from "dexie";

export interface ChatMessage {
  id?: number;
  timestamp: number;
  role: "user" | "assistant" | "system";
  content: string;
}

export interface Chat {
  id?: number;
  messages: ChatMessage[];
  model: string;
  createdAt: number;
  updatedAt: number;
}

export class ChatDatabase extends Dexie {
  chats!: Table<Chat>;

  constructor() {
    super("ChatDatabase");
    this.version(1).stores({
      chats: "++id, createdAt, updatedAt",
    });
  }
}

export const db = new ChatDatabase();
