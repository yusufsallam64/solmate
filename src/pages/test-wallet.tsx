// TestWalletPage.tsx
import { useState, useEffect } from 'react';
import { PublicKey, Connection, clusterApiUrl } from '@solana/web3.js';
import { useSession } from 'next-auth/react';
import { handleToolCalls } from '@/lib/solana/tools';

// Constants
const DEVNET_CONNECTION = new Connection(clusterApiUrl('devnet'), 'confirmed');
const AIRDROP_AMOUNT = 2 * 1000000000; // 2 SOL in lamports for devnet

export default function TestWalletPage() {
  const { data: session, status } = useSession();
  const [balance, setBalance] = useState('');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [isAirdropping, setIsAirdropping] = useState(false);

  useEffect(() => {
    if (session?.user) {
      const address = session.user.walletAddress;
      if (address) {
        setWalletAddress(address);
        handleCheckBalance(address);
      }
    }
  }, [session]);

  const handleCheckBalance = async (address?: string) => {
    try {
      const pubKey = new PublicKey(address || walletAddress);
      console.log('Checking devnet balance for address:', pubKey.toString());
      
      // Force devnet connection
      const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
      console.log('Using devnet connection:', connection.rpcEndpoint);
      
      const balance = await connection.getBalance(pubKey);
      console.log('Raw balance:', balance);
      
      setBalance(`${(balance / 1000000000).toFixed(4)} SOL`);
      setError('');
    } catch (err) {
      console.error('Balance check error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handleAirdrop = async () => {
    if (!walletAddress) return;
    setIsAirdropping(true);
    try {
      const pubKey = new PublicKey(walletAddress);
      const signature = await DEVNET_CONNECTION.requestAirdrop(pubKey, AIRDROP_AMOUNT);
      await DEVNET_CONNECTION.confirmTransaction(signature);
      setResult('Successfully received 2 devnet SOL!');
      setTimeout(() => handleCheckBalance(), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to airdrop');
    } finally {
      setIsAirdropping(false);
    }
  };

  const handleTransfer = async () => {
    try {
      if (!recipient || !amount) throw new Error('All fields required');
      if (!walletAddress) throw new Error('Wallet not connected');
      new PublicKey(recipient); // Validate recipient address
      const numericAmount = parseFloat(amount);
      if (isNaN(numericAmount) || numericAmount <= 0) throw new Error('Invalid amount');

      const response = await handleToolCalls([{
        name: 'transferSol',
        arguments: {
          sender: walletAddress,
          recipient,
          amount: numericAmount,
          network: 'devnet' // Specify devnet
        }
      }]);

      if (response[0].error) throw new Error(response[0].error);
      
      setResult(response[0].result || 'Transaction successful');
      setError('');
      setTimeout(() => handleCheckBalance(), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  if (status === 'loading') {
    return <div className="container mx-auto p-4">Loading...</div>;
  }

  if (!session) {
    return (
      <div className="container mx-auto p-4">
        Please sign in to access the wallet test page.
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Devnet Wallet</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Connected Wallet</h2>
          <p className="text-sm font-mono mb-4 break-all bg-gray-50 p-2 rounded">
            {walletAddress || 'No wallet connected'}
          </p>
          
          <div className="mb-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold mb-2">Devnet Balance</h2>
                <p className="text-lg">{balance || 'N/A'}</p>
              </div>
              <div className="space-x-2">
                <button
                  onClick={() => handleCheckBalance()}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Refresh
                </button>
                <button
                  onClick={handleAirdrop}
                  disabled={isAirdropping}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400"
                >
                  {isAirdropping ? 'Airdropping...' : 'Get 2 SOL'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Recipient Address
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full p-2 border rounded mt-1"
                placeholder="Enter Solana devnet address"
              />
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              SOL Amount
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full p-2 border rounded mt-1"
                placeholder="0.00"
                step="0.0001"
                min="0.0001"
              />
            </label>
          </div>

          <button
            onClick={handleTransfer}
            disabled={!walletAddress}
            className="w-full py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Send SOL (Devnet)
          </button>

          {result && (
            <div className="p-3 bg-green-50 text-green-800 rounded-md">
              <p className="font-medium">Success:</p>
              <p className="break-all text-sm">{result}</p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 text-red-800 rounded-md">
              <p className="font-medium">Error:</p>
              <p className="text-sm">{error}</p>
            </div>
          )}
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-md">
          <h3 className="font-semibold text-blue-800 mb-2">Devnet Information</h3>
          <ul className="list-disc pl-5 text-sm text-blue-700 space-y-2">
            <li>You are using Solana's devnet - no real SOL is being transferred</li>
            <li>Get free devnet SOL using the "Get 2 SOL" button (devnet allows larger airdrops)</li>
            <li>Practice transactions safely without risking real funds</li>
            <li>Verify transactions on <a 
              href="https://explorer.solana.com/?cluster=devnet" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-900 underline"
            >
              Solana Devnet Explorer
            </a></li>
          </ul>
        </div>
      </div>
    </div>
  );
}