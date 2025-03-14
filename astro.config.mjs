import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
// https://docs.astro.build/en/guides/integrations-guide/mdx/
export default defineConfig({
  site: 'https://kexizeroing.github.io',
  integrations: [
    mdx(),
    react(), 
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
