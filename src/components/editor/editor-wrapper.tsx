'use client';
// src/components/editor/editor-wrapper.tsx
import React from 'react';
import dynamic from 'next/dynamic';

// Dynamic import the Editor component with client-side rendering only
// This is important since TipTap requires browser APIs
const Editor = dynamic(() => import('@/components/editor/editor'), {
  ssr: false,
  loading: () => <div className="flex-1 flex items-center justify-center">Loading editor...</div>
});

export default function EditorWrapper() {
  return <Editor />;
}