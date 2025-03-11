// src/components/settings/settings-form.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSettingsStore } from '@/store/setting-store';
import { useToast } from '@/components/ui/use-toast';
import { useTheme } from '@/components/layout/theme-provider';
import { MoonIcon, SunIcon, SaveIcon } from 'lucide-react';
import React from 'react';

export function SettingsForm() {
  const { 
    darkMode, 
    autoSave, 
    fontSize, 
    spacedRepetition, 
    reviewLimit, 
    autoGenerate, 
    shuffleQuestions, 
    showAnswers, 
    updateSettings 
  } = useSettingsStore();
  
  const [activeTab, setActiveTab] = useState('general');
  const { toast } = useToast();
  const { setTheme } = useTheme();
  
  // Initialize local state with store values
  const [localSettings, setLocalSettings] = useState({
    darkMode,
    autoSave,
    fontSize,
    spacedRepetition,
    reviewLimit,
    autoGenerate,
    shuffleQuestions,
    showAnswers,
  });
  
  // Update local state when store changes
  useEffect(() => {
    setLocalSettings({
      darkMode,
      autoSave,
      fontSize,
      spacedRepetition,
      reviewLimit,
      autoGenerate,
      shuffleQuestions,
      showAnswers,
    });
  }, [
    darkMode,
    autoSave,
    fontSize,
    spacedRepetition,
    reviewLimit,
    autoGenerate,
    shuffleQuestions,
    showAnswers,
  ]);
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(localSettings);
    setTheme(localSettings.darkMode ? 'dark' : 'light');
    
    toast({
      title: 'Settings saved',
      description: 'Your settings have been saved successfully.',
    });
  };
  
  // Handle input changes
  const handleChange = (key: string, value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };
  
  // Handle theme toggle
  const handleThemeToggle = (checked: boolean) => {
    handleChange('darkMode', checked);
    setTheme(checked ? 'dark' : 'light');
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className={undefined}>
        <TabsList className="mb-6">
          <TabsTrigger value="general" className={undefined}>General</TabsTrigger>
          <TabsTrigger value="flashcards" className={undefined}>Flashcards</TabsTrigger>
          <TabsTrigger value="quizzes" className={undefined}>Quizzes</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className={undefined}>
          <Card className={undefined}>
            <CardHeader className={undefined}>
              <CardTitle className={undefined}>General Settings</CardTitle>
              <CardDescription className={undefined}>
                Configure appearance and behavior of the app.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Theme</Label>
                  <div className="text-sm text-muted-foreground">
                    Choose between light and dark theme.
                  </div>
                </div>
                <div className="flex items-center">
                  <SunIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                  <Switch
                    checked={localSettings.darkMode}
                    onCheckedChange={handleThemeToggle} className={undefined}                  />
                  <MoonIcon className="h-4 w-4 ml-2 text-muted-foreground" />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Auto Save</Label>
                  <div className="text-sm text-muted-foreground">
                    Automatically save your notes as you type.
                  </div>
                </div>
                <Switch
                  checked={localSettings.autoSave}
                  onCheckedChange={(checked) => handleChange('autoSave', checked)} className={undefined}                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Font Size</Label>
                  <div className="text-sm text-muted-foreground">
                    Change the size of text in the editor.
                  </div>
                </div>
                <Select
                  value={localSettings.fontSize}
                  onValueChange={(value) => handleChange('fontSize', value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Font size" />
                  </SelectTrigger>
                  <SelectContent className={undefined}>
                    <SelectItem value="small" className={undefined} >Small</SelectItem>
                    <SelectItem value="medium" className={undefined} >Medium</SelectItem>
                    <SelectItem value="large" className={undefined} >Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="flashcards" className={undefined}>
          <Card className={undefined}>
            <CardHeader className={undefined}>
              <CardTitle className={undefined}>Flashcard Settings</CardTitle>
              <CardDescription className={undefined}>
                Configure flashcards and spaced repetition options.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Spaced Repetition</Label>
                  <div className="text-sm text-muted-foreground">
                    Use SM-2 algorithm for flashcard scheduling.
                  </div>
                </div>
                <Switch
                  checked={localSettings.spacedRepetition}
                  onCheckedChange={(checked) => handleChange('spacedRepetition', checked)} className={undefined}                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Daily Review Limit</Label>
                  <div className="text-sm text-muted-foreground">
                    Maximum number of cards to review per day.
                  </div>
                </div>
                <Select
                  value={localSettings.reviewLimit.toString()}
                  onValueChange={(value) => handleChange('reviewLimit', parseInt(value))}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Review limit" />
                  </SelectTrigger>
                  <SelectContent className={undefined}>
                    <SelectItem value="20" className={undefined}>20 cards</SelectItem>
                    <SelectItem value="50" className={undefined}>50 cards</SelectItem>
                    <SelectItem value="100" className={undefined}>100 cards</SelectItem>
                    <SelectItem value="0" className={undefined}>No limit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Auto-generate Flashcards</Label>
                  <div className="text-sm text-muted-foreground">
                    Automatically create flashcards from notes.
                  </div>
                </div>
                <Switch
                  checked={localSettings.autoGenerate}
                  onCheckedChange={(checked) => handleChange('autoGenerate', checked)} className={undefined}                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="quizzes" className={undefined}>
          <Card className={undefined}>
            <CardHeader className={undefined}>
              <CardTitle className={undefined}>Quiz Settings</CardTitle>
              <CardDescription className={undefined}>
                Configure behavior of quizzes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Shuffle Questions</Label>
                  <div className="text-sm text-muted-foreground">
                    Randomize question order when taking quizzes.
                  </div>
                </div>
                <Switch
                  checked={localSettings.shuffleQuestions}
                  onCheckedChange={(checked) => handleChange('shuffleQuestions', checked)} className={undefined}                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Show Answers</Label>
                  <div className="text-sm text-muted-foreground">
                    Show correct answers after quiz completion.
                  </div>
                </div>
                <Switch
                  checked={localSettings.showAnswers}
                  onCheckedChange={(checked) => handleChange('showAnswers', checked)} className={undefined}                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="mt-6 flex justify-end">
        <Button type="submit" className={undefined} variant={undefined} size={undefined}>
          <SaveIcon className="h-4 w-4 mr-2" />
          Save Settings
        </Button>
      </div>
    </form>
  );
}