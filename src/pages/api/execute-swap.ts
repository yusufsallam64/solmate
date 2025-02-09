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

    // Mainnet-optimized settings
    const swapResponse = await fetch('https://api.jup.ag/swap/v1/swap', {
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
        dynamicSlippage: true, // Use dynamic slippage for better prices
        prioritizationFeeLamports: {
          priorityLevelWithMaxLamports: {
            maxLamports: 100000, // 0.0001 SOL max for priority fees
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
    console.log('Jupiter response:', JSON.stringify(swapData, null, 2));

    if (swapData.simulationError) {
      console.error('Simulation error:', swapData.simulationError);
      return res.status(400).json({ 
        error: 'Transaction simulation failed. Please check your balances and try again.',
        details: swapData.simulationError
      });
    }

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