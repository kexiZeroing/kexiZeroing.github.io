import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

// https://astro.build/config
// https://docs.astro.build/en/guides/integrations-guide/mdx/#rehypeplugins
// https://docs.astro.build/en/guides/markdown-content/#markdown-heading-ids
export default defineConfig({
	site: 'https://kexizeroing.github.io',
	integrations: [mdx()],
});
