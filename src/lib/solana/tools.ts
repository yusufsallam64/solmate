import { Connection, PublicKey, LAMPORTS_PER_SOL, clusterApiUrl, Transaction, SystemProgram } from '@solana/web3.js';
import { formatBalanceResponse, ModelFunction, BalanceToolResult } from './natural';

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

interface DevnetBalance {
  solBalance: number;
  address: string;
}

interface Asset {
  token: string;
  balance: number;
  value: number;
  price: number;
}

export type ToolCallResult = BalanceToolResult;

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
      description: 'Initiate a SOL transfer to another wallet address',
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

async function getDevnetBalance(address: string): Promise<DevnetBalance> {
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

export async function handleToolCalls(toolCalls: Array<{ name: string; arguments: Record<string, any> }>, modelFunction: ModelFunction): Promise<string> {
  if (!toolCalls?.length) throw new Error('No tool calls provided');

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

          const assets: Asset[] = [{
            token: 'SOL',
            balance: solBalance,
            value: solBalance,
            price: 1
          }];

          const formattedBalance = `
            Devnet Wallet Assets:
            Address: ${checkedAddress}
            SOL Balance: ${solBalance.toFixed(4)} SOL`;

          results.push({
            tool: toolCall.name,
            result: formattedBalance
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

          // Get Phantom wallet instance
          const phantom = (window as any).solana;
          if (!phantom) {
            throw new Error('Phantom wallet is not available');
          }

          // Connect to network
          const connection = new Connection(
            network === 'mainnet' 
              ? (process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.mainnet-beta.solana.com')
              : clusterApiUrl(network as 'devnet' | 'testnet'),
            'confirmed'
          );

          // Get sender's public key
          const sender = await phantom.connect();
          const senderPublicKey = sender.publicKey;

          // Create transaction
          const transaction = new Transaction().add(
            SystemProgram.transfer({
              fromPubkey: senderPublicKey,
              toPubkey: new PublicKey(recipient),
              lamports: amount * LAMPORTS_PER_SOL,
            })
          );

          // Get latest blockhash
          const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
          transaction.recentBlockhash = blockhash;
          transaction.feePayer = senderPublicKey;

          // Sign and send transaction
          try {
            const signedTx = await phantom.signTransaction(transaction);
            const rawTransaction = signedTx.serialize();
            const signature = await connection.sendRawTransaction(rawTransaction);

            // Confirm transaction
            await connection.confirmTransaction({
              signature,
              blockhash,
              lastValidBlockHeight
            });

            const successMessage = `Successfully transferred ${amount} SOL to ${recipient} on ${network}. Transaction signature: ${signature}`;
            results.push({
              tool: toolCall.name,
              result: successMessage
            });
          } catch (err) {
            throw new Error(err instanceof Error ? err.message : 'Transaction failed');
          }
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

  try {
    const naturalResponse = await formatBalanceResponse(results, modelFunction);
    return naturalResponse;
  } catch (error) {
    console.error('Error formatting natural response:', error);
    return results[0]?.result || 'Unable to process tool';
  }
}