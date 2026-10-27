import type { DocsPageContent } from "../types";

export const apiTasks: DocsPageContent = {
  navTitle: "Tasks",
  title: "Tasks API Reference",
  description:
    "GET /open/v1/tasks/{id} returns task status, progress, download URLs and failure reasons; GET /open/v1/tasks pages tasks by status and type, with polling tips.",
  body: `
## Get a task {#get-task}
~~~http
GET /open/v1/tasks/{id}
~~~
Returns the current status of a task. Both image and video tasks use this endpoint; each query counts toward the 60 requests per minute limit.
::: example taskGet
### Response {#response}
~~~json
{
  "id": "GT2026102716412174278429",
  "object": "generation.task",
  "status": "succeeded",
  "model": "gpt-image-2",
  "type": "image",
  "mode": "text_to_image",
  "prompt": "A red fox sitting in a snowy pine forest at dawn, soft light, 35mm photo",
  "cost_points": 15,
  "created_at": 1793090482,
  "finished_at": 1793090513,
  "error": null,
  "progress": null,
  "data": [
    {
      "url": "https://api.zroimg.com/open/v1/files/36?exp=1793178000&sig=...",
      "type": "image",
      "width": 1254,
      "height": 1254,
      "expires_at": 1793178000
    }
  ]
}
~~~
### Task object {#task-object}
| Field | Type | Description |
| --- | --- | --- |
| \`id\` | string | Task ID |
| \`object\` | string | Always \`generation.task\` |
| \`status\` | string | \`pending\`, \`processing\`, \`succeeded\` or \`failed\` |
| \`model\` | string | Model ID |
| \`type\` | string | \`image\` or \`video\` |
| \`mode\` | string | Generation mode actually used |
| \`prompt\` | string | Submitted prompt |
| \`cost_points\` | integer | Credits charged on submission; refunded automatically for failed tasks |
| \`created_at\` | integer | Creation time, Unix timestamp (seconds) |
| \`finished_at\` | integer \\| null | Time the task succeeded or failed; \`null\` while still running |
| \`error\` | object \\| null | \`{ "message": "..." }\` only on failure |
| \`progress\` | object \\| null | \`{ "stage": "...", "percent": ... }\` while in progress; \`null\` once finished |
| \`data\` | array | Populated only on success; an empty array otherwise |
Common values of \`progress.stage\` include \`queued\`, \`running\` and \`retrying\`, and it may also be a stage name from the upstream model; \`percent\` may be \`null\`. Use these for display only.
Each item in \`data\`:
| Field | Description |
| --- | --- |
| \`url\` | Signed download URL of the result file; no authentication required |
| \`type\` | \`image\` or \`video\` |
| \`width\`, \`height\` | Pixel dimensions; returned only when known (usually absent for videos) |
| \`expires_at\` | Expiration time of the download URL, Unix timestamp (seconds) |
## Polling recommendations {#polling}
- Poll every 3–5 seconds; images usually finish in 30–90 seconds, while videos usually take a few minutes.
- Stop polling only when \`status\` is \`succeeded\` or \`failed\`.
- On \`429\`, wait for the \`Retry-After\` duration before continuing.
- Set an overall polling timeout (for example, 10 minutes for images and 30 minutes for videos); after a timeout the task keeps running on the server, and you can check it again later.
## Downloading results {#result-urls}
\`data[].url\` is a signed temporary link that **does not require an API key** and can be downloaded directly:
~~~bash
curl -L -o result.png "https://api.zroimg.com/open/v1/files/36?exp=1793178000&sig=..."
~~~
- Links are valid for about 24 hours, as given by \`expires_at\`. After expiry, calling \`GET /tasks/{id}\` again returns a new link.
- An expired or modified link returns \`403 invalid_signature\`; a deleted file returns \`404 file_not_found\`.
- \`Range\` requests are supported (videos can resume downloads and support seeking); append \`&download=1\` to the URL to download it as an attachment.
Download results you need to keep long-term to your own storage, and don't show these links directly to end users.
## Failed tasks {#failed}
When \`status\` is \`failed\`, \`error.message\` explains the reason, and the credits in \`cost_points\` have already been refunded to your account automatically; no further action is needed. You can adjust the parameters and resubmit.
## List tasks {#list-tasks}
~~~http
GET /open/v1/tasks?limit=20&page=1&status=succeeded&type=image
~~~
Lists your account's tasks in reverse order of creation time, including tasks created in the web app.
| Parameter | Type | Description |
| --- | --- | --- |
| \`limit\` | integer | Items per page, 1–50; default 20 |
| \`page\` | integer | Page number, starting from 1; default 1 |
| \`status\` | string | Filter by status: \`pending\`, \`processing\`, \`succeeded\`, \`failed\` |
| \`type\` | string | Filter by type: \`image\`, \`video\` |
~~~json
{
  "object": "list",
  "data": [
    { "id": "GT2026102716412174278429", "object": "generation.task", "status": "succeeded", "...": "..." }
  ],
  "page": 1,
  "limit": 20,
  "total": 16,
  "has_more": false
}
~~~
Each item in \`data\` is a full task object; \`total\` is the total number of matching tasks, and when \`has_more\` is \`true\`, increment \`page\` by 1 to fetch more.
::: example taskList
`,
};
