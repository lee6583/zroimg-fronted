# ZroImg 发布与回滚

## 日常流程

项目只使用 `main` 作为共享发布分支：

```text
功能分支 -> Pull Request -> CI 检查 -> 合并 main -> 自动部署正式环境
```

推送到 Pull Request 只执行格式、Lint、类型、测试、构建和依赖审计。只有合并后的 `main` push 会构建镜像并部署服务器。

## 发布前检查

```bash
pnpm install --frozen-lockfile
pnpm check
git diff --check
```

确认提交中没有 `.env`、密钥、Token、服务器密码或临时构建文件。

## 生产部署

前端工作流构建：

```text
ghcr.io/lee6583/zroimg-frontend:sha-<commit>
```

然后部署到 `/opt/zroimg/frontend-prod` 的 `zroimg-frontend-prod` 容器。后端工作流构建生产 JAR，部署到 `/opt/zroimg/backend-prod` 的 `zroimg-backend-prod` 容器。

两套部署都使用健康检查。前端通过 `http://127.0.0.1:3000/` 检查，后端通过 `http://127.0.0.1:8080/health/ready` 检查。

## 服务器只读检查

```bash
docker ps --filter name=zroimg-frontend-prod
docker ps --filter name=zroimg-backend-prod
docker inspect --format '{{.State.Health.Status}}' zroimg-frontend-prod
docker inspect --format '{{.State.Health.Status}}' zroimg-backend-prod
docker logs --tail 100 zroimg-frontend-prod
docker logs --tail 100 zroimg-backend-prod
docker exec nginx nginx -t
```

## 回滚

前端部署目录中的 `.deployed-tag` 保存上一成功版本。部署脚本在新镜像健康检查失败时会尝试恢复该标签。

后端回滚时，从 GitHub Actions 重新运行上一条成功的 `main` 提交，或在服务器部署目录使用上一份已验证的 JAR 重新构建容器。回滚后必须重新检查：

```text
首页 -> 登录 -> 生成 -> 资源访问 -> 后台接口
```

不要执行以下命令：

```text
docker compose down -v
docker system prune -a
docker volume prune
```

这些命令可能删除数据库、Redis 或媒体数据。
