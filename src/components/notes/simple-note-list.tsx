// src/components/notes/simple-note-list.tsx
import React, { useState } from 'react';
import { Folder, File, Plus, Search, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Simple data types that don't depend on external imports
type SimpleNote = {
  id: string;
  title: string;
  folderId: string | null;
  tags: string[];
};

type SimpleFolder = {
  id: string;
  name: string;
};

type SimpleTag = {
  id: string;
  name: string;
  color: string;
};

// Sample data
const sampleFolders: SimpleFolder[] = [
  { id: '1', name: 'School' },
  { id: '2', name: 'Work' },
  { id: '3', name: 'Personal' }
];

const sampleNotes: SimpleNote[] = [
  { id: '1', title: 'Getting Started with NoteFlash', folderId: '1', tags: ['1'] },
  { id: '2', title: 'Project Ideas', folderId: '2', tags: [] },
  { id: '3', title: 'Meeting Notes', folderId: '2', tags: ['2'] },
  { id: '4', title: 'Personal Goals', folderId: '3', tags: [] },
  { id: '5', title: 'Books to Read', folderId: null, tags: ['3'] }
];

const sampleTags: SimpleTag[] = [
  { id: '1', name: 'Important', color: '#ef4444' },
  { id: '2', name: 'To Review', color: '#3b82f6' },
  { id: '3', name: 'Reference', color: '#10b981' }
];

interface SimpleNoteListProps {
  activeNoteId: string | null;
  onSelectNote: (noteId: string) => void;
}

const SimpleNoteList: React.FC<SimpleNoteListProps> = ({ activeNoteId, onSelectNote }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<string[]>(sampleFolders.map(f => f.id));
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Toggle folder expansion
  const toggleFolder = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (expandedFolders.includes(folderId)) {
      setExpandedFolders(expandedFolders.filter(id => id !== folderId));
    } else {
      setExpandedFolders([...expandedFolders, folderId]);
    }
  };

  // Filter notes based on search query
  const filteredNotes = searchQuery
    ? sampleNotes.filter(note => 
        note.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : sampleNotes;

  // Group notes by folder
  const notesByFolder = filteredNotes.reduce((acc, note) => {
    const folderId = note.folderId || 'uncategorized';
    if (!acc[folderId]) {
      acc[folderId] = [];
    }
    acc[folderId].push(note);
    return acc;
  }, {} as Record<string, SimpleNote[]>);

  // Create new folder (would save to database in a real app)
  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      // In a real app, this would save to a database
      console.log(`Creating folder: ${newFolderName}`);
      setNewFolderName('');
      setShowNewFolderInput(false);
    }
  };

  // Create new note (would save to database in a real app)
  const handleCreateNote = () => {
    // In a real app, this would save to a database
    console.log('Creating new note');
    // Here we would create a note and then set it as active
  };

  return (
    <div className="h-full flex flex-col border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Notes</h2>
          <Button variant="ghost" size="sm" onClick={handleCreateNote} className="h-8 w-8 p-0">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
          />
        </div>
      </div>

      {/* Folders and Notes */}
      <div className="flex-1 overflow-auto p-2">
        {/* Create New Folder */}
        <div className="mb-2">
          {showNewFolderInput ? (
            <div className="flex items-center mb-2">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name"
                className="flex-1 p-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md mr-1"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateFolder();
                  if (e.key === 'Escape') setShowNewFolderInput(false);
                }}
              />
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleCreateFolder}
                className="px-2 py-1 h-7"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowNewFolderInput(true)}
              className="text-xs px-2 py-1 h-7 w-full justify-start mb-2"
            >
              <Folder className="h-3 w-3 mr-1" />
              New Folder
            </Button>
          )}
        </div>

        {/* Folders */}
        {sampleFolders.map(folder => (
          <div key={folder.id} className="mb-1">
            <div className="flex items-center">
              <div 
                className="flex-grow flex items-center py-1 px-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800 cursor-pointer"
                onClick={() => {
                  // In a real app, this would filter notes by folder
                  // For now, we'll just expand the folder
                  if (!expandedFolders.includes(folder.id)) {
                    setExpandedFolders([...expandedFolders, folder.id]);
                  }
                }}
              >
                <button
                  onClick={(e) => toggleFolder(folder.id, e)}
                  className="mr-1 p-0.5 rounded-sm hover:bg-gray-300 dark:hover:bg-gray-700"
                >
                  {expandedFolders.includes(folder.id) ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </button>
                <Folder className="h-4 w-4 mr-2 text-blue-500" />
                <span className="text-sm font-medium flex-1">{folder.name}</span>
                <span className="text-xs text-gray-400">
                  {notesByFolder[folder.id]?.length || 0}
                </span>
              </div>
            </div>
            
            {expandedFolders.includes(folder.id) && notesByFolder[folder.id]?.map(note => (
              <div 
                key={note.id}
                className={`flex items-center py-1 px-2 pl-6 my-0.5 rounded-md cursor-pointer ${
                  activeNoteId === note.id ? 'bg-blue-100 dark:bg-blue-900' : 'hover:bg-gray-200 dark:hover:bg-gray-800'
                }`}
                onClick={() => onSelectNote(note.id)}
              >
                <File className="h-3 w-3 mr-2 text-gray-500" />
                <span className="text-sm flex-1 truncate">{note.title}</span>
                <div className="flex space-x-1">
                  {note.tags.map(tagId => {
                    const tag = sampleTags.find(t => t.id === tagId);
                    if (!tag) return null;
                    return (
                      <div 
                        key={tagId} 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: tag.color }}
                        title={tag.name}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ))}

        {/* Uncategorized Notes */}
        {notesByFolder['uncategorized']?.length > 0 && (
          <div className="mb-1">
            <div className="flex items-center">
              <div 
                className="flex-grow flex items-center py-1 px-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800 cursor-pointer"
                onClick={() => {
                  // Toggle uncategorized
                  if (expandedFolders.includes('uncategorized')) {
                    setExpandedFolders(expandedFolders.filter(id => id !== 'uncategorized'));
                  } else {
                    setExpandedFolders([...expandedFolders, 'uncategorized']);
                  }
                }}
              >
                <button
                  onClick={(e) => toggleFolder('uncategorized', e)}
                  className="mr-1 p-0.5 rounded-sm hover:bg-gray-300 dark:hover:bg-gray-700"
                >
                  {expandedFolders.includes('uncategorized') ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </button>
                <span className="text-sm font-medium flex-1">Uncategorized</span>
                <span className="text-xs text-gray-400">
                  {notesByFolder['uncategorized']?.length || 0}
                </span>
              </div>
            </div>
            
            {expandedFolders.includes('uncategorized') && notesByFolder['uncategorized']?.map(note => (
              <div 
                key={note.id}
                className={`flex items-center py-1 px-2 pl-6 my-0.5 rounded-md cursor-pointer ${
                  activeNoteId === note.id ? 'bg-blue-100 dark:bg-blue-900' : 'hover:bg-gray-200 dark:hover:bg-gray-800'
                }`}
                onClick={() => onSelectNote(note.id)}
              >
                <File className="h-3 w-3 mr-2 text-gray-500" />
                <span className="text-sm flex-1 truncate">{note.title}</span>
                <div className="flex space-x-1">
                  {note.tags.map(tagId => {
                    const tag = sampleTags.find(t => t.id === tagId);
                    if (!tag) return null;
                    return (
                      <div 
                        key={tagId} 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: tag.color }}
                        title={tag.name}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleNoteList;