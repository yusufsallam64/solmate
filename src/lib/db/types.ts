import { ObjectId } from "mongodb";

export interface User {
  _id: ObjectId;
  email: string;
  name: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date;
}

export interface Conversation {
  _id: ObjectId;
  userId: ObjectId;
  title: string;
  status: 'active' | 'archived';
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt: Date;
  messageCount: number;
}

export interface Message {
  _id: ObjectId;
  conversationId: ObjectId;
  userId: ObjectId;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: Date;
  metadata?: {
    imageUrl?: string;
    latex?: boolean;
    codeSnippet?: {
      language: string;
      code: string;
    };
  };
}