// src/components/editor/extensions/folders-extension.ts
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';

export type FolderOptions = {
  HTMLAttributes: Record<string, any>;
  folders: Array<{ id: string; name: string; parentId: string | null }>;
  onFoldersChange?: (folders: Array<{ id: string; name: string; parentId: string | null }>) => void;
};

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    folders: {
      /**
       * Assign content to a folder
       */
      assignToFolder: (folderId: string) => ReturnType;
      
      /**
       * Remove content from a folder
       */
      removeFromFolder: () => ReturnType;
    };
  }
}

const folderKey = new PluginKey('folders');

export const Folders = Extension.create<FolderOptions>({
  name: 'folders',

  addOptions() {
    return {
      HTMLAttributes: {},
      folders: [],
      onFoldersChange: undefined,
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: ['doc'],
        attributes: {
          'data-folder': {
            default: null,
            parseHTML: element => element.getAttribute('data-folder') || null,
            renderHTML: attributes => {
              if (!attributes['data-folder']) {
                return {};
              }

              return {
                'data-folder': attributes['data-folder'],
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      assignToFolder:
        (folderId: string) =>
        ({ editor, tr, dispatch }) => {
          tr.setDocAttribute('data-folder', folderId);
          
          if (dispatch) {
            dispatch(tr);
          }
          
          return true;
        },
        
      removeFromFolder:
        () =>
        ({ tr, dispatch }) => {
          tr.setDocAttribute('data-folder', null);
          
          if (dispatch) {
            dispatch(tr);
          }
          
          return true;
        },
    };
  },

  addProseMirrorPlugins() {
    const { folders, onFoldersChange } = this.options;
    
    return [
      new Plugin({
        key: folderKey,
        // Additional plugin behavior can be added here
        // For example, tracking changes to folders or managing folder hierarchy
      }),
    ];
  },
});