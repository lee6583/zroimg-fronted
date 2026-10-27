import type { DocsPageContent } from "../types";

export const apiModels: DocsPageContent = {
  navTitle: "Models",
  title: "Model List API",
  description:
    "GET /open/v1/models lists available image and video models with modes, ratios, quality or resolution, counts, durations, reference limits, defaults and pricing.",
  body: `
## List models {#list-models}
~~~http
GET /open/v1/models
~~~
Returns all models currently available to call. Models, parameters and prices change with platform configuration, so **read this endpoint in your program to determine the available parameters** instead of hard-coding them.
::: example listModels
## Response {#response}
~~~json
{
  "object": "list",
  "data": [
    {
      "id": "gpt-image-2",
      "object": "model",
      "name": "GPT Image 2",
      "type": "image",
      "modes": ["text_to_image", "image_to_image", "inpaint"],
      "ratios": ["1:1", "16:9", "9:16", "4:3", "3:4"],
      "qualities": ["low", "medium", "high", "auto"],
      "counts": [1, 2, 3, 4],
      "maxReferenceImages": 1,
      "defaults": { "mode": "text_to_image", "ratio": "1:1", "quality": "low", "count": 1 },
      "pricing": {
        "unit": "image",
        "items": [
          { "mode": "text_to_image", "quality": "low", "points": 10 },
          { "mode": "text_to_image", "quality": "medium", "points": 15 }
        ]
      },
      "description": "Default image model"
    },
    {
      "id": "YOUR_VIDEO_MODEL_ID",
      "object": "model",
      "name": "Example Video",
      "type": "video",
      "modes": ["text_to_video", "image_to_video"],
      "ratios": ["16:9", "9:16"],
      "resolutions": ["720p"],
      "durations": [4, 6, 8],
      "maxReferenceImages": 9,
      "defaults": { "mode": "text_to_video", "ratio": "16:9", "resolution": "720p", "duration": 6 },
      "pricing": {
        "unit": "request",
        "items": [
          { "mode": "text_to_video", "resolution": "720p", "points": 40, "unit": "request" },
          { "mode": "image_to_video", "resolution": "720p", "points": 40, "unit": "request", "reference_image_points": 0 }
        ]
      }
    }
  ]
}
~~~
Prices in the example only illustrate the format; actual values are those returned by the endpoint.
## Model object {#model-object}
| Field | Type | Description |
| --- | --- | --- |
| \`id\` | string | Model ID (same as on the web app), passed as the \`model\` parameter when submitting a task |
| \`object\` | string | Always \`model\` |
| \`name\` | string | Display name |
| \`type\` | string | \`image\` or \`video\` |
| \`modes\` | string[] | Supported generation modes; see the table below |
| \`ratios\` | string[] | Supported aspect ratios, e.g. \`16:9\` |
| \`qualities\` | string[] | Image models only: supported quality levels |
| \`counts\` | number[] | Image models only: number of images that can be generated per request |
| \`resolutions\` | string[] | Video models only: supported resolutions |
| \`durations\` | number[] | Video models only: supported durations (seconds) |
| \`maxReferenceImages\` | number | Maximum number of reference images; 0 means reference images are not supported |
| \`defaults\` | object | Default values used for parameters omitted on submission |
| \`pricing\` | object | Billing method and prices; see below |
| \`description\` | string | Optional model description |
## Generation modes {#modes}
| Mode | Type | Description |
| --- | --- | --- |
| \`text_to_image\` | Image | Generate images from a prompt only |
| \`image_to_image\` | Image | Generate from 1 reference image |
| \`inpaint\` | Image | Inpainting: 1 source image plus a \`mask_url\` mask |
| \`text_to_video\` | Video | Generate videos from a prompt only |
| \`image_to_video\` | Video | Generate videos from reference images |
Image qualities \`low\`, \`medium\` and \`high\` correspond to roughly 1K, 2K and 4K output; \`auto\` is billed as \`medium\`.
## Pricing fields {#pricing}
\`pricing.unit\` determines how credits are calculated:
- \`image\`: credits per image × number of images \`n\`.
- \`second\`: credits per second × video duration \`duration\`.
- \`request\`: a fixed number of credits per video.
\`pricing.items\` lists the unit price \`points\` by mode and quality (images) or by mode and resolution (videos). Image-to-video entries may include \`reference_image_points\`, the extra credits charged per reference image.
The credits actually charged are given by \`cost_points\` returned from the submit endpoint, under the same rules as the web app; see [Credits and billing](/docs/billing#pricing-units).
`,
};
