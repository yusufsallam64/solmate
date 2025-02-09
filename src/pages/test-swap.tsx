import React, { useState } from 'react';
import { Connection, PublicKey, VersionedTransaction } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { toast } from 'react-hot-toast';

const COMMON_TOKENS = [
  { mint: 'So11111111111111111111111111111111111111112', symbol: 'SOL', decimals: 9 },
  { mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', symbol: 'USDC', decimals: 6 },
];

const SOLANA_RPC = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';

export default function TestSwap() {
  const { publicKey, signTransaction, connected } = useWallet();
  const [amount, setAmount] = useState('');
  const [inputToken, setInputToken] = useState(COMMON_TOKENS[0]);
  const [outputToken, setOutputToken] = useState(COMMON_TOKENS[1]);
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState(null);
  const [error, setError] = useState('');
  const [connection] = useState(() => {
    const connectionConfig = {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 60000,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    return new Connection(SOLANA_RPC, connectionConfig);
  });
  const [txSignature, setTxSignature] = useState('');

  const getQuote = async () => {
    if (!amount || !inputToken || !outputToken) return;
    setError('');
    setLoading(true);

    try {
      const inputAmount = parseFloat(amount) * Math.pow(10, inputToken.decimals);
      const response = await fetch(
        `/api/quote-swap?inputMint=${inputToken.mint}&outputMint=${outputToken.mint}&amount=${inputAmount}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch quote');
      }

      const data = await response.json();
      setQuote(data);
    } catch (error) {
      setError('Failed to get quote: ' + error.message);
      console.error('Error fetching quote:', error);
    } finally {
      setLoading(false);
    }
  };

  const executeSwap = async () => {
    if (!quote || !publicKey || !signTransaction) {
      toast.error('Please connect wallet and get a quote first');
      return;
    }

    setLoading(true);
    try {
      // Check SOL balance first with error handling
      let balance;
      try {
        balance = await connection.getBalance(publicKey);
      } catch (balanceError) {
        console.error('Error fetching balance:', balanceError);
        // Continue with the swap even if balance check fails
        balance = Infinity; // Assume sufficient balance, let the transaction fail if insufficient
      }

      const minimumSol = 10000000; // 0.01 SOL for fees
      if (balance < minimumSol) {
        toast.error('Insufficient SOL for transaction fees. Please ensure you have at least 0.01 SOL.');
        return;
      }

      // Get the swap transaction
      const response = await fetch('/api/execute-swap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quoteResponse: quote,
          userPublicKey: publicKey.toString(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Show user-friendly error message if available
        const errorMessage = data.userMessage || data.error || 'Failed to create swap transaction';
        throw new Error(errorMessage);
      }

      // Deserialize and sign the transaction
      const transaction = VersionedTransaction.deserialize(
        Buffer.from(data.swapTransaction, 'base64')
      );

      const signedTransaction = await signTransaction(transaction);

      // Send the signed transaction with retries
      const signature = await connection.sendRawTransaction(
        signedTransaction.serialize(),
        {
          skipPreflight: true,
          maxRetries: 3
        }
      );

      // Show transaction signature immediately
      toast.success(
        <div>
          Transaction sent!
          <a
            href={`https://solscan.io/tx/${signature}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-700 ml-2"
          >
            View on Solscan
          </a>
        </div>,
        { duration: 10000 }
      );

      // Wait for confirmation
      const confirmation = await connection.confirmTransaction(signature);

      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
      }

      toast.success('Swap completed successfully!');
      setAmount('');
      setQuote(null);

    } catch (error) {
      console.error('Swap error:', error);
      toast.error(error.message || 'Failed to execute swap');
    } finally {
      setLoading(false);
    }
  };

  const formatOutputAmount = (amount: string) => {
    if (!amount) return '0';
    return (parseFloat(amount) / Math.pow(10, outputToken.decimals)).toFixed(outputToken.decimals);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-lg mx-auto bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Test Swap</h2>
          <WalletMultiButton className="px-4 py-2 bg-blue-500 text-white rounded-md" />
        </div>

        <div className="p-6 space-y-6">
          {/* Input Token Section */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">From</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={inputToken.mint}
              onChange={(e) => {
                const token = COMMON_TOKENS.find(t => t.mint === e.target.value);
                if (token) setInputToken(token);
              }}
            >
              {COMMON_TOKENS.map((token) => (
                <option key={token.mint} value={token.mint}>
                  {token.symbol}
                </option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Output Token Section */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">To</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={outputToken.mint}
              onChange={(e) => {
                const token = COMMON_TOKENS.find(t => t.mint === e.target.value);
                if (token) setOutputToken(token);
              }}
            >
              {COMMON_TOKENS.map((token) => (
                <option key={token.mint} value={token.mint}>
                  {token.symbol}
                </option>
              ))}
            </select>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Quote Display */}
          {quote && (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">
                Estimated output: {formatOutputAmount(quote.outAmount)} {outputToken.symbol}
              </p>
              <p className="text-sm text-gray-600">
                Price impact: {quote.priceImpactPct}%
              </p>
            </div>
          )}

          {/* Transaction Link */}
          {txSignature && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <a
                href={`https://solscan.io/tx/${txSignature}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-green-600 hover:text-green-800"
              >
                View transaction on Solscan →
              </a>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={getQuote}
              disabled={loading || !amount}
              className={`flex-1 px-4 py-2 rounded-md text-white font-medium ${loading || !amount
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700'
                }`}
            >
              {loading ? 'Getting Quote...' : 'Get Quote'}
            </button>

            <button
              onClick={executeSwap}
              disabled={loading || !quote || !connected}
              className={`flex-1 px-4 py-2 rounded-md text-white font-medium ${loading || !quote || !connected
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-500 hover:bg-green-600 active:bg-green-700'
                }`}
            >
              {loading ? 'Swapping...' : 'Swap'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}