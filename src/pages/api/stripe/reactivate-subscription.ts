import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { DatabaseService } from '@/lib/db/service';
import { authenticateRequest } from '../problemsets';
import { ObjectId } from 'mongodb';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-11-20.acacia'
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    console.log("reactivate subscription: ", req.headers.authorization);
    const userId = await authenticateRequest(req, res);
    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const user = await DatabaseService.getUserById(new ObjectId(userId));
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (!user.subscriptionId) {
            return res.status(400).json({ error: 'No subscription found' });
        }

        // Remove the cancellation at period end
        const subscription = await stripe.subscriptions.update(user.subscriptionId, {
            cancel_at_period_end: false,
        });

        // Update local database
        await DatabaseService.updateUserSubscription(user._id, {
            status: subscription.status,
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: false
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error reactivating subscription:', error);
        res.status(500).json({ error: 'Failed to reactivate subscription' });
    }
}