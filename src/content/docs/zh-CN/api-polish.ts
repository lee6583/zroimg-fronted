import type { DocsPageContent } from "../types";

export const apiPolish: DocsPageContent = {
  navTitle: "提示词润色",
  title: "提示词润色 API",
  description:
    "POST /open/v1/prompts/polish 把简短的描述扩写为细节完整的图片或视频提示词，与网页端「AI 润色」计费相同，同步返回结果、消耗积分和剩余余额。",
  body: `
## 润色提示词 {#polish}
~~~http
POST /open/v1/prompts/polish
~~~
与网页端的「AI 润色」相同：把一句简单的想法扩写成包含主体、场景、光线、构图和风格的完整提示词。这个接口是**同步**的，直接返回润色结果，不需要轮询。
::: example polish
## 请求参数 {#parameters}
| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| \`prompt\` | string | 是 | 需要润色的原始描述 |
| \`scene\` | string | 否 | \`image\`（默认）或 \`video\`，按图片或视频的写法润色 |
| \`image_urls\` | string[] | 否 | 参考图 HTTPS 地址，最多 4 张（PNG / JPEG / WebP）。传入后会以图片内容为准：保留图中的主体、场景、色调、光线和风格，\`prompt\` 视为要做的改动或动作；视频场景从图片开始描述运动和运镜 |
## 响应 {#response}
~~~json
{
  "prompt": "A fluffy ginger cat curled up on a sunlit wooden windowsill, soft morning light, shallow depth of field, warm tones, cozy atmosphere",
  "cost_points": 1,
  "balance": 275
}
~~~
| 字段 | 类型 | 说明 |
| --- | --- | --- |
| \`prompt\` | string | 润色后的提示词 |
| \`cost_points\` | integer | 本次扣除的积分 |
| \`balance\` | integer | 扣费后的积分余额 |
## 计费与限制 {#billing}
- 每次润色单独扣费，价格与网页端相同；润色失败时积分自动退还。
- 计入提交类接口的限额（每个密钥 20 次 / 分钟）。
- 平台未开放润色服务时返回 \`400 invalid_request\`；上游服务失败返回 \`502 upstream_error\`，积分已退还。
- 传了 \`image_urls\` 但平台配置的润色模型不支持识图时，返回 \`502 upstream_error\`（「当前润色模型不支持识图…」），积分已退还。
润色结果可以直接作为 [图片生成](/docs/api/images) 或 [视频生成](/docs/api/videos) 的 \`prompt\`。
`,
};
