# ZroCodeImg Frontend

这是新的前后端分离前端仓库。当前目标是：

- 保留 `zrocode-image` 里的前端页面、样式和交互风格
- 把数据库、鉴权、支付、任务、OSS 等后端能力从前端仓库里剥离
- 在 Java 后端尚未完成前，用 Next.js Route Handlers + 内存 mock 数据支撑前端联调

## 当前状态

- 已迁移页面：首页、登录、注册、定价、文档、概览、开始创作、历史、收藏、订单、积分购买、反馈、设置、后台管理
- 已迁移样式：`globals.css`、CSS Modules、KoImg 风格导航与工具页布局
- 已迁移规范：`PROJECT_GUIDELINES.md`、`design.md`
- 已补 mock API：认证、签到、订单、对话、生成、收藏、反馈、后台设置

## 启动

```bash
pnpm install
pnpm dev
```

打开：

```text
http://localhost:3000
```

## 校验

```bash
pnpm lint
pnpm build
```

## Mock 账号

开发环境里内置了两个账号：

- 管理员
  - 邮箱：`admin@zrocodeimg.dev`
  - 密码：`admin123456`
- 普通用户
  - 邮箱：`creator@zrocodeimg.dev`
  - 密码：`creator123456`

注册发码接口也是 mock：

- 验证码固定为：`123456`

## Mock 说明

当前仓库里的这些能力都还是 mock，不是生产实现：

- 登录注册与会话
- 积分余额与流水
- 易支付下单
- 生图任务与对话
- 反馈与后台设置
- 文件上传与图片地址

对应 mock 代码主要在：

- `src/server/mock-store.ts`
- `src/server/*`
- `src/app/api/*`

这些文件里已经加了 `TODO(java-backend)` 注释，后续由 Java 后端替换。

## 后端接入建议

Java 后端完成后，前端建议按这个顺序切换：

1. 保留页面和组件不动
2. 先把 `src/app/api/*` mock route 改成转发 Java API 或直接删除
3. 再把 `src/server/*` 的 mock 查询替换成真实 BFF / SDK 请求
4. 最后移除 `src/server/mock-store.ts`

## 规范

开发前先读：

- `PROJECT_GUIDELINES.md`
- `design.md`
- `AGENTS.md`
