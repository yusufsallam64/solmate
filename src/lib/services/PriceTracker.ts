// lib/services/PriceTracker.ts
import axios from 'axios';
import { EventEmitter } from 'events';
import NodeCache from 'node-cache';

interface PriceTarget {
  symbol: string;
  targetPrice: number;
  condition: 'above' | 'below';
  volatilityThreshold?: number;
  userId: string;
}

interface PriceUpdate {
  symbol: string;
  price: number;
  timestamp: string;
  change?: number;
}

export class PriceTracker extends EventEmitter {
  private targets: Map<string, PriceTarget[]> = new Map();
  private cache: NodeCache;
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private lastPrices: Map<string, number> = new Map();
  
  constructor() {
    super();
    this.cache = new NodeCache({ stdTTL: 60 }); // 60 second cache
  }

  async fetchPrice(symbol: string): Promise<number> {
    const cachedPrice = this.cache.get<number>(symbol);
    if (cachedPrice !== undefined) {
      return cachedPrice;
    }

    try {
      const formattedSymbol = symbol.includes('-USD') ? 
        symbol.toUpperCase() : 
        `${symbol.toUpperCase()}-USD`;

      const response = await axios.get(
        `https://query1.finance.yahoo.com/v8/finance/chart/${formattedSymbol}`,
        {
          params: {
            interval: '1m',
            range: '1d'
          }
        }
      );

      const price = response.data?.chart?.result?.[0]?.meta?.regularMarketPrice;
      if (!price) {
        throw new Error('No price data available');
      }

      this.cache.set(symbol, price);
      return price;
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

  addTarget(target: PriceTarget): void {
    const targets = this.targets.get(target.symbol) || [];
    targets.push(target);
    this.targets.set(target.symbol, targets);
    
    // Start tracking if not already tracking this symbol
    if (!this.intervals.has(target.symbol)) {
      this.startTracking(target.symbol);
    }
  }

  removeTarget(symbol: string, userId: string): void {
    const targets = this.targets.get(symbol) || [];
    const filteredTargets = targets.filter(t => t.userId !== userId);
    
    if (filteredTargets.length === 0) {
      this.targets.delete(symbol);
      this.stopTracking(symbol);
    } else {
      this.targets.set(symbol, filteredTargets);
    }
  }

  private startTracking(symbol: string): void {
    const checkPrice = async () => {
      try {
        const price = await this.fetchPrice(symbol);
        const lastPrice = this.lastPrices.get(symbol);
        const change = lastPrice ? ((price - lastPrice) / lastPrice) * 100 : 0;
        
        const update: PriceUpdate = {
          symbol,
          price,
          timestamp: new Date().toISOString(),
          change
        };

        this.emit('price-update', update);
        
        // Check targets
        const targets = this.targets.get(symbol) || [];
        for (const target of targets) {
          if (this.checkPriceTarget(target, price, change)) {
            this.emit('target-hit', { target, price, change });
          }
        }

        this.lastPrices.set(symbol, price);
      } catch (error) {
        this.emit('error', { symbol, error });
      }
    };

    // Initial check
    checkPrice();
    
    // Set up interval
    const interval = setInterval(checkPrice, 30000); // Check every 30 seconds
    this.intervals.set(symbol, interval);
  }

  private stopTracking(symbol: string): void {
    const interval = this.intervals.get(symbol);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(symbol);
      this.lastPrices.delete(symbol);
    }
  }

  private checkPriceTarget(target: PriceTarget, price: number, change: number): boolean {
    // Check price conditions
    if (target.condition === 'above' && price >= target.targetPrice) {
      return true;
    }
    if (target.condition === 'below' && price <= target.targetPrice) {
      return true;
    }
    
    // Check volatility if threshold is set
    if (target.volatilityThreshold && Math.abs(change) >= target.volatilityThreshold) {
      return true;
    }
    
    return false;
  }

  stopAll(): void {
    for (const symbol of this.intervals.keys()) {
      this.stopTracking(symbol);
    }
    this.targets.clear();
    this.lastPrices.clear();
  }
}

export const priceTracker = new PriceTracker();