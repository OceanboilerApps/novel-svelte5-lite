import { Editor, Extension, type Range } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import { mount, unmount } from 'svelte';
import type {Component} from 'svelte';

import tippy from 'tippy.js';

import {
	CheckSquare,
	Code,
	Heading1,
	Heading2,
	Heading3,
	List,
	ListOrdered,
	MessageSquarePlus,
	Text,
	TextQuote,
	Image as ImageIcon
} from 'lucide-svelte';
import CommandList from './CommandList.svelte';
import { startImageUpload } from '../plugins/upload-images.js';
import { Magic } from '../../../ui/icons/index.js';

export interface CommandItemProps {
	title: string;
	description: string;
	icon: Component;
}

interface CommandProps {
	editor: Editor;
	range: Range;
}

const Command = Extension.create({
	name: 'slash-command',
	addOptions() {
		return {
			suggestion: {
				char: '/',
				command: ({ editor, range, props }: { editor: Editor; range: Range; props: any }) => {
					props.command({ editor, range });
				}
			}
		};
	},
	addProseMirrorPlugins() {
		return [
			Suggestion({
				editor: this.editor,
				...this.options.suggestion
			})
		];
	}
});

const getSuggestionItems = ({ query }: { query: string }) => {
	return [
		{
			title: 'Continue writing',
			description: 'Use AI to expand your thoughts.',
			searchTerms: ['gpt'],
			icon: Magic
		},
		{
			title: 'Text',
			description: 'Just start typing with plain text.',
			searchTerms: ['p', 'paragraph'],
			icon: Text,
			command: ({ editor, range }: CommandProps) => {
				editor.chain().focus().deleteRange(range).toggleNode('paragraph', 'paragraph').run();
			}
		},
		{
			title: 'To-do List',
			description: 'Track tasks with a to-do list.',
			searchTerms: ['todo', 'task', 'list', 'check', 'checkbox'],
			icon: CheckSquare,
			command: ({ editor, range }: CommandProps) => {
				editor.chain().focus().deleteRange(range).toggleTaskList().run();
			}
		},
		{
			title: 'Heading 1',
			description: 'Big section heading.',
			searchTerms: ['title', 'big', 'large'],
			icon: Heading1,
			command: ({ editor, range }: CommandProps) => {
				editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run();
			}
		},
		{
			title: 'Heading 2',
			description: 'Medium section heading.',
			searchTerms: ['subtitle', 'medium'],
			icon: Heading2,
			command: ({ editor, range }: CommandProps) => {
				editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run();
			}
		},
		{
			title: 'Heading 3',
			description: 'Small section heading.',
			searchTerms: ['subtitle', 'small'],
			icon: Heading3,
			command: ({ editor, range }: CommandProps) => {
				editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run();
			}
		},
		{
			title: 'Bullet List',
			description: 'Create a simple bullet list.',
			searchTerms: ['unordered', 'point'],
			icon: List,
			command: ({ editor, range }: CommandProps) => {
				editor.chain().focus().deleteRange(range).toggleBulletList().run();
			}
		},
		{
			title: 'Numbered List',
			description: 'Create a list with numbering.',
			searchTerms: ['ordered'],
			icon: ListOrdered,
			command: ({ editor, range }: CommandProps) => {
				editor.chain().focus().deleteRange(range).toggleOrderedList().run();
			}
		},
		{
			title: 'Quote',
			description: 'Capture a quote.',
			searchTerms: ['blockquote'],
			icon: TextQuote,
			command: ({ editor, range }: CommandProps) =>
				editor
					.chain()
					.focus()
					.deleteRange(range)
					.toggleNode('paragraph', 'paragraph')
					.toggleBlockquote()
					.run()
		},
		{
			title: 'Code',
			description: 'Capture a code snippet.',
			searchTerms: ['codeblock'],
			icon: Code,
			command: ({ editor, range }: CommandProps) =>
				editor.chain().focus().deleteRange(range).toggleCodeBlock().run()
		},
		{
			title: 'Image',
			description: 'Upload an image from your computer.',
			searchTerms: ['photo', 'picture', 'media'],
			icon: ImageIcon,
			command: ({ editor, range }: CommandProps) => {
				editor.chain().focus().deleteRange(range).run();
				const input = document.createElement('input');
				input.type = 'file';
				input.accept = 'image/*';
				input.onchange = async () => {
					if (input.files?.length) {
						const file = input.files[0];
						const pos = editor.view.state.selection.from;
						startImageUpload(file, editor.view, pos);
					}
				};
				input.click();
			}
		}
	].filter((item) => {
		if (typeof query === 'string' && query.length > 0) {
			const search = query.toLowerCase();
			return (
				item.title.toLowerCase().includes(search) ||
				item.description.toLowerCase().includes(search) ||
				(item.searchTerms && item.searchTerms.some((term: string) => term.includes(search)))
			);
		}
		return true;
	});
};

export const updateScrollView = (container: HTMLElement, item: HTMLElement) => {
	const containerHeight = container.offsetHeight;
	const itemHeight = item ? item.offsetHeight : 0;

	const top = item.offsetTop;
	const bottom = top + itemHeight;

	if (top < container.scrollTop) {
		container.scrollTop -= container.scrollTop - top + 5;
	} else if (bottom > containerHeight + container.scrollTop) {
		container.scrollTop += bottom - containerHeight - container.scrollTop + 5;
	}
};

const renderItems = () => {
	let component: ReturnType<typeof mount> | null = null;
	let popup: any | null = null;
	let el = document.createElement('div');
  
	return {
		onStart: (props: { editor: Editor; clientRect: DOMRect; [key: string]: any }) => {
			el = document.createElement('div');
	
			component = mount(CommandList, {
				target: el,
				props: props as any,
			});
	
			popup = (tippy as any)('body', {
				getReferenceClientRect: props.clientRect,
				appendTo: () => document.body,
				content: el,
				showOnCreate: true,
				interactive: true,
				trigger: 'manual',
				placement: 'bottom-start',
			});
		},
		onUpdate: (props: { editor: Editor; clientRect: DOMRect; [key: string]: any }) => {
			// component?.$set(props);

			component = mount(CommandList, { 
				target: el, 
				props: props as any 
			});
	
			popup?.[0].setProps({
				getReferenceClientRect: props.clientRect,
			});
		},
		onKeyDown: (props: { event: KeyboardEvent }) => {
			if (props.event.key === 'Escape') {
				popup?.[0].hide();
				return true;
			}
			// Handle other key events if necessary
		},
		onExit: () => {
			popup?.[0].unmount();
			// component?.unmount();
		},
	};
};

const SlashCommand = Command.configure({
	suggestion: {
		items: getSuggestionItems,
		render: renderItems
	}
});

export default SlashCommand;