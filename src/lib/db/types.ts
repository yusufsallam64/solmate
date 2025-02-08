import { ObjectId } from "mongodb";

export interface User {
  _id: ObjectId;
  email: string;
  name: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date;
  // Stripe
  stripeCustomerId?: string;
  subscriptionId?: string;
  subscriptionStatus?: 'active' | 'canceled' | 'past_due' | 'trialing';
  subscriptionPeriodEnd?: Date;
  trialEnd?: Date | null;
  cancelAtPeriodEnd?: boolean;
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