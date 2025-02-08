import { buffer } from 'micro';
import Stripe from 'stripe';
import { NextApiRequest, NextApiResponse } from 'next';
import { DatabaseService } from '@/lib/db/service';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
   apiVersion: '2024-11-20.acacia',
});

const webhookSecret = process.env.NODE_ENV === 'production'
   ? process.env.STRIPE_WEBHOOK_SECRET_PROD
   : process.env.STRIPE_WEBHOOK_SECRET_LOCAL;

export const config = {
   api: {
      bodyParser: false,
   },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
   if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
   }

   try {
      const buf = await buffer(req);
      const sig = req.headers['stripe-signature']!;
      console.log('Received webhook with signature:', sig);

      let event;
      try {
         event = stripe.webhooks.constructEvent(buf, sig, webhookSecret!);
         console.log('Received Stripe webhook event:', event.type); // Add this log
      } catch (err: any) {
         console.error('Webhook signature verification failed:', err.message);
         return res.status(400).json({ error: `Webhook Error: ${err.message}` });
      }

      switch (event.type) {
         case 'customer.subscription.created':
         case 'customer.subscription.updated': {
            const subscription = event.data.object as Stripe.Subscription;
            const customerId = subscription.customer as string;
            console.log('Processing subscription for customer:', customerId); // Add this log

            const user = await DatabaseService.getUserByStripeId(customerId);
            console.log('Found user:', user?._id); // Add this log

            if (user) {
               await DatabaseService.updateUserSubscription(user._id, {
                  subscriptionId: subscription.id,
                  status: subscription.status,
                  currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                  trialEnd: subscription.trial_end
                     ? new Date(subscription.trial_end * 1000)
                     : null,
                  cancelAtPeriodEnd: subscription.cancel_at_period_end
               });
               console.log('Updated user subscription'); // Add this log
            } else {
               console.error('User not found for customer:', customerId);
            }
            break;
         }

         case 'customer.subscription.deleted': {
            const subscription = event.data.object as Stripe.Subscription;
            const customerId = subscription.customer as string;
            const user = await DatabaseService.getUserByStripeId(customerId);

            if (user) {
               await DatabaseService.updateUserSubscription(user._id, {
                  status: 'canceled',
                  currentPeriodEnd: new Date(subscription.current_period_end * 1000)
               });
            }
            break;
         }

         case 'invoice.payment_failed': {
            const subscription = event.data.object as Stripe.Invoice;
            const customerId = subscription.customer as string;
            const user = await DatabaseService.getUserByStripeId(customerId);
            
            if (user) {
                await DatabaseService.updateUserSubscription(user._id, {
                    status: 'past_due',
                    currentPeriodEnd: new Date() // Current access ends now
                });
            }
            break;
        }
                
         default:
            console.log(`Unhandled event type ${event.type}`);
      }

      res.json({ received: true });
   } catch (err: any) {
      console.error('Error processing webhook:', err);
      res.status(500).json({ error: `Webhook handler failed: ${err.message}` });
   }
}