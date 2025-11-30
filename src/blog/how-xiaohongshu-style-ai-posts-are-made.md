---
title: "How Xiaohongshu-style AI posts are made"
description: ""
added: "Nov 30 2025"
tags: [AI]
---

This is a walkthrough of a two‑stage pipeline that turns a short idea into a multi‑page Xiaohongshu‑style post: automated outline generation, cover‑first image generation for visual consistency, and an asynchronous event stream for real-time UI updates. If you want to dive deeper, https://github.com/HisMax/RedInk is a great resource to check out and learn from, and this post is based on it.

## The approach

### 1. Outline phase
The system composes a “write an outline for Xiaohongshu” prompt (explicit rules: cover first, number of pages, sample tone). A text-model provider generates a multi-page outline formatted with page separators. The outline is parsed into an ordered list of page objects (index, page type like cover/content/summary, and the page text).

### 2. Image generation phase
Frontend sends the page list, optional user images, and full outline to the generate endpoint. The backend creates an image-generation task and a task folder for outputs.

The cover is generated first, which establishes the visual language (colors, composition, typography) for the whole post. Once generated, the cover image is compressed and cached in the task state, which will be injected into the model adapter as a reference image alongside the text prompt.

For each remaining page, build an image prompt that embeds: page text (what to show), page role (cover/content/summary), full outline and user topic, instruction to follow cover style, strict mechanical specs (vertical 3:4 ratio, no logos/watermarks, no phone frames).

## End‑to‑end user flow

### 1. Outline Phase
  * **Request:** Client sends `POST /api/outline` with `{ topic: "5 easy skincare tips" }`.
  * **Processing:**
      * Server injects the topic into the `outline_prompt` template.
      * Calls the Text Provider LLM.
      * Receives raw text delimited by specific markers (e.g., `<page>`).
  * **Parsing:** Server deserializes the text into a JSON array of objects:
    ```json
    [
      { "index": 0, "type": "cover", "content": "Title: Glowing Skin..." },
      { "index": 1, "type": "content", "content": "Step 1: Hydration..." }
    ]
    ```
  * **Response:** Returns the structured list to the Client for user verification/editing.

### 2. Task Initialization
  * **Request:** Client sends `POST /api/generate` containing the `pages` array, `full_outline`, `user_topic`, and optionally `user_images` (base64 encoded).
  * **State:** Server generates a unique `task_id`, creates the directory `history/<task_id>/`, and initializes the async job.

### 3. Cover Generation
  * **Prompt Construction:** Server hydrates `image_prompt.txt` with specific variables: `{page_content}`, `{page_type}`, `{full_outline}`.
  * **Reference Injection:** If the user uploaded a photo, it is compressed and attached as a reference signal.
  * **Execution:** The Adapter sends the request to the image model.
  * **Persistence:**
      * `0.png`: The raw high-res output.
      * `thumb_0.png`: A standardized thumbnail for the UI.
  * **State Update:** The system stores the cover image in memory (or temp storage) as `cover_image` to serve as the style anchor for the queue.

### 4. Content Page Iteration
  * **Loop:** The server iterates through remaining pages.
  * **Style Injection:** The `cover_image` generated in Step 3 is included in the payload for every subsequent request to enforce style consistency.
  * **Streaming Feedback (SSE):**
      * `event: progress` → "Generating page 2..."
      * `event: complete` → Payload includes the URL for `thumb_2.png`.
  * **Artifacts:** The server saves `<index>.png` (canonical asset) and `thumb_<index>.png` (UI asset) to the task folder.

### 5. Finalization
  * **Completion:** Once the queue is empty, the server emits a final `finish` event via SSE.
  * **Payload:**
    ```json
    {
      "success": true,
      "task_id": "uuid-v4",
      "images": ["0.png", "1.png", ...],
      "stats": { "total": 5, "completed": 5, "failed": 0 }
    }
    ```
  * **Retrieval:** Client can now fetch high-res assets via static serving at `/api/images/<task_id>/<filename>`.

## Prompts
Below are practical prompt templates used in this pipeline. Edit tone and design instructions to match your product.

**Outline prompt:**

