import type { NextApiRequest, NextApiResponse } from 'next';
import { DatabaseService } from '@/lib/db/service';
import { ObjectId } from 'mongodb';
import { authenticateRequest } from '../conversations';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const userId = await authenticateRequest(req, res);
    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    switch (req.method) {
        case 'GET':
            try {
                const user = await DatabaseService.getUserById(new ObjectId(userId));
                if (!user) {
                    return res.status(404).json({ error: 'User not found' });
                }

                res.status(200).json({
                    voiceId: user.voiceId || null,
                    voiceName: user.voiceName || null
                });
            } catch (error) {
                console.error('Error fetching voice settings:', error);
                res.status(500).json({ error: 'Failed to fetch voice settings' });
            }
            break;

        case 'PUT':
            try {
                const { voiceId, voiceName } = req.body;
                if (!voiceId || !voiceName) {
                    return res.status(400).json({ error: 'Voice ID and name are required' });
                }

                await DatabaseService.updateUser(new ObjectId(userId), {
                    voiceId,
                    voiceName
                });

                res.status(200).json({ success: true });
            } catch (error) {
                console.error('Error updating voice settings:', error);
                res.status(500).json({ error: 'Failed to update voice settings' });
            }
            break;

        default:
            res.setHeader('Allow', ['GET', 'PUT']);
            res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}