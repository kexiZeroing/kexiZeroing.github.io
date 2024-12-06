import { glob } from "astro/loaders";
import { z, defineCollection } from "astro:content";

// Define a `loader` and `schema` for each collection
const blog = defineCollection({
  loader: glob({ pattern: "**/[^_]*.md", base: "./src/blog" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    added: z.string(),
    updatedDate: z.string().optional(),
    tags: z.array(z.string()).optional(),
    top: z.boolean().optional(),
    order: z.number().optional(),
  }),
});

// Export a single `collections` object to register your collection(s)
export const collections = { blog };
