import type { DocsPageContent } from "../types";

export const apiTasks: DocsPageContent = {
  navTitle: "任务",
  title: "任务 API",
  description:
    "GET /open/v1/tasks/{id} 查询生成任务的状态、进度、结果下载地址和失败原因；GET /open/v1/tasks 按状态和类型分页列出任务。附轮询建议与结果链接有效期说明。",
  body: `
## 查询任务 {#get-task}
~~~http
GET /open/v1/tasks/{id}
~~~
返回任务的当前状态。图片和视频任务都使用这个接口；每次查询计入每分钟 60 次的请求限额。
::: example taskGet
### 响应 {#response}
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
### 任务对象 {#task-object}
| 字段 | 类型 | 说明 |
| --- | --- | --- |
| \`id\` | string | 任务 ID |
| \`object\` | string | 固定为 \`generation.task\` |
| \`status\` | string | \`pending\`、\`processing\`、\`succeeded\` 或 \`failed\` |
| \`model\` | string | 模型 ID |
| \`type\` | string | \`image\` 或 \`video\` |
| \`mode\` | string | 实际使用的生成模式 |
| \`prompt\` | string | 提交的提示词 |
| \`cost_points\` | integer | 提交时扣除的积分；失败任务会自动退还 |
| \`created_at\` | integer | 创建时间，Unix 时间戳（秒） |
| \`finished_at\` | integer \\| null | 完成或失败的时间，未结束时为 \`null\` |
| \`error\` | object \\| null | 仅失败时为 \`{ "message": "..." }\` |
| \`progress\` | object \\| null | 进行中时为 \`{ "stage": "...", "percent": ... }\`，结束后为 \`null\` |
| \`data\` | array | 仅成功时有内容，否则为空数组 |
\`progress.stage\` 的常见值有 \`queued\`、\`running\`、\`retrying\`，也可能是上游模型的阶段名；\`percent\` 可能为 \`null\`。请把它们只用于展示。
\`data\` 中每一项：
| 字段 | 说明 |
| --- | --- |
| \`url\` | 结果文件的签名下载地址，无需认证 |
| \`type\` | \`image\` 或 \`video\` |
| \`width\`、\`height\` | 像素尺寸，仅在已知时返回（视频通常没有） |
| \`expires_at\` | 下载地址的过期时间，Unix 时间戳（秒） |
## 轮询建议 {#polling}
- 每 3–5 秒查询一次；图片通常 30–90 秒完成，视频通常需要几分钟。
- 只在 \`status\` 为 \`succeeded\` 或 \`failed\` 时停止轮询。
- 遇到 \`429\` 时按 \`Retry-After\` 等待后再继续。
- 给轮询设置一个总超时（例如图片 10 分钟、视频 30 分钟）；超时后任务仍在服务端运行，可以稍后再查。
## 下载结果 {#result-urls}
\`data[].url\` 是带签名的临时链接，**不需要 API 密钥**，可以直接下载：
~~~bash
curl -L -o result.png "https://api.zroimg.com/open/v1/files/36?exp=1793178000&sig=..."
~~~
- 有效期约 24 小时，以 \`expires_at\` 为准。过期后再次调用 \`GET /tasks/{id}\` 会返回新的链接。
- 链接过期或被修改返回 \`403 invalid_signature\`；文件已被删除返回 \`404 file_not_found\`。
- 支持 \`Range\` 请求（视频可以断点续传、拖动播放）；在地址后加 \`&download=1\` 会以附件形式下载。
需要长期保存的结果请下载到自己的存储，不要直接把这些链接展示给最终用户。
## 失败的任务 {#failed}
\`status\` 为 \`failed\` 时，\`error.message\` 说明失败原因，\`cost_points\` 对应的积分已经自动退还到账户，不需要额外操作。可以修改参数后重新提交。
## 列出任务 {#list-tasks}
~~~http
GET /open/v1/tasks?limit=20&page=1&status=succeeded&type=image
~~~
按创建时间倒序列出当前账户的任务，包括在网页端创建的任务。
| 参数 | 类型 | 说明 |
| --- | --- | --- |
| \`limit\` | integer | 每页数量，1–50，默认 20 |
| \`page\` | integer | 页码，从 1 开始，默认 1 |
| \`status\` | string | 按状态筛选：\`pending\`、\`processing\`、\`succeeded\`、\`failed\` |
| \`type\` | string | 按类型筛选：\`image\`、\`video\` |
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
\`data\` 中每一项都是完整的任务对象；\`total\` 是符合条件的任务总数，\`has_more\` 为 \`true\` 时把 \`page\` 加 1 继续获取。
::: example taskList
`,
};
