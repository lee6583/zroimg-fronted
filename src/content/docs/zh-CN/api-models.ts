import type { DocsPageContent } from "../types";

export const apiModels: DocsPageContent = {
  navTitle: "模型列表",
  title: "模型列表 API",
  description:
    "GET /open/v1/models 返回当前可用的图片和视频模型，以及每个模型支持的模式、比例、画质或分辨率、数量、时长、参考图数量、默认值和计费价格。",
  body: `
## 列出模型 {#list-models}
~~~http
GET /open/v1/models
~~~
返回当前可以调用的全部模型。模型、参数和价格会随平台配置调整，**请在程序中读取这个接口来决定可用参数**，不要写死。
::: example listModels
## 响应 {#response}
~~~json
{
  "object": "list",
  "data": [
    {
      "id": "gpt-image-2",
      "object": "model",
      "name": "GPT Image 2",
      "type": "image",
      "modes": ["text_to_image", "image_to_image", "inpaint"],
      "ratios": ["1:1", "16:9", "9:16", "4:3", "3:4"],
      "qualities": ["low", "medium", "high", "auto"],
      "counts": [1, 2, 3, 4],
      "maxReferenceImages": 1,
      "defaults": { "mode": "text_to_image", "ratio": "1:1", "quality": "low", "count": 1 },
      "pricing": {
        "unit": "image",
        "items": [
          { "mode": "text_to_image", "quality": "low", "points": 10 },
          { "mode": "text_to_image", "quality": "medium", "points": 15 }
        ]
      },
      "description": "默认图片生成模型"
    },
    {
      "id": "YOUR_VIDEO_MODEL_ID",
      "object": "model",
      "name": "Example Video",
      "type": "video",
      "modes": ["text_to_video", "image_to_video"],
      "ratios": ["16:9", "9:16"],
      "resolutions": ["720p"],
      "durations": [4, 6, 8],
      "maxReferenceImages": 9,
      "defaults": { "mode": "text_to_video", "ratio": "16:9", "resolution": "720p", "duration": 6 },
      "pricing": {
        "unit": "request",
        "items": [
          { "mode": "text_to_video", "resolution": "720p", "points": 40, "unit": "request" },
          { "mode": "image_to_video", "resolution": "720p", "points": 40, "unit": "request", "reference_image_points": 0 }
        ]
      }
    }
  ]
}
~~~
示例中的价格只用于说明格式，实际数值以接口返回为准。
## 模型对象 {#model-object}
| 字段 | 类型 | 说明 |
| --- | --- | --- |
| \`id\` | string | 模型 ID（与网页端相同），提交任务时作为 \`model\` 参数 |
| \`object\` | string | 固定为 \`model\` |
| \`name\` | string | 展示名称 |
| \`type\` | string | \`image\` 或 \`video\` |
| \`modes\` | string[] | 支持的生成模式，见下表 |
| \`ratios\` | string[] | 支持的画面比例，例如 \`16:9\` |
| \`qualities\` | string[] | 仅图片模型：支持的画质 |
| \`counts\` | number[] | 仅图片模型：一次可以生成的张数 |
| \`resolutions\` | string[] | 仅视频模型：支持的分辨率 |
| \`durations\` | number[] | 仅视频模型：支持的时长（秒） |
| \`maxReferenceImages\` | number | 最多可以传入的参考图数量，0 表示不支持参考图 |
| \`defaults\` | object | 提交时省略参数所使用的默认值 |
| \`pricing\` | object | 计费方式与价格，见下文 |
| \`description\` | string | 可选，模型说明 |
## 生成模式 {#modes}
| 模式 | 类型 | 说明 |
| --- | --- | --- |
| \`text_to_image\` | 图片 | 只用提示词生成图片 |
| \`image_to_image\` | 图片 | 基于 1 张参考图生成 |
| \`inpaint\` | 图片 | 局部重绘：1 张原图加 \`mask_url\` 遮罩 |
| \`text_to_video\` | 视频 | 只用提示词生成视频 |
| \`image_to_video\` | 视频 | 基于参考图生成视频 |
图片画质 \`low\`、\`medium\`、\`high\` 分别对应约 1K、2K、4K 输出；\`auto\` 按 \`medium\` 计费。
## 计费字段 {#pricing}
\`pricing.unit\` 决定积分怎么算：
- \`image\`：每张图片的积分 × 张数 \`n\`。
- \`second\`：每秒的积分 × 视频时长 \`duration\`。
- \`request\`：每条视频固定积分。
\`pricing.items\` 按模式和画质（图片）或模式和分辨率（视频）列出单价 \`points\`。视频图生视频的条目可能带 \`reference_image_points\`，表示每张参考图额外收取的积分。
最终扣除的积分以提交接口返回的 \`cost_points\` 为准，规则与网页端一致，见 [积分与计费](/docs/billing#pricing-units)。
`,
};
