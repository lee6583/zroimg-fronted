import type { DocsPageContent } from "../types";

export const apiErrors: DocsPageContent = {
  navTitle: "Error Codes",
  title: "API Error Codes",
  description:
    "ZroImg API error format and codes: auth failures, insufficient credits, rate and concurrency limits, idempotency conflicts, invalid params, not found, and retries.",
  body: `
## Error format {#format}
When a request fails, the API returns a 4xx or 5xx status code with this response body:
~~~json
{
  "error": {
    "code": "invalid_request",
    "message": "Model gpt-image-2 does not support ratio 21:9",
    "type": "invalid_request_error"
  }
}
~~~
| Field | Description |
| --- | --- |
| \`code\` | Stable error code; your program should use it to determine the error type |
| \`message\` | Human-readable description (currently in Chinese); its content may change, so don't rely on it in program logic |
| \`type\` | Error category: \`invalid_request_error\`, \`authentication_error\`, \`rate_limit_error\` or \`api_error\` |
## Error code list {#codes}
| HTTP status | \`code\` | Meaning | Recommended handling |
| --- | --- | --- | --- |
| 400 | \`invalid_request\` | Parameters missing or malformed, unsupported mode/ratio/quality, or a reference image failed to download or its URL is unsafe | Fix the parameters based on \`message\`; don't retry as-is |
| 401 | \`invalid_api_key\` | Key missing, incorrect, expired or revoked, or the account is disabled | Check the \`Authorization\` header and create a new key if needed |
| 402 | \`insufficient_points\` | Insufficient credits; no task was created and nothing was charged | Retry after you [buy credits](/credits) |
| 403 | \`invalid_signature\` | Result download link has an invalid or expired signature | Call \`GET /tasks/{id}\` again to get a new link |
| 404 | \`model_not_found\` | Model does not exist, is disabled, or its type doesn't match the endpoint | Call the [models list](/docs/api/models) again |
| 404 | \`task_not_found\` | Task does not exist or does not belong to your account | Check the task ID |
| 404 | \`file_not_found\` | The result file has been deleted | It cannot be recovered; generate it again |
| 409 | \`idempotency_conflict\` | A request with the same \`Idempotency-Key\` is still being processed | Wait a few seconds and retry with the same value |
| 429 | \`rate_limited\` | Per-minute request limit exceeded | Wait for the duration in the \`Retry-After\` response header, then retry |
| 429 | \`concurrency_limit\` | In-progress task cap reached | Wait for the \`Retry-After\` duration (10 seconds), or until existing tasks finish, before submitting |
| 500 | \`server_error\` | Internal server error | Retry later; for submit endpoints, reuse the same \`Idempotency-Key\` |
| 502 | \`upstream_error\` | Upstream service failure (e.g. prompt polish failed; credits have been refunded) | Retry later |
## Retry strategy {#retries}
- **Retry**: \`409\`, \`429\`, \`500\`, \`502\` and network timeouts. Use exponential backoff (e.g. 2, 4, 8 seconds); for \`429\`, prefer \`Retry-After\`.
- **Don't retry**: \`400\`, \`401\`, \`402\`, \`403\`, \`404\`; fix the request first.
- **Reuse the same \`Idempotency-Key\` when retrying submit endpoints**, so that even if the first request actually succeeded, no second task is created and you aren't charged twice. See [Idempotent submission](/docs/api/overview#idempotency).
## Task failures vs. API errors {#task-failures}
A \`202\` from a submit endpoint only means the task has been created. Problems that occur during generation are not returned as HTTP errors; instead they are reflected on the task: \`GET /tasks/{id}\` returns \`status: "failed"\` and \`error.message\`. Credits for failed tasks are refunded automatically.
`,
};
