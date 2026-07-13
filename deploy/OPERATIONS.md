# zroImg 前端自动部署与运营维护手册

> 适用对象：前端开发、后端联调、测试、项目负责人和服务器维护人员  
> 适用环境：`dev` 开发/联调环境  
> 更新日期：2026-07-14  
> 说明：本文可直接复制到语雀。文中不得补充私钥、Token、密码、服务器 IP 或 `.env` 真实内容。

## 1. 文档目的

这套流程解决三个问题：

1. 开发人员提交代码后，先自动检查质量，再由同学审核。
2. 代码合并到 `dev` 后，自动构建 Docker 镜像并更新开发服务器。
3. 发布失败时停止部署或自动回滚，避免错误版本直接替换可用版本。

团队统一流程：

```text
功能分支
  -> 推送到 GitHub
  -> 创建 Pull Request（目标分支 dev）
  -> verify 通过
  -> 负责人审核
  -> 合并 dev
  -> 自动构建 Docker 镜像
  -> 推送到 GHCR
  -> 服务器自动拉取镜像并更新容器
  -> 健康检查
  -> 部署成功；失败则停止或回滚
```

这是一套 CI/CD 流程：

- CI（持续集成）：PR 上的 `verify`，用于验证代码能否安全合并。
- CD（持续部署）：合并到 `dev` 后自动构建镜像并部署到开发服务器。

## 2. 分工与权限

| 角色       | 主要职责                                            | 是否需要登录服务器 |
| ---------- | --------------------------------------------------- | ------------------ |
| 普通开发者 | 创建功能分支、开发、自测、提交 PR、修复检查问题     | 否                 |
| PR 审核人  | 检查需求、代码、测试和风险，决定是否允许合并        | 否                 |
| 项目负责人 | 安排需求、确认发布窗口、处理跨模块问题              | 通常不需要         |
| 部署维护人 | 维护 Actions、Secrets、服务器、Docker、Nginx 和回滚 | 需要               |

普通开发者不能直接修改 `dev`、服务器容器、部署目录和 GitHub Secrets。这样可以保证每次变更都有记录、检查和审核。

## 3. 日常开发与发布步骤

### 3.1 同步最新代码

在 VS Code 终端或 PowerShell 中进入前端本地仓库，然后执行：

```bash
git switch dev
git pull --ff-only origin dev
```

- `git switch dev`：切换到本地 `dev` 分支。
- `git pull --ff-only origin dev`：从 GitHub 下载最新 `dev`，只允许快进更新，避免无意生成额外合并提交。
- 如果本地有未提交修改，应先提交到自己的分支，不能直接覆盖或删除。

### 3.2 创建功能分支

```bash
git switch -c feature/功能名称
```

推荐命名：

| 类型       | 示例                        | 用途           |
| ---------- | --------------------------- | -------------- |
| `feature/` | `feature/forgot-password`   | 新功能         |
| `fix/`     | `fix/login-validation`      | 修复缺陷       |
| `chore/`   | `chore/update-dependencies` | 工程或配置修改 |
| `docs/`    | `docs/deployment-guide`     | 文档修改       |

功能分支把个人修改和共享的 `dev` 隔离开。即使功能还未完成，也不会影响服务器上的联调版本。

### 3.3 开发并在本地检查

根据修改范围运行检查：

```bash
pnpm install --frozen-lockfile
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

本地检查通过不能代替 GitHub Actions，但能更早发现问题，减少等待时间。

### 3.4 提交并推送功能分支

```bash
git status
git add <本次修改的文件>
git commit -m "feat: add forgot password entry"
git push -u origin feature/forgot-password
```

- `git status`：查看哪些文件发生了变化。
- `git add`：选择本次要放进提交的文件。
- `git commit`：在本地生成一条带说明的版本记录。
- `git push`：把本地提交上传到 GitHub。
- `-u`：第一次推送时建立本地分支和远程分支的对应关系，后续可直接使用 `git push`。

不要对共享的 `dev` 使用强制推送。强制推送可能改写其他人的提交历史，并让已经审核或已经部署的版本无法追踪。

### 3.5 创建 Pull Request

在 GitHub 前端仓库中点击 `Compare & pull request`，确认：

```text
base: dev
compare: 自己的功能分支
```

PR 描述建议使用以下模板：

```markdown
## 需求背景

