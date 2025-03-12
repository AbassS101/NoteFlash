'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import React from 'react';

export default function AuthErrorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  
  // Auto-redirect back to login after a short delay
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/login');
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [router]);
  
  const getErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case 'Signin':
        return 'Try signing in with a different account.';
      case 'OAuthSignin':
        return 'Try signing in with a different provider.';
      case 'OAuthCallback':
        return 'Try signing in with a different provider.';
      case 'OAuthCreateAccount':
        return 'Try signing in with a different provider.';
      case 'EmailCreateAccount':
        return 'Try signing in with a different email.';
      case 'Callback':
        return 'Try signing in with a different account.';
      case 'OAuthAccountNotLinked':
        return 'To confirm your identity, sign in with the same account you used originally.';
      case 'EmailSignin':
        return 'Check your email address.';
      case 'CredentialsSignin':
        return 'Sign in failed. Check the details you provided are correct.';
      case 'UserExists':
        return 'A user with this email already exists.';
      default:
        return 'An unexpected error occurred. Please try again later.';
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mt-6">Authentication Error</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            There was a problem with the authentication process.
          </p>
        </div>
        
        <Alert variant="destructive" className={undefined}>
          <AlertDescription className={undefined}>
            {error ? getErrorMessage(error) : 'An unknown error occurred'}
          </AlertDescription>
        </Alert>
        
        <div className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            You will be redirected to the login page in 5 seconds.
          </p>
          
          <Button onClick={() => router.push('/login')} className="w-full" variant={undefined} size={undefined}>
            Return to Login
          </Button>
        </div>
      </div>
    </div>
  );
}