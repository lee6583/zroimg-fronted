import type { DocsPageContent } from "../types";

export const quickstart: DocsPageContent = {
  navTitle: "Quickstart",
  title: "Quickstart Guide",
  description:
    "Get started with ZroImg in minutes: sign up, get credits, create your first image and video, try the infinite canvas and AI prompt polish, and manage your works.",
  body: `
## 1. Sign up and log in {#register}
1. Open the [sign-up page](/register), enter your email and complete verification.
2. Set a username and password; you are logged in automatically once registration is complete.
3. New users receive trial credits on sign-up and can start generating right away.
> [!TIP]
> If you forget your password, use "Forgot password" on the [login page](/login) to reset it with an email verification code.
## 2. Get credits {#credits}
Generating images and videos and using AI polish all consume credits. Ways to get credits:
- **Daily check-in**: on the [Dashboard](/dashboard), click "Check in" to claim today's credits.
- **Buy a credit package**: choose a package on [Buy credits](/credits) and pay with Alipay / WeChat Pay; credits are added automatically once payment succeeds. See [Pricing](/pricing) for packages and prices.
For detailed rules, see [Credits and billing](/docs/billing).
## 3. Generate your first image {#first-image}
1. Go to [Image generation](/generate).
2. Describe the scene you want in the input box at the bottom, for example: **A red fox sitting in the snow in a cedar forest at dawn, soft side lighting, 35mm film look**.
3. In the settings, choose the model, aspect ratio, quality and number of images; the estimated credit cost is shown next to the input box.
4. Click generate. Images usually finish within 30–90 seconds, and you can keep typing your next prompt in the meantime.
5. Once generation is complete, you can zoom in, download, add to favorites, submit to the gallery, or use the image as a reference for further creation.
> [!NOTE]
> Want to modify an existing image? Upload reference images in the input box (up to 4; PNG, JPEG, WebP, up to 10 MB each), or choose "Inpainting" and paint over the area you want to change on the original image.
## 4. Generate your first video {#first-video}
1. Go to [Video creation](/video).
2. Choose "Text to video" or "Image to video"; image-to-video requires a reference image.
3. Enter a description, choose the duration, aspect ratio and resolution, and confirm the estimated credit cost.
4. After you submit, the video is generated in the background, which usually takes a few minutes. You can leave the page and check the result on the video page or in your [Creation history](/history) when it's done.
## 5. Use the infinite canvas {#canvas}
1. Go to the [Infinite canvas](/canvas) and create a new canvas.
2. Use the toolbar to add generation nodes and notes, upload images, or add works from your history.
3. Write a prompt in a generation node and generate; connect other image nodes to a generation node to use them as references.
4. Select an image to inpaint: paint over the area to change and enter a new description.
5. The canvas saves automatically, so you can come back and continue at any time.
## 6. Polish prompts with AI {#polish}
If you're not sure how to write a prompt, start with a simple idea and click "AI polish" next to the input box. The polished result replaces the input content, and you can edit it further before generating. The button shows how many credits each polish costs.
## 7. Manage your works {#manage}
- [Creation history](/history): view all tasks, their status and credits spent; failed tasks show the reason.
- [Favorites](/favorites): keep the works you like in one place.
- [My submissions](/submissions): check the review status of works submitted to the public gallery.
- [Feedback](/tickets): submit a ticket if you run into problems or have questions about charges.
## Next steps {#next-steps}
- Learn about [Credits and billing](/docs/billing).
- Want to use generation in your own programs? Create an API key in [Account settings](/settings#api-keys), then read the [API overview](/docs/api/overview).
`,
};
