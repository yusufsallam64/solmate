// pages/api/crypto/ws.ts
import { Server as WebSocketServer } from 'ws';
import { NextApiRequest, NextApiResponse } from 'next';
import { priceTracker } from '@/lib/services/PriceTracker';

interface WebSocketConnection extends WebSocket {
  userId?: string;
  isAlive?: boolean;
  subscribedSymbols?: Set<string>;
}

let wss: WebSocketServer | null = null;

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!wss) {
    // @ts-ignore - NextJS server is available at res.socket.server
    wss = new WebSocketServer({ server: res.socket.server });
    
    wss.on('connection', (ws: WebSocketConnection) => {
      console.log('New WebSocket connection');
      ws.isAlive = true;
      ws.subscribedSymbols = new Set();

      ws.on('pong', () => {
        ws.isAlive = true;
      });

      ws.on('message', async (message: string) => {
        try {
          const data = JSON.parse(message);
          
          switch (data.type) {
            case 'subscribe': {
              if (data.symbol && typeof data.symbol === 'string') {
                ws.subscribedSymbols?.add(data.symbol);
                // Add price target if provided
                if (data.target) {
                  priceTracker.addTarget({
                    symbol: data.symbol,
                    targetPrice: data.target.price,
                    condition: data.target.condition,
                    volatilityThreshold: data.target.volatilityThreshold,
                    userId: ws.userId || 'anonymous'
                  });
                }
              }
              break;
            }
            
            case 'unsubscribe': {
              if (data.symbol && typeof data.symbol === 'string') {
                ws.subscribedSymbols?.delete(data.symbol);
                priceTracker.removeTarget(data.symbol, ws.userId || 'anonymous');
              }
              break;
            }

            case 'authenticate': {
              if (data.userId) {
                ws.userId = data.userId;
              }
              break;
            }
          }
        } catch (error) {
          console.error('WebSocket message error:', error);
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
        }
      });

      ws.on('close', () => {
        if (ws.subscribedSymbols) {
          for (const symbol of ws.subscribedSymbols) {
            priceTracker.removeTarget(symbol, ws.userId || 'anonymous');
          }
        }
      });
    });

    // Set up price update handler
    priceTracker.on('price-update', (update) => {
      wss?.clients.forEach((client: WebSocketConnection) => {
        if (client.readyState === client.OPEN && client.subscribedSymbols?.has(update.symbol)) {
          client.send(JSON.stringify({
            type: 'price-update',
            data: update
          }));
        }
      });
    });

    // Set up target hit handler
    priceTracker.on('target-hit', (data) => {
      wss?.clients.forEach((client: WebSocketConnection) => {
        if (client.readyState === client.OPEN && 
            client.userId === data.target.userId && 
            client.subscribedSymbols?.has(data.target.symbol)) {
          client.send(JSON.stringify({
            type: 'target-hit',
            data
          }));
        }
      });
    });

    // Heartbeat to keep connections alive
    setInterval(() => {
      wss?.clients.forEach((ws: WebSocketConnection) => {
        if (ws.isAlive === false) {
          return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);
  }

  res.end();
}