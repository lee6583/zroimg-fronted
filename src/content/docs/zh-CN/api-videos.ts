import type { DocsPageContent } from "../types";

export const apiVideos: DocsPageContent = {
  navTitle: "视频生成",
  title: "视频生成 API",
  description:
    "POST /open/v1/videos/generations 提交文生视频和图生视频任务，可指定时长、比例、分辨率和多张参考图，返回异步任务对象与本次消耗的积分。",
  body: `
## 提交视频生成任务 {#create}
~~~http
POST /open/v1/videos/generations
~~~
提交成功返回 \`202 Accepted\` 和任务对象，响应格式与 [图片生成](/docs/api/images#response) 相同（\`type\` 为 \`video\`）。视频生成通常需要几分钟，请用 [任务接口](/docs/api/tasks) 轮询结果。
::: example videosSubmit
\`YOUR_VIDEO_MODEL_ID\` 需要替换为 [模型列表](/docs/api/models) 中 \`type\` 为 \`video\` 的模型 ID。
## 请求参数 {#parameters}
| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| \`model\` | string | 是 | 视频模型 ID |
| \`prompt\` | string | 是 | 描述画面内容、镜头运动和风格，最多 4000 个字符 |
| \`mode\` | string | 否 | \`text_to_video\` 或 \`image_to_video\`；省略时按是否传了 \`image_urls\` 推断 |
| \`duration\` | integer | 否 | 时长（秒），必须是模型 \`durations\` 中的值 |
| \`ratio\` | string | 否 | 画面比例，必须是模型 \`ratios\` 中的值 |
| \`resolution\` | string | 否 | 分辨率，必须是模型 \`resolutions\` 中的值 |
| \`image_urls\` | string[] | 否 | 参考图（\`https\` 地址），\`image_to_video\` 时必填，可以传多张，数量不超过模型的 \`maxReferenceImages\`（部分模型有最少张数要求） |
省略的可选参数使用模型的 \`defaults\`。请求头与图片接口相同，同样支持 \`Idempotency-Key\`。参考图的格式和大小要求与 [图片接口](/docs/api/images#image-to-image) 相同。
> [!NOTE]
> 是否带音频目前由模型决定，接口暂不提供开关。
## 计费 {#billing}
视频模型的 \`pricing.unit\` 可能是：
- \`second\`：按秒计费，积分 = 每秒积分 × \`duration\`。
- \`request\`：按条计费，每条视频固定积分。
- 图生视频可能对每张参考图额外收取 \`reference_image_points\`。
提交时立即按 \`cost_points\` 扣除积分，失败自动退还。详见 [积分与计费](/docs/billing)。
## 结果 {#result}
任务成功后，\`GET /tasks/{id}\` 返回的 \`data\` 中包含 \`type\` 为 \`video\` 的结果：
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
> 视频文件较大，结果地址约 24 小时内有效，请在任务完成后尽快下载到自己的存储。下载地址支持 \`Range\` 请求，可以断点续传。
`,
};
