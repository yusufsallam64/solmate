import { PublicKey } from '@solana/web3.js';
import { ModelFunction } from './natural';
import { checkBalance } from './wallet-tools/balance';
import { transferSol } from './wallet-tools/transfer';
import { swapTokens } from './wallet-tools/swap';
import { checkCryptoPrice } from './wallet-tools/price';
import { AVAILABLE_TOOLS, TOKENS } from './wallet-tools/types';

export { AVAILABLE_TOOLS };

export const SOLANA_CONFIG = {
  rpcUrl: process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
  network: process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'mainnet-beta',
  jupiterUrl: 'https://quote-api.jup.ag/v6'
};

export const SYSTEM_PROMPT = `You are a friendly and helpful Solana wallet assistant that can both engage in casual conversation and help with wallet operations.

When to use tools:
1. For "balance", "check balance", or similar queries -> Use checkBalance
2. For transfer requests with amount and recipient -> Use transferSol
3. For swap requests between SOL and USDC -> Use swapTokens
4. Only use tools when explicitly asked about wallet operations

For casual conversation:
1. Respond naturally to greetings, questions about your status, or general queries
2. Don't use tools unless specifically asked about wallet operations
3. Keep responses friendly but professional

For balance checks:
1. Use checkBalance with their wallet address
2. Present the returned data clearly showing SOL, USDC and total value
3. Don't generate additional responses after showing balance data

For transfers:
1. Use transferSol with recipient and amount
2. Confirm the transaction details

For swaps:
1. Use swapTokens for any swap request between SOL and USDC
2. Parse amount and direction from user request
3. Format amount properly and specify input/output tokens
4. Confirm the swap details with estimated output

For price checks:
1. Use checkCryptoPrice with the requested symbol
2. Present the price data clearly in USD
3. Format large numbers with appropriate commas and decimals`;

export async function handleToolCalls(
  toolCalls: Array<{ name: string; arguments: Record<string, any> }>,
  modelFunction: ModelFunction
): Promise<string> {
  if (!toolCalls?.length) throw new Error('No tool calls provided');

  const result = await Promise.all(toolCalls.map(async (toolCall) => {
    try {
      let toolResult;
      
      switch (toolCall.name) {
        case 'checkBalance': {
          const { address } = toolCall.arguments;
          if (!address) throw new Error('Address is required');
          try {
            new PublicKey(address);
          } catch (e) {
            throw new Error('Invalid Solana address');
          }
          toolResult = await checkBalance(toolCall.arguments);
          break;
        }

        case 'transferSol': {
          const { recipient, amount } = toolCall.arguments;
          try {
            new PublicKey(recipient);
          } catch (e) {
            throw new Error('Invalid Solana address');
          }
          if (amount <= 0) throw new Error('Amount must be greater than 0');
          toolResult = await transferSol(toolCall.arguments);
          break;
        }

        case 'swapTokens': {
          const { inputToken, outputToken, amount } = toolCall.arguments;
          if (!TOKENS[inputToken] || !TOKENS[outputToken]) {
            throw new Error('Invalid token selection');
          }
          if (inputToken === outputToken) {
            throw new Error('Cannot swap same tokens');
          }
          toolResult = await swapTokens(toolCall.arguments);
          break;
        }

        case 'checkCryptoPrice': {
          const { symbol } = toolCall.arguments;
          if (!symbol) throw new Error('Symbol is required');
          toolResult = await checkCryptoPrice(toolCall.arguments);
          break;
        }

        default:
          throw new Error(`Unknown tool: ${toolCall.name}`);
      }

      return {
        tool: toolCall.name,
        result: JSON.stringify(toolResult)
      };
    } catch (error) {
      console.error(`Error in ${toolCall.name}:`, error);
      return {
        tool: toolCall.name,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }));

  // If we only have one result and it's not an error, return just that result
  if (result.length === 1 && !result[0].error) {
    const toolResponse = JSON.parse(result[0].result!);
    // If it's a balance check, return the formatted string directly
    if (result[0].tool === 'checkBalance') {
      return toolResponse;
    }
  }

  return JSON.stringify(result);
}