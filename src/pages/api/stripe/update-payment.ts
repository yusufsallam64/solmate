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

    console.log("update payment: ", req.headers.authorization);
    const userId = await authenticateRequest(req, res);
    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const user = await DatabaseService.getUserById(new ObjectId(userId));
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (!user.stripeCustomerId) {
            return res.status(400).json({ error: 'No associated Stripe customer' });
        }

        const portalSession = await stripe.billingPortal.sessions.create({
            customer: user.stripeCustomerId,
            return_url: `${process.env.NEXTAUTH_URL}/settings/billing`,
            configuration: process.env.STRIPE_PORTAL_CONFIGURATION_ID, // Optional: if you have a specific portal configuration
            flow_data: {
                type: 'payment_method_update',
            },
        });

        res.json({ url: portalSession.url });
    } catch (error) {
        console.error('Error creating payment update session:', error);
        res.status(500).json({ error: 'Failed to create payment update session' });
    }
}