```
You are an expert Xiaohongshu content creator specializing in generating highly engaging, visually-driven photo album outlines. Your task is to generate a complete, structured content outline based on the user's specific requirement.

User Requirement:
{topic}

Output Rules:

Length: The outline must contain 6 to 12 pages (including the cover). If the user explicitly specifies a different length, adhere to that number (within a flexible range of 2 to 18 pages).

Visual Consistency: Each page's content description must be concise, punchy, and highly suitable for graphic generation.

Language & Tone: Use a signature Xiaohongshu style (friendly, engaging, practical, and fun). Emojis can be used appropriately to enhance appeal and match the requested style.

Utility: The content must provide practical value, solve a user problem, or offer useful, actionable information.

Strict Formatting Requirements (MANDATORY):

Page Separator: Use the exact tag <page> to separate every page, and place it on its own line.

Page Type Tag: The first line of every page must be one of the following page type tags:

[COVER] (Must be the first page)

[CONTENT]

[SUMMARY] (Must be the last page)

[COVER] Content: Must include a Title and Subtitle on separate lines, followed by a detailed visual Background description.

[CONTENT] Detail: The content description must be specific, detailed, professional, and actionable, serving as a script for image generation.

[SUMMARY] Content: Must contain a final conclusion or a clear call-to-action.

Final Output Instruction (CRITICAL):
Generate the outline directly, starting immediately with [COVER]. DO NOT include any introductory or conversational text before the outline.
```

**Image prompt:**

```
You are an expert Xiaohongshu graphic designer, skilled in creating visually stunning and highly engaging images for photo-based content. Your goal is to generate a single, high-quality image that perfectly matches the provided page content, type, and overall design guidelines, while strictly adhering to compliance rules and maintaining visual consistency across pages.

Page Content for this Image:
{page_content}

Page Type:
{page_type}

Consistency Reference:

If Page Type is NOT [COVER]: Refer to the LAST GENERATED IMAGE as the canonical style anchor for design elements, color palette, typography, and overall aesthetic.

All subsequent generations MUST strictly reference the style established by the cover image to ensure complete visual consistency throughout the entire content album.

Compliance & Strict Exclusions (CRITICAL - DO NOT FAIL):

NO Xiaohongshu Branding: Absolutely DO NOT include any Xiaohongshu logos, watermarks, user IDs, or any branding elements of the platform itself.

NO External Watermarks/Logos: If any reference images provided (hypothetically, if the system had access to them) contain watermarks or logos (especially in the bottom right or top left corners), they MUST be removed or ignored in the generated image.

Design Requirements:

1. Overall Style:

- Must emulate a "Xiaohongshu viral post" aesthetic.
- Clean, refined, and design-forward.
- Appealing to a young, modern audience.
- Harmonious color schemes with strong visual appeal.

2. Text Layout:

- Text must be clear, legible, and appropriately sized.
- Key information should be highlighted or emphasized.
- Aesthetic typography with good spacing and ample white space.
- Support for emojis and symbols.
For [COVER] type, the title must be large and eye-catching.

3. Visual Elements:

- Backgrounds should be clean but not monotonous.
- Can include decorative elements (e.g., icons, illustrations) that enhance the theme.
- Color palettes should be warm or fresh.
- Maintain a professional and polished feel.

4. Page Type Specific Requirements:

[COVER] Type:

- Title in the primary position, largest font size.
- Subtitle centered or directly below the title.
- Overall design must be highly attractive and impactful.
- Background can be richer with a clear visual focal point.

[CONTENT] Type:

- Information presented with clear hierarchy.
- List items displayed distinctly.
- Key points emphasized with color or bolding.
- Small illustrative icons can be used to aid explanation.

[SUMMARY] Type:

- Concluding text is prominent.
- Can include checkmark boxes or completion symbols.
- Evoke a sense of accomplishment and satisfaction.
- Incorporate encouraging visual elements.

5. Technical Specifications:

- Aspect Ratio: Strictly 3:4 vertical (standard Xiaohongshu dimension).
- High-definition quality.
- Optimized for mobile screen viewing.
- ALL TEXT CONTENT MUST BE COMPLETELY VISIBLE AND LEGIBLE.
- Orientation (CRITICAL): The layout MUST be designed for correct vertical viewing. NO horizontal rotations or inversions of text/elements are allowed.

6. Holistic Style Consistency (across the entire album):
To ensure a unified style across all generated images, carefully consider the following based on the full_outline and user_topic:

- Overall color scheme and palette.
- Dominant design aesthetic (e.g., fresh/tech/warm/professional).
- Consistency of visual elements and decorative motifs.
- Uniformity in layout and text presentation styles.

Contextual Information:

User's Original Topic/Demand:
{user_topic}

Full Content Outline Reference:

{full_outline}

Generate the image directly. DO NOT include any phone borders, frames, or white margins around the image.
```
