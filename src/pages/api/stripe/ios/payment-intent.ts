// pages/api/stripe/payment-intent.ts
import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { DatabaseService } from '@/lib/db/service';
import { verifyToken } from '../../auth/[...nextauth]';
import { ObjectId } from 'mongodb';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia'
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    const { userId } = verifyToken(token);
    const user = await DatabaseService.getUserById(new ObjectId(userId));
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let customerId = user.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user._id.toString()
        }
      });
      customerId = customer.id;
      await DatabaseService.updateUser(user._id, { stripeCustomerId: customerId });
    }

    // Create subscription first
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{
        price: process.env.STRIPE_PRICE_ID,
      }],
      trial_period_days: 7,
      payment_settings: {
        save_default_payment_method: 'on_subscription'
      },
      metadata: {
        userId: user._id.toString()
      }
    });

    // Create setup intent for saving payment method
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
      metadata: {
        subscription_id: subscription.id
      }
    });

    // Create ephemeral key
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customerId },
      { apiVersion: '2024-11-20.acacia' }
    );

    res.json({
      subscriptionId: subscription.id,
      clientSecret: setupIntent.client_secret,
      customerId: customerId,
      ephemeralKey: ephemeralKey.secret,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
}