import { openApiBaseUrl } from "@/lib/open-api";
import type { DocsPageContent } from "../types";

export const apiOverview: DocsPageContent = {
  navTitle: "API 概览",
  title: "开放 API 概览",
  description:
    "ZroImg 开放 API 入门：Base URL、API 密钥认证、异步任务模型、幂等提交、速率限制与错误格式，附完整的 Python 和 JavaScript 轮询示例。",
  body: `
## 简介 {#introduction}
ZroImg 开放 API 让你在自己的程序中调用平台上的图片和视频生成模型。API 采用 REST 风格，请求和响应都是 JSON，消耗的是你账户中的积分，规则与网页端一致（见 [积分与计费](/docs/billing)）。
## Base URL {#base-url}
所有接口都以下面的地址为前缀：
~~~text
${openApiBaseUrl}/open/v1
~~~
| 接口 | 说明 |
| --- | --- |
| \`GET /models\` | [可用模型与参数](/docs/api/models) |
| \`POST /images/generations\` | [提交图片生成任务](/docs/api/images) |
| \`POST /videos/generations\` | [提交视频生成任务](/docs/api/videos) |
| \`GET /tasks/{id}\` | [查询任务状态与结果](/docs/api/tasks) |
| \`GET /tasks\` | [列出任务](/docs/api/tasks#list-tasks) |
| \`POST /prompts/polish\` | [AI 润色提示词](/docs/api/polish) |
| \`GET /balance\` | [查询积分余额](/docs/api/balance) |
## 认证 {#authentication}
API 使用 API 密钥认证。登录后在 [账户设置 → API 密钥](/settings#api-keys) 创建密钥，密钥以 \`zk-\` 开头，**只在创建时完整显示一次**，请立即保存（服务端只保存哈希，丢失后只能重新创建）。每个账户最多同时拥有 10 个有效密钥（未吊销且未过期），可以设置有效期，也可以随时吊销，吊销立即生效。
每个请求都在 \`Authorization\` 请求头中携带密钥（也可以使用 \`X-API-Key: zk-...\` 请求头）：
~~~http
Authorization: Bearer zk-xxxxxxxxxxxxxxxxxxxxxxxx
~~~
密钥不存在、已吊销、已过期或账户被禁用时返回 \`401 invalid_api_key\`。API 密钥只能用于 \`/open/v1\` 接口。
用余额接口验证密钥是否可用：
::: example balance
> [!WARNING]
> API 密钥等同于你的账户积分，请只在服务端使用。不要把密钥写进网页、App 或公开的代码仓库；一旦泄露，请立即在账户设置中吊销并创建新的密钥。
## 异步任务模型 {#async-tasks}
图片和视频生成需要较长时间，所以 API 采用「提交 + 轮询」的异步模型：
1. 调用 \`POST /images/generations\` 或 \`POST /videos/generations\` 提交任务。服务端校验参数并扣除积分后立即返回 \`202 Accepted\`，响应中包含任务 \`id\` 和本次消耗的 \`cost_points\`。
2. 每隔 3–5 秒调用 \`GET /tasks/{id}\` 查询任务状态。图片通常需要 30–90 秒，视频通常需要几分钟。
3. 状态变为 \`succeeded\` 时，从 \`data\` 中读取结果地址并下载；变为 \`failed\` 时，从 \`error.message\` 读取原因，积分已自动退还。
任务状态：
| 状态 | 含义 |
| --- | --- |
| \`pending\` | 已提交，排队中或等待自动重试 |
| \`processing\` | 生成中，\`progress\` 可能包含进度 |
| \`succeeded\` | 生成成功，\`data\` 中是结果 |
| \`failed\` | 生成失败，\`error\` 中是原因；积分已自动退还 |
> [!NOTE]
> 结果地址是带签名的临时链接，无需认证即可下载，有效期约 24 小时（见 \`data[].expires_at\`）。需要长期保存请下载到自己的存储；链接过期后重新调用 \`GET /tasks/{id}\` 可以获得新的链接。暂不支持 Webhook 回调，请使用轮询。
## 幂等提交 {#idempotency}
网络超时后重试提交接口，可能会创建两个任务并扣两次积分。为避免这种情况，提交时在请求头中带上 \`Idempotency-Key\`（建议使用 UUID）：
~~~http
Idempotency-Key: 6f1c2a9e-3d4b-4c8e-9a51-2b7d0e8f1a33
~~~
- 24 小时内用同一个 API 密钥、相同的 \`Idempotency-Key\` 重复提交，会直接返回第一次创建的任务（仍是 \`202\`，响应头带 \`Idempotent-Replayed: true\`），不会重复扣费。
- 第一次请求还在处理中时重复提交，返回 \`409 idempotency_conflict\`，稍等后用同一个值重试即可。
- 第一次请求失败（没有创建任务、没有扣费）时，可以用同一个值重新提交。
- 每个新任务都应该使用新的 \`Idempotency-Key\`（最长 128 个字符）；只有「重试同一次提交」时才复用。
## 速率限制 {#rate-limits}
| 范围 | 限制 |
| --- | --- |
| 每个 API 密钥的全部接口 | 60 次 / 分钟 |
| 提交类接口（图片生成、视频生成、提示词润色） | 20 次 / 分钟 |
| 同时进行中的任务 | 与网页端共用账户的进行中任务上限，超出时返回 \`concurrency_limit\` |
每个响应都带有 \`X-RateLimit-Limit\` 和 \`X-RateLimit-Remaining\` 响应头，表示每分钟总限额和剩余次数。
超出限制时返回 HTTP \`429\`，错误码为 \`rate_limited\` 或 \`concurrency_limit\`，并带有 \`Retry-After\` 响应头（单位秒），请等待相应时间后重试。\`concurrency_limit\` 表示进行中的任务太多，可以等已有任务完成后再提交。
## 错误格式 {#errors}
出错时 API 返回对应的 HTTP 状态码和统一的错误对象：
~~~json
{
  "error": {
    "code": "insufficient_points",
    "message": "积分不足：本次需要 40 积分，当前余额 12",
    "type": "invalid_request_error"
  }
}
~~~
请根据 \`code\` 判断错误类型，\`message\` 只用于展示和排查（目前为中文说明）。完整列表见 [错误码](/docs/api/errors)。
## 时间格式 {#timestamps}
开放 API 响应中的时间字段（\`created_at\`、\`finished_at\`、\`expires_at\`）都是 Unix 时间戳，单位为秒。
## 完整示例 {#end-to-end}
下面的程序提交一个图片生成任务，轮询直到完成，下载全部结果并打印剩余积分。它处理了 \`429\` 重试和失败任务，可以直接作为接入的起点。把 \`API_KEY\` 替换为你的密钥即可运行。
::: example endToEnd
`,
};
