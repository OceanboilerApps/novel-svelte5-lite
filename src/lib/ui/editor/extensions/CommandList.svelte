<script lang="ts">
	import { getPrevText } from '$lib/editor.js';
	import type { CommandItemProps } from '$lib/ui/editor/extensions/slash-command.js';
	import { cn } from '$lib/utils.js';

	let {
		items = [],
		command,
		editor,
		range,
		...restProps
	}: {
		items: CommandItemProps[];
		command: any;
		editor: any;
		range: any;
	} = $props();

	let selectedIndex = $state(0);
	let container = $state<HTMLElement | null>(null);

	const selectItem = (index: number) => {
		const item = items[index];
		if (item) {
			if (item.title === 'Continue writing') {
				getPrevText(editor, {
					chars: 5000,
					offset: 1
				})
			} else {
				command(item);
			}
		}
	};

	const navigationKeys = ['ArrowUp', 'ArrowDown', 'Enter'];
	const onKeyDown = (e: KeyboardEvent) => {
		if (!navigationKeys.includes(e.key)) return;
		e.preventDefault();
		
		if (e.key === 'ArrowUp') {
			selectedIndex = (selectedIndex + items.length - 1) % items.length;
		} else if (e.key === 'ArrowDown') {
			selectedIndex = (selectedIndex + 1) % items.length;
		} else if (e.key === 'Enter') {
			selectItem(selectedIndex);
		}

		const item = container?.querySelector(`[data-index="${selectedIndex}"]`) as HTMLElement;
		if (item) {
			item.scrollIntoView({
				block: 'nearest'
			});
		}
	};
</script>

<svelte:window on:keydown={onKeyDown} />

{#if items.length > 0}
	<div
		id="slash-command"
		class="z-50 h-auto max-h-[330px] w-72 overflow-y-auto rounded-md border border-stone-200 bg-white px-1 py-2 shadow-md transition-all"
		bind:this={container}
	>
		{#each items as item, index (index)}
			<button
				class="flex w-full items-center space-x-2 rounded-md px-2 py-1 text-left text-sm text-stone-900 hover:bg-stone-100 scroll-my-2
				{index === selectedIndex ? 'bg-stone-100 text-stone-900' : ''}"
				onclick={() => selectItem(index)}
				data-index={index}
				type="button"
			>
				<div
					class="flex h-10 w-10 items-center justify-center rounded-md border border-stone-200 bg-white"
				>
					{#if item.icon}
						<item.icon size="18" />
					{/if}
				</div>
				<div>
					<p class="font-medium">{item.title}</p>
					<p class="text-xs text-stone-500">{item.description}</p>
				</div>
			</button>
		{/each}
	</div>
{/if}