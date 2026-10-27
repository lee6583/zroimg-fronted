import type { DocsPageContent } from "../types";

export const apiErrors: DocsPageContent = {
  navTitle: "错误码",
  title: "错误码",
  description:
    "ZroImg 开放 API 的错误格式与全部错误码：认证失败、积分不足、速率与并发限制、幂等冲突、参数错误、资源不存在、上游错误，以及推荐的重试策略。",
  body: `
## 错误格式 {#format}
请求失败时，API 返回 4xx 或 5xx 状态码，响应体为：
~~~json
{
  "error": {
    "code": "invalid_request",
    "message": "模型 gpt-image-2 不支持比例 21:9",
    "type": "invalid_request_error"
  }
}
~~~
| 字段 | 说明 |
| --- | --- |
| \`code\` | 稳定的错误码，程序应该根据它判断错误类型 |
| \`message\` | 人类可读的说明（目前为中文），内容可能调整，不要用于程序判断 |
| \`type\` | 错误大类：\`invalid_request_error\`、\`authentication_error\`、\`rate_limit_error\` 或 \`api_error\` |
## 错误码列表 {#codes}
| HTTP 状态码 | \`code\` | 含义 | 建议处理 |
| --- | --- | --- | --- |
| 400 | \`invalid_request\` | 参数缺失或格式错误、模式/比例/画质不受支持、参考图下载失败或地址不安全 | 根据 \`message\` 修正参数，不要原样重试 |
| 401 | \`invalid_api_key\` | 缺少密钥、密钥错误、已过期或已吊销，或账户被禁用 | 检查 \`Authorization\` 请求头，必要时创建新密钥 |
| 402 | \`insufficient_points\` | 积分不足，任务未创建，也未扣费 | [购买积分](/credits) 后重试 |
| 403 | \`invalid_signature\` | 结果下载链接签名无效或已过期 | 重新调用 \`GET /tasks/{id}\` 获取新链接 |
| 404 | \`model_not_found\` | 模型不存在、已停用或类型与接口不符 | 重新调用 [模型列表](/docs/api/models) |
| 404 | \`task_not_found\` | 任务不存在或不属于当前账户 | 检查任务 ID |
| 404 | \`file_not_found\` | 结果文件已被删除 | 无法恢复，需要重新生成 |
| 409 | \`idempotency_conflict\` | 相同 \`Idempotency-Key\` 的请求仍在处理中 | 稍等几秒后用同一个值重试 |
| 429 | \`rate_limited\` | 超过每分钟请求限额 | 按 \`Retry-After\` 响应头等待后重试 |
| 429 | \`concurrency_limit\` | 进行中的任务已达上限 | 按 \`Retry-After\`（10 秒）等待，或等已有任务完成后再提交 |
| 500 | \`server_error\` | 服务端内部错误 | 稍后重试；提交接口请带同一个 \`Idempotency-Key\` |
| 502 | \`upstream_error\` | 上游服务失败（例如提示词润色失败，积分已退还） | 稍后重试 |
## 重试策略 {#retries}
- **可以重试**：\`409\`、\`429\`、\`500\`、\`502\` 以及网络超时。使用指数退避（例如 2、4、8 秒），\`429\` 优先使用 \`Retry-After\`。
- **不要重试**：\`400\`、\`401\`、\`402\`、\`403\`、\`404\`，先修正请求。
- **重试提交接口时复用同一个 \`Idempotency-Key\`**，这样即使第一次请求其实已经成功，也不会创建第二个任务或重复扣费。见 [幂等提交](/docs/api/overview#idempotency)。
## 任务失败与接口错误的区别 {#task-failures}
提交接口返回 \`202\` 只代表任务已经创建。生成过程中出现的问题不会以 HTTP 错误返回，而是体现在任务上：\`GET /tasks/{id}\` 返回 \`status: "failed"\` 和 \`error.message\`。失败任务的积分会自动退还。
`,
};
