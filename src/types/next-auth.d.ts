// src/types/next-auth.d.ts
import "next-auth";
import type { User as PrismaUser } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    }
  }

  interface User extends Partial<PrismaUser> {
    id: string;
  }
}

// Extend the JWT interface to include the user's id
declare module "next-auth/jwt" {
  interface JWT {
    sub?: string;
    name?: string | null;
    email?: string | null;
    picture?: string | null;
  }
}