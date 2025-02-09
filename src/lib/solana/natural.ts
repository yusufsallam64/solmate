// natural-balance-formatter.ts
import { Connection } from '@solana/web3.js';

export const NATURAL_BALANCE_PROMPT = `You are a helpful wallet assistant providing clear and concise information about crypto balances. When presenting balances:

- Present information in a clear, professional manner
- Round numbers to 2 decimal places for better readability
- Include both token amounts and their USD values
- Summarize the total portfolio value

Example response:
"Your wallet contains 1.50 SOL ($150) and 50 USDC ($50). Total portfolio value: $200."

Keep responses brief and focused on the essential information while maintaining a professional tone.`;

export interface ModelResponse {
  response: string | null;
  tool_calls?: Array<{
    name: string;
    arguments: Record<string, any>;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export type ModelFunction = (messages: any[]) => Promise<ModelResponse>;

export interface BalanceToolResult {
  tool: string;
  result?: string;
  error?: string;
}

export async function formatBalanceResponse(
  toolResults: BalanceToolResult[],
  modelFunction: ModelFunction
): Promise<string> {
  try {
    // Extract the raw balance data
    const balanceResult = toolResults.find(result => result.tool === 'checkBalance');
    
    if (!balanceResult?.result) {
      throw new Error(balanceResult?.error || 'No balance data found');
    }

    // Call the model with our natural language prompt
    const response = await modelFunction([
      { role: 'system', content: NATURAL_BALANCE_PROMPT },
      { role: 'user', content: `Convert this wallet data into a natural, conversational response: ${balanceResult.result}` }
    ]);

    return response.response || 'Unable to format the balance information naturally.';
  } catch (error) {
    console.error('Error formatting balance response:', error);
    throw error;
  }
}