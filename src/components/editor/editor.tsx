"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { useNoteStore } from '@/store/note-store';
import { useParams, useSearchParams } from 'next/navigation';
import { EditorToolbar } from './editor-toolbar';
import { useToast } from '@/components/ui/use-toast';

const Editor = () => {
  const { notes, currentNote, setCurrentNote, saveNote, createNote } = useNoteStore();
  const [isSaving, setIsSaving] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const params = useParams();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const noteId = params?.id || searchParams?.get('id');
  
  // Find or create the current note
  useEffect(() => {
    // If we're already initialized, don't reinitialize
    if (isInitialized) return;

    if (noteId && typeof noteId === 'string') {
      const note = notes.find(n => n.id === noteId);
      if (note) {
        setCurrentNote(note);
        setIsInitialized(true);
      } else {
        // If note not found but ID provided, create a blank note with this ID
        // This might happen when navigating directly to a new note URL
        createNote();
        setIsInitialized(true);
      }
    } else if (!currentNote) {
      // If no note ID and no current note, create a new note
      createNote();
      setIsInitialized(true);
    } else {
      // We already have a current note set
      setIsInitialized(true);
    }
  }, [noteId, notes, setCurrentNote, currentNote, createNote, isInitialized]);
  
  // Set up the editor with default content if needed
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
      }),
      Image,
    ],
    content: currentNote?.content || '<p>Start typing here...</p>',
    onUpdate: ({ editor }) => {
      if (currentNote) {
        // Update the current note with the editor's content
        setCurrentNote({
          ...currentNote,
          content: editor.getHTML()
        });
      }
    },
  });
  
  // Update editor content when current note changes
  useEffect(() => {
    if (editor && currentNote && isInitialized) {
      // Only update if content is different to avoid cursor position reset
      const currentContent = editor.getHTML();
      if (currentContent !== currentNote.content && currentNote.content) {
        editor.commands.setContent(currentNote.content);
      }
    }
  }, [editor, currentNote, isInitialized]);
  
  // Handle save
  const handleSave = useCallback(async () => {
    if (!currentNote) return;
    
    setIsSaving(true);
    try {
      await saveNote();
      toast({
        title: "Note saved",
        description: "Your note has been saved successfully."
      });
    } catch (error) {
      toast({
        title: "Error saving note",
        description: "There was an error saving your note. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  }, [currentNote, saveNote, toast]);
  
  // Auto-save on unmount
  useEffect(() => {
    return () => {
      if (currentNote) {
        saveNote();
      }
    };
  }, [currentNote, saveNote]);
  
  if (!isInitialized) {
    return <div className="flex items-center justify-center h-full">Initializing editor...</div>;
  }
  
  if (!editor) {
    return <div className="flex items-center justify-center h-full">Loading editor...</div>;
  }
  
  if (!currentNote) {
    return <div className="flex items-center justify-center h-full">Creating new note...</div>;
  }
  
  return (
    <div className="flex flex-col h-full">
      <EditorToolbar editor={editor} isSaving={isSaving} onSave={handleSave} />
      <div className="flex-grow p-4 overflow-auto">
        <EditorContent editor={editor} className="prose dark:prose-invert max-w-none" />
      </div>
    </div>
  );
}

export default Editor;