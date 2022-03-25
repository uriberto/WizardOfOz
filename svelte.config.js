import preprocess from 'svelte-preprocess';
import adapter from '@sveltejs/adapter-static';
import image from "svelte-image";

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		// hydrate the <div id="svelte"> element in src/app.html
		target: '#svelte',
		adapter: adapter({
			// default options are shown
			pages: 'build',
			assets: 'build',
			fallback: null
		})
	},

	preprocess: [
		preprocess({
			postcss: true
		}),
		image()
	]
};

export default config;
