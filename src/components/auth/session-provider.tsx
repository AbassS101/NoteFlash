'use client';

import { SessionProvider } from 'next-auth/react';
import React from 'react';

export function ClientSessionProvider({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return <SessionProvider>{children}</SessionProvider>;
}