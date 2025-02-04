<script lang="ts">
	import { Editor } from '@tiptap/core';
	import { onMount } from 'svelte';
	import Moveable from 'moveable';
  
	let {
		class: className = '',
		editor = $bindable(),
		children,
		...restProps
	}: {
		class?: string,
		editor: Editor,
		children?: any
	} = $props();
  
	let moveable: any;

	onMount(() => {
		moveable = new Moveable(document.body, {
			target: document.querySelector('.ProseMirror-selectednode') as HTMLElement,
			resizable: true,
			keepRatio: true,
			// Add other desired options
		});
  
		moveable.on('resize', ({ target, width, height, delta }) => {
			if (delta[0]) target.style.width = `${width}px`;
			if (delta[1]) target.style.height = `${height}px`;
		});
  
		moveable.on('resizeEnd', () => {
			updateMediaSize();
		});

		return () => {
			if (moveable) {
				moveable.destroy();
			}
		};
	});
  
	const updateMediaSize = () => {
		const imageInfo = document.querySelector('.ProseMirror-selectednode') as HTMLImageElement;
		if (imageInfo) {
			const { state } = editor;
			const { from } = state.selection;
			
			const tr = state.tr.setNodeMarkup(from, undefined, {
				src: imageInfo.src,
				alt: imageInfo.alt,
				title: imageInfo.title,
				width: Math.round(imageInfo.width),
				height: Math.round(imageInfo.height)
			});
			
			editor.view.dispatch(tr);
		}
	};
</script>