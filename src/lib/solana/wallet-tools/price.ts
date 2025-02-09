// wallet-tools/price.ts
import axios from 'axios';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 60 }); // 60 second cache
const YAHOO_API_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart/';

interface PriceResponse {
  symbol: string;
  price: number;
  timestamp: string;
}

async function fetchPrice(symbol: string): Promise<number> {
  const formattedSymbol = symbol.includes('-USD') ? 
    symbol.toUpperCase() : 
    `${symbol.toUpperCase()}-USD`;

  try {
    const response = await axios.get(`${YAHOO_API_BASE}${formattedSymbol}`, {
      params: {
        interval: '1m',
        range: '1d'
      }
    });

    const result = response.data?.chart?.result?.[0];
    if (!result?.meta?.regularMarketPrice) {
      throw new Error('No price data available');
    }

    return result.meta.regularMarketPrice;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded');
      }
      throw new Error(`Failed to fetch price: ${error.message}`);
    }
    throw error;
  }
}

export async function checkCryptoPrice(args: { symbol: string }): Promise<PriceResponse> {
  const { symbol } = args;

  // Check cache first
  const cached = cache.get<PriceResponse>(symbol);
  if (cached) {
    return cached;
  }

  // Fetch new price
  const price = await fetchPrice(symbol);
  
  const response: PriceResponse = {
    symbol,
    price,
    timestamp: new Date().toISOString()
  };

  // Update cache
  cache.set(symbol, response);

  return response;
}