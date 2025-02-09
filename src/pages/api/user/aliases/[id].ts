import { NextApiRequest, NextApiResponse } from 'next';
import { getCollection } from '@/lib/db/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { ObjectId } from 'mongodb';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session?.user?.email) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid alias ID' });
    }

    const aliases = await getCollection('aliases');

    // Verify the alias belongs to the user before deleting
    const result = await aliases.deleteOne({
      _id: new ObjectId(id),
      userEmail: session.user.email
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Alias not found' });
    }

    return res.status(200).json({ message: 'Alias deleted successfully' });
  } catch (error) {
    console.error('Error deleting alias:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}