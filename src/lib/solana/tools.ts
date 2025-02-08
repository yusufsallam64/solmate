// tools.ts
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

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

const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';

const KNOWN_TOKENS = {
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': {
    symbol: 'USDC',
    decimals: 6,
    coingeckoId: 'usd-coin'
  },
  'So11111111111111111111111111111111111111112': {
    symbol: 'SOL',
    decimals: 9,
    coingeckoId: 'solana'
  },
  'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So': {
    symbol: 'mSOL',
    decimals: 9,
    coingeckoId: 'msol'
  }
};

export const AVAILABLE_TOOLS: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'checkBalance',
      description: 'Check token balances and values of a Solana wallet address',
      parameters: {
        type: 'object',
        properties: {
          address: {
            type: 'string',
            description: 'Solana wallet address to check balances for'
          }
        },
        required: ['address']
      }
    }
  }
];

export const SYSTEM_PROMPT = `You are a Solana wallet assistant. You can help users check their wallet balances and view their portfolio.
When a user asks about their balance or holdings, use the checkBalance function with their connected wallet address.
Format numbers nicely and provide clear summaries of their holdings.`;

async function getTokenPrice(coingeckoId: string): Promise<number> {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoId}&vs_currencies=usd`
    );
    const data = await response.json();
    return data[coingeckoId]?.usd || 0;
  } catch (error) {
    console.error('Error fetching price:', error);
    return 0;
  }
}

async function getTokenBalances(address: string) {
  const connection = new Connection(SOLANA_RPC_URL);
  const pubKey = new PublicKey(address);
  
  const solBalance = await connection.getBalance(pubKey);
  const solPrice = await getTokenPrice('solana');
  
  const assets = [{
    token: 'SOL',
    balance: solBalance / LAMPORTS_PER_SOL,
    value: (solBalance / LAMPORTS_PER_SOL) * solPrice,
    price: solPrice
  }];

  try {
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      pubKey,
      { programId: TOKEN_PROGRAM_ID }
    );

    for (const { account } of tokenAccounts.value) {
      const parsedInfo = account.data.parsed.info;
      const mintAddress = parsedInfo.mint;
      const tokenInfo = KNOWN_TOKENS[mintAddress];

      if (tokenInfo && parsedInfo.tokenAmount.uiAmount > 0) {
        const price = await getTokenPrice(tokenInfo.coingeckoId);
        assets.push({
          token: tokenInfo.symbol,
          balance: parsedInfo.tokenAmount.uiAmount,
          value: parsedInfo.tokenAmount.uiAmount * price,
          price
        });
      }
    }

    const totalValue = assets.reduce((sum, asset) => sum + asset.value, 0);
    return { assets, totalValue };

  } catch (error) {
    console.error('Error fetching token balances:', error);
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

          const balances = await getTokenBalances(address);
          
          const formattedResponse = `
Wallet Assets:
${balances.assets.map(asset => 
  `${asset.token}: ${asset.balance.toFixed(4)} (${asset.price ? `$${asset.price.toFixed(2)} per token, ` : ''}$${asset.value.toFixed(2)})`
).join('\n')}

Total Portfolio Value: $${balances.totalValue.toFixed(2)}`;

          results.push({
            tool: toolCall.name,
            result: formattedResponse
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