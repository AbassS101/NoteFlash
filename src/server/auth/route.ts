// src/server/auth/route.ts
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/db/prisma";
import bcrypt from "bcrypt";
import { AuthOptions } from "next-auth";

// Custom adapter that works around the type incompatibilities
const customPrismaAdapter = {
  // Implement only the methods we need
  createUser: async (userData: any) => {
    return await prisma.user.create({ data: userData });
  },
  getUser: async (id: string) => {
    return await prisma.user.findUnique({ where: { id } });
  },
  getUserByEmail: async (email: string) => {
    return await prisma.user.findUnique({ where: { email } });
  },
  // Add other adapter methods as needed
} as any; // Use type assertion for now to work around the issue

export const authOptions: AuthOptions = {
  // Use the custom adapter to avoid type issues
  adapter: customPrismaAdapter,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          return null;
        }

        const passwordMatch = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!passwordMatch) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };