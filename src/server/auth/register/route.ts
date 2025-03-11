// src/app/api/auth/register/route.ts
import { NextResponse } from 'next/server';
import { hash } from 'bcrypt';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Validate request body
    const validationResult = registerSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input data', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }
    
    const { name, email, password } = validationResult.data;
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }
    
    // Hash password
    const hashedPassword = await hash(password, 10);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        settings: {
          create: {
            darkMode: false,
            autoSave: true,
            fontSize: 'medium',
            reviewLimit: 50,
            autoGenerate: false,
            shuffleQuestions: true,
            showAnswers: true,
          },
        },
      },
    });
    
    // Create default note
    await prisma.note.create({
      data: {
        userId: user.id,
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
            },
            {
              type: 'heading',
              attrs: { level: 2 },
              content: [{ type: 'text', text: 'How to Create Flashcards' }]
            },
            {
              type: 'paragraph',
              content: [
                { type: 'text', text: 'You can create flashcards in two ways:' }
              ]
            },
            {
              type: 'orderedList',
              content: [
                {
                  type: 'listItem',
                  content: [
                    {
                      type: 'paragraph',
                      content: [
                        { type: 'text', text: 'Manually by clicking the "Create Flashcard" button' }
                      ]
                    }
                  ]
                },
                {
                  type: 'listItem',
                  content: [
                    {
                      type: 'paragraph',
                      content: [
                        { type: 'text', text: 'Automatically from your notes using the special syntax:' }
                      ]
                    }
                  ]
                }
              ]
            },
            {
              type: 'paragraph',
              content: [
                { type: 'text', text: 'Capital of France :: Paris' }
              ]
            },
            {
              type: 'paragraph',
              content: [
                { type: 'text', text: 'Speed of light :: 299,792,458 meters per second' }
              ]
            },
            {
              type: 'paragraph',
              content: [
                { type: 'text', text: 'Just use the "::" delimiter between the question and answer, and our system will automatically detect and create flashcards for you.' }
              ]
            },
            {
              type: 'heading',
              attrs: { level: 2 },
              content: [{ type: 'text', text: 'Try It Out!' }]
            },
            {
              type: 'paragraph',
              content: [
                { type: 'text', text: 'Try it out by clicking the "Generate Flashcards" button in the toolbar.' }
              ]
            },
            {
              type: 'paragraph',
              content: [
                { type: 'text', text: 'Happy learning!' }
              ]
            }
          ]
        }
      }
    });
    
    return NextResponse.json(
      { message: 'User registered successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}