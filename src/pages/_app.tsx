import "@/styles/globals.css";
import "katex/dist/katex.min.css";
import "@solana/wallet-adapter-react-ui/styles.css";
import type { AppProps } from "next/app";
import ToastWrapper from "@/lib/components/ToastWrapper";
import { SessionProvider } from "next-auth/react";
import { useEffect, useMemo } from "react";
import { Urbanist, Righteous } from 'next/font/google';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter, TorusWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl, Cluster } from '@solana/web3.js';

const urbanist = Urbanist({
  subsets: ['latin'],
  variable: '--font-urbanist',
});

const righteous = Righteous({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-righteous',
});

// You can change this to 'devnet' or 'testnet' if needed
const network = (process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'mainnet-beta') as Cluster;

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  // Initialize wallet adapters
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new TorusWalletAdapter(),
    ],
    []
  );

  // Get the RPC endpoint
  const endpoint = useMemo(() => {
    return process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl(network);
  }, []);

  useEffect(() => {
    document.title = 'Solana Bot';
  }, []);

  return (
    <main className={`${urbanist.variable} ${righteous.variable}`}>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <SessionProvider session={session}>
              <Component {...pageProps} />
              <ToastWrapper />
            </SessionProvider>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </main>
  );
}