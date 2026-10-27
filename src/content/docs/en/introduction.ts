import type { DocsPageContent } from "../types";

export const introduction: DocsPageContent = {
  navTitle: "Introduction",
  title: "Introduction to ZroImg",
  description:
    "ZroImg is an all-in-one AI visual creation platform: text-to-image and video, reference remixes, inpainting, infinite canvas, prompt polish, gallery and API.",
  body: `
## What is ZroImg {#what-is-zroimg}
ZroImg brings leading AI image and video generation models into a single creative workspace. Just describe the scene you want in natural language and get images or short videos ready to use; you can keep editing the results you like, add them to favorites, download them, or submit them to the public gallery.
The platform is billed in credits: the estimated cost is shown before each generation, credits for failed tasks are refunded automatically, and no subscription is required.
## Core features {#features}
| Feature | Where | Description |
| --- | --- | --- |
| Image generation | [/generate](/generate) | Text-to-image, image-to-image with references, and inpainting; choose the model, aspect ratio, quality and count, up to 4 images per run |
| Video creation | [/video](/video) | Text-to-video and image-to-video; choose duration, aspect ratio and resolution |
| Infinite canvas | [/canvas](/canvas) | Arrange images, generation nodes and notes on an endlessly expanding canvas and iterate around a single creative theme |
| Inpainting | Generate page, canvas | Paint over the area you want to change on the original image and regenerate only that part |
| AI prompt polish | Generate page, canvas, video page | Expand a short description into a detailed, well-structured prompt with one click |
| Work management | [/history](/history), [/favorites](/favorites) | View all generation records; favorite, download, and keep editing |
| Public gallery | [/gallery](/gallery) | Browse works shared publicly by other creators; your works appear here too once approved |
| Open API | [API overview](/docs/api/overview) | Submit generation tasks from your own programs with an API key |
### Image generation {#image-generation}
The image generation workspace uses a chat-style layout: the conversation list on the left, the result preview in the middle, and the prompt input at the bottom. Each conversation keeps its own generation history, which makes it easy to keep refining around one theme.
- **Text-to-image**: enter a prompt only.
- **Image-to-image with references**: upload 1–4 reference images (PNG, JPEG, WebP, up to 20 MB each) to change the style or background while preserving the subject or composition.
- **Inpainting**: draw a mask on the original image to change only that area while leaving the rest untouched.
Supported aspect ratios, quality levels and image counts vary by model; the interface automatically shows the available options for the selected model.
### Video creation {#video-generation}
Video creation lets you generate short videos from a description, or use an image as the first frame or reference. Available durations, aspect ratios, resolutions and the number of reference images depend on the selected model. Video generation usually takes a few minutes; you can leave the page in the meantime, and the result is saved in your creation history.
### Infinite canvas {#canvas}
The canvas is ideal for work that involves repeated comparison, combination and iteration. There are three kinds of nodes on the canvas:
- **Image nodes**: uploaded images, works added from your history, or generation results.
- **Generation nodes**: write a prompt and generate directly on the canvas; you can connect other images as references.
- **Notes**: capture ideas and prompt snippets.
Canvas content is saved automatically, so you can pick up where you left off next time.
### AI prompt polish {#prompt-polish}
Click "AI polish" next to the prompt input, and the system expands your description into a complete prompt with details on subject, setting, lighting, composition, style and more. Polishing costs a small number of credits (as shown on the button), and credits are refunded automatically if polishing fails.
### Public gallery and submissions {#gallery}
You can submit your generated works to the public gallery. Submissions go through review first and are shown publicly only after an administrator approves them; rejected or withdrawn works can be resubmitted.
## Who it's for {#who}
- **Content creators**: social media images, covers, avatars, and illustration sketches.
- **E-commerce and brands**: product showcase images, campaign posters, and short video assets.
- **Developers**: integrate image and video generation into your own products or automation workflows via the [open API](/docs/api/overview).
## Next steps {#next-steps}
- Read the [Quickstart](/docs/quickstart) to complete your first generation in a few minutes.
- Learn about [Credits and billing](/docs/billing) to understand how each generation is charged and when credits are refunded.
- Developers can go straight to the [API overview](/docs/api/overview).
`,
};
