import "@/styles/globals.css";
import "katex/dist/katex.min.css";
import type { AppProps } from "next/app";
import ToastWrapper from "@/lib/components/ToastWrapper";
import { SessionProvider } from "next-auth/react";
import { useEffect } from "react";
import { Urbanist, Righteous } from 'next/font/google';

const urbanist = Urbanist({
  subsets: ['latin'],
  variable: '--font-urbanist',
});

const righteous = Righteous({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-righteous',
});

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  useEffect(() => {
    document.title = 'InsightfullyStudy';
  }, []);

  return (
    <main className={`${urbanist.variable} ${righteous.variable}`}>
      <SessionProvider session={session}>
        <Component {...pageProps} />
        <ToastWrapper />
      </SessionProvider>
    </main>
  );
}