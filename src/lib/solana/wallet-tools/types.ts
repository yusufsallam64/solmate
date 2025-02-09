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
        enum?: string[];
      }>;
      required?: string[];
    };
  };
};

export interface WalletBalance {
  solBalance: number;
  address: string;
}

export interface Asset {
  token: string;
  balance: number;
  value: number;
  price: number;
}

export interface TokenBalances {
  assets: Asset[];
  totalValue: number;
}

export type ToolCallResult = {
  tool: string;
  result?: string;
  error?: string;
};

export interface SwapQuoteResponse {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  platformFee: null | any;
  priceImpactPct: number;
  routePlan: Array<any>;
  contextSlot: number;
  timeTaken: number;
}

export const TOKENS = {
  SOL: {
    mint: 'So11111111111111111111111111111111111111112',
    decimals: 9,
    symbol: 'SOL'
  },
  USDC: {
    mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    decimals: 6,
    symbol: 'USDC'
  }
};

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
  },
  {
    type: 'function',
    function: {
      name: 'swapTokens',
      description: 'Swap between SOL and USDC using Jupiter Exchange',
      parameters: {
        type: 'object',
        properties: {
          inputToken: {
            type: 'string',
            description: 'Input token (SOL or USDC)',
            enum: ['SOL', 'USDC']
          },
          outputToken: {
            type: 'string',
            description: 'Output token (SOL or USDC)',
            enum: ['SOL', 'USDC']
          },
          amount: {
            type: 'number',
            description: 'Amount of input token to swap'
          }
        },
        required: ['inputToken', 'outputToken', 'amount']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'checkCryptoPrice',
      description: 'Get the current price of any cryptocurrency',
      parameters: {
        type: 'object',
        properties: {
          symbol: {
            type: 'string',
            description: 'The cryptocurrency symbol (e.g., BTC, ETH, SOL)',
          }
        },
        required: ['symbol']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'trackCryptoPrice',
      description: 'Set up real-time price tracking for a cryptocurrency',
      parameters: {
        type: 'object',
        properties: {
          symbol: {
            type: 'string',
            description: 'Cryptocurrency symbol to track (e.g., BTC, ETH, SOL)'
          },
          targetPrice: {
            type: 'number',
            description: 'Target price for alerts'
          },
          condition: {
            type: 'string',
            enum: ['above', 'below'],
            description: 'Price condition to monitor'
          },
          volatilityThreshold: {
            type: 'number',
            description: 'Optional volatility threshold percentage'
          }
        },
        required: ['symbol', 'targetPrice', 'condition']
      }
    }
  }
];