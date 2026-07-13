# 前端开发环境自动部署

本文只描述 `dev` 分支对应的开发/联调环境。当前业务仍包含 mock 数据，不得把这套配置当作正式生产环境发布。

## 1. 发布流程

```text
代码合并到 dev
  -> GitHub Actions 执行格式、Lint、类型、测试、构建和依赖审计
  -> 构建 Docker 镜像
  -> 推送到 GHCR
  -> 通过 SSH 上传 Compose 和部署脚本
  -> 服务器拉取指定 Git SHA 镜像
  -> Docker Compose 重建容器
  -> 健康检查
  -> 成功后记录版本，失败则回滚上一个版本
```

镜像会同时保留两个标签：

- `dev`：始终指向最近一次通过检查的开发版。
- `sha-<完整提交号>`：指向一个不可混淆的代码版本，用于部署和回滚。

## 2. 服务器前提检查

以下命令在 MobaXterm 的服务器终端执行：

```bash
cat /etc/os-release
uname -m
docker --version
docker compose version
docker exec nginx nginx -v
```

当前 Actions 构建 `linux/amd64` 镜像，因此 `uname -m` 应显示 `x86_64`。如果服务器显示 `aarch64`，必须先修改工作流的镜像平台。

## 3. 创建部署用户和目录

以下命令需要服务器管理员执行，用户名可以调整，但必须和 GitHub 变量一致：

```bash
sudo adduser --disabled-password --gecos "" zroimgdeploy
sudo usermod -aG docker zroimgdeploy
sudo install -d -o zroimgdeploy -g zroimgdeploy -m 750 /opt/zroimg/frontend-image-dev
```

加入 `docker` 用户组后需要退出 SSH 并重新登录。`docker` 组权限接近 root，只能授予专用部署账号，不能授予普通访客账号。

验证：

```bash
su - zroimgdeploy
docker ps
docker compose version
```

## 4. 配置服务器环境变量

在服务器创建 `/opt/zroimg/frontend-image-dev/.env`：

```dotenv
FRONTEND_IMAGE=ghcr.io/lee6583/zroimg-frontend
BFF_MODE=mock
AUTH_BFF_MODE=java
ALLOW_MOCK_BFF=true
JAVA_API_BASE_URL=http://api-dev.zroimg.com
```

权限设置：

```bash
chmod 600 /opt/zroimg/frontend-image-dev/.env
```

说明：

- `FRONTEND_IMAGE`：GHCR 中的镜像名称。
- `BFF_MODE=mock`：未接 Java 的业务模块使用开发期模拟数据。
- `AUTH_BFF_MODE=java`：认证请求转发到当前开发环境 Java 后端。
- `ALLOW_MOCK_BFF=true`：允许开发容器在 production 运行模式下使用 mock。正式生产必须为 `false`。
- `JAVA_API_BASE_URL`：容器能够访问的 Java 后端地址。不能写 `localhost`，因为容器里的 localhost 指前端容器自身。

## 5. 允许服务器读取 GHCR

如果 GHCR 镜像是私有的，需要由有权限的仓库管理员创建只包含 `read:packages` 的 GitHub Personal Access Token，然后在服务器执行一次：

```bash
docker login ghcr.io -u <GitHub用户名>
```

在密码提示中输入 Token。不要把 Token 写进命令历史、语雀、仓库或截图。服务器登录信息会保存在部署用户自己的 Docker 配置中。

如果镜像被仓库管理员设为公开，则不需要这一步。

## 6. 创建专用 SSH 密钥

在可信的管理电脑上创建一对只用于开发环境部署的密钥：

```bash
ssh-keygen -t ed25519 -N "" -C "zroimg-github-actions-dev" -f zroimg_actions_dev
```

- `zroimg_actions_dev` 是私钥，只能放到 GitHub Secret `DEPLOY_SSH_KEY`。
- `zroimg_actions_dev.pub` 是公钥，追加到服务器部署用户的 `~/.ssh/authorized_keys`。

服务器端权限必须正确：

