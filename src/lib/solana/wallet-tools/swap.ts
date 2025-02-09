import { TOKENS } from './types';
import { SOLANA_CONFIG } from '../tools';
import { SwapQuoteResponse } from './types';

function normalizeAmount(amount: number | string, token: 'SOL' | 'USDC'): number {
  const parsedAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    throw new Error('Invalid amount');
  }
  return Math.floor(parsedAmount * Math.pow(10, TOKENS[token].decimals));
}

async function getJupiterQuote(inputMint: string, outputMint: string, amount: number) {
  console.log('Getting Jupiter quote for:', { inputMint, outputMint, amount });

  const queryParams = new URLSearchParams({
    inputMint,
    outputMint,
    amount: amount.toString(),
    slippageBps: '50',
    feeBps: '4',
    onlyDirectRoutes: 'false',
    asLegacyTransaction: 'true'
  });

  const response = await fetch(
    `${SOLANA_CONFIG.jupiterUrl}/quote?${queryParams.toString()}`,
    {
      headers: { 'Content-Type': 'application/json' }
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Jupiter API error: ${JSON.stringify(errorData)}`);
  }

  const data = await response.json();
  console.log('Jupiter quote response:', data);
  return data;
}

export async function swapTokens({ 
  inputToken, 
  outputToken, 
  amount 
}: { 
  inputToken: 'SOL' | 'USDC'; 
  outputToken: 'SOL' | 'USDC'; 
  amount: number; 
}) {
  // Input validation is now handled in the main handleToolCalls
  const inputAmount = normalizeAmount(amount, inputToken);
  
  const quoteResponse = await getJupiterQuote(
    TOKENS[inputToken].mint,
    TOKENS[outputToken].mint,
    inputAmount
  );
  
  const estimatedOutput = Number(quoteResponse.outAmount) / 
    Math.pow(10, TOKENS[outputToken].decimals);

  return {
    type: 'PENDING_SWAP',
    quoteResponse,
    inputToken,
    outputToken,
    amount: Number(amount),
    estimated: estimatedOutput
  };
}