import { PublicKey } from '@solana/web3.js';

export type ToolDefinition = {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, {
        type: string;
        description: string;
      }>;
      required?: string[];
    };
  };
};

export type ToolCallResult = {
  tool: string;
  result?: string;
  error?: string;
};

export const AVAILABLE_TOOLS: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'transferSol',
      description: 'Transfer SOL from the bot wallet to a specified address',
      parameters: {
        type: 'object',
        properties: {
          recipient: {
            type: 'string',
            description: 'Solana wallet address to send SOL to'
          },
          amount: {
            type: 'number',
            description: 'Amount of SOL to transfer'
          }
        },
        required: ['recipient', 'amount']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'checkBalance',
      description: 'Check SOL balance of the bot wallet or a specified address',
      parameters: {
        type: 'object',
        properties: {
          address: {
            type: 'string',
            description: 'Optional Solana wallet address to check. If not provided, checks bot wallet balance'
          }
        }
      }
    }
  }
];

export const SYSTEM_PROMPT = `You are a Solana wallet assistant with access to blockchain functionality. 
You can help users interact with their Solana wallet and execute transactions. 
Always verify transaction details and amounts before proceeding.
When handling financial transactions:
1. Confirm the details with the user
2. Check if the amount is reasonable
3. Provide transaction details before execution
4. Warn about any potential risks`;

export async function handleToolCalls(toolCalls: Array<{ name: string; arguments: Record<string, any> }>): Promise<ToolCallResult[]> {
  if (!toolCalls?.length) return [];

  const results: ToolCallResult[] = [];
  
  for (const toolCall of toolCalls) {
    try {
      switch (toolCall.name) {
        case 'transferSol':
          const { recipient, amount } = toolCall.arguments;
          
          // Validate address
          try {
            new PublicKey(recipient);
          } catch (e) {
            throw new Error('Invalid Solana address');
          }

          // Validate amount
          if (amount <= 0) {
            throw new Error('Amount must be greater than 0');
          }

          // TODO: Implement actual transfer logic
          results.push({
            tool: toolCall.name,
            result: `Simulated: Transfer of ${amount} SOL to ${recipient}`
          });
          break;

        case 'checkBalance':
          const { address } = toolCall.arguments;
          
          if (address) {
            try {
              new PublicKey(address);
            } catch (e) {
              throw new Error('Invalid Solana address');
            }
          }

          // TODO: Implement actual balance check
          results.push({
            tool: toolCall.name,
            result: `Simulated: Balance check for ${address || 'bot wallet'}`
          });
          break;

        default:
          results.push({
            tool: toolCall.name,
            error: 'Unknown tool'
          });
      }
    } catch (error) {
      results.push({
        tool: toolCall.name,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return results;
}