```bash
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

不要复用服务器 root 私钥，也不要把 root 密码放进 GitHub。

## 7. 配置 GitHub Actions Secrets 和 Variables

打开前端 GitHub 仓库：

```text
Settings -> Secrets and variables -> Actions
```

添加 Repository Variables：

| 名称          | 示例                             | 含义                           |
| ------------- | -------------------------------- | ------------------------------ |
| `DEV_URL`     | `https://dev.zroimg.com`         | Actions 页面展示的开发站点地址 |
| `DEPLOY_PORT` | `22`                             | SSH 端口                       |
| `DEPLOY_USER` | `zroimgdeploy`                   | 专用部署用户                   |
| `DEPLOY_PATH` | `/opt/zroimg/frontend-image-dev` | 服务器镜像部署目录             |

添加 Repository Secrets：

| 名称                 | 内容                            |
| -------------------- | ------------------------------- |
| `DEPLOY_HOST`        | 服务器 IP 或 SSH 域名           |
| `DEPLOY_SSH_KEY`     | 上一步生成的完整私钥            |
| `DEPLOY_KNOWN_HOSTS` | 已核对指纹的服务器 SSH host key |

开发环境直接使用仓库级配置，不依赖 GitHub Environment。正式生产环境必须由仓库所有者创建带审批规则的 Environment。

服务器管理员先在服务器读取真实指纹：

```bash
sudo ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub
```

再在可信电脑运行：

```bash
ssh-keyscan -p 22 <服务器地址>
```

核对指纹一致后，才把 `ssh-keyscan` 输出放入 `DEPLOY_KNOWN_HOSTS`。这样 Actions 不会盲目信任被冒充的服务器。

## 8. 配置 Nginx 和 HTTPS

服务器使用 Docker 中的 Nginx。新前端容器加入现有 `zroimg_default` 网络后，先从 Nginx 容器测试新前端：

```bash
docker exec nginx wget --quiet --tries=1 --spider http://zroimg-frontend-dev:3000/
```

确认成功后备份并编辑宿主机挂载的开发域名配置：

```bash
cp /opt/zroimg/nginx/conf.d/dev.conf /opt/zroimg/backup/dev.conf.before-image-deploy
nano /opt/zroimg/nginx/conf.d/dev.conf
```

把旧的 `proxy_pass http://172.18.0.1:3000;` 改为：

```nginx
proxy_pass http://zroimg-frontend-dev:3000;
```

验证并重载容器化 Nginx：

```bash
docker exec nginx nginx -t
docker exec nginx nginx -s reload
curl -I -H 'Host: dev.zroimg.com' http://127.0.0.1
```

Actions 不会覆盖 Nginx 配置，只会在新前端健康后执行一次 Nginx reload，让 Nginx 重新解析新容器的地址。

HTTPS 证书可在 DNS 生效后由服务器管理员使用 Certbot 配置。启用 HTTPS 前不要把登录 Cookie 和真实业务数据用于公网测试。

## 9. 首次发布

1. 在 `chore/docker-deployment` 分支提交部署文件并推送。
2. 在 GitHub 创建 Pull Request，目标分支选择 `dev`。
3. 等 CI 全部通过并由前端负责人审核。
4. 合并 Pull Request 到 `dev`。
5. 合并产生的 push 会自动构建镜像并部署。
6. 在仓库的 `Actions -> CI` 中查看三个任务：`verify`、`build-image`、`deploy-development`。

服务器验证：

```bash
docker ps --filter name=zroimg-frontend-dev
docker logs --tail 100 zroimg-frontend-dev
cat /opt/zroimg/frontend-image-dev/.deployed-tag
```

## 10. 日常发布

其他同学仍按正常方式开发：功能分支提交 Pull Request 到 `dev`。只有代码进入 `dev` 后才自动部署，开发者不需要登录服务器，也不需要修改 Compose。

禁止直接在服务器容器里改代码，因为容器重建后这些修改会消失。代码修改必须回到 Git 分支并经过 Pull Request。

## 11. 回滚和排障

部署脚本会等待容器健康；失败时自动重新启动上一次记录的镜像标签。Actions 会显示失败，避免把错误版本误认为发布成功。

常用只读命令：

```bash
docker compose -p zroimg-frontend-dev -f /opt/zroimg/frontend-image-dev/compose.dev.yml ps
docker inspect zroimg-frontend-dev
docker logs --tail 200 zroimg-frontend-dev
```

不要在共享服务器执行以下命令：

```text
docker system prune -a
docker volume prune
docker compose down -v
```

这些命令可能删除后端、MySQL、Redis 或其他项目正在使用的数据。
