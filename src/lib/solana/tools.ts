import { Connection, PublicKey, LAMPORTS_PER_SOL, Transaction, SystemProgram } from '@solana/web3.js';
import { formatBalanceResponse, ModelFunction, BalanceToolResult } from './natural';

const SOLANA_CONFIG = {
  rpcUrl: process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'http://localhost:8899',
  network: process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'localnet'
};

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

interface WalletBalance {
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
      description: 'Check SOL balance of a Solana wallet address',
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
          }
        },
        required: ['recipient', 'amount']
      }
    }
  }
];

export const SYSTEM_PROMPT = `You are a friendly and helpful Solana wallet assistant that can both engage in casual conversation and help with wallet operations.

When to use tools:
1. For "balance", "check balance", or similar queries -> Use checkBalance
2. For transfer requests with amount and recipient -> Use transferSol
3. Only use tools when explicitly asked about wallet operations

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
2. Confirm the transaction details`;


interface TokenBalances {
  assets: Asset[];
  totalValue: number;
}

const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

async function getTokenBalances(address: string): Promise<TokenBalances> {
  try {
    const connection = new Connection(SOLANA_CONFIG.rpcUrl, 'confirmed');
    const pubKey = new PublicKey(address);
    
    // Get SOL balance
    const balance = await connection.getBalance(pubKey);
    const solPrice = await fetchSolPrice();
    const solBalance = balance / LAMPORTS_PER_SOL;
    const solValue = solBalance * solPrice;
    
    // Get USDC balance
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(pubKey, {
      programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
    });
    
    let usdcBalance = 0;
    for (const { account } of tokenAccounts.value) {
      const parsedData = account.data.parsed.info;
      if (parsedData.mint === USDC_MINT.toString()) {
        usdcBalance = parsedData.tokenAmount.uiAmount || 0;
        break;
      }
    }
    
    const assets = [
      {
        token: 'SOL',
        balance: solBalance,
        value: solValue,
        price: solPrice
      },
      {
        token: 'USDC',
        balance: usdcBalance,
        value: usdcBalance, // USDC is pegged to USD, so 1 USDC = $1
        price: 1
      }
    ];
    
    const totalValue = assets.reduce((sum, asset) => sum + asset.value, 0);
    
    return {
      assets,
      totalValue
    };
  } catch (error) {
    console.error('Error fetching token balances:', error);
    throw error;
  }
}

async function fetchSolPrice(): Promise<number> {
  try {
    // You can replace this with your preferred price feed
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
    const data = await response.json();
    return data.solana.usd;
  } catch (error) {
    console.error('Error fetching SOL price:', error);
    return 0; // Return 0 if price fetch fails
  }
}

async function getWalletBalance(address: string): Promise<WalletBalance> {
  try {
    const connection = new Connection(SOLANA_CONFIG.rpcUrl, 'confirmed');
    const pubKey = new PublicKey(address);
    const balance = await connection.getBalance(pubKey);
    
    return {
      solBalance: balance / LAMPORTS_PER_SOL,
      address: pubKey.toString()
    };
  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    throw error;
  }
}

export async function handleToolCalls(toolCalls: Array<{ name: string; arguments: Record<string, any> }>, modelFunction: ModelFunction): Promise<string> {
  if (!toolCalls?.length) throw new Error('No tool calls provided');

  const results: ToolCallResult[] = [];
  
  for (const toolCall of toolCalls) {
    try {
      switch (toolCall.name) {
        case 'checkBalance': {
          const { address } = toolCall.arguments;
          if (!address) throw new Error('Address is required');
          
          try {
            new PublicKey(address);
          } catch (e) {
            throw new Error('Invalid Solana address');
          }
  
          const balances = await getTokenBalances(address);
          
          // Format directly without additional model calls
          return `Your wallet contains ${balances.assets[0].balance.toFixed(2)} SOL ($${balances.assets[0].value.toFixed(2)}) and ${balances.assets[1].balance.toFixed(2)} USDC ($${balances.assets[1].value.toFixed(2)}). Total portfolio value: $${balances.totalValue.toFixed(2)}`;
        }

          case 'transferSol': {
            const { recipient, amount, network = 'devnet' } = toolCall.arguments;
            
            try {
              new PublicKey(recipient);
            } catch (e) {
              throw new Error('Invalid Solana address');
            }
  
            if (amount <= 0) throw new Error('Amount must be greater than 0');
  
            // Instead of executing the transaction, return a pending transaction
            const pendingTransaction = {
              type: 'PENDING_TRANSACTION',
              recipient,
              amount,
              network
            };
  
            results.push({
              tool: toolCall.name,
              result: JSON.stringify(pendingTransaction)
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
  
    try {
      console.log("RESULTS IN TOOLS", results);
      return JSON.stringify(results);
    } catch (error) {
      console.error('Error formatting natural response:', error);
      return JSON.stringify(results[0]);
    }
  }
