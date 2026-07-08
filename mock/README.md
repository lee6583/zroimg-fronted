# Frontend Mock Data

这个目录放前端开发、页面走查和 UI 联调用的 mock 数据。

说明：

- 这里的数据按前端业务域分类，便于设计、产品和前端开发查看。
- 真实接口联调仍然走 `src/app/api/**` 和 Java 后端。
- 当前运行态 mock 仍在 `src/server/bff/**`，后续如需统一 mock 来源，可以逐步改为读取这里的数据。
- 不要在这里放真实密钥、真实用户密码、真实订单或生产数据。

分类：

- `landing.json`：首页展示文案、流程、优势、推广目标。
- `auth.json`：登录注册页 mock 账号、验证码说明。
- `billing.json`：积分套餐、订单示例。
- `generation.json`：创作会话、任务、画廊、收藏示例。
- `dashboard.json`：概览、签到、统计示例。
- `admin.json`：后台用户、系统设置、审计日志示例。
- `support.json`：意见反馈工单示例。
