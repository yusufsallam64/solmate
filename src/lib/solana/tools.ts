// tools.ts
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL, Commitment, clusterApiUrl } from '@solana/web3.js';

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
      description: 'Transfer SOL from the wallet to a specified address',
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
          },
          network: {
            type: 'string',
            description: 'Network to use: mainnet, devnet, or testnet'
          }
        },
        required: ['recipient', 'amount']
      }
    }
  }
];

export async function handleToolCalls(toolCalls: Array<{ name: string; arguments: Record<string, any> }>): Promise<ToolCallResult[]> {
  if (!toolCalls?.length) return [];

  const results: ToolCallResult[] = [];
  
  for (const toolCall of toolCalls) {
    try {
      switch (toolCall.name) {
        case 'transferSol': {
          const { recipient, amount, network = 'devnet' } = toolCall.arguments;
          
          try {
            new PublicKey(recipient);
          } catch (e) {
            throw new Error('Invalid Solana address');
          }

          if (amount <= 0) throw new Error('Amount must be greater than 0');

          const phantom = (window as any).solana;
          if (!phantom) throw new Error('Phantom wallet is not available');

          const connection = await phantom.connect();
          const senderPublicKey = connection.publicKey.toString();

          const rpcConnection = new Connection(
            network === 'mainnet' 
              ? (process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.mainnet-beta.solana.com')
              : clusterApiUrl(network as 'devnet' | 'testnet'),
            'confirmed' as Commitment
          );

          const { blockhash, lastValidBlockHeight } = await rpcConnection.getLatestBlockhash();
          
          const lamports = amount * LAMPORTS_PER_SOL;
          const transaction = new Transaction().add(
            SystemProgram.transfer({
              fromPubkey: new PublicKey(senderPublicKey),
              toPubkey: new PublicKey(recipient),
              lamports,
            })
          );

          transaction.recentBlockhash = blockhash;
          transaction.feePayer = new PublicKey(senderPublicKey);

          const signedTx = await phantom.signTransaction(transaction);
          const rawTransaction = signedTx.serialize();
          const txSignature = await rpcConnection.sendRawTransaction(rawTransaction);

          await rpcConnection.confirmTransaction({
            signature: txSignature,
            blockhash,
            lastValidBlockHeight
          }, 'confirmed');

          results.push({
            tool: toolCall.name,
            result: `Successfully transferred ${amount} SOL to ${recipient}. Transaction ID: ${txSignature}`
          });
          break;
        }

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