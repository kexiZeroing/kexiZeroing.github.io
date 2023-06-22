import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

// https://astro.build/config
// https://docs.astro.build/en/guides/integrations-guide/mdx/
export default defineConfig({
	site: 'https://kexizeroing.github.io',
	integrations: [mdx()],
});
