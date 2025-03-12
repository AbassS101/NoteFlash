// src/app/api/auth/error/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Extract error from URL
  const url = new URL(request.url);
  const errorType = url.searchParams.get('error');

  // Redirect to our custom error page with the error parameter
  return NextResponse.redirect(`${url.origin}/auth/error?error=${errorType || 'unknown'}`);
}