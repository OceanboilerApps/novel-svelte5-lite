<script lang="ts">
	import '$lib/styles/index.css';
	import '$lib/styles/prosemirror.css';
	import '$lib/styles/tailwind.css';

	import { getPrevText } from '$lib/editor.js';
	import { createLocalStorageStore } from '$lib/stores/localStorage.js';
	import { createDebouncedCallback, noop } from '$lib/utils.js';
	import { Editor, Extension, type JSONContent } from '@tiptap/core';
	import type { EditorProps } from '@tiptap/pm/view';
	// import { useCompletion } from 'ai/svelte';
	import ImageResizer from '$lib/ui/editor/extensions/ImageResizer.svelte';
	import { mount, unmount, onMount } from 'svelte';
	import { defaultEditorContent } from '$lib/ui/editor/default-content.js';
	import { defaultExtensions } from '$lib/ui/editor/extensions/index.js';
	import { defaultEditorProps } from '$lib/ui/editor/props.js';
	import Toasts, { addToast } from '$lib/ui/toasts.svelte';

	import EditorBubbleMenu from '$lib/ui/editor/bubble-menu/index.svelte';
	import { cn } from '$lib/utils.js';


	// import type { Component } from 'svelte';

	let {
		class: className = '',
		defaultValue = defaultEditorContent,
		extensions = [],
		editorProps = {},
		onUpdate = noop,
		onDebouncedUpdate = noop,
		debounceDuration = 750,
		storageKey = 'novel__content',
		disableLocalStorage = false,
		editor = $bindable(),
		children,
		...restProps
	}: {
		class?: string,
		defaultValue?: JSONContent | string,
		extensions?: Extension[],
		editorProps?: EditorProps,
		onUpdate: (editor?: Editor) => void | Promise<void>,
		onDebouncedUpdate: (editor?: Editor) => void | Promise<void>,
		debounceDuration?: number,
		storageKey?: string,
		disableLocalStorage?: boolean,
		editor: Editor,
		children?: any
	} = $props();
	
	let borderlessStyles = 'relative w-full max-w-screen-lg border-stone-200 bg-white p-12 pb-24 sm:pb-12 px-8 sm:mb-[calc(20vh)] ';
	let defaultStyles = 'relative min-h-[500px] w-full max-w-screen-lg border-stone-200 bg-white p-12 pb-24 sm:pb-12 px-8 sm:mb-[calc(20vh)] sm:rounded-lg sm:border sm:px-12 sm:shadow-lg';

	/**
	 * Additional classes to add to the editor container.
	 * Defaults to "relative min-h-[500px] w-full max-w-screen-lg border-stone-200 bg-white p-12 px-8 sm:mb-[calc(20vh)] sm:rounded-lg sm:border sm:px-12 sm:shadow-lg".
	 */
	
	/**
	 * The default value to use for the editor.
	 * Defaults to defaultEditorContent.
	 */
	
	/**
	 * A list of extensions to use for the editor, in addition to the default Novel extensions.
	 * Defaults to [].
	 */
	
	/**
	 * Props to pass to the underlying Tiptap editor, in addition to the default Novel editor props.
	 * Defaults to {}.
	 */
	
	/**
	 * A callback function that is called whenever the editor is updated.
	 * Defaults to () => {}.
	 */
	
	/**
	 * A callback function that is called whenever the editor is updated, but only after the defined debounce duration.
	 * Defaults to () => {}.
	 */
	
	/**
	 * The duration (in milliseconds) to debounce the onDebouncedUpdate callback.
	 * Defaults to 750.
	 */
	
	/**
	 * The key to use for storing the editor's value in local storage.
	 * Defaults to "novel__content".
	 */
	
	/**
	 * Disable local storage read/save.
	 * @default false
	 */
	
  	/**
	 * The editor instance. Bind to it to get access to the editor.
	 */
	// export let editor: Editor | undefined = undefined;

	let element: Element;

	let hydrated = $state(false);
	const content = $state(createLocalStorageStore(storageKey, defaultValue));

	$effect(() => {
		if (editor && !hydrated) {
			const value = disableLocalStorage ? defaultValue : $content;
			if (value) {
				editor.commands.setContent(value);
			}
			hydrated = true;
		}
	});

	const debouncedUpdates = createDebouncedCallback(async ({ editor }) => {
		if (!disableLocalStorage) {
			$content = editor.getJSON();
		}
		onDebouncedUpdate(editor);
	}, debounceDuration);

	onMount(() => {
		editor = new Editor({
			element: element,
			onTransaction: () => {
				// force re-render so `editor.isActive` works as expected
				editor = editor;
			},
			extensions: [...defaultExtensions, ...extensions],
			editorProps: {
				...defaultEditorProps,
				...editorProps
			},
			onUpdate: (e) => {
				const selection = e.editor.state.selection;
				const lastTwo = getPrevText(e.editor, {
					chars: 2
				});

				onUpdate(e.editor);
				debouncedUpdates(e);
			},
			autofocus: 'end'
		});

		return () => editor?.destroy();
	});
</script>

{#if editor && editor.isEditable}
	<EditorBubbleMenu {editor} />
{/if}

<div id="editor" class={cn(className, defaultStyles)} bind:this={element}>
	{@render children?.()}
	{#if editor?.isActive('image')}
		<ImageResizer {editor} />
	{/if}
</div>

<Toasts />