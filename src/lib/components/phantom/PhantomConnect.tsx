import { useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';
import bs58 from 'bs58';

// Add type definition for Phantom
type PhantomWindow = Window & {
  solana?: {
    isPhantom?: boolean;
    connect: () => Promise<{ publicKey: { toString: () => string } }>;
    signMessage: (message: Uint8Array) => Promise<{ signature: Uint8Array }>;
  };
};

declare const window: PhantomWindow;

export default function PhantomConnect() {
  const [phantom, setPhantom] = useState<typeof window.solana>(null);

  useEffect(() => {
    if (window.solana?.isPhantom) {
      setPhantom(window.solana);
    }
  }, []);

  const connectWallet = async () => {
    try {
      // Connect to Phantom
      const connection = await phantom.connect();
      const publicKey = connection.publicKey.toString();

      // Create a message for signing
      const message = `Sign this message to verify your wallet ownership: ${Date.now()}`;
      const messageBytes = new TextEncoder().encode(message);

      // Request signature - this returns { signature: Uint8Array }
      const { signature } = await phantom.signMessage(messageBytes);

      // Convert signature to base58 string for transmission
      const signatureBase58 = bs58.encode(signature);

      // Sign in with NextAuth using Phantom provider
      await signIn('phantom', {
        publicKey,
        signature: signatureBase58,
        message,
        redirect: true,
        callbackUrl: '/dashboard'
      });
    } catch (error) {
      console.error('Error connecting to Phantom wallet:', error);
      // You might want to show an error message to the user
      alert('Failed to connect to Phantom wallet. Please try again.');
    }
  };

  if (!phantom) {
    return (
      <div className="text-red-500">
        Phantom wallet is not installed. Please install it from{' '}
        <a 
          href="https://phantom.app/" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="underline hover:text-red-600"
        >
          phantom.app
        </a>
      </div>
    );
  }

  return (
    <button
      onClick={connectWallet}
      className="w-full flex items-center justify-center space-x-2 py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
    >
      <img src="/providers/phantom.svg" alt="Phantom" className="w-5 h-5" />
      <span>Continue with Phantom</span>
    </button>
  );
}