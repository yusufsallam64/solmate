import { PublicKey } from '@solana/web3.js';

export async function transferSol({ 
  recipient, 
  amount, 
  network = 'devnet' 
}: { 
  recipient: string; 
  amount: number; 
  network?: string; 
}) {
  // Input validation is handled in handleToolCalls
  return {
    type: 'PENDING_TRANSACTION',
    recipient,
    amount,
    network
  };
}