// src/server/auth/route.ts - Updated with modified error handling
import NextAuth, { 
    type AuthOptions, 
    type Session, 
    type Account, 
    type Profile, 
    type User as NextAuthUser 
  } from "next-auth";
  import { type JWT } from "next-auth/jwt";
  import CredentialsProvider from "next-auth/providers/credentials";
  import GoogleProvider from "next-auth/providers/google";
  import GitHubProvider from "next-auth/providers/github";
  import { compare, hash } from "bcrypt";
  
  import { prisma } from "@/lib/db/prisma";
  import { PrismaAdapter } from "@auth/prisma-adapter";
  import { type User } from "@prisma/client";
  
  export const authOptions: AuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID || "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      }),
      GitHubProvider({
        clientId: process.env.GITHUB_CLIENT_ID || "",
        clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
      }),
      CredentialsProvider({
        name: "credentials",
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" },
          name: { label: "Name", type: "text" }, // Add for registration
          isRegistering: { label: "Is Registering", type: "text" }, // Flag to indicate registration
        },
        async authorize(credentials) {
          if (!credentials?.email || !credentials?.password) {
            throw new Error("Missing credentials");
          }
  
          try {
            // Check if this is a registration attempt
            if (credentials.isRegistering === 'true' && credentials.name) {
              // Check if user already exists
              const existingUser = await prisma.user.findUnique({
                where: { email: credentials.email }
              });
              
              if (existingUser) {
                throw new Error("UserExists");
              }
              
              // Create new user
              const hashedPassword = await hash(credentials.password, 10);
              const newUser = await prisma.user.create({
                data: {
                  name: credentials.name,
                  email: credentials.email,
                  password: hashedPassword,
                  settings: {
                    create: {
                      darkMode: false,
                      autoSave: true,
                      fontSize: 'medium',
                      reviewLimit: 50,
                      autoGenerate: false,
                      shuffleQuiz: true,
                      showAnswers: true,
                    },
                  },
                },
              });
              
              // Create welcome note
              await prisma.note.create({
                data: {
                  userId: newUser.id,
                  title: 'Welcome to NoteFlash',
                  content: {
                    type: 'doc',
                    content: [
                      {
                        type: 'heading',
                        attrs: { level: 1 },
                        content: [{ type: 'text', text: 'Welcome to NoteFlash!' }]
                      },
                      {
                        type: 'paragraph',
                        content: [
                          { type: 'text', text: 'This is a smart note-taking app with integrated flashcards and quizzes.' }
                        ]
                      }
                    ]
                  }
                }
              });
              
              return {
                id: newUser.id,
                email: newUser.email,
                name: newUser.name,
              };
            }
            
            // Regular login attempt
            const user = await prisma.user.findUnique({
              where: {
                email: credentials.email,
              },
            });
  
            if (!user) {
              throw new Error("CredentialsSignin");
            }
  
            // Explicitly check for password field
            if (!user.password) {
              throw new Error("CredentialsSignin");
            }
  
            const isValid = await compare(
              credentials.password, 
              user.password
            );
  
            if (!isValid) {
              throw new Error("CredentialsSignin");
            }
  
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              image: user.image,
            };
          } catch (error) {
            // Check if this is our expected error format
            if (error instanceof Error) {
              throw new Error(error.message);
            }
            throw new Error("CredentialsSignin");
          }
        },
      }),
    ],
    session: {
      strategy: "jwt",
    },
    pages: {
      signIn: "/login",
      signOut: "/login",
      error: "/auth/error",
    },
    callbacks: {
      async session({ session, token }) {
        if (session.user) {
          session.user.id = token.sub || '';
        }
        return session;
      },
      async jwt({ token, user }) {
        if (user) {
          // Add user id to the token during sign in
          token.sub = user.id;
        }
        return token;
      },
    },
    debug: process.env.NODE_ENV === 'development', // Enable debug mode in development
  };