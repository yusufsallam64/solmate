// pages/api/email/send.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';

// Create transporter outside request handler for reuse
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.BOT_EMAIL,
    pass: process.env.BOT_PASSWORD,
  },
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { recipientEmail, subject, body } = req.body;

    const recipient = process.env.RECIPIENT_EMAIL;
    if (!subject || !body) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await transporter.sendMail({
      from: process.env.BOT_EMAIL,
      to: recipient,
      subject,
      text: body,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Email send error:', error);
    return res.status(500).json({ error: 'Failed to send email' });
  }
}