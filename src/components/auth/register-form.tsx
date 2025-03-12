// src/components/auth/register-form.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
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

const registerSchema = z.object({
  name: z.string().min(2, { message: 'Name is required' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters' }),
  confirmPassword: z.string(),
  terms: z.boolean().refine(val => val === true, {
    message: 'You must agree to the terms and privacy policy',
  }),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      terms: false,
    },
  });
  
  async function onSubmit(data: RegisterFormValues) {
    setIsLoading(true);
    setError(null);
    
    // Create user data object
    const userData = {
      name: data.name,
      email: data.email,
      password: data.password,
    };
    
    // Manual registration approach - bypass fetch and API
    try {
      // Create user directly using NextAuth credentials signin
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        name: data.name,
        isRegistering: 'true', // Custom parameter to indicate registration
        redirect: false, // Important: prevent automatic redirects
      });
      
      if (result?.error) {
        console.error("Sign-in error:", result.error);
        setError(result.error);
      } else if (result?.url) {
        // Success - redirect
        router.push(result.url);
        router.refresh();
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('An error occurred during registration. Please try again.');
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
            name="name"
            render={({ field }: { field: any }) => (
              <FormItem className={undefined}>
                <FormLabel className={undefined}>Name</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Your full name" 
                    {...field} 
                    autoComplete="name"
                  />
                </FormControl>
                <FormMessage className={undefined} />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="email"
            render={({ field }: { field: any }) => (
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
            render={({ field }: { field: any }) => (
              <FormItem className={undefined}>
                <FormLabel className={undefined}>Password</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Create a password" 
                    type="password" 
                    {...field} 
                    autoComplete="new-password"
                  />
                </FormControl>
                <FormMessage className={undefined} />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }: { field: any }) => (
              <FormItem className={undefined}>
                <FormLabel className={undefined}>Confirm Password</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Confirm your password" 
                    type="password" 
                    {...field} 
                    autoComplete="new-password"
                  />
                </FormControl>
                <FormMessage className={undefined} />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="terms"
            render={({ field }: { field: any }) => (
              <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange} className={undefined}
                  />
                </FormControl>
                <div className="leading-none">
                  <FormLabel className="text-sm font-normal">
                    I agree to the{' '}
                    <Button variant="link" className="p-0 h-auto text-primary underline" size={undefined}>
                      Terms of Service
                    </Button>{' '}
                    and{' '}
                    <Button variant="link" className="p-0 h-auto text-primary underline" size={undefined}>
                      Privacy Policy
                    </Button>
                  </FormLabel>
                  <FormMessage className={undefined} />
                </div>
              </FormItem>
            )}
          />
          
          <Button type="submit" className="w-full" disabled={isLoading} variant={undefined} size={undefined}>
            {isLoading ? 'Creating account...' : 'Create Account'}
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
          onClick={() => signIn('google', { callbackUrl: '/' })} className={undefined} size={undefined}
        >
          <FcGoogle className="h-5 w-5 mr-2" />
          Google
        </Button>
        <Button 
          variant="outline"
          type="button"
          onClick={() => signIn('github', { callbackUrl: '/' })} className={undefined} size={undefined}
        >
          <FaGithub className="h-5 w-5 mr-2" />
          GitHub
        </Button>
      </div>
    </div>
  );
}