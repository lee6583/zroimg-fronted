import type { DocsPageContent } from "../types";

export const apiImages: DocsPageContent = {
  navTitle: "图片生成",
  title: "图片生成 API",
  description:
    "POST /open/v1/images/generations 提交文生图、参考图生图和局部重绘任务，返回异步任务对象和本次消耗的积分；支持 Idempotency-Key 防止重复扣费。",
  body: `
## 提交图片生成任务 {#create}
~~~http
POST /open/v1/images/generations
~~~
提交成功返回 \`202 Accepted\` 和一个任务对象。任务在后台运行，用 [任务接口](/docs/api/tasks) 查询结果。提交时会立即扣除积分，任务失败自动退还。通过 API 创建的图片任务会归入网页端的「Open API」对话，在网页上也能看到。
::: example imagesSubmit
## 请求头 {#headers}
| 请求头 | 必填 | 说明 |
| --- | --- | --- |
| \`Authorization\` | 是 | \`Bearer zk-...\` |
| \`Content-Type\` | 是 | \`application/json\` |
| \`Idempotency-Key\` | 否 | 建议使用 UUID，最长 128 个字符。24 小时内相同的值只会创建一个任务，见 [幂等提交](/docs/api/overview#idempotency) |
## 请求参数 {#parameters}
| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| \`model\` | string | 是 | 模型 ID，来自 [模型列表](/docs/api/models) 中 \`type\` 为 \`image\` 的模型 |
| \`prompt\` | string | 是 | 提示词，最多 4000 个字符 |
| \`mode\` | string | 否 | \`text_to_image\`、\`image_to_image\` 或 \`inpaint\`；省略时自动推断：有 \`mask_url\` 为 \`inpaint\`，有 \`image_urls\` 为 \`image_to_image\`，否则为 \`text_to_image\` |
| \`ratio\` | string | 否 | 画面比例，必须是模型 \`ratios\` 中的值，例如 \`1:1\`、\`16:9\` |
| \`quality\` | string | 否 | 画质，必须是模型 \`qualities\` 中的值 |
| \`n\` | integer | 否 | 生成张数（也可以写作 \`count\`），必须是模型 \`counts\` 中的值 |
| \`image_urls\` | string[] | 否 | 参考图的 \`https\` 地址；\`image_to_image\` 和 \`inpaint\` 需要且只支持 1 张 |
| \`mask_url\` | string | 否 | 局部重绘遮罩（PNG），仅 \`inpaint\` 使用 |
省略的可选参数使用模型的 \`defaults\`。参数不在模型支持范围内时返回 \`400 invalid_request\`。
## 响应 {#response}
返回完整的 [任务对象](/docs/api/tasks#task-object)，刚提交时 \`status\` 为 \`pending\`：
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
| 字段 | 说明 |
| --- | --- |
| \`id\` | 任务 ID，用于 \`GET /tasks/{id}\` |
| \`cost_points\` | 本次扣除的积分 |
| \`created_at\` | 创建时间，Unix 时间戳（秒） |
使用相同 \`Idempotency-Key\` 重放时同样返回 \`202\` 和第一次创建的任务，响应头带 \`Idempotent-Replayed: true\`。
## 参考图生图与局部重绘 {#image-to-image}
- **参考图生图**：\`mode\` 设为 \`image_to_image\`（或只传 \`image_urls\`），在 \`image_urls\` 中传入 1 张参考图。
- **局部重绘**：\`mode\` 设为 \`inpaint\`（或传 \`mask_url\`），在 \`image_urls\` 中传入 1 张原图，在 \`mask_url\` 中传入遮罩。
遮罩要求：PNG 格式，尺寸与原图一致；**透明区域（alpha 为 0）是需要重绘的部分**，其余区域为不透明。
::: example imagesEdit
> [!NOTE]
> 参考图和遮罩由服务端下载：只接受公网可访问的 \`https\` 地址（不支持内网地址），支持 PNG、JPEG、WebP，单张不超过 10 MB。下载失败或地址不安全时返回 \`400 invalid_request\`。
## 获取结果 {#result}
提交后用返回的 \`id\` 轮询 \`GET /tasks/{id}\`，直到 \`status\` 为 \`succeeded\` 或 \`failed\`。完整的轮询代码见 [API 概览中的完整示例](/docs/api/overview#end-to-end)，任务对象说明见 [任务](/docs/api/tasks)。
`,
};
