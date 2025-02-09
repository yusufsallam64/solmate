// wallet-tools/tracker.ts
import { priceTracker } from '@/lib/services/PriceTracker';

interface TrackCryptoPriceArgs {
  symbol: string;
  targetPrice: string | number;  // Allow both string and number
  condition: 'above' | 'below';
  volatilityThreshold?: number;
}

interface TrackingResponse {
  symbol: string;
  currentPrice: number;
  targetPrice: number;
  condition: string;
  trackingId: string;
  timestamp: string;
}

export async function trackCryptoPrice(args: TrackCryptoPriceArgs): Promise<TrackingResponse> {
  const { symbol, condition, volatilityThreshold } = args;
  // Convert targetPrice to number
  const targetPrice = typeof args.targetPrice === 'string' ? 
    parseFloat(args.targetPrice) : args.targetPrice;

  if (isNaN(targetPrice)) {
    throw new Error('Invalid target price');
  }

  try {
    // First get the current price
    const currentPrice = await priceTracker.fetchPrice(symbol);

    // Generate a unique tracking ID
    const trackingId = `${symbol}-${Date.now()}`;

    // Set up the price target
    priceTracker.addTarget({
      symbol,
      targetPrice,
      condition,
      volatilityThreshold,
      userId: trackingId
    });

    // Return the response
    return {
      symbol,
      currentPrice,
      targetPrice,
      condition,
      trackingId,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error setting up price tracking:', error);
    throw error;
  }
}