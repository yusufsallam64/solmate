import { MongoDBAdapter } from "@auth/mongodb-adapter";
import NextAuth, { AuthOptions, User } from "next-auth";
import { Adapter } from "next-auth/adapters";
import GoogleProvider from "next-auth/providers/google";
import jwt from "jsonwebtoken";
import { clientPromise } from "@/lib/db/client";
import { ObjectId } from "mongodb";
import { DatabaseService } from "@/lib/db/service";
import PhantomProvider from "@/lib/components/auth/PhantomProvider";

if (
  !process.env.GOOGLE_CLIENT_ID ||
  !process.env.GOOGLE_CLIENT_SECRET ||
  !process.env.JWT_SECRET
) {
  throw new Error("Missing required environment variables");
}

export const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: "24h" });
};

export const verifyToken = (token: string): { userId: string } => {
  return jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
};

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    PhantomProvider(),
  ],
  adapter: MongoDBAdapter(clientPromise) as Adapter,
  pages: {
    signIn: "/auth/signup",
  },
  callbacks: {
    async signIn({ user, account }) {
      try {
        const existingUser = await DatabaseService.getUserByEmail(
          user.email as string
        );
        const now = new Date();

        if (!existingUser) {
          const userDoc = {
            email: user.email,
            name: user.name,
            imageUrl: user.image,
            createdAt: now,
            updatedAt: now,
            lastLoginAt: now,
            walletAddress: user.walletAddress, // TypeScript now knows about this property
          };

          const client = await clientPromise;
          const collection = client.db("DB").collection("users");
          await collection.insertOne({
            ...userDoc,
            _id: new ObjectId(),
          });
        } else {
          await DatabaseService.updateUserLastLogin(existingUser._id);
          if (account?.provider === "phantom") {
            await DatabaseService.updateUser(existingUser._id, {
              walletAddress: user.walletAddress,
            } as any);
          }
        }
        return true;
      } catch (error) {
        console.error("Error in signIn callback:", error);
        return false;
      }
    },
    
    async session({ session, user }) {
      try {
        if (!session?.user?.email) {
          return session;
        }
        
        const dbUser = await DatabaseService.getUserByEmail(session.user.email);
        if (!dbUser) {
          return session;
        }

        const token = generateToken(dbUser._id.toString());
        
        return {
          ...session,
          token,
          user: {
            ...session.user,
            name: `${session.user.name || dbUser.name}|${dbUser._id.toString()}`,
            image: dbUser.imageUrl || session.user.image,
            email: dbUser.email,
            walletAddress: (dbUser as any).walletAddress,
          }
        };
      } catch (error) {
        console.error("Error in session callback:", error);
        return session;
      }
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/dashboard")) {
        return url;
      }
      if (url.startsWith(baseUrl)) {
        return url;
      }
      return "/dashboard";
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.JWT_SECRET,
};

export default NextAuth(authOptions);
