import { getStore } from "@/server/bff/mock-store";
import { isJavaBffEnabled } from "@/server/env";
import { getJavaApiData, requestJavaApiData } from "@/server/java-api";
import type { DocsConfig } from "@/types/content";

export const defaultDocsConfig: DocsConfig = {
  title: "ZroImg 文档",
  description: "了解 ZroImg 的图片创作、积分、订单、收藏和账户使用方式。",
  groups: [
    {
      title: "快速开始",
      items: [
        {
          id: "overview",
          title: "项目概览",
          body: `# 项目概览
ZroImg 是一个面向创作者的 AI 图片生成产品。

## 核心能力
- 使用邮箱完成注册、登录和密码重置。
- 通过对话创建图片，上传参考图继续编辑。
- 查看创作历史，将作品收藏或发布到公共画廊。
- 购买积分、查看订单并通过每日签到获得积分。`,
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
      title: "账户与积分",
      items: [
        {
          id: "credits",
          title: "积分与订单",
          body: `# 积分与订单
- 图片生成会按照模型、分辨率、画质和数量消耗积分。
- 提交任务前会显示后端实时试算结果，实际扣费以后端记录为准。
- 支付完成后由支付回调发放积分，不依赖浏览器跳转结果。
- 生成失败时，系统会按照原任务流水退回积分。`,
        },
      ],
    },
  ],
};

export async function getDocsConfig(): Promise<DocsConfig> {
  if (isJavaBffEnabled()) {
    const docs = await getJavaApiData<DocsConfig>("/content/public/docs");
    if (!docs.title) {
      throw new Error("Java 文档接口返回内容为空");
    }

    return docs;
  }

  const docs = getStore().settings.docs;
  return (docs as DocsConfig) || defaultDocsConfig;
}

export async function updateDocsConfig(nextDocs: DocsConfig) {
  if (isJavaBffEnabled()) {
    return requestJavaApiData<DocsConfig>("/admin/settings/docs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nextDocs),
    });
  }

  getStore().settings.docs = nextDocs;
  return nextDocs;
}
