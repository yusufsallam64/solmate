import { PublicKey } from '@solana/web3.js';
import { ModelFunction } from './natural';
import { checkBalance } from './wallet-tools/balance';
import { transferSol } from './wallet-tools/transfer';
import { swapTokens } from './wallet-tools/swap';
import { checkCryptoPrice } from './wallet-tools/price';
import { trackCryptoPrice } from './wallet-tools/tracker';
import { AVAILABLE_TOOLS, TOKENS } from './wallet-tools/types';

export { AVAILABLE_TOOLS };

export const SOLANA_CONFIG = {
  rpcUrl: process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
  network: process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'mainnet-beta',
  jupiterUrl: 'https://quote-api.jup.ag/v6'
};

export const SYSTEM_PROMPT = `
KNOWN ALIASES:
  Alias: Safa; Address:AdsvBAPiBXLh7UtJhPBNa2a1evwmXiBHQtBtPqoigy7;
  When users refer to these aliases in commands, use the corresponding addresses.

You are a friendly Solana wallet assistant. ONLY use tools when users explicitly request wallet operations. For market discussion, trends, or general questions, provide conversational responses using available context.

WHEN TO USE TOOLS (only when explicitly requested):
- checkBalance: Only when user specifically asks "check balance" or similar
- transferSol: Only when user provides both recipient and amount for transfer
- swapTokens: Only when user specifically requests SOL/USDC swap with amount
- checkCryptoPrice: Only when user directly asks for current price of specific token

IMPORTANT: For general questions about markets, trends, or crypto opinions, DO NOT use tools. Instead:
- Provide thoughtful responses based on available context
- Engage in natural conversation
- Share market insights when relevant context is provided
- Maintain a helpful, knowledgeable tone

Example:
✓ "check my balance" -> Use checkBalance
✓ "send 1 SOL to address" -> Use transferSol
✗ "how's the market?" -> Provide conversational response
✗ "thoughts on Solana?" -> Share insights from context`;

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

        case 'trackCryptoPrice': {
          const { symbol, targetPrice, condition, volatilityThreshold } = toolCall.arguments;
          if (!symbol || !targetPrice || !condition) {
            throw new Error('Symbol, targetPrice, and condition are required');
          }
          toolResult = await trackCryptoPrice(toolCall.arguments);
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