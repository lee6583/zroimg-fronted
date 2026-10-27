import { openApiBaseUrl } from "@/lib/open-api";
import type { DocsPageContent } from "../types";

export const apiOverview: DocsPageContent = {
  navTitle: "API Overview",
  title: "Open API Overview",
  description:
    "Get started with the ZroImg API: base URL, API key auth, async tasks, idempotent submits, rate limits and errors, plus full Python and JavaScript examples.",
  body: `
## Introduction {#introduction}
The ZroImg open API lets you call the platform's image and video generation models from your own programs. The API is RESTful, requests and responses are JSON, and it consumes credits from your account under the same rules as the web app (see [Credits and billing](/docs/billing)).
## Base URL {#base-url}
All endpoints are prefixed with the following URL:
~~~text
${openApiBaseUrl}/open/v1
~~~
| Endpoint | Description |
| --- | --- |
| \`GET /models\` | [Available models and parameters](/docs/api/models) |
| \`POST /images/generations\` | [Submit an image generation task](/docs/api/images) |
| \`POST /videos/generations\` | [Submit a video generation task](/docs/api/videos) |
| \`GET /tasks/{id}\` | [Get task status and results](/docs/api/tasks) |
| \`GET /tasks\` | [List tasks](/docs/api/tasks#list-tasks) |
| \`POST /prompts/polish\` | [AI prompt polish](/docs/api/polish) |
| \`GET /balance\` | [Get credit balance](/docs/api/balance) |
## Authentication {#authentication}
The API uses API key authentication. After logging in, create a key in [Account settings → API keys](/settings#api-keys). Keys start with \`zk-\` and are **shown in full only once, at creation time**, so save yours immediately (the server stores only a hash; a lost key can only be replaced by creating a new one). Each account can have up to 10 active keys at a time (not revoked and not expired); you can set an expiration date and revoke keys at any time, and revocation takes effect immediately.
Include the key in the \`Authorization\` header of every request (the \`X-API-Key: zk-...\` header also works):
~~~http
Authorization: Bearer zk-xxxxxxxxxxxxxxxxxxxxxxxx
~~~
If the key does not exist, has been revoked or has expired, or the account is disabled, the API returns \`401 invalid_api_key\`. API keys can only be used with \`/open/v1\` endpoints.
Use the balance endpoint to verify that your key works:
::: example balance
> [!WARNING]
> An API key is as good as your account's credits, so use it only on the server side. Never put keys in web pages, apps or public code repositories; if a key is leaked, revoke it immediately in Account settings and create a new one.
## Asynchronous task model {#async-tasks}
Image and video generation takes a while, so the API uses an asynchronous "submit + poll" model:
1. Call \`POST /images/generations\` or \`POST /videos/generations\` to submit a task. After validating the parameters and deducting credits, the server immediately returns \`202 Accepted\`; the response includes the task \`id\` and the \`cost_points\` charged.
2. Call \`GET /tasks/{id}\` every 3–5 seconds to check the task status. Images usually take 30–90 seconds; videos usually take a few minutes.
3. When the status becomes \`succeeded\`, read the result URLs from \`data\` and download them; when it becomes \`failed\`, read the reason from \`error.message\`; the credits have already been refunded automatically.
Task statuses:
| Status | Meaning |
| --- | --- |
| \`pending\` | Submitted; queued or waiting for an automatic retry |
| \`processing\` | Generating; \`progress\` may contain progress information |
| \`succeeded\` | Generation succeeded; results are in \`data\` |
| \`failed\` | Generation failed; the reason is in \`error\`; credits have been refunded automatically |
> [!NOTE]
> Result URLs are signed temporary links that can be downloaded without authentication and are valid for about 24 hours (see \`data[].expires_at\`). For long-term storage, download them to your own storage; after a link expires, call \`GET /tasks/{id}\` again to get a new one. Webhook callbacks are not supported yet, so please use polling.
## Idempotent submission {#idempotency}
Retrying a submit request after a network timeout may create two tasks and charge credits twice. To avoid this, include an \`Idempotency-Key\` header (a UUID is recommended) when submitting:
~~~http
Idempotency-Key: 6f1c2a9e-3d4b-4c8e-9a51-2b7d0e8f1a33
~~~
- Resubmitting with the same API key and the same \`Idempotency-Key\` within 24 hours returns the task created the first time (still \`202\`, with the response header \`Idempotent-Replayed: true\`), with no duplicate charge.
- If you resubmit while the first request is still being processed, the API returns \`409 idempotency_conflict\`; wait a moment and retry with the same value.
- If the first request failed (no task was created and nothing was charged), you can resubmit with the same value.
- Every new task should use a new \`Idempotency-Key\` (up to 128 characters); reuse a key only when retrying the same submission.
## Rate limits {#rate-limits}
| Scope | Limit |
| --- | --- |
| All endpoints per API key | 60 requests / minute |
| Submit endpoints (image generation, video generation, prompt polish) | 20 requests / minute |
| Concurrent in-progress tasks | Shares the account's in-progress task cap with the web app; exceeding it returns \`concurrency_limit\` |
Every response includes the \`X-RateLimit-Limit\` and \`X-RateLimit-Remaining\` headers, indicating the total per-minute limit and the remaining requests.
When a limit is exceeded, the API returns HTTP \`429\` with the error code \`rate_limited\` or \`concurrency_limit\` and a \`Retry-After\` response header (in seconds); wait that long before retrying. \`concurrency_limit\` means too many tasks are in progress; you can wait for existing tasks to finish before submitting more.
## Error format {#errors}
On error, the API returns the corresponding HTTP status code and a uniform error object:
~~~json
{
  "error": {
    "code": "insufficient_points",
    "message": "Insufficient credits: this request requires 40 credits, current balance is 12",
    "type": "invalid_request_error"
  }
}
~~~
Use \`code\` to determine the error type; \`message\` is for display and troubleshooting only (currently in Chinese). See [Error codes](/docs/api/errors) for the full list.
## Timestamps {#timestamps}
Time fields in open API responses (\`created_at\`, \`finished_at\`, \`expires_at\`) are all Unix timestamps in seconds.
## End-to-end example {#end-to-end}
The program below submits an image generation task, polls until it completes, downloads all results and prints the remaining credits. It handles \`429\` retries and failed tasks, so you can use it directly as a starting point for your integration. Replace \`API_KEY\` with your key to run it.
::: example endToEnd
`,
};
