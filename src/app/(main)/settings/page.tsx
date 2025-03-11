//src/app/(main)/settings/page.tsx
import page from '@/app/page';
import { SettingsForm } from '@/components/settings/settings-form';
import React from 'react';

export default function SettingsPage() {
  return (
    <div className="container mx-auto max-w-4xl py-6">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <SettingsForm />
    </div>
  );
}