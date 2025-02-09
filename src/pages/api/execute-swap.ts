// pages/api/execute-swap.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { quoteResponse, userPublicKey } = req.body;

    if (!quoteResponse || !userPublicKey) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Call Jupiter API to execute swap
    const swapResponse = await fetch('https://quote-api.jup.ag/v6/swap', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        quoteResponse,
        userPublicKey,
        // Production settings
        wrapUnwrapSOL: true,
        dynamicComputeUnitLimit: true,
        dynamicSlippage: true,
        prioritizationFeeLamports: {
          priorityLevelWithMaxLamports: {
            maxLamports: 100000,
            priorityLevel: "high",
            global: false
          }
        }
      }),
    });

    if (!swapResponse.ok) {
      const errorData = await swapResponse.json();
      console.error('Jupiter API error:', errorData);
      return res.status(400).json({ 
        error: 'Jupiter API error',
        details: errorData
      });
    }

    const swapData = await swapResponse.json();

    // Log full response for debugging
    console.log('Jupiter swap response:', JSON.stringify(swapData, null, 2));

    // Handle simulation errors
    if (swapData.simulationError) {
      console.error('Simulation error:', swapData.simulationError);
      return res.status(400).json({ 
        error: 'Transaction simulation failed',
        details: swapData.simulationError
      });
    }

    // Return necessary transaction data
    return res.status(200).json({
      swapTransaction: swapData.swapTransaction,
      lastValidBlockHeight: swapData.lastValidBlockHeight,
      prioritizationFeeLamports: swapData.prioritizationFeeLamports,
      computeUnitLimit: swapData.computeUnitLimit
    });

  } catch (error) {
    console.error('Error in swap endpoint:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to create swap transaction',
      details: error instanceof Error ? error.stack : undefined
    });
  }
}
