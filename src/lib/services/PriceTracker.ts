// lib/services/PriceTracker.ts
import axios from 'axios';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 60 });

interface PriceTarget {
  symbol: string;
  targetPrice: number;
  condition: 'above' | 'below';
  userId: string;
  email: string;
}

class PriceTracker {
  private targets: PriceTarget[] = [];
  private checkInterval: NodeJS.Timeout | null = null;

  async fetchPrice(symbol: string): Promise<number> {
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
      return price;
    } catch (error) {
      console.error('Error fetching price:', error);
      throw error;
    }
  }

  async sendEmail(email: string, symbol: string, price: number, targetPrice: number, condition: string) {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      await axios.post(`${baseUrl}/api/email/send`, {
        recipientEmail: email,
        subject: `Price Alert: ${symbol} has hit ${condition} $${targetPrice}`,
        body: `The price of ${symbol} is now $${price}, reaching your target of ${condition} $${targetPrice}.`,
      });
      console.log(`Email sent to ${email} for ${symbol}`);
    } catch (error) {
      console.error('Error sending email:', error);
    }
  }

  addTarget(target: PriceTarget) {
    console.log('Adding price target:', target);
    this.targets.push(target);
    if (!this.checkInterval) {
      this.startChecking();
    }
  }

  private startChecking() {
    console.log('Starting price checks');
    this.checkInterval = setInterval(async () => {
      const currentTargets = [...this.targets];
      for (const target of currentTargets) {
        try {
          const price = await this.fetchPrice(target.symbol);
          console.log(`Checking ${target.symbol}: Current price $${price}, Target $${target.targetPrice} ${target.condition}`);
          const isHit = target.condition === 'above' ?
            price >= target.targetPrice :
            price <= target.targetPrice;
          if (isHit) {
            console.log(`Target hit for ${target.symbol}!`);
            this.targets = this.targets.filter(t => t !== target);
            await this.sendEmail(target.email, target.symbol, price, target.targetPrice, target.condition);
          }
        } catch (error) {
          console.error(`Error checking price for ${target.symbol}:`, error);
        }
      }
      if (this.targets.length === 0 && this.checkInterval) {
        console.log('No more targets, stopping checks');
        clearInterval(this.checkInterval);
        this.checkInterval = null;
      }
    }, 1000);
  }
}

export const priceTracker = new PriceTracker();
