// src/components/editor/editor-toolbar.tsx
import React, { useState } from 'react';
import { Editor as TiptapEditor } from '@tiptap/react';
import { Button } from '@/components/ui/button';

// Define types here instead of importing them
export type EditorTag = {
  id: string;
  name: string;
  color: string;
};

export type EditorFolder = {
  id: string;
  name: string;
  parentId: string | null;
};

interface EditorToolbarProps {
  editor: TiptapEditor | null;
  onSave?: () => void;
  tags?: EditorTag[];
  folders?: EditorFolder[];
  onAddTag?: (tag: EditorTag) => void;
  onAddFolder?: (folder: EditorFolder) => void;
}

const EditorToolbar: React.FC<EditorToolbarProps> = ({
  editor,
  onSave,
  tags = [],
  folders = [],
  onAddTag,
  onAddFolder,
}) => {
  const [showFolderDropdown, setShowFolderDropdown] = useState(false);
  const [showTagDropdown, setShowTagDropdown] = useState(false);

  if (!editor) {
    return null;
  }

  return (
    <div className="editor-toolbar bg-gray-50 dark:bg-gray-800 p-2 flex flex-wrap gap-1 items-center border-b border-gray-200 dark:border-gray-700 rounded-t-md">
      {/* Basic Formatting */}
      <Button
        variant="ghost"
        className={editor.isActive('bold') ? 'bg-gray-200 dark:bg-gray-700' : ''}
        onClick={() => editor.chain().focus().toggleBold().run()} size={undefined}      >
        Bold
      </Button>

      <Button
        variant="ghost"
        className={editor.isActive('italic') ? 'bg-gray-200 dark:bg-gray-700' : ''}
        onClick={() => editor.chain().focus().toggleItalic().run()} size={undefined}      >
        Italic
      </Button>

      {/* Only use what's available in StarterKit */}
      <Button
        variant="ghost"
        className={editor.isActive('heading', { level: 1 }) ? 'bg-gray-200 dark:bg-gray-700' : ''}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} size={undefined}      >
        H1
      </Button>

      <Button
        variant="ghost"
        className={editor.isActive('heading', { level: 2 }) ? 'bg-gray-200 dark:bg-gray-700' : ''}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} size={undefined}      >
        H2
      </Button>

      <Button
        variant="ghost"
        className={editor.isActive('bulletList') ? 'bg-gray-200 dark:bg-gray-700' : ''}
        onClick={() => editor.chain().focus().toggleBulletList().run()} size={undefined}      >
        List
      </Button>

      <Button
        variant="ghost"
        className={editor.isActive('orderedList') ? 'bg-gray-200 dark:bg-gray-700' : ''}
        onClick={() => editor.chain().focus().toggleOrderedList().run()} size={undefined}      >
        Numbered
      </Button>

      <Button
        variant="ghost"
        className={editor.isActive('blockquote') ? 'bg-gray-200 dark:bg-gray-700' : ''}
        onClick={() => editor.chain().focus().toggleBlockquote().run()} size={undefined}      >
        Quote
      </Button>

      <Button
        variant="ghost"
        className={editor.isActive('codeBlock') ? 'bg-gray-200 dark:bg-gray-700' : ''}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()} size={undefined}      >
        Code
      </Button>

      {/* Tags Dropdown - Simple implementation */}
      <div className="relative">
        <Button
          variant="ghost"
          onClick={() => setShowTagDropdown(!showTagDropdown)} className={undefined} size={undefined}        >
          Tags
        </Button>
        
        {showTagDropdown && (
          <div className="absolute z-10 mt-1 w-48 bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700">
            <div className="p-2 text-sm font-semibold border-b border-gray-200 dark:border-gray-700">
              Apply Tag
            </div>
            
            <div className="max-h-48 overflow-y-auto">
              {tags.map(tag => (
                <div 
                  key={tag.id}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center"
                  onClick={() => {
                    // This is where we would apply the tag if the extension was available
                    // For now, we'll just close the dropdown
                    setShowTagDropdown(false);
                  }}
                >
                  <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: tag.color }}></div>
                  <span>{tag.name}</span>
                </div>
              ))}
            </div>
            
            {onAddTag && (
              <div 
                className="p-2 border-t border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                onClick={() => {
                  // Here we would show a dialog, but for simplicity we'll add a default tag
                  onAddTag({
                    id: Math.random().toString(36).substr(2, 9),
                    name: 'New Tag',
                    color: '#' + Math.floor(Math.random()*16777215).toString(16)
                  });
                  setShowTagDropdown(false);
                }}
              >
                + Add New Tag
              </div>
            )}
          </div>
        )}
      </div>

      {/* Folders Dropdown - Simple implementation */}
      <div className="relative">
        <Button
          variant="ghost"
          onClick={() => setShowFolderDropdown(!showFolderDropdown)} className={undefined} size={undefined}        >
          Folders
        </Button>
        
        {showFolderDropdown && (
          <div className="absolute z-10 mt-1 w-48 bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700">
            <div className="p-2 text-sm font-semibold border-b border-gray-200 dark:border-gray-700">
              Select Folder
            </div>
            
            <div className="max-h-48 overflow-y-auto">
              {folders.map(folder => (
                <div 
                  key={folder.id}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => {
                    // This is where we would assign to folder if the extension was available
                    // For now, we'll just close the dropdown
                    setShowFolderDropdown(false);
                  }}
                >
                  {folder.name}
                </div>
              ))}
            </div>
            
            {onAddFolder && (
              <div 
                className="p-2 border-t border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                onClick={() => {
                  // Here we would show a dialog, but for simplicity we'll add a default folder
                  onAddFolder({
                    id: Math.random().toString(36).substr(2, 9),
                    name: 'New Folder',
                    parentId: null
                  });
                  setShowFolderDropdown(false);
                }}
              >
                + Add New Folder
              </div>
            )}
          </div>
        )}
      </div>

      {/* Save Button */}
      {onSave && (
        <Button
          className="ml-auto"
          onClick={onSave} variant={undefined} size={undefined}        >
          Save
        </Button>
      )}
    </div>
  );
};

export default EditorToolbar;