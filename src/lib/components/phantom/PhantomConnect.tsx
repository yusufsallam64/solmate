import { useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';
import bs58 from 'bs58';

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
      const connection = await phantom.connect();
      const publicKey = connection.publicKey.toString();
      const message = `Sign this message to verify your wallet ownership: ${Date.now()}`;
      const messageBytes = new TextEncoder().encode(message);
      const { signature } = await phantom.signMessage(messageBytes);
      const signatureBase58 = bs58.encode(signature);
      
      await signIn('phantom', {
        publicKey,
        signature: signatureBase58,
        message,
        redirect: true,
        callbackUrl: '/dashboard'
      });
    } catch (error) {
      console.error('Error connecting to Phantom wallet:', error);
      alert('Failed to connect to Phantom wallet. Please try again.');
    }
  };

  if (!phantom) {
    return (
      <div className="p-4 rounded-xl bg-background-900/40 border border-red-500/30 backdrop-blur-sm">
        <p className="text-red-400 text-center">
          Phantom wallet is not installed. Please install it from{' '}
          <a
            href="https://phantom.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-400 hover:text-accent-300 transition-colors duration-200"
          >
            phantom.app
          </a>
        </p>
      </div>
    );
  }

  return (
    <button
      onClick={connectWallet}
      className="group relative w-full flex items-center justify-center gap-3 py-3 px-4 bg-accent-600 hover:bg-accent-500 rounded-xl text-white font-medium transition-all duration-300 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] overflow-hidden"
    >
      <div className="absolute inset-0 bg-accent-400/40 rounded-xl filter blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <img src="/providers/phantom.svg" alt="Phantom" className="relative w-5 h-5" />
      <span className="relative">Continue with Phantom</span>
    </button>
  );
}