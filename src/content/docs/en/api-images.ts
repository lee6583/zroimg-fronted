import type { DocsPageContent } from "../types";

export const apiImages: DocsPageContent = {
  navTitle: "Image Generation",
  title: "Image Generation API",
  description:
    "POST /open/v1/images/generations submits text-to-image, image-to-image and inpainting tasks; returns a task object and credit cost. Supports Idempotency-Key.",
  body: `
## Submit an image generation task {#create}
~~~http
POST /open/v1/images/generations
~~~
A successful submission returns \`202 Accepted\` and a task object. The task runs in the background; use the [tasks endpoint](/docs/api/tasks) to get the results. Credits are deducted immediately on submission and refunded automatically if the task fails. Image tasks created through the API are grouped into the "Open API" conversation in the web app, so you can see them on the web as well.
::: example imagesSubmit
## Request headers {#headers}
| Header | Required | Description |
| --- | --- | --- |
| \`Authorization\` | Yes | \`Bearer zk-...\` |
| \`Content-Type\` | Yes | \`application/json\` |
| \`Idempotency-Key\` | No | A UUID is recommended, up to 128 characters. The same value creates only one task within 24 hours; see [Idempotent submission](/docs/api/overview#idempotency) |
## Request parameters {#parameters}
| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| \`model\` | string | Yes | Model ID of a model with \`type\` \`image\` from the [models list](/docs/api/models) |
| \`prompt\` | string | Yes | Prompt (no length limit; the upstream model's own limit applies) |
| \`mode\` | string | No | \`text_to_image\`, \`image_to_image\` or \`inpaint\`; inferred when omitted: \`inpaint\` if \`mask_url\` is present, \`image_to_image\` if \`image_urls\` is present, otherwise \`text_to_image\` |
| \`ratio\` | string | No | Aspect ratio; must be one of the model's \`ratios\`, e.g. \`1:1\`, \`16:9\` |
| \`quality\` | string | No | Quality; must be one of the model's \`qualities\` |
| \`n\` | integer | No | Number of images (can also be written as \`count\`); must be one of the model's \`counts\` |
| \`image_urls\` | string[] | No | \`https\` URLs of reference images; \`image_to_image\` and \`inpaint\` require exactly 1 image |
| \`mask_url\` | string | No | Inpainting mask (PNG); used only for \`inpaint\` |
Optional parameters that are omitted use the model's \`defaults\`. Parameters outside the model's supported range return \`400 invalid_request\`.
## Response {#response}
Returns the full [task object](/docs/api/tasks#task-object); right after submission, \`status\` is \`pending\`:
~~~json
{
  "id": "GT2026102716412174278429",
  "object": "generation.task",
  "status": "pending",
  "model": "gpt-image-2",
  "type": "image",
  "mode": "text_to_image",
  "prompt": "A red fox sitting in a snowy pine forest at dawn, soft light, 35mm photo",
  "cost_points": 15,
  "created_at": 1793090482,
  "finished_at": null,
  "error": null,
  "progress": { "stage": "queued", "percent": null },
  "data": []
}
~~~
| Field | Description |
| --- | --- |
| \`id\` | Task ID, used with \`GET /tasks/{id}\` |
| \`cost_points\` | Credits charged for this request |
| \`created_at\` | Creation time, Unix timestamp (seconds) |
A replay with the same \`Idempotency-Key\` also returns \`202\` and the task created the first time, with the response header \`Idempotent-Replayed: true\`.
## Image-to-image and inpainting {#image-to-image}
- **Image-to-image**: set \`mode\` to \`image_to_image\` (or pass only \`image_urls\`) and pass 1 reference image in \`image_urls\`.
- **Inpainting**: set \`mode\` to \`inpaint\` (or pass \`mask_url\`), pass 1 source image in \`image_urls\`, and pass the mask in \`mask_url\`.
Mask requirements: PNG format, same dimensions as the source image; **transparent areas (alpha 0) are the parts to be regenerated**, and all other areas are opaque.
::: example imagesEdit
> [!NOTE]
> Reference images and masks are downloaded by the server: only publicly accessible \`https\` URLs are accepted (private network addresses are not supported). PNG, JPEG and WebP are supported, up to 20 MB each. If a download fails or a URL is deemed unsafe, the API returns \`400 invalid_request\`.
## Getting results {#result}
After submitting, poll \`GET /tasks/{id}\` with the returned \`id\` until \`status\` is \`succeeded\` or \`failed\`. See the [end-to-end example in the API overview](/docs/api/overview#end-to-end) for complete polling code, and [Tasks](/docs/api/tasks) for the task object.
`,
};
