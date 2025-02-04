<script lang="ts" context="module">
	export interface BubbleMenuItem {
		name: string;
		isActive: () => boolean;
		command: () => void;
		icon: typeof BoldIcon;
	}
</script>

<script lang="ts">
	import { cn } from '$lib/utils.js';
	import type { Editor } from '@tiptap/core';
	import { BoldIcon, CodeIcon, ItalicIcon, StrikethroughIcon, UnderlineIcon } from 'lucide-svelte';
	import { writable } from 'svelte/store';
	import ColorSelector from '$lib/ui/editor/bubble-menu/color-selector.svelte';
	import LinkSelector from '$lib/ui/editor/bubble-menu/link-selector.svelte';
	import NodeSelector from '$lib/ui/editor/bubble-menu/node-selector.svelte';
	import { BubbleMenuPlugin, type BubbleMenuPluginProps } from '@tiptap/extension-bubble-menu';
	import { onDestroy, onMount } from 'svelte';

	let element: HTMLElement;

	let isNodeSelectorOpen = $state(false);
	let isColorSelectorOpen = $state(false);
	let isLinkSelectorOpen = $state(false);

	let reset = $derived(() => {
		isNodeSelectorOpen = false;
		isColorSelectorOpen = false;
		isLinkSelectorOpen = false;
	});

	let {
		class: className = '',
		editor = $bindable(),
		tippyOptions = {
			moveTransition: 'transform 0.15s ease-out',
			onHidden: () => { reset() }
		},
		pluginKey = 'SvelteTiptapBubbleMenu',
		shouldShow = ({ editor }) => {
			// don't show if image is selected
			if (editor.isActive('image')) {
				return false;
			}
			return editor.view.state.selection.content().size > 0;
		},
		updateDelay = 250,
		children,
		...restProps
	}: {
		class?: string,
		editor: Editor,
		tippyOptions?: BubbleMenuPluginProps['tippyOptions'],
		pluginKey?: BubbleMenuPluginProps['pluginKey'],
		shouldShow?: BubbleMenuPluginProps['shouldShow'],
		updateDelay?: BubbleMenuPluginProps['updateDelay'],
		children?: any
	} = $props();

	const items: BubbleMenuItem[] = [
		{
			name: 'bold',
			isActive: () => editor.isActive('bold'),
			command: () => editor.chain().focus().toggleBold().run(),
			icon: BoldIcon
		},
		{
			name: 'italic',
			isActive: () => editor.isActive('italic'),
			command: () => editor.chain().focus().toggleItalic().run(),
			icon: ItalicIcon
		},
		{
			name: 'underline',
			isActive: () => editor.isActive('underline'),
			command: () => editor.chain().focus().toggleUnderline().run(),
			icon: UnderlineIcon
		},
		{
			name: 'strike',
			isActive: () => editor.isActive('strike'),
			command: () => editor.chain().focus().toggleStrike().run(),
			icon: StrikethroughIcon
		},
		{
			name: 'code',
			isActive: () => editor.isActive('code'),
			command: () => editor.chain().focus().toggleCode().run(),
			icon: CodeIcon
		}
	];

	if (!editor) {
		throw new Error('Missing editor instance.');
	}

	onMount(() => {
		const plugin = BubbleMenuPlugin({
			pluginKey,
			editor,
			element,
			tippyOptions,
			shouldShow,
			updateDelay
		});

		editor.registerPlugin(plugin);
	});

	onDestroy(() => {
		editor.unregisterPlugin(pluginKey);
	});
</script>

<div
	bind:this={element}
	class="flex w-fit divide-x divide-stone-200 rounded border border-stone-200 bg-white shadow-xl"
>
	<NodeSelector {editor} bind:isOpen={isNodeSelectorOpen} />
	<LinkSelector {editor} bind:isOpen={isLinkSelectorOpen} />
	<div class="flex">
		{#each items as item, index (index)}
			<button
				onclick={item.command}
				class="p-2 text-stone-600 hover:bg-stone-100 active:bg-stone-200"
				type="button"
			>
				<item.icon class={cn('h-4 w-4', {
					'text-blue-500': item.isActive()
				})} />
			</button>
		{/each}
	</div>
	<ColorSelector {editor} bind:isOpen={isColorSelectorOpen} />
</div>