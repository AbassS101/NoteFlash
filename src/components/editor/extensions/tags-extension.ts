// src/components/editor/extensions/tags-extension.ts
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';

export type TagOptions = {
  HTMLAttributes: Record<string, any>;
  tags: Array<{ id: string; name: string; color: string }>;
  onTagsChange?: (tags: Array<{ id: string; name: string; color: string }>) => void;
};

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    tags: {
      /**
       * Apply a tag to the current selection
       */
      applyTag: (tagId: string) => ReturnType;
      
      /**
       * Remove a tag from the current selection
       */
      removeTag: (tagId: string) => ReturnType;
    };
  }
}

const tagKey = new PluginKey('tags');

export const Tags = Extension.create<TagOptions>({
  name: 'tags',

  addOptions() {
    return {
      HTMLAttributes: {},
      tags: [],
      onTagsChange: undefined,
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: ['paragraph', 'heading'],
        attributes: {
          'data-tags': {
            default: null,
            parseHTML: element => element.getAttribute('data-tags') || null,
            renderHTML: attributes => {
              if (!attributes['data-tags']) {
                return {};
              }

              return {
                'data-tags': attributes['data-tags'],
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      applyTag:
        (tagId: string) =>
        ({ editor, tr, state, dispatch }) => {
          // Get current selection
          const { from, to } = state.selection;
          
          // Apply tag to all applicable nodes in range
          state.doc.nodesBetween(from, to, (node, pos) => {
            if (node.type.name === 'paragraph' || node.type.name.startsWith('heading')) {
              const currentTagsAttr = node.attrs['data-tags'];
              const currentTags = currentTagsAttr ? JSON.parse(currentTagsAttr) : [];
              
              // Don't add duplicate tags
              if (!currentTags.includes(tagId)) {
                const newTags = [...currentTags, tagId];
                tr.setNodeAttribute(pos, 'data-tags', JSON.stringify(newTags));
              }
            }
            
            return true;
          });
          
          if (dispatch) {
            dispatch(tr);
          }
          
          return true;
        },
        
      removeTag:
        (tagId: string) =>
        ({ editor, tr, state, dispatch }) => {
          // Get current selection
          const { from, to } = state.selection;
          
          // Remove tag from all applicable nodes in range
          state.doc.nodesBetween(from, to, (node, pos) => {
            if (node.type.name === 'paragraph' || node.type.name.startsWith('heading')) {
              const currentTagsAttr = node.attrs['data-tags'];
              
              if (currentTagsAttr) {
                const currentTags = JSON.parse(currentTagsAttr);
                const newTags = currentTags.filter((id: string) => id !== tagId);
                
                tr.setNodeAttribute(
                  pos,
                  'data-tags',
                  newTags.length ? JSON.stringify(newTags) : null
                );
              }
            }
            
            return true;
          });
          
          if (dispatch) {
            dispatch(tr);
          }
          
          return true;
        },
    };
  },

  addProseMirrorPlugins() {
    const { tags, onTagsChange } = this.options;
    
    return [
      new Plugin({
        key: tagKey,
        // Add plugin behavior as needed
        // This is a minimal implementation that can be extended
      }),
    ];
  },
});