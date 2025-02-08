import { PublicKey, PublicKeyInitData } from '@solana/web3.js';
import bs58 from 'bs58';
import { Provider } from 'next-auth/providers/index';
import nacl from 'tweetnacl';

export interface PhantomProfile {
  publicKey: string;
  signature: string;
}

export default function PhantomProvider(): Provider {
  return {
    id: "phantom",
    name: "Phantom",
    type: "credentials",
    credentials: {
      publicKey: { label: "Public Key", type: "text" },
      signature: { label: "Signature", type: "text" },
      message: { label: "Message", type: "text" }
    },
    async authorize(credentials: any) {
      try {
        if (!credentials?.publicKey || !credentials?.signature || !credentials?.message) {
          throw new Error("Missing credentials");
        }

        // Convert the public key string to a PublicKey object
        const publicKey = new PublicKey(credentials.publicKey);
        
        // Decode the base58 signature back to Uint8Array
        const signatureUint8 = bs58.decode(credentials.signature);
        
        // Convert message to Uint8Array
        const messageUint8 = new TextEncoder().encode(credentials.message);
        
        // Verify the signature using tweetnacl
        const verified = nacl.sign.detached.verify(
          messageUint8,
          signatureUint8,
          publicKey.toBytes()
        );

        if (!verified) {
          throw new Error("Invalid signature");
        }

        // Return the user object
        return {
          id: credentials.publicKey,
          name: `Phantom Wallet (${credentials.publicKey.slice(0, 4)}...${credentials.publicKey.slice(-4)})`,
          email: `${credentials.publicKey}@phantom.wallet`,
          walletAddress: credentials.publicKey
        };
      } catch (error) {
        console.error("Authorization error:", error);
        return null;
      }
    }
  };
}