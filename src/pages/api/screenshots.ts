import type { NextApiRequest, NextApiResponse } from 'next';
import { runImage } from '@/lib/model/worker';
import { Message } from '@/lib/model/types';

const IMAGE_CAPTIONING_MASTER_PROMPT = `
  You are a computer vision model designed to parse the contents of screenshots and images.
  Look for problems within the images (such as LeetCode questions, mathematical equations/problem statements, etc).
  Additionally, look for solutions to the discovered problems within the same screenshot. 
  If you cannot clearly identify a problem within the screenshot or a user solution, respond solely with: NULL
  If you can identify a problem and answer within the screenshot, respond with:

  Problem Statement:
  Name: *Problem Name*
  Description: *Description of the Problem*
  Equations/Formulas: *Equations/Formulas associated with the problem that are present within the image*
  Topic: *Problem Topic*

  User Solution:
  *The user's solution as presented in the image. Ensure if there are multiple steps that you capture them all in order. The user solution may be handwritten and hard to identify. Decipher any poor handwriting. If there is no identifiable user solution, respond solely with: NULL*

  Do not include any fields you are uncertain about or cannot confidently identify.
`

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { screenshot } = req.body;

    const processedScreenshot = (await runImage(IMAGE_CAPTIONING_MASTER_PROMPT, screenshot)).modelResponse

    if (processedScreenshot === 'NULL') {
      return res.status(200).json({ modelResponse: 'NULL' });
    }

    const messages: Message[] = [{
      role: 'user',
      content: processedScreenshot,
    }];

    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/model/question`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        interactionMessages: messages,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to process with question handler');
    }

    const { modelResponse, title } = await response.json();
    
    res.status(200).json({ processedScreenshot, modelResponse, title });
  } catch (error) {
    console.error('Screenshot processing error:', error);
    res.status(500).json({ modelResponse: 'Failed to process screenshot' });
  }
}