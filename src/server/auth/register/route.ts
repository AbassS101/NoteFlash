// src/server/auth/register/route.ts
import NextAuth from "next-auth";
import { authOptions } from "@/server/auth/route";

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };