// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import { authOptions } from '@/server/auth/route';

// Export the NextAuth handler
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
