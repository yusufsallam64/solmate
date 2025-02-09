import React, { useEffect, useState } from 'react';
import { Connection, PublicKey, LAMPORTS_PER_SOL, Transaction, SystemProgram, clusterApiUrl } from '@solana/web3.js';

interface PendingTransaction {
  type: 'PENDING_TRANSACTION';
  recipient: string;
  amount: number;
  network: string;
}

interface TransactionResult {
  success: boolean;
  signature: string | null;
  error: string | null;
}

interface TransactionHandlerProps {
  pendingTransactions: PendingTransaction[];
  onTransactionComplete: (result: TransactionResult) => void;
}

const TransactionHandler: React.FC<TransactionHandlerProps> = ({
  pendingTransactions,
  onTransactionComplete
}) => {
  const [status, setStatus] = useState<string>('');

  useEffect(() => {
    console.log('TransactionHandler useEffect triggered', {
      hasPendingTransactions: pendingTransactions?.length > 0,
      pendingTransactions
    });

    const processTransaction = async (txData: PendingTransaction) => {
      console.log('Processing transaction:', txData);
      
      try {
        setStatus('Initiating transaction...');
        
        // Check if Phantom is installed
        const provider = (window as any).phantom?.solana;
        console.log('Phantom provider status:', {
          windowPhantom: !!(window as any).phantom,
          provider: !!provider,
          isPhantom: provider?.isPhantom
        });

        if (!provider?.isPhantom) {
          console.error('Phantom wallet not found:', {
            phantom: (window as any).phantom,
            solana: (window as any).phantom?.solana
          });
          throw new Error('Phantom wallet is not installed');
        }

        // Connect to network
        console.log('Connecting to network:', txData.network);
        const connection = new Connection(
          clusterApiUrl('devnet'),
          'confirmed'
        );

        // Request wallet connection
        setStatus('Connecting to wallet...');
        console.log('Requesting wallet connection...');
        
        let publicKey;
        try {
          const resp = await provider.connect();
          publicKey = resp.publicKey;
          console.log('Wallet connected successfully:', {
            publicKey: publicKey.toString()
          });
        } catch (err) {
          console.error('Wallet connection error:', err);
          throw new Error('Failed to connect to wallet');
        }

        // Create transaction
        console.log('Creating transaction...', {
          amount: txData.amount,
          recipient: txData.recipient
        });
        
        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: new PublicKey(txData.recipient),
            lamports: Math.floor(txData.amount * LAMPORTS_PER_SOL),
          })
        );

        // Get latest blockhash
        console.log('Fetching latest blockhash...');
        const { blockhash } = await connection.getLatestBlockhash('finalized');
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = publicKey;

        // Request signature from user
        setStatus('Please approve the transaction in your wallet...');
        console.log('Requesting transaction signature...');
        
        try {
          const signed = await provider.signAndSendTransaction(transaction);
          console.log('Transaction signed:', signed);
          
          setStatus('Transaction sent! Confirming...');
          
          // Wait for confirmation
          console.log('Waiting for transaction confirmation...');
          await connection.confirmTransaction(signed.signature);
          
          console.log('Transaction confirmed successfully:', {
            signature: signed.signature
          });
          
          setStatus('Transaction successful!');
          onTransactionComplete({
            success: true,
            signature: signed.signature,
            error: null
          });
        } catch (err) {
          console.error('Transaction signing error:', err);
          if ((err as any).message.includes('User rejected')) {
            throw new Error('Transaction rejected by user');
          }
          throw err;
        }
      } catch (error) {
        console.error('Transaction failed:', {
          error,
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        });
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setStatus(`Transaction failed: ${errorMessage}`);
        onTransactionComplete({
          success: false,
          signature: null,
          error: errorMessage
        });
      }
    };

    if (pendingTransactions?.length > 0) {
      processTransaction(pendingTransactions[0]);
    }
  }, [pendingTransactions, onTransactionComplete]);

  // Log status changes
  useEffect(() => {
    console.log('Transaction status changed:', status);
  }, [status]);

  if (!status) {
    console.log('TransactionHandler rendering null - no status');
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
        <h3 className="text-lg font-semibold mb-4">Transaction Status</h3>
        <div className="mb-4">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
        <p className="text-gray-600">{status}</p>
      </div>
    </div>
  );
};

export default TransactionHandler;