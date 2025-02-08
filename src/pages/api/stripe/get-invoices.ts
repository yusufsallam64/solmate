import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { DatabaseService } from '@/lib/db/service';
import { authenticateRequest } from '../problemsets';
import { ObjectId } from 'mongodb';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-11-20.acacia'
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

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

        const invoices = await stripe.invoices.list({
            customer: user.stripeCustomerId,
            limit: 12, // Last 12 invoices
        });

        // Format invoices for frontend
        const formattedInvoices = invoices.data.map(invoice => ({
            id: invoice.id,
            amount: invoice.amount_paid,
            status: invoice.status,
            date: invoice.created,
            pdfUrl: invoice.invoice_pdf,
            periodStart: invoice.period_start,
            periodEnd: invoice.period_end,
        }));

        res.json(formattedInvoices);
    } catch (error) {
        console.error('Error fetching invoices:', error);
        res.status(500).json({ error: 'Failed to fetch invoices' });
    }
}