import { ObjectId } from 'mongodb';
import { getCollection, getDb, clientPromise } from './client';
import type { User, ProblemSet, Problem, Message } from './types';

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

  // ProblemSet operations
  static async createProblemSet(
    data: Omit<ProblemSet, '_id' | 'createdAt' | 'updatedAt' | 'problemCount' | 'lastAccessedAt'> & {
      icon?: string | null;
    }
  ): Promise<ObjectId> {
    const problemSets = await getCollection<ProblemSet>('problemSets');
    const now = new Date();
  
    const result = await problemSets.insertOne({
      ...data,
      createdAt: now,
      updatedAt: now,
      problemCount: 0,
      lastAccessedAt: now,
      _id: new ObjectId(),
      icon: data.icon || "default"
    });
  
    return result.insertedId;
  }
  

  static async getUserProblemSets(userId: ObjectId): Promise<ProblemSet[]> {
    const problemSets = await getCollection<ProblemSet>('problemSets');
    return problemSets
      .find({ userId })
      .sort({ lastAccessedAt: -1 })
      .toArray();
  }

  // Problem operations
  static async createProblem(data: Omit<Problem, '_id' | 'createdAt' | 'updatedAt' | 'lastMessageAt' | 'messageCount'>): Promise<ObjectId> {
    const client = await clientPromise;
    const problems = await getCollection<Problem>('problems');
    const problemSets = await getCollection<ProblemSet>('problemSets');

    const session = client.startSession();
    let problemId: ObjectId;

    try {
      await session.withTransaction(async () => {
        const now = new Date();
        // Create problem
        const result = await problems.insertOne({
          ...data,
          createdAt: now,
          updatedAt: now,
          lastMessageAt: now,
          messageCount: 0,
          _id: new ObjectId()
        }, { session });

        // Update problem count in problem set
        await problemSets.updateOne(
          { _id: data.problemSetId },
          {
            $inc: { problemCount: 1 },
            $set: { updatedAt: now }
          },
          { session }
        );

        problemId = result.insertedId;
      });

      return problemId!; // We know this is defined if transaction succeeded
    } finally {
      await session.endSession();
    }
  }

  // Message operations
  static async createMessage(data: Omit<Message, '_id' | 'createdAt'>): Promise<ObjectId> {
    const client = await clientPromise;
    const messages = await getCollection<Message>('messages');
    const problems = await getCollection<Problem>('problems');

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

        // Update problem metadata
        await problems.updateOne(
          { _id: data.problemId },
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

      return messageId!; // We know this is defined if transaction succeeded
    } finally {
      await session.endSession();
    }
  }


  static async deleteProblemSet(problemSetId: ObjectId): Promise<void> {
    const client = await clientPromise;
    const problemSets = await getCollection<ProblemSet>('problemSets');
    const problems = await getCollection<Problem>('problems');
    const messages = await getCollection<Message>('messages');

    const session = client.startSession();

    try {
      await session.withTransaction(async () => {
        // Get all problems in this set
        const problemsInSet = await problems.find({ problemSetId }).toArray();
        const problemIds = problemsInSet.map(p => p._id);

        // Delete all messages for all problems in this set
        await messages.deleteMany({
          problemId: { $in: problemIds }
        }, { session });

        // Delete all problems in this set
        await problems.deleteMany({
          problemSetId
        }, { session });

        // Delete the problem set itself
        await problemSets.deleteOne({
          _id: problemSetId
        }, { session });
      });
    } finally {
      await session.endSession();
    }
  }

  static async getProblemSet(id: ObjectId): Promise<ProblemSet | null> {
    const problemSets = await getCollection<ProblemSet>('problemSets');
    return problemSets.findOne({ _id: id });
  }

  static async updateProblemSet(
    id: ObjectId,
    updates: Partial<Omit<ProblemSet, '_id' | 'userId' | 'createdAt'>>
  ): Promise<void> {
    const problemSets = await getCollection<ProblemSet>('problemSets');
    await problemSets.updateOne(
      { _id: id },
      {
        $set: {
          ...updates,
          updatedAt: new Date()
        }
      }
    );
  }


  static async getProblemSetIdForProblem(problemId: ObjectId): Promise<ObjectId | null> {
    const problem = await this.getProblem(problemId);
    return problem ? problem.problemSetId : null;
  }


  // Update the type of getMessage to include metadata
  static async getMessage(id: ObjectId): Promise<Message | null> {
    const messages = await getCollection<Message>('messages');
    return messages.findOne({ _id: id });
  }

  // Add method to get messages for a problem, sorted by creation time
  static async getProblemMessages(problemId: ObjectId): Promise<Message[]> {
    const messages = await getCollection<Message>('messages');
    return messages
      .find({ problemId })
      .sort({ createdAt: 1 })
      .toArray();
  }

  static async getProblemsInSet(problemSetId: ObjectId): Promise<Problem[]> {
    const problems = await getCollection<Problem>('problems');
    return problems
      .find({ problemSetId })
      .sort({ lastMessageAt: -1 })
      .toArray();
  }

  static async getProblem(id: ObjectId): Promise<Problem | null> {
    const problems = await getCollection<Problem>('problems');
    return problems.findOne({ _id: id });
  }

  static async getProblemsByUserId(userId: ObjectId): Promise<Problem[]> {
    const problems = await getCollection<Problem>('problems');
    return problems
      .find({ userId })
      .sort({ lastMessageAt: -1 })
      .toArray();
  }

  static async updateProblem(
    id: ObjectId,
    updates: Partial<Omit<Problem, '_id' | 'userId' | 'problemSetId' | 'createdAt'>>
  ): Promise<void> {
    const problems = await getCollection<Problem>('problems');
    await problems.updateOne(
      { _id: id },
      {
        $set: {
          ...updates,
          updatedAt: new Date()
        }
      }
    );
  }

  //Stripe

  static async getUserByStripeId(stripeCustomerId: string): Promise<User | null> {
    const users = await getCollection<User>('users');
    return users.findOne({ stripeCustomerId });
  }

  static async updateUserSubscription(
    userId: ObjectId,
    data: {
      subscriptionId?: string;
      status?: string;
      currentPeriodEnd?: Date;
      trialEnd?: Date | null;
      cancelAtPeriodEnd?: boolean;
    }
  ): Promise<void> {
    const users = await getCollection<User>('users');
    console.log('Updating subscription for user:', userId, 'with data:', data); // Add this log

    await users.updateOne(
      { _id: userId },
      {
        $set: {
          subscriptionId: data.subscriptionId,
          subscriptionStatus: data.status as 'active' | 'canceled' | 'past_due' | 'trialing',
          subscriptionPeriodEnd: data.currentPeriodEnd,
          trialEnd: data.trialEnd,
          updatedAt: new Date(), 
          cancelAtPeriodEnd: data.cancelAtPeriodEnd
        }
      }
    );
  }

  static async checkUserSubscription(userId: ObjectId): Promise<boolean> {
    const user = await this.getUserById(userId);
    if (!user || !user.subscriptionStatus || !user.subscriptionPeriodEnd) return false;

    return (
      ['active', 'trialing'].includes(user.subscriptionStatus) ||
      user.subscriptionPeriodEnd > new Date()
    );
  }

  static async updateUser(userId: ObjectId, data: Partial<User>): Promise<void> {
    const users = await getCollection<User>('users');
    await users.updateOne(
      { _id: userId },
      {
        $set: {
          ...data,
          updatedAt: new Date()
        }
      }
    );
  }

  static async getUserSubscription(userId: ObjectId) {
    const user = await this.getUserById(userId);
    if (!user) return null;
    
    return {
      status: user.subscriptionStatus,
      currentPeriodEnd: user.subscriptionPeriodEnd,
      trialEnd: user.trialEnd,
      cancelAtPeriodEnd: user.cancelAtPeriodEnd
    };
  }

}