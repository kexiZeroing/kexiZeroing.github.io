---
layout: "../layouts/BlogPost.astro"
title: "How semantic image search works"
slug: how-semantic-image-search-works
description: ""
added: "Jun 27 2024"
tags: [AI, code]
---

Vercel recently shipped an open-source ai-powered image search app. The general idea here is to generate the metadata for the images we want to index using LLMs, and store them as embeddings in a vector database. So that when someone does a query, we would convert it into an embed and do a cosine similarity search.

- Source code: https://github.com/vercel-labs/semantic-image-search
- Demo App: https://semantic-image-search.vercel.app

### Upload Images

```js
import { list, put } from "@vercel/blob";

async function main() {
  const basePath = "images-to-index";
  const files = await getJpgFiles(basePath);
  const { blobs } = await list();

  for (const file of files) {
    const exists = blobs.some((blob) => blob.pathname === file);
    if (exists) {
      console.log(`File (${file}) already exists in Blob store`);
      continue;
    }
    const filePath = basePath + "/" + file;
    const fileContent = fs.readFileSync(filePath);

    await put(file, fileContent, { access: "public" });
    console.log(`Uploaded ${file}`);
  }
}

async function getJpgFiles(dir) {
  const files = await fs.promises.readdir(dir);
  const jpgFiles = files.filter(
    (file) => path.extname(file).toLowerCase() === ".jpg",
  );
  return jpgFiles;
}
```

### Generate Metadata

```js
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { list } from "@vercel/blob";

async function main() {
  const blobs = await list();
  const files = blobs.blobs.map((b) => b.url);

  const images = [];

  for (const file of files) {
    const result = await generateObject({
      model: openai("gpt-4o"),
      schema: z.object({
        image: z.object({
          title: z.string().describe("an artistic title for the image"),
          description: z
            .string()
            .describe("A one sentence description of the image"),
        }),
      }),
      maxTokens: 512,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Describe the image in detail." },
            {
              type: "image",
              image: file,
            },
          ],
        },
      ],
    });
    images.push({ path: file, metadata: result.object.image });
  }

  await writeAllMetadataToFile(images, "images-with-metadata.json");
}
```

### Database Setup

```js
import { varchar, index, pgTable, vector, text } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";

export const images = pgTable(
  "images",
  {
    id: varchar("id", { length: 191 })
      .primaryKey()
      .$defaultFn(() => nanoid()),
    title: text("title").notNull(),
    description: text("description").notNull(),
    path: text("path").notNull(),
    embedding: vector("embedding", { dimensions: 1536 }).notNull(),
  },
  (table) => ({
    embeddingIndex: index("embeddingIndex").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops"),
    ),
  }),
);

export const dbImageSchema = z.object({
  id: z.string(),
  embedding: z.array(z.number()),
  title: z.string(),
  path: z.string(),
  description: z.string(),
  similarity: z.number().optional(),
});
```

### Embed Metadata and Save to Database

```js
import { openai } from "@ai-sdk/openai";
import { embed } from "ai";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

export const embeddingModel = openai.embedding("text-embedding-3-small");
export const client = postgres(process.env.POSTGRES_URL!);
export const db = drizzle(client);

async function main() {
  const imagesWithMetadata = await getMetadataFile("images-with-metadata.json");

  for (const image of imagesWithMetadata) {
    const { embedding } = await embed({
      model: embeddingModel,
      value: image.metadata.title + "\n" + image.metadata.description,
    });

    try {
      await saveImage({
        title: image.metadata.title,
        description: image.metadata.description,
        id: nanoid(),
        path: image.path,
        embedding,
      });
    } catch (e) {
      console.error(e);
    }
  }
}

const saveImage = async (image) => {
  const safeImage = dbImageSchema.parse(image);
  const [savedImage] = await db.insert(images).values(safeImage);
  return savedImage;
};
```

### Query Images

```js
import { kv } from "@vercel/kv";

const { embedding: _, ...rest } = getTableColumns(images);
const imagesWithoutEmbedding = {
  ...rest,
  embedding: sql<number[]>`ARRAY[]::integer[]`,
};

const getImages = async (query) => {
  const formattedQuery = query
    ? "q:" + query?.replaceAll(" ", "_")
    : "all_images";

  const cached = await kv.get(formattedQuery);
  if (cached) {
    return { images: cached };
  } else {
    if (query === undefined || query.length < 3) {
      const allImages = await db
        .select(imagesWithoutEmbedding)
        .from(images)
        .limit(20);
      await kv.set("all_images", JSON.stringify(allImages));
      return { images: allImages };
    } else {
      const directMatches = await findImageByQuery(query);
      const semanticMatches = await findSimilarContent(query);
      const allMatches = uniqueItemsByObject(
        [...directMatches, ...semanticMatches].map((image) => ({
          ...image.image,
          similarity: image.similarity,
        })),
      );

      await kv.set(formattedQuery, JSON.stringify(allMatches));
      return { images: allMatches };
    }
  }
};

export const findImageByQuery = async (query) => {
  const result = await db
    .select({ image: imagesWithoutEmbedding, similarity: sql<number>`1` })
    .from(images)
    .where(
      or(
        sql`title ILIKE ${"%" + query + "%"}`,
        sql`description ILIKE ${"%" + query + "%"}`,
      ),
    );
  return result;
};

export const findSimilarContent = async (description) => {
  const embedding = await generateEmbedding(description);
  const similarity = sql<number>`1 - (${cosineDistance(images.embedding, embedding)})`;
  const similarGuides = await db
    .select({ image: imagesWithoutEmbedding, similarity })
    .from(images)
    .where(gt(similarity, 0.28)) // experiment with this value based on your embedding model
    .orderBy((t) => desc(t.similarity))
    .limit(10);

  return similarGuides;
};
```
