import Image from '@tiptap/extension-image';
import UploadImagesPlugin from '$lib/ui/editor/plugins/upload-images.js';

const UpdatedImage = Image.extend({
	addAttributes() {
		return {
			...this.parent?.(),
			width: {
				default: null,
				renderHTML: (attributes) => {
					if (!attributes.width) return {};
					return { width: attributes.width };
				}
			},
			height: {
				default: null,
				renderHTML: (attributes) => {
					if (!attributes.height) return {};
					return { height: attributes.height };
				}
			}
		};
	},
	addProseMirrorPlugins() {
		const parentPlugins = this.parent?.() || [];
		// Only add the upload plugin for handling file uploads
		// It should not interfere with images loaded from URLs
		return [...parentPlugins, UploadImagesPlugin()];
	},
	parseHTML() {
		return [
			{
				tag: 'img[src]',
				getAttrs: (dom: string | HTMLElement) => {
					if (typeof dom === 'string') return {};
					const element = dom as HTMLElement;
					return {
						src: element.getAttribute('src'),
						title: element.getAttribute('title'),
						alt: element.getAttribute('alt'),
						width: element.getAttribute('width'),
						height: element.getAttribute('height')
					};
				}
			}
		];
	}
});

export default UpdatedImage;