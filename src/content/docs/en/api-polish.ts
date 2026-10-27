import type { DocsPageContent } from "../types";

export const apiPolish: DocsPageContent = {
  navTitle: "Prompt Polish",
  title: "Prompt Polish API",
  description:
    "POST /open/v1/prompts/polish expands a short description into a detailed image or video prompt, billed like web AI polish; returns the result, cost and balance.",
  body: `
## Polish a prompt {#polish}
~~~http
POST /open/v1/prompts/polish
~~~
Works the same as "AI polish" in the web app: it expands a simple idea into a complete prompt covering subject, setting, lighting, composition and style. This endpoint is **synchronous** and returns the polished result directly, with no polling needed.
::: example polish
## Request parameters {#parameters}
| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| \`prompt\` | string | Yes | Original description to polish |
| \`scene\` | string | No | \`image\` (default) or \`video\`; polishes in the style of an image or video prompt |
| \`image_urls\` | string[] | No | Reference image HTTPS URLs, up to 4 (PNG / JPEG / WebP). The result stays grounded in the images: it keeps the subject, setting, palette, lighting and style they show and treats \`prompt\` as the requested change or action; for \`video\` it describes motion and camera work starting from the image |
## Response {#response}
~~~json
{
  "prompt": "A fluffy ginger cat curled up on a sunlit wooden windowsill, soft morning light, shallow depth of field, warm tones, cozy atmosphere",
  "cost_points": 1,
  "balance": 275
}
~~~
| Field | Type | Description |
| --- | --- | --- |
| \`prompt\` | string | Polished prompt |
| \`cost_points\` | integer | Credits charged for this request |
| \`balance\` | integer | Credit balance after the charge |
## Billing and limits {#billing}
- Each polish is charged separately at the same price as in the web app; credits are refunded automatically if polishing fails.
- Counts toward the submit endpoint limit (20 requests / minute per key).
- Returns \`400 invalid_request\` when the platform has not enabled the polish service; an upstream service failure returns \`502 upstream_error\`, and credits are refunded.
- If \`image_urls\` is provided but the platform's polish model cannot read images, returns \`502 upstream_error\` and the credits are refunded.
The polished result can be used directly as the \`prompt\` for [image generation](/docs/api/images) or [video generation](/docs/api/videos).
`,
};
