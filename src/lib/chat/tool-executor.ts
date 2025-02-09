import { handleSwap } from '../solana/swap-execution';
import { handleToolCalls as handleTransferToolCalls } from '../solana/transfer';
import { Message } from '../db/types';
import { toast } from 'react-hot-toast';

export interface ToolExecutionResult {
  success: boolean;
  message: Message;
  error?: string;
}

export async function executeToolResponse(
  toolCall: any, 
  conversationId: string,
): Promise<ToolExecutionResult> {
  try {
    if (!toolCall.result) {
      throw new Error('No tool result provided');
    }

    const toolResult = JSON.parse(toolCall.result);
    console.log('Tool result:', toolResult);

    switch (toolCall.tool) {
      case 'swapTokens': {
        const swapResult = await handleSwap(toolResult);
        
        if (swapResult.success) {
          toast.success('Swap successful!');
          return {
            success: true,
            message: {
              _id: `system-${Date.now()}` as any,
              role: 'system',
              content: `Successfully swapped ${swapResult.inputAmount} ${swapResult.inputToken} for approximately ${swapResult.estimatedOutput} ${swapResult.outputToken}. Transaction ID: ${swapResult.signature}`,
              conversationId: conversationId || ('' as any),
              userId: '' as any,
              createdAt: new Date(),
            }
          };
        } else {
          throw new Error(swapResult.error || 'Swap failed');
        }
      }

      case 'transferSol': {
        if (toolResult.type === 'PENDING_TRANSACTION') {
          const response = await handleTransferToolCalls([{
            name: 'transferSol',
            arguments: {
              recipient: toolResult.recipient,
              amount: toolResult.amount,
              network: toolResult.network || 'devnet'
            }
          }]);

          console.log("Transfer response:", response);

          if (response[0].result) {
            toast.success('Transfer successful!');
            return {
              success: true,
              message: {
                _id: `system-${Date.now()}` as any,
                role: 'system',
                content: response[0].result,
                conversationId: conversationId || ('' as any),
                userId: '' as any,
                createdAt: new Date(),
              }
            };
          } else if (response[0].error) {
            throw new Error(response[0].error);
          }
        }
        throw new Error('Invalid transfer result');
      }

      default:
        throw new Error(`Unknown tool: ${toolCall.tool}`);
    }
  } catch (error) {
    console.error('Tool execution error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: {
        _id: `system-${Date.now()}` as any,
        role: 'system',
        content: `Operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        conversationId: conversationId || ('' as any),
        userId: '' as any,
        createdAt: new Date(),
      }
    };
  }
}