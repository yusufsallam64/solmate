import { NextApiRequest, NextApiResponse } from 'next';
import { getCollection } from '@/lib/db/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';

const isValidSolanaAddress = (address: string): boolean => {
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  return base58Regex.test(address);
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);
    
  if (!session?.user?.email) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  switch (req.method) {
    case 'GET':
      return handleGet(req, res, session.user.email);
    case 'POST':
      return handlePost(req, res, session.user.email);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse,
  userEmail: string
) {
  try {
    const aliases = await getCollection('aliases');
    const userAliases = await aliases
      .find({ userEmail })
      .toArray();

    return res.status(200).json(userAliases.map(({ _id, alias, address }) => ({
      id: _id.toString(),
      alias,
      address
    })));
  } catch (error) {
    console.error('Error fetching aliases:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handlePost(
  req: NextApiRequest,
  res: NextApiResponse,
  userEmail: string
) {
  try {
    const { alias, address } = req.body;

    // Validation
    if (!alias || !address) {
      return res.status(400).json({ error: 'Alias and address are required' });
    }

    if (!isValidSolanaAddress(address)) {
      return res.status(400).json({ error: 'Invalid Solana address format' });
    }

    const aliases = await getCollection('aliases');

    // Check if alias already exists for this user
    const existingAlias = await aliases.findOne({
      userEmail,
      alias: alias
    });

    if (existingAlias) {
      return res.status(400).json({ error: 'Alias already exists' });
    }

    // Insert new alias
    const result = await aliases.insertOne({
      userEmail,
      alias,
      address,
      createdAt: new Date()
    });

    return res.status(201).json({
      id: result.insertedId.toString(),
      alias,
      address
    });
  } catch (error) {
    console.error('Error creating alias:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}