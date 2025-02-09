import { ObjectId } from 'mongodb';
import { getCollection, getDb, clientPromise } from './client';
import type { User, Conversation, Message } from './types';

export class DatabaseService {
  // User operations
  static async getUserById(userId: ObjectId): Promise<User | null> {
    const users = await getCollection<User>('users');
    return users.findOne({ _id: userId });
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    const users = await getCollection<User>('users');
    return users.findOne({ email });
  }

  static async updateUserLastLogin(userId: ObjectId): Promise<void> {
    const users = await getCollection<User>('users');
    await users.updateOne(
      { _id: userId },
      {
        $set: {
          lastLoginAt: new Date(),
          updatedAt: new Date()
        }
      }
    );
  }

  static async updateUser(userId: ObjectId, updates: Partial<Omit<User, '_id'>>): Promise<void> {
    const users = await getCollection<User>('users');
    await users.updateOne(
      { _id: userId },
      {
        $set: {
          ...updates,
          updatedAt: new Date()
        }
      }
    );
  }

  // ProblemSet operations
  static async createConversation(
    data: Omit<Conversation, '_id' | 'createdAt' | 'updatedAt' | 'messageCount' | 'lastMessageAt'>
  ): Promise<ObjectId> {
    const conversations = await getCollection<Conversation>('conversations');
    const now = new Date();
  
    const result = await conversations.insertOne({
      ...data,
      createdAt: now,
      updatedAt: now,
      messageCount: 0,
      lastMessageAt: now,
      _id: new ObjectId()
    });
  
    return result.insertedId;
  }

  static async getUserConversations(userId: ObjectId): Promise<Conversation[]> {
    const conversations = await getCollection<Conversation>('conversations');
    return conversations
      .find({ userId })
      .sort({ lastMessageAt: -1 })
      .toArray();
  }

  static async getConversation(id: ObjectId): Promise<Conversation | null> {
    const conversations = await getCollection<Conversation>('conversations');
    return conversations.findOne({ _id: id });
  }

  static async updateConversation(
    id: ObjectId,
    updates: Partial<Omit<Conversation, '_id' | 'userId' | 'createdAt'>>
  ): Promise<void> {
    const conversations = await getCollection<Conversation>('conversations');
    await conversations.updateOne(
      { _id: id },
      {
        $set: {
          ...updates,
          updatedAt: new Date()
        }
      }
    );
  }

  static async deleteConversation(conversationId: ObjectId): Promise<void> {
    const client = await clientPromise;
    const conversations = await getCollection<Conversation>('conversations');
    const messages = await getCollection<Message>('messages');

    const session = client.startSession();

    try {
      await session.withTransaction(async () => {
        // Delete all messages in this conversation
        await messages.deleteMany({
          conversationId
        }, { session });

        // Delete the conversation itself
        await conversations.deleteOne({
          _id: conversationId
        }, { session });
      });
    } finally {
      await session.endSession();
    }
  }

  // Message operations
  static async createMessage(data: Omit<Message, '_id' | 'createdAt'>): Promise<ObjectId> {
    const client = await clientPromise;
    const messages = await getCollection<Message>('messages');
    const conversations = await getCollection<Conversation>('conversations');

    const session = client.startSession();
    let messageId: ObjectId;

    try {
      await session.withTransaction(async () => {
        const now = new Date();
        // Create message
        const result = await messages.insertOne({
          ...data,
          createdAt: now,
          _id: new ObjectId()
        }, { session });

        // Update conversation metadata
        await conversations.updateOne(
          { _id: data.conversationId },
          {
            $inc: { messageCount: 1 },
            $set: {
              lastMessageAt: now,
              updatedAt: now
            }
          },
          { session }
        );

        messageId = result.insertedId;
      });

      return messageId!;
    } finally {
      await session.endSession();
    }
  }

  static async getMessage(id: ObjectId): Promise<Message | null> {
    const messages = await getCollection<Message>('messages');
    return messages.findOne({ _id: id });
  }

  static async getConversationMessages(conversationId: ObjectId): Promise<Message[]> {
    const messages = await getCollection<Message>('messages');
    return messages
      .find({ conversationId })
      .sort({ createdAt: 1 })
      .toArray();
  }

  static async deleteUserData(userId: ObjectId): Promise<void> {
    const client = await clientPromise;
    const conversations = await getCollection<Conversation>('conversations');
    const messages = await getCollection<Message>('messages');
  
    const session = client.startSession();
  
    try {
      await session.withTransaction(async () => {
        // Find all conversations for this user
        const userConversations = await conversations
          .find({ userId }, { session })
          .toArray();
  
        const conversationIds = userConversations.map(conv => conv._id);
  
        // Delete all messages from these conversations
        if (conversationIds.length > 0) {
          await messages.deleteMany({
            conversationId: { $in: conversationIds }
          }, { session });
        }
  
        // Delete all conversations
        await conversations.deleteMany({
          userId
        }, { session });
      });
    } finally {
      await session.endSession();
    }
  }
}