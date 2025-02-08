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

export type SubjectIcon = 
  'general' |
  'math' | 
  'science' | 
  'computer' | 
  'chemistry' | 
  'physics' | 
  'biology';

export interface ProblemSet {
  _id: ObjectId;
  userId: ObjectId;
  title: string;
  description?: string;
  subject?: string;
  icon?: SubjectIcon;
  topic?: string;
  status: 'active' | 'archived' | 'completed';
  createdAt: Date;
  updatedAt: Date;
  problemCount: number;
  lastAccessedAt: Date;
}
export interface Problem {
  _id: ObjectId;
  problemSetId: ObjectId;
  userId: ObjectId;
  title: string;
  description?: string;
  status: 'unsolved' | 'in_progress' | 'solved' | 'needs_review';
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt: Date;
  messageCount: number;
}

export interface Message {
  _id: ObjectId;
  problemId: ObjectId;
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