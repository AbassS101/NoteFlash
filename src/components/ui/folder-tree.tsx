// src/components/ui/folder-tree.tsx
import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Folder, File, MoreVertical, Plus } from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export interface TreeItem {
  id: string;
  name: string;
  icon?: React.ReactNode;
  color?: string;
  children?: TreeItem[];
  type: 'folder' | 'item';
  parentId?: string;
}

interface FolderTreeProps {
  items: TreeItem[];
  onItemClick?: (item: TreeItem) => void;
  onItemEdit?: (item: TreeItem) => void;
  onItemDelete?: (item: TreeItem) => void;
  onItemDuplicate?: (item: TreeItem) => void;
  onFolderCreate?: (parentId?: string) => void;
  onItemCreate?: (parentId?: string) => void;
  selectedItemId?: string;
}

export const FolderTree: React.FC<FolderTreeProps> = ({
  items,
  onItemClick,
  onItemEdit,
  onItemDelete,
  onItemDuplicate,
  onFolderCreate,
  onItemCreate,
  selectedItemId
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  const buildTree = (items: TreeItem[], parentId?: string): TreeItem[] => {
    return items
      .filter(item => item.parentId === parentId)
      .map(item => ({
        ...item,
        children: item.type === 'folder' ? buildTree(items, item.id) : undefined
      }));
  };

  const rootItems = buildTree(items);

  const renderTreeItem = (item: TreeItem, level = 0) => {
    const isFolder = item.type === 'folder';
    const isExpanded = expandedFolders[item.id];
    const hasChildren = isFolder && item.children && item.children.length > 0;
    const isSelected = item.id === selectedItemId;

    return (
      <div key={item.id}>
        <div 
          className={cn(
            "flex items-center py-1 px-2 rounded-md gap-1 text-sm",
            "hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer",
            isSelected && "bg-slate-200 dark:bg-slate-700"
          )}
          style={{ paddingLeft: `${(level * 12) + 4}px` }}
        >
          <div onClick={() => isFolder ? toggleFolder(item.id) : {}}>
            {isFolder && (
              hasChildren ? (
                isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                )
              ) : (
                <span className="w-4" />
              )
            )}
          </div>
          
          <div 
            className="flex-grow flex items-center gap-2"
            onClick={() => onItemClick && onItemClick(item)}
          >
            {item.icon || (isFolder ? (
              <Folder size={16} style={{ color: item.color || 'currentColor' }} />
            ) : (
              <File size={16} style={{ color: item.color || 'currentColor' }} />
            ))}
            <span>{item.name}</span>
          </div>
          
          <div className="flex items-center">
            {isFolder && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e: { stopPropagation: () => void; }) => {
                  e.stopPropagation();
                  onItemCreate && onItemCreate(item.id);
                }}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e: { stopPropagation: () => any; }) => e.stopPropagation()}
                >
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className={undefined}>
                <DropdownMenuItem
                                onClick={() => onItemEdit && onItemEdit(item)} className={undefined} inset={undefined}                >
                  Rename
                </DropdownMenuItem>
                {!isFolder && onItemDuplicate && (
                  <DropdownMenuItem
                                    onClick={() => onItemDuplicate(item)} className={undefined} inset={undefined}                  >
                    Duplicate
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                                onClick={() => onItemDelete && onItemDelete(item)}
                                className="text-red-600 focus:text-red-600" inset={undefined}                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {isFolder && isExpanded && item.children && (
          <div>
            {item.children.map(child => renderTreeItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium">Folders</h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => onFolderCreate && onFolderCreate()}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="space-y-1">
        {rootItems.map(item => renderTreeItem(item))}
      </div>
    </div>
  );
};