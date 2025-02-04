import { addToast } from '$lib/ui/toasts.svelte';
import { EditorState, Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet, EditorView } from '@tiptap/pm/view';

const uploadKey = new PluginKey('upload-image');

const UploadImagesPlugin = () =>
	new Plugin({
		key: uploadKey,
		state: {
			init() {
				return DecorationSet.empty;
			},
			apply(tr, set) {
				set = set.map(tr.mapping, tr.doc);
				// See if the transaction adds or removes any placeholders
				const action = tr.getMeta(this as any);
				if (action && action.add) {
					const { id, pos, src } = action.add;

					const placeholder = document.createElement('div');
					placeholder.setAttribute('class', 'img-placeholder');
					const image = document.createElement('img');
					image.setAttribute('class', 'opacity-40 rounded-lg border border-stone-200');
					image.src = src;
					placeholder.appendChild(image);
					const deco = Decoration.widget(pos + 1, placeholder, {
						id
					});
					set = set.add(tr.doc, [deco]);
				} else if (action && action.remove) {
					set = set.remove(
						set.find(null as any, null as any, (spec) => spec.id == action.remove.id)
					);
				}
				return set;
			}
		},
		props: {
			decorations(state) {
				return this.getState(state);
			},
			handleDOMEvents: {
				// Intercept paste and drop events for image handling
				paste(view, event) {
					const items = Array.from((event as ClipboardEvent).clipboardData?.items || []);
					const imageItems = items.filter((item) => item.type.indexOf('image') === 0);
					
					if (imageItems.length === 0) return false;
					
					event.preventDefault();
					const file = imageItems[0].getAsFile();
					if (file) {
						startImageUpload(file, view, view.state.selection.from);
					}
					return true;
				},
				drop(view, event) {
					if (!event.dataTransfer) return false;
					
					const files = event.dataTransfer.files;
					if (!files || files.length === 0) return false;

					const hasImages = Array.from(files).some(file => 
						file.type.indexOf('image') === 0
					);
					
					if (!hasImages) return false;
					
					event.preventDefault();
					const images = Array.from(files).filter(file => 
						file.type.indexOf('image') === 0
					);
					
					if (images.length > 0) {
						const { pos } = view.posAtCoords({ left: event.clientX, top: event.clientY }) || { pos: 0 };
						images.forEach(image => {
							startImageUpload(image, view, pos);
						});
					}
					return true;
				}
			}
		}
	});

export default UploadImagesPlugin;

function findPlaceholder(state: EditorState, id: any) {
	const decos = uploadKey.getState(state);
	const found = decos.find(null, null, (spec: any) => spec.id == id);
	return found.length ? found[0].from : null;
}

export function startImageUpload(file: File, view: EditorView, pos: number) {
	// check if the file is an image
	if (!file.type.includes('image/')) {
		addToast({
			data: {
				text: 'File type not supported.',
				type: 'error'
			}
		});
		return;
	} else if (file.size / 1024 / 1024 > 20) {
		addToast({
			data: {
				text: 'File size too big (max 20MB).',
				type: 'error'
			}
		});
		return;
	}

	// A fresh object to act as the ID for this upload
	const id = {};

	// Replace the selection with a placeholder
	const tr = view.state.tr;
	if (!tr.selection.empty) tr.deleteSelection();

	const reader = new FileReader();
	reader.readAsDataURL(file);
	reader.onload = () => {
		tr.setMeta(uploadKey, {
			add: {
				id,
				pos,
				src: reader.result
			}
		});
		view.dispatch(tr);
	};

	handleImageUpload(file).then((src) => {
		const { schema } = view.state;
		const pos = findPlaceholder(view.state, id);
		
		// If the content around the placeholder has been deleted, drop the image
		if (pos == null) return;

		// Create the image node with the local file data
		const imageSrc = reader.result;
		const node = schema.nodes.image.create({ src: imageSrc });
		const transaction = view.state.tr
			.replaceWith(pos, pos, node)
			.setMeta(uploadKey, { remove: { id } });
		view.dispatch(transaction);
	});
}

export const handleImageUpload = async (file: File) => {
	await sleep(1000); // Simulate upload delay
	return file;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));