说明为什么要做这个修改。

## 修改内容

- 修改了什么页面或模块
- 是否涉及接口、配置或依赖

## 测试方式

- 本地执行了哪些检查
- 页面上如何验证

## 风险与影响

- 是否影响登录、权限、数据或现有功能
- 是否需要后端、测试或运维配合
```

### 3.6 等待 `verify` 通过

PR 创建或更新后会触发 `verify`：

```text
安装依赖
-> 格式检查
-> ESLint
-> TypeScript 类型检查
-> 自动化测试
-> Next.js 构建
-> 生产依赖安全审计
```

`verify` 绿色对勾只代表代码检查通过。PR 阶段不会构建 Docker 镜像，也不会连接服务器或部署网站。

检查失败时，点击失败任务查看红色步骤，在原功能分支修复后重新 `git push`。PR 会自动更新，不需要重新创建。

### 3.7 审核和合并

审核人重点确认：

- 修改符合需求，没有把无关文件带入 PR。
- 接口地址、环境变量和权限处理正确。
- 页面主要流程经过测试。
- `verify` 已通过。
- 不包含密码、Token、私钥或真实 `.env`。

审核通过后合并到 `dev`。合并会产生一次 `dev` push，从而触发完整自动部署。

### 3.8 观察自动部署

进入 GitHub 仓库：

```text
Actions -> CI -> 最新一条 dev 运行记录
```

完整流程包含四个任务：

| 任务                    | 作用                                     | 失败后的结果               |
| ----------------------- | ---------------------------------------- | -------------------------- |
| `verify`                | 验证代码质量和 Next.js 构建              | 停止，不构建镜像           |
| `build-image-attempt-1` | 第一次构建并推送镜像                     | 允许进入自动重试判断       |
| `build-image`           | 确认镜像存在；必要时等待 45 秒并重试一次 | 停止，不部署服务器         |
| `deploy-development`    | SSH 连接服务器，更新容器并健康检查       | 自动尝试回滚，Actions 标红 |

最终以最新 `dev` 工作流中的 `deploy-development` 为绿色对勾作为部署成功标准。功能分支 PR 上的绿色记录不等于服务器部署成功。

## 4. 自动构建、部署和重试原理

### 4.1 Docker 镜像构建

GitHub Actions Runner 根据仓库根目录的 `Dockerfile` 构建 `linux/amd64` 镜像。Next.js 使用 standalone 输出，只把运行所需文件放入最终镜像，并以非 root 用户运行。

镜像名称：

```text
ghcr.io/lee6583/zroimg-frontend
```

每次构建推送两个标签：

- `dev`：指向最近一次成功构建的开发版本。
- `sha-<完整Git提交号>`：唯一对应某次提交，用于准确部署、追踪和回滚。

服务器实际部署 `sha-<完整Git提交号>`，不会只依赖含义会变化的 `dev` 标签。

### 4.2 自动重试

第一次构建由 `build-image-attempt-1` 使用标准 Docker Actions 和 GitHub Actions 缓存完成。之后 `build-image` 检查当前提交对应的 SHA 镜像：

1. 镜像存在：说明第一次构建成功，直接进入部署。
2. 镜像不存在：等待 45 秒，使用 Runner 自带 Docker CLI 再构建和推送一次。
3. 第二次仍失败：停止流程，不更新服务器。

它主要处理网络波动、GitHub/GHCR 临时不可用、Action 下载失败等偶发问题。代码错误、Dockerfile 错误、权限错误通常不会因为重试而消失，必须根据日志修复。

手动点击 `Cancel workflow` 会取消整个流程，不属于构建失败，因此不会触发自动重试。

### 4.3 GHCR 镜像仓库

GHCR 是 GitHub Container Registry，用于保存 Docker 镜像：

- Actions 使用仓库自带的 `GITHUB_TOKEN` 推送镜像。
- 服务器部署用户只使用 `read:packages` 权限读取镜像。
- 普通开发者不需要服务器 Token，也不需要登录 GHCR。

### 4.4 服务器部署

`deploy-development` 使用专用 SSH 私钥登录服务器部署账号，并执行：

```text
上传 Compose 和部署脚本
-> 拉取本次 SHA 镜像
-> Docker Compose 更新前端容器
-> 等待容器健康
-> 检查并 reload Nginx
-> 记录已部署 SHA 标签
```

前端容器通过 Docker 网络 `zroimg_default` 与 Nginx 通信，不直接向公网暴露前端容器端口。Nginx 负责接收网站请求并反向代理到前端容器。

## 5. 如何验收自动部署

### 5.1 GitHub 页面验证

1. 确认 PR 的目标分支为 `dev`。
2. 确认 `verify` 绿色通过并完成审核。
3. 合并 PR。
4. 打开 `Actions -> CI`，选择最新的 `dev` 运行记录。
5. 等待最终 `deploy-development` 绿色通过。
6. 打开开发环境地址，使用无痕窗口或强制刷新验证功能。

### 5.2 服务器验证

以下命令只由部署维护人在 MobaXterm 中执行：

```bash
docker ps --filter name=zroimg-frontend-dev
docker inspect --format '{{.State.Health.Status}}' zroimg-frontend-dev
docker logs --tail 100 zroimg-frontend-dev
cat /opt/zroimg/frontend-image-dev/.deployed-tag
docker exec nginx nginx -t
```

正常结果应满足：

- 容器 `zroimg-frontend-dev` 为运行状态。
- 健康状态为 `healthy`。
- `.deployed-tag` 为 `sha-...`，并对应最新 `dev` 工作流的提交号。
- Nginx 配置检查成功。

## 6. 运营维护清单

### 6.1 每次发布后

- 确认最新 `dev` Actions 最终部署任务为绿色。
- 打开开发站点验证首页、登录和本次修改的核心流程。
- 有异常时记录 PR、提交 SHA、Actions 链接、发生时间和错误步骤。
- 不在服务器容器中直接修改代码。

### 6.2 每周检查

部署维护人执行只读检查：

```bash
df -h
docker system df
docker ps --filter name=zroimg-frontend-dev
docker logs --tail 200 zroimg-frontend-dev
```

重点观察磁盘空间、容器是否反复重启、日志是否持续出现错误。清理镜像前必须确认没有被当前版本、回滚版本或其他项目使用。

### 6.3 每月检查

- 检查 GHCR 读取 Token 的到期时间，提前安排轮换。
- 检查 GitHub Secrets、SSH 公钥和协作者权限，移除不再需要的访问权限。
- 检查 HTTPS 证书有效期、域名解析和 Nginx 配置。
- 关注 `pnpm audit:prod` 结果，评估依赖升级。
- 至少保留一个已验证可用的 SHA 镜像作为回滚版本。

## 7. 常见状态与处理方法

| 现象                         | 含义                                   | 处理方式                                                   |
| ---------------------------- | -------------------------------------- | ---------------------------------------------------------- |
| PR 的 `verify` 失败          | 代码、测试、构建或依赖审计有问题       | 在原功能分支修复并重新 push                                |
| `build-image-attempt-1` 失败 | 第一次镜像构建未成功                   | 先等待 `build-image` 自动检查和重试                        |
| `build-image` 成功           | SHA 镜像已经可用                       | 继续等待 `deploy-development`                              |
| `build-image` 仍失败         | 重试后镜像仍不可用                     | 查看日志；网络故障可稍后重跑，配置或代码错误要先修复       |
| Workflow 显示 `Cancelled`    | 被手动取消，或被更新的同分支运行替代   | 先看是否有更新运行；没有时对最新记录执行 `Re-run all jobs` |
| `deploy-development` 失败    | SSH、拉镜像、容器健康或 Nginx 检查失败 | 查看失败步骤和服务器日志，确认自动回滚结果                 |
| 网站显示 502                 | Nginx 无法访问前端容器                 | 检查容器状态、健康检查、Docker 网络和 Nginx 日志           |
| Actions 成功但页面像旧版本   | 浏览器缓存、访问地址错误或版本判断错误 | 强制刷新，并核对 `.deployed-tag` 和 Actions 提交 SHA       |
| GHCR 显示 unauthorized       | 服务器镜像读取凭据失效或权限不足       | 由管理员更新仅含 `read:packages` 的凭据                    |

黄色 warning 不一定代表失败，应以任务最终状态和具体日志为准。例如 Action 运行时版本弃用提示需要后续升级，但不等于本次部署失败。

## 8. 回滚与应急处理

部署脚本在新容器健康检查或 Nginx 检查失败时，会尝试恢复上一次记录的 SHA 镜像。即使自动回滚成功，当前 Actions 仍会标红，用于提醒本次发布失败。

人工回滚只能由部署维护人执行。先从 GitHub Actions 或发布记录中确认一个已验证的 SHA，然后在服务器运行：

```bash
cd /opt/zroimg/frontend-image-dev
./deploy-dev.sh sha-<已验证的完整提交号>
```

回滚后重新检查容器健康、Nginx 和开发站点，并在语雀故障记录中写明原因、处理过程和后续修复 PR。

共享服务器禁止执行：

```text
docker system prune -a
docker volume prune
docker compose down -v
```

这些命令可能删除后端、MySQL、Redis、回滚镜像或其他项目的数据。

## 9. 安全要求

- 私钥、PAT、密码、Cookie、`.env` 真实内容不能写入 GitHub、语雀、聊天记录或截图。
- GitHub Actions 推送 GHCR 使用 `GITHUB_TOKEN`，不额外保存长期写入 Token。
- 服务器 GHCR 凭据只授予 `read:packages`，不授予写入权限。
- SSH 使用专用部署账号，不使用 root 密码或 root 私钥。
- `DEPLOY_KNOWN_HOSTS` 必须在核对服务器指纹后配置。
- 普通开发者不需要服务器权限；权限按完成工作所需的最小范围分配。
- 生产环境不能直接照搬当前 dev 配置，必须增加独立域名、环境变量、审批、备份和发布策略。

## 10. 关键名词解释

| 名词               | 通俗解释                                           |
| ------------------ | -------------------------------------------------- |
| Git                | 记录代码每次修改和版本历史的工具                   |
| 分支（Branch）     | 一条独立开发线，用来隔离尚未完成的修改             |
| Commit             | 一次带说明的本地版本记录                           |
| Push               | 把本地 Commit 上传到 GitHub                        |
| Pull Request（PR） | 请求团队审核并把一个分支合并到另一个分支           |
| Review             | 同学对 PR 的代码和风险进行审核                     |
| Git SHA            | 唯一标识某次提交的一串字符                         |
| CI                 | 代码提交后自动执行检查、测试和构建                 |
| CD                 | 检查通过并满足分支条件后自动发布或部署             |
| GitHub Actions     | GitHub 提供的自动任务平台                          |
| Workflow           | Actions 的完整自动化流程，由 YAML 文件定义         |
| Job                | Workflow 中相对独立的一组任务，例如 `verify`       |
| Runner             | GitHub 临时提供、负责执行 Job 的机器               |
| Dockerfile         | 描述如何把项目制作成 Docker 镜像的文件             |
| Docker 镜像        | 打包好的应用和运行环境，只读、可复制               |
| Docker 容器        | 镜像运行起来后的实例                               |
| Registry           | 保存和分发 Docker 镜像的仓库服务                   |
| GHCR               | GitHub 提供的 Docker 镜像仓库                      |
| Tag                | 镜像的版本标记，例如 `dev` 或 `sha-...`            |
| Docker Compose     | 用 YAML 描述并启动容器、网络和环境变量的工具       |
| SSH                | 通过加密连接远程服务器的协议                       |
| Secret             | GitHub 中加密保存的敏感配置，日志会尽量隐藏        |
| Variable           | GitHub 中保存的非敏感配置                          |
| Nginx              | 接收网站请求并转发给前端容器的 Web 服务器          |
| 反向代理           | 由 Nginx 接收外部请求，再转发给内部应用            |
| 健康检查           | 自动判断容器是否已经可以正常提供服务               |
| 回滚               | 新版本失败时恢复到上一个可用版本                   |
| Concurrency        | 新提交出现时取消同分支旧流程，防止旧版本覆盖新版本 |
| Cache              | 保存可复用构建数据，用于缩短后续构建时间           |

## 11. 面试时如何介绍

### 30 秒版本

> 我们前端采用基于 GitHub Actions 的 CI/CD。开发人员从 `dev` 创建功能分支，通过 PR 触发格式、Lint、类型、测试和 Next.js 构建检查，审核后合并 `dev`。合并会自动构建 Docker 镜像并推送到 GHCR，再通过专用 SSH 账号通知服务器使用 Docker Compose 更新容器。部署使用 Git SHA 镜像保证版本可追踪，并配有健康检查、Nginx reload、失败回滚和一次网络故障自动重试。

### 展开说明

可以按以下顺序回答：

1. 分支和审核：功能分支开发，PR 到 `dev`，`verify` 通过后审核合并。
2. 镜像：使用 Next.js standalone 和多阶段 Docker 构建，推送到 GHCR。
3. 版本：同时生成 `dev` 和不可变的 `sha-<提交号>` 标签，服务器部署 SHA 标签。
4. 部署：Actions 通过 SSH 调用服务器脚本，Compose 拉取镜像并替换容器。
5. 可用性：容器健康后才重载 Nginx；失败自动回滚上一个 SHA。
6. 稳定性：首次构建失败时等待 45 秒重试；新提交会取消旧流水线，避免旧版覆盖新版。
7. 安全：Actions 用 `GITHUB_TOKEN` 写 GHCR，服务器只持有 `read:packages`，SSH 使用非 root 专用账号和主机指纹校验。

## 12. 语雀发布与故障记录模板

建议在语雀知识库中建立：

```text
zroImg 项目开发
├── 前端
│   ├── 前端自动部署与运营维护
│   ├── 发布记录
│   └── 故障记录
```

发布记录模板：

```markdown
## YYYY-MM-DD 发布记录

