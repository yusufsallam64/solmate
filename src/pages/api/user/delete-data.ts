import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { DatabaseService } from '@/lib/db/service';
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getSession({ req });
    if (!session?.user?.email) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get the user from the database
    const user = await DatabaseService.getUserByEmail(session.user.email);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete all user data
    await DatabaseService.deleteUserData(user._id);

    return res.status(200).json({ message: 'Data deleted successfully' });

  } catch (error) {
    console.error('Error deleting user data:', error);
    return res.status(500).json({ error: 'Failed to delete data' });
  }
}