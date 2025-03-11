// src/app/(auth)/login/page.tsx
import { LoginForm } from '@/components/auth/login-form';
import Link from 'next/link';
import React from 'react';

export default function LoginPage() {
  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center">
        <div className="flex justify-center mb-4 lg:hidden">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-10 w-10 text-primary"
          >
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="text-muted-foreground mt-1">
          Sign in to your account to continue
        </p>
      </div>
      
      <LoginForm />
      
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Don't have an account?{' '}
          <Link href="/register" className="underline font-medium text-primary">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
