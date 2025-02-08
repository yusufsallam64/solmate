import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface User {
    walletAddress?: string;
    imageUrl?: string;
  }

  interface Session {
    token?: string;
    user: {
      walletAddress?: string;
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    walletAddress?: string;
  }
}