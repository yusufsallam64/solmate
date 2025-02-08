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
  messageCount?: number;
  lastMessageAt?: Date;
}

export interface Message {
  _id: ObjectId;
  conversationId: ObjectId;
  userId: ObjectId;
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  createdAt: Date;
}

