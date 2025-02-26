import Dexie, { type Table } from "dexie";

export interface ChatMessage {
  id?: number;
  role: "user" | "assistant" | "system";
  content: string;
}

export interface Chat {
  id?: number;
  title: string;
  messages: ChatMessage[];
  model: string;
  createdAt: Date;
  updatedAt: Date;
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
