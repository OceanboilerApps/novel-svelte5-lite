import { Extension } from '@tiptap/core';

export const FocusExtension = Extension.create({
  name: 'focus',

  addCommands() {
    return {
      focus: () => ({ editor }) => {
        editor.view.focus();
        return true;
      },
    };
  },
});

export default FocusExtension;
