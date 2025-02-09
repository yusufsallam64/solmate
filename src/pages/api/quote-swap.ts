import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { inputMint, outputMint, amount } = req.query;

    if (!inputMint || !outputMint || !amount) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Ensure we're working with single string values
    const inputMintStr = Array.isArray(inputMint) ? inputMint[0] : inputMint;
    const outputMintStr = Array.isArray(outputMint) ? outputMint[0] : outputMint;
    const amountStr = Array.isArray(amount) ? amount[0] : amount;

    const quoteResponse = await fetch(
      `https://api.jup.ag/swap/v1/quote?inputMint=${inputMintStr}&outputMint=${outputMintStr}&amount=${amountStr}&slippageBps=50&restrictIntermediateTokens=true`
    );

    if (!quoteResponse.ok) {
      throw new Error('Failed to fetch quote from Jupiter');
    }

    const quoteData = await quoteResponse.json();
    return res.status(200).json(quoteData);
  } catch (error) {
    console.error('Error in quote endpoint:', error);
    return res.status(500).json({ error: 'Failed to get quote' });
  }
}