// src/app/(main)/pricing/page.tsx
import { Button } from '@/components/ui/button';
import { CheckIcon } from 'lucide-react';
import React from 'react';

export default function PricingPage() {
  return (
    <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-foreground sm:text-4xl">
          Choose Your Plan
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-xl text-muted-foreground">
          Get the most out of NoteFlash with our premium features. All plans include a 14-day free trial.
        </p>
      </div>

      <div className="mt-16 grid gap-8 lg:grid-cols-3">
        {/* Basic Plan */}
        <div className="bg-background rounded-lg shadow-md overflow-hidden border border-border transition-all duration-200 hover:shadow-lg transform hover:-translate-y-1">
          <div className="px-6 py-8">
            <h3 className="text-2xl font-bold text-foreground">Basic</h3>
            <div className="mt-4 flex items-baseline">
              <span className="text-5xl font-extrabold text-foreground">$5</span>
              <span className="ml-1 text-xl font-medium text-muted-foreground">/month</span>
            </div>
            <p className="mt-5 text-lg text-muted-foreground">
              Perfect for getting started with digital note-taking.
            </p>
          </div>
          <div className="border-t border-border px-6 py-6 bg-muted/30">
            <ul className="space-y-4">
              <FeatureItem included>Unlimited notes</FeatureItem>
              <FeatureItem included>Basic flashcards</FeatureItem>
              <FeatureItem included>Simple quizzes</FeatureItem>
              <FeatureItem>Advanced spaced repetition</FeatureItem>
              <FeatureItem>Auto-generated flashcards</FeatureItem>
              <FeatureItem>Cloud sync</FeatureItem>
            </ul>
            <Button variant="outline" className="mt-8 w-full" size={undefined}>
              Start Free Trial
            </Button>
          </div>
        </div>

        {/* Pro Plan */}
        <div className="bg-background rounded-lg shadow-lg overflow-hidden border-2 border-primary relative transform transition-all duration-200 hover:shadow-xl hover:-translate-y-1">
          <div className="absolute top-0 right-0 bg-primary text-white px-4 py-1 transform translate-x-8 translate-y-4 rotate-45">
            Popular
          </div>
          <div className="px-6 py-8">
            <h3 className="text-2xl font-bold text-foreground">Pro</h3>
            <div className="mt-4 flex items-baseline">
              <span className="text-5xl font-extrabold text-foreground">$10</span>
              <span className="ml-1 text-xl font-medium text-muted-foreground">/month</span>
            </div>
            <p className="mt-5 text-lg text-muted-foreground">
              Advanced features for serious learners.
            </p>
          </div>
          <div className="border-t border-border px-6 py-6 bg-muted/30">
            <ul className="space-y-4">
              <FeatureItem included>Unlimited notes</FeatureItem>
              <FeatureItem included>Advanced flashcards</FeatureItem>
              <FeatureItem included>Comprehensive quizzes</FeatureItem>
              <FeatureItem included>SM-2 spaced repetition</FeatureItem>
              <FeatureItem included>Auto-generated flashcards</FeatureItem>
              <FeatureItem>Cloud sync</FeatureItem>
            </ul>
            <Button className="mt-8 w-full" variant={undefined} size={undefined}>
              Start Free Trial
            </Button>
          </div>
        </div>

        {/* Premium Plan */}
        <div className="bg-background rounded-lg shadow-md overflow-hidden border border-border transition-all duration-200 hover:shadow-lg transform hover:-translate-y-1">
          <div className="px-6 py-8">
            <h3 className="text-2xl font-bold text-foreground">Premium</h3>
            <div className="mt-4 flex items-baseline">
              <span className="text-5xl font-extrabold text-foreground">$15</span>
              <span className="ml-1 text-xl font-medium text-muted-foreground">/month</span>
            </div>
            <p className="mt-5 text-lg text-muted-foreground">
              The ultimate package for power users.
            </p>
          </div>
          <div className="border-t border-border px-6 py-6 bg-muted/30">
            <ul className="space-y-4">
              <FeatureItem included>Unlimited notes</FeatureItem>
              <FeatureItem included>Advanced flashcards</FeatureItem>
              <FeatureItem included>Comprehensive quizzes</FeatureItem>
              <FeatureItem included>SM-2 spaced repetition</FeatureItem>
              <FeatureItem included>Auto-generated flashcards</FeatureItem>
              <FeatureItem included>Cloud sync</FeatureItem>
            </ul>
            <Button variant="outline" className="mt-8 w-full" size={undefined}>
              Start Free Trial
            </Button>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mt-20">
        <h2 className="text-2xl font-bold text-center mb-12">
          Frequently Asked Questions
        </h2>
        <div className="max-w-3xl mx-auto divide-y divide-border">
          <FAQ 
            question="What is spaced repetition?"
            answer="Spaced repetition is a learning technique that incorporates increasing intervals of time between subsequent review of previously learned material to exploit the psychological spacing effect. NoteFlash uses the proven SM-2 algorithm to optimize your memory retention and make learning more efficient."
          />
          <FAQ 
            question="Can I cancel my subscription anytime?"
            answer="Yes, you can cancel your subscription at any time. If you cancel, you'll continue to have access to your paid features until the end of your current billing cycle."
          />
          <FAQ 
            question="Is there a student discount available?"
            answer="Yes! We offer a 50% discount for students and educators. Please contact our support team with your academic credentials to apply for the discount."
          />
          <FAQ 
            question="How does auto-generated flashcards work?"
            answer="Our system automatically detects question-answer pairs in your notes when you use the format 'Q: [question]' followed by 'A: [answer]'. This allows you to create flashcards quickly without manually typing each one."
          />
        </div>
      </div>
    </div>
  );
}

// Feature item component
function FeatureItem({ children, included = false }: { children: React.ReactNode; included?: boolean }) {
  return (
    <li className="flex items-start">
      <div className={`flex-shrink-0 ${included ? 'text-primary' : 'text-muted-foreground'}`}>
        {included ? (
          <CheckIcon className="h-5 w-5" />
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        )}
      </div>
      <p className={`ml-3 text-base ${included ? 'text-foreground' : 'text-muted-foreground'}`}>
        {children}
      </p>
    </li>
  );
}

// FAQ component
function FAQ({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="py-6">
      <details className="group">
        <summary className="flex justify-between items-center font-medium cursor-pointer list-none">
          <span className="text-lg">{question}</span>
          <span className="transition group-open:rotate-180">
            <svg fill="none" height="24" shape-rendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24">
              <path d="M6 9l6 6 6-6"></path>
            </svg>
          </span>
        </summary>
        <p className="text-muted-foreground mt-3 group-open:animate-fadeIn">
          {answer}
        </p>
      </details>
    </div>
  );
}
