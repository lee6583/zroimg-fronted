import { getStore } from "@/server/mock-store";

export type DocsConfig = {
  title: string;
  description: string;
  groups: Array<{
    title: string;
    items: Array<{
      id: string;
      title: string;
      body: string;
    }>;
  }>;
};

export const defaultDocsConfig: DocsConfig = {
  title: "ZroCodeImg 文档",
  description: "了解 ZroCodeImg 的创作方式、积分闭环和账户配置，先完成前端迁移，再接 Java 后端。",
  groups: [
    {
      title: "快速开始",
      items: [
        {
          id: "overview",
          title: "项目概览",
          body: `# 项目概览
ZroCodeImg 是一个面向创作者的图片生成产品，当前前端已从旧项目迁移出来，后端部分暂时使用 mock 数据承接页面展示和交互。

## 当前阶段
- 前端：Next.js SSR 页面、样式和交互已经迁移。
- 后端：暂时由 mock route handlers 提供假数据。
- 下一步：由 Java 后端补齐认证、积分、订单、任务和文件服务。`,
        },
        {
          id: "workflow",
          title: "创作流程",
          body: `# 创作流程
1. 注册或登录账号。
2. 进入开始创作页面，选择文生图或图生图。
3. 输入提示词，设置比例、分辨率、画质与数量。
4. 提交任务后，在历史页和对话页查看结果。`,
        },
      ],
    },
    {
      title: "后端协作",
      items: [
        {
          id: "backend-todo",
          title: "Java 后端待接入",
          body: `# Java 后端待接入
> 当前文档、设置、订单、反馈和任务接口都还是 mock。

- 登录注册与会话
- 积分账户与流水
- 易支付下单与回调
- 生图任务队列与 OSS 文件
- 管理后台查询与审计`,
        },
      ],
    },
  ],
};

export async function getDocsConfig(): Promise<DocsConfig> {
  const docs = getStore().settings.docs;
  return (docs as DocsConfig) || defaultDocsConfig;
}

export async function updateDocsConfig(nextDocs: DocsConfig) {
  getStore().settings.docs = nextDocs;
  return nextDocs;
}