- PR：#编号 + 链接
- 需求/修复：一句话说明
- 合并分支：功能分支 -> dev
- 部署提交 SHA：
- Actions 结果：成功/失败
- 开发环境验证：
- 操作人：
- 备注：
```

故障记录模板：

```markdown
## YYYY-MM-DD 故障记录

- 发生时间：
- 影响范围：
- 关联 PR / SHA：
- 失败任务：verify / build-image / deploy-development / 网站运行期
- 错误现象：
- 根本原因：
- 临时处理：
- 是否回滚：
- 最终修复 PR：
- 后续预防措施：
```

## 13. 仓库中的相关文件

| 文件                            | 作用                                         |
| ------------------------------- | -------------------------------------------- |
| `.github/workflows/ci.yml`      | 定义 PR 检查、镜像构建、自动重试和服务器部署 |
| `Dockerfile`                    | 定义 Next.js 镜像构建过程                    |
| `next.config.ts`                | 启用 Next.js standalone 输出                 |
| `deploy/compose.dev.yml`        | 定义开发环境前端容器、健康检查和 Docker 网络 |
| `deploy/deploy-dev.sh`          | 拉取镜像、更新容器、检查健康和回滚           |
| `deploy/env.dev.example`        | 服务器 `.env` 的非敏感示例                   |
| `deploy/nginx.dev.conf.example` | Nginx 开发环境配置示例                       |
| `deploy/README.md`              | 首次配置和部署技术说明                       |
| `deploy/OPERATIONS.md`          | 团队日常发布、运营维护和面试说明             |
