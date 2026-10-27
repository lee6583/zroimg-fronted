// 开放 API 的对外地址，只用于文档示例和 API 密钥页面的展示；浏览器本身不请求它。
// 测试环境可用 NEXT_PUBLIC_OPEN_API_BASE_URL 指向测试网关。
export const openApiBaseUrl = (
  process.env.NEXT_PUBLIC_OPEN_API_BASE_URL || "https://api.zroimg.com"
).replace(/\/+$/, "");

// 文档里所有示例使用的占位密钥，真实密钥在「账户设置 → API 密钥」创建。
export const placeholderApiKey = "zk-xxxxxxxxxxxxxxxxxxxxxxxx";
