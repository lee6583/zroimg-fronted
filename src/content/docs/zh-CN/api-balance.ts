import type { DocsPageContent } from "../types";

export const apiBalance: DocsPageContent = {
  navTitle: "积分余额",
  title: "积分余额 API",
  description:
    "GET /open/v1/balance 查询 API 密钥所属账户的当前积分余额。API 与网页端共用同一个积分余额，可用于提交前检查或余额告警。",
  body: `
## 查询余额 {#get-balance}
~~~http
GET /open/v1/balance
~~~
返回 API 密钥所属账户的当前可用积分。API 和网页端共用同一个积分余额。
::: example balance
## 响应 {#response}
~~~json
{
  "points": 1280
}
~~~
| 字段 | 类型 | 说明 |
| --- | --- | --- |
| \`points\` | integer | 当前可用积分 |
## 使用建议 {#tips}
- 批量提交前先查询余额，避免中途出现 \`402 insufficient_points\`。
- 可以定时查询余额，低于阈值时提醒自己 [购买积分](/credits)。
- 余额也是验证 API 密钥是否有效的最简单方式：密钥无效时返回 \`401 invalid_api_key\`。
`,
};
