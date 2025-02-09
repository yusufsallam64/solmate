import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { TokenBalances } from './types';
import { SOLANA_CONFIG } from '../tools';

const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

async function fetchSolPrice(): Promise<number> {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
    const data = await response.json();
    return data.solana.usd;
  } catch (error) {
    console.error('Error fetching SOL price:', error);
    return 0;
  }
}

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
        value: usdcBalance,
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

export async function checkBalance({ address }: { address: string }) {
  // Input validation is handled in handleToolCalls
  const balances = await getTokenBalances(address);
  
  return `Your wallet contains ${balances.assets[0].balance.toFixed(2)} SOL ($${balances.assets[0].value.toFixed(2)}) and ${balances.assets[1].balance.toFixed(2)} USDC ($${balances.assets[1].value.toFixed(2)}). Total portfolio value: $${balances.totalValue.toFixed(2)}`;
}