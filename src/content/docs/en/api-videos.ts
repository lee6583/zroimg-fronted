import type { DocsPageContent } from "../types";

export const apiVideos: DocsPageContent = {
  navTitle: "Video Generation",
  title: "Video Generation API",
  description:
    "POST /open/v1/videos/generations submits text-to-video and image-to-video tasks with duration, ratio, resolution and multiple references; returns a task and cost.",
  body: `
## Submit a video generation task {#create}
~~~http
POST /open/v1/videos/generations
~~~
A successful submission returns \`202 Accepted\` and a task object, in the same format as [image generation](/docs/api/images#response) (with \`type\` \`video\`). Video generation usually takes a few minutes; poll for results with the [tasks endpoint](/docs/api/tasks).
::: example videosSubmit
Replace \`YOUR_VIDEO_MODEL_ID\` with the ID of a model with \`type\` \`video\` from the [models list](/docs/api/models).
## Request parameters {#parameters}
| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| \`model\` | string | Yes | Video model ID |
| \`prompt\` | string | Yes | Describes the scene content, camera movement and style; up to 4000 characters |
| \`mode\` | string | No | \`text_to_video\` or \`image_to_video\`; when omitted, inferred from whether \`image_urls\` is provided |
| \`duration\` | integer | No | Duration (seconds); must be one of the model's \`durations\` |
| \`ratio\` | string | No | Aspect ratio; must be one of the model's \`ratios\` |
| \`resolution\` | string | No | Resolution; must be one of the model's \`resolutions\` |
| \`image_urls\` | string[] | No | Reference images (\`https\` URLs); required for \`image_to_video\`; multiple images allowed, no more than the model's \`maxReferenceImages\` (some models require a minimum number) |
Optional parameters that are omitted use the model's \`defaults\`. Request headers are the same as for the image endpoint, and \`Idempotency-Key\` is supported as well. Reference image format and size requirements are the same as for the [image endpoint](/docs/api/images#image-to-image).
> [!NOTE]
> Whether a video includes audio is currently determined by the model; the API does not yet provide a toggle.
## Billing {#billing}
A video model's \`pricing.unit\` may be:
- \`second\`: billed per second; credits = credits per second × \`duration\`.
- \`request\`: billed per request; a fixed number of credits per video.
- Image-to-video may charge an extra \`reference_image_points\` per reference image.
Credits are deducted immediately on submission according to \`cost_points\` and refunded automatically on failure. See [Credits and billing](/docs/billing) for details.
## Results {#result}
After the task succeeds, the \`data\` returned by \`GET /tasks/{id}\` contains results with \`type\` \`video\`:
~~~json
{
  "id": "GT2026102716503391827364",
  "object": "generation.task",
  "status": "succeeded",
  "type": "video",
  "data": [
    {
      "url": "https://api.zroimg.com/open/v1/files/58?exp=1793178000&sig=...",
      "type": "video",
      "expires_at": 1793178000
    }
  ]
}
~~~
> [!TIP]
> Video files are large and result URLs are valid for about 24 hours, so download them to your own storage soon after the task completes. Download URLs support \`Range\` requests, so interrupted downloads can be resumed.
`,
};
