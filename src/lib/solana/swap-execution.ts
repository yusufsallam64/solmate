import { Connection, VersionedTransaction } from '@solana/web3.js';
import { SOLANA_CONFIG } from '@/lib/solana/tools';

export interface SwapResult {
  success: boolean;
  signature?: string;
  inputToken: string;
  outputToken: string;
  inputAmount: number;
  estimatedOutput: number;
  error?: string;
}

export async function handleSwap(toolArgumentResults: any): Promise<SwapResult> {
  console.log('Starting handleSwap with arguments:', toolArgumentResults);

  const phantom = (window as any).solana;
  if (!phantom) {
    throw new Error('Phantom wallet is not available');
  }

  try {
    // Connect to wallet if not already connected
    const connection = await phantom.connect();
    const userPublicKey = connection.publicKey.toString();

    // Validate the required data exists
    if (!toolArgumentResults?.quoteResponse) {
      console.error('Invalid tool arguments:', toolArgumentResults);
      throw new Error('Invalid swap arguments received - missing quote response');
    }

    // Get swap transaction from Jupiter
    const swapResponse = await fetch('/api/execute-swap', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        quoteResponse: toolArgumentResults.quoteResponse,
        userPublicKey
      }),
    });

    if (!swapResponse.ok) {
      const error = await swapResponse.json();
      throw new Error(error.error || 'Failed to create swap transaction');
    }

    const swapData = await swapResponse.json();
    console.log('Swap data received:', swapData);

    // Check for errors in swap data
    if (swapData.error) {
      throw new Error(swapData.error);
    }

    if (!swapData.swapTransaction) {
      throw new Error('No swap transaction received from API');
    }

    // Deserialize transaction
    const transaction = VersionedTransaction.deserialize(
      Buffer.from(swapData.swapTransaction, 'base64')
    );

    console.log('Transaction deserialized, requesting signature...');

    // Sign transaction with Phantom
    const signedTransaction = await phantom.signTransaction(transaction);
    console.log('Transaction signed successfully');

    // Send transaction
    const rpcConnection = new Connection(SOLANA_CONFIG.rpcUrl, 'confirmed');
    const signature = await rpcConnection.sendRawTransaction(
      signedTransaction.serialize(),
      {
        skipPreflight: true,
        maxRetries: 3,
        preflightCommitment: 'confirmed'
      }
    );

    console.log('Transaction sent, signature:', signature);

    // Wait for confirmation
    const confirmation = await rpcConnection.confirmTransaction({
      signature,
      blockhash: swapData.blockhash || toolArgumentResults.quoteResponse.blockhash,
      lastValidBlockHeight: swapData.lastValidBlockHeight
    });

    if (confirmation.value.err) {
      throw new Error('Transaction failed to confirm');
    }

    console.log('Transaction confirmed successfully');

    return {
      success: true,
      signature,
      inputToken: toolArgumentResults.inputToken,
      outputToken: toolArgumentResults.outputToken,
      inputAmount: toolArgumentResults.amount,
      estimatedOutput: toolArgumentResults.estimated
    };

  } catch (error) {
    console.error('Error in handleSwap:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      inputToken: toolArgumentResults.inputToken,
      outputToken: toolArgumentResults.outputToken,
      inputAmount: toolArgumentResults.amount,
      estimatedOutput: toolArgumentResults.estimated
    };
  }
}