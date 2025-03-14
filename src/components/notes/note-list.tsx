// src/components/notes/note-list.tsx
"use client";

import React, { useState } from 'react';
import { Folder, File, Plus, Search, MoreVertical, Edit, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNoteStore } from '@/store/note-store';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

export default function NoteList() {
  // Get everything from the note store
  const { 
    notes, 
    folders, 
    tags, 
    activeNoteId, 
    setActiveNoteId, 
    createNote, 
    deleteNote, 
    createFolder,
    deleteFolder,
    updateFolder
  } = useNoteStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<string[]>(folders.map(f => f.id));
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Toggle folder expansion
  const toggleFolder = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent folder selection when clicking the toggle
    
    if (expandedFolders.includes(folderId)) {
      setExpandedFolders(expandedFolders.filter(id => id !== folderId));
    } else {
      setExpandedFolders([...expandedFolders, folderId]);
    }
  };

  // Filter notes based on search query
  const filteredNotes = searchQuery
    ? notes.filter(note => 
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tags.filter(tag => note.tags.includes(tag.id))
          .some(tag => tag.name.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : notes;

  // Group notes by folder
  const notesByFolder: Record<string, typeof notes> = {};
  
  // Populate the notesByFolder object
  filteredNotes.forEach(note => {
    const folderId = note.folderId || 'uncategorized';
    if (!notesByFolder[folderId]) {
      notesByFolder[folderId] = [];
    }
    notesByFolder[folderId].push(note);
  });

  // Handle creating a new folder
  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      createFolder(newFolderName);
      setNewFolderName('');
      setShowNewFolderInput(false);
    }
  };

  return (
    <div className="h-full flex flex-col border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Notes</h2>
          <Button variant="ghost" size="sm" onClick={createNote} className="h-8 w-8 p-0">
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
      <div className="flex-1 overflow-auto p-3">
        {/* Create New Folder */}
        <div className="mb-2">
          {showNewFolderInput ? (
            <div className="flex items-center mb-2 px-2">
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
        {folders.map(folder => (
          <div key={folder.id} className="mb-1">
            <div className="flex items-center group">
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
                <span className="text-xs text-gray-400 mr-1">
                  {notesByFolder[folder.id]?.length || 0}
                </span>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-0 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100"
                  >
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem
                    className="cursor-pointer text-sm py-1 h-8"
                    onClick={() => {
                      // Open rename dialog
                      const newName = prompt('Rename folder:', folder.name);
                      if (newName && newName.trim()) {
                        updateFolder({ ...folder, name: newName });
                      }
                    } } inset={undefined}                  >
                    <Edit className="h-3 w-3 mr-2" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className={undefined} />
                  <DropdownMenuItem
                    className="cursor-pointer text-destructive text-sm py-1 h-8"
                    onClick={() => {
                      if (confirm(`Delete folder "${folder.name}" and move all notes to uncategorized?`)) {
                        deleteFolder(folder.id);
                      }
                    } } inset={undefined}                  >
                    <Trash2 className="h-3 w-3 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {expandedFolders.includes(folder.id) && notesByFolder[folder.id]?.map(note => (
              <div 
                key={note.id}
                className={`flex items-center py-1 px-2 pl-6 my-0.5 rounded-md cursor-pointer group ${
                  activeNoteId === note.id ? 'bg-blue-100 dark:bg-blue-900' : 'hover:bg-gray-200 dark:hover:bg-gray-800'
                }`}
                onClick={() => setActiveNoteId(note.id)}
              >
                <File className="h-3 w-3 mr-2 text-gray-500" />
                <span className="text-sm flex-1 truncate">{note.title}</span>
                <div className="flex space-x-1 mr-1">
                  {note.tags.map(tagId => {
                    const tag = tags.find(t => t.id === tagId);
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
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-0 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100"
                    >
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem
                      className="cursor-pointer text-destructive text-sm py-1 h-8"
                      onClick={(e: { stopPropagation: () => void; }) => {
                        e.stopPropagation();
                        if (confirm(`Delete note "${note.title}"?`)) {
                          deleteNote(note.id);
                        }
                      } } inset={undefined}                    >
                      <Trash2 className="h-3 w-3 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        ))}

        {/* Uncategorized Notes */}
        {(notesByFolder['uncategorized']?.length > 0 || searchQuery) && (
          <div className="mb-1">
            <div className="flex items-center group">
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
                <span className="text-xs text-gray-400 mr-1">
                  {notesByFolder['uncategorized']?.length || 0}
                </span>
              </div>
            </div>
            
            {expandedFolders.includes('uncategorized') && notesByFolder['uncategorized']?.map(note => (
              <div 
                key={note.id}
                className={`flex items-center py-1 px-2 pl-6 my-0.5 rounded-md cursor-pointer group ${
                  activeNoteId === note.id ? 'bg-blue-100 dark:bg-blue-900' : 'hover:bg-gray-200 dark:hover:bg-gray-800'
                }`}
                onClick={() => setActiveNoteId(note.id)}
              >
                <File className="h-3 w-3 mr-2 text-gray-500" />
                <span className="text-sm flex-1 truncate">{note.title}</span>
                <div className="flex space-x-1 mr-1">
                  {note.tags.map(tagId => {
                    const tag = tags.find(t => t.id === tagId);
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
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-0 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100"
                    >
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem
                      className="cursor-pointer text-destructive text-sm py-1 h-8"
                      onClick={(e: { stopPropagation: () => void; }) => {
                        e.stopPropagation();
                        if (confirm(`Delete note "${note.title}"?`)) {
                          deleteNote(note.id);
                        }
                      } } inset={undefined}                    >
                      <Trash2 className="h-3 w-3 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}
        
        {/* No notes message */}
        {Object.keys(notesByFolder).length === 0 && (
          <div className="text-center py-6 text-gray-500 dark:text-gray-400">
            <p>No notes found</p>
            <Button 
              variant="outline"
              className="mt-2"
              onClick={createNote} size={undefined}            >
              <Plus className="h-4 w-4 mr-1" />
              Create Note
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}