# ZroImg 正式环境自动部署

本项目只维护 `main` 分支。推送到 `main` 后，GitHub Actions 会依次执行：

```text
质量检查 -> 构建前端镜像 -> 推送 GHCR -> 部署生产前端 -> 健康检查
```

正式地址：

```text
https://zroimg.com
```

前端容器名为 `zroimg-frontend-prod`，后端容器名为 `zroimg-backend-prod`。两者加入服务器上的 `zroimg_default` Docker 网络，不向公网暴露应用端口。

## GitHub 配置

在前端和后端仓库分别创建 GitHub Environment：

```text
Settings -> Environments -> production
```

两个仓库都配置以下 Environment Secrets：

```text
DEPLOY_HOST
DEPLOY_SSH_KEY
DEPLOY_KNOWN_HOSTS
```

配置以下 Environment Variables：

```text
DEPLOY_PORT=22
DEPLOY_USER=zroimgdeploy
```

前端额外配置：

```text
FRONTEND_DEPLOY_PATH=/opt/zroimg/frontend-prod
```

后端额外配置：

```text
BACKEND_DEPLOY_PATH=/opt/zroimg/backend-prod
```

`DEPLOY_SSH_KEY` 只用于部署，服务器建议使用专用的 `zroimgdeploy` 账号，不要把 root 密码写入 GitHub。`DEPLOY_KNOWN_HOSTS` 应先核对服务器 SSH 指纹，再保存到 GitHub。

## 服务器配置

前端目录 `/opt/zroimg/frontend-prod/.env`：

```dotenv
FRONTEND_IMAGE=ghcr.io/lee6583/zroimg-frontend
JAVA_API_BASE_URL=http://zroimg-backend-prod:8080
```

`JAVA_API_BASE_URL` 只给 Next 服务端渲染使用，走 `zroimg_default` 内网，不要填公网域名。

后端目录 `/opt/zroimg/backend-prod/.env` 使用仓库 `deploy/.env.example` 作为字段参考，至少应配置：

- `SPRING_PROFILE=prod`
- 生产 MySQL 和 Redis
- `JWT_SECRET`
- `SETTINGS_ENCRYPTION_KEY`
- Cloudflare R2 参数
- 支付参数和正式回调地址
- 生成模型相关配置

`.env` 只保存在服务器，权限设置为：

```bash
chmod 600 /opt/zroimg/frontend-prod/.env
chmod 600 /opt/zroimg/backend-prod/.env
```

## Nginx

复制并按服务器证书路径检查 `nginx.prod.conf.example`，让 Nginx 转发：

```text
zroimg.com/api/*  -> zroimg-backend-prod:8080（去掉 /api 前缀，浏览器接口直连 Java）
zroimg.com/*      -> zroimg-frontend-prod:3000（页面，Next 服务端渲染）
api.zroimg.com    -> zroimg-backend-prod:8080（支付回调等外部调用）
```

浏览器接口与页面同域，Java 设置的登录 Cookie 可以直接生效，前端不再有接口转发层。

Nginx、前端和后端必须加入同一个 `zroimg_default` 网络。MySQL、Redis、前端和后端都不要发布宿主机公网端口。

更新配置后执行：

```bash
docker exec nginx nginx -t
docker exec nginx nginx -s reload
```

## 发布方式

```text
功能分支 -> Pull Request -> 检查通过并审核 -> 合并 main -> 自动部署
```

`main` 应设置为默认分支并禁止直接 push。生产环境建议开启至少一次审核和 Environment 部署审批。工作流使用提交 SHA 作为实际部署标签，失败时保留上一版本标签以便回滚。

## 首次切换

1. 确认 DNS 将 `zroimg.com`、`www.zroimg.com` 和 `api.zroimg.com` 指向服务器。
2. 创建生产前端目录和后端目录，并配置服务器 `.env`。
3. 配置 Nginx 生产站点和 HTTPS 证书。
4. 将当前 `dev` 的已确认代码合并到 `main`。
5. 等待前后端两个仓库的 `main` 工作流完成。
6. 检查首页、注册、登录、后台、生图、视频、支付回调和 R2。
7. 验证成功后，再停止并清理旧的 dev 容器和目录。

不要直接在容器内修改代码；所有变更都从本地提交到 `main`，由 Actions 部署。
