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
      name: 'checkBalance',
      description: 'Check SOL balance of a Solana wallet address on devnet',
      parameters: {
        type: 'object',
        properties: {
          address: {
            type: 'string',
            description: 'Solana wallet address to check balance for'
          }
        },
        required: ['address']
      }
    }
  },
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

export const SYSTEM_PROMPT = `You are a Solana wallet assistant for devnet testing. You can help users check their wallet balances and transfer SOL on devnet.
When a user asks about their balance, use the checkBalance function with their connected wallet address.
Remember that this is devnet, so only SOL balances are relevant.`;

async function getDevnetBalance(address: string) {
  try {
    const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
    const pubKey = new PublicKey(address);
    const balance = await connection.getBalance(pubKey);
    
    return {
      solBalance: balance / LAMPORTS_PER_SOL,
      address: pubKey.toString()
    };
  } catch (error) {
    console.error('Error fetching devnet balance:', error);
    throw error;
  }
}

export async function handleToolCalls(toolCalls: Array<{ name: string; arguments: Record<string, any> }>): Promise<ToolCallResult[]> {
  if (!toolCalls?.length) return [];

  const results: ToolCallResult[] = [];
  
  for (const toolCall of toolCalls) {
    try {
      switch (toolCall.name) {
        case 'checkBalance':
          const { address } = toolCall.arguments;
          
          if (!address) {
            throw new Error('Address is required');
          }

          try {
            new PublicKey(address);
          } catch (e) {
            throw new Error('Invalid Solana address');
          }

          const { solBalance, address: checkedAddress } = await getDevnetBalance(address);
          
          const formattedResponse = `Devnet Wallet Balance:\nAddress: ${checkedAddress}\nBalance: ${solBalance.toFixed(4)} SOL`;

          results.push({
            tool: toolCall.name,
            result: formattedResponse
          });
          break;

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

          const formattedResponse = `Successfully transferred ${amount} SOL to ${recipient} on ${network} network. Transaction signature: ${txSignature}`;

          results.push({
            tool: toolCall.name,
            result: formattedResponse
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