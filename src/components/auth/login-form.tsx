// src/components/auth/login-form.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FcGoogle } from 'react-icons/fc';
import { FaGithub } from 'react-icons/fa';
import React from 'react';

const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
  remember: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      remember: true,
    },
  });
  
  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });
      
      if (result?.error) {
        setError(result.error);
        return;
      }
      
      // Redirect to dashboard
      router.push('/');
      router.refresh();
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }
  
  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive" className={undefined}>
          <AlertDescription className={undefined}>{error}</AlertDescription>
        </Alert>
      )}
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className={undefined}>
                <FormLabel className={undefined}>Email</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Your email address" 
                    type="email" 
                    {...field} 
                    autoComplete="email"
                  />
                </FormControl>
                <FormMessage className={undefined} />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className={undefined}>
                <div className="flex items-center justify-between">
                  <FormLabel className={undefined}>Password</FormLabel>
                  <Button variant="link" className="p-0 h-auto text-xs" type="button" size={undefined}>
                    Forgot password?
                  </Button>
                </div>
                <FormControl>
                  <Input 
                    placeholder="Your password" 
                    type="password" 
                    {...field} 
                    autoComplete="current-password"
                  />
                </FormControl>
                <FormMessage className={undefined} />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="remember"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                <FormControl>
                  <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange} className={undefined}                  />
                </FormControl>
                <FormLabel className="text-sm font-normal">
                  Remember me
                </FormLabel>
              </FormItem>
            )}
          />
          
          <Button type="submit" className="w-full" disabled={isLoading} variant={undefined} size={undefined}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
      </Form>
      
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <Button 
                  variant="outline"
                  type="button"
                  onClick={() => signIn('google', { callbackUrl: '/' })} className={undefined} size={undefined}        >
          <FcGoogle className="h-5 w-5 mr-2" />
          Google
        </Button>
        <Button 
                  variant="outline"
                  type="button"
                  onClick={() => signIn('github', { callbackUrl: '/' })} className={undefined} size={undefined}        >
          <FaGithub className="h-5 w-5 mr-2" />
          GitHub
        </Button>
      </div>
    </div>
  );
}