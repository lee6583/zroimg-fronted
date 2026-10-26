# ZroImg 简历技术点实现详解

本文用于解释简历中 ZroImg 项目的前端技术点，内容以当前仓库代码为依据。建议先记住每一节的“面试简述”，再结合调用链和关键代码回答追问。

## 1. 项目定位与前端职责

### 简历中的项目介绍

> 面向有 AI 图片创作需求的用户，ZroImg 提供多模型图片生成与作品管理服务，覆盖创作参数配置、异步任务跟踪、生成记录、作品收藏及积分消费等核心业务流程。

这段只说明项目面向的用户、解决的问题和核心业务，不展开技术方案。具体技术实现放在“项目工作”中，避免项目介绍与技术点重复。

### 前端在系统中的职责

ZroImg 前端不只是页面展示层，代码中实际包含四部分：

1. Next.js App Router 页面与 Server Components，负责鉴权、首屏数据获取和页面结构组装。
2. React Client Components，负责创作工作台、上传、表单、弹层和任务轮询等交互。
3. `src/api` 与统一请求工具，负责浏览器同源请求和错误归一化。
4. Next.js Route Handlers 组成的 BFF，负责鉴权、输入校验、资源归属检查、Java 接口适配和 DTO 转换。

核心请求链路如下：

```text
用户操作
  -> React Client Component
  -> src/api 中的业务请求函数
  -> 同源 /api/** Route Handler
  -> src/server/bff 业务 facade
  -> Java 后端或开发期 Mock
  -> 统一 DTO 返回页面
```

项目主要技术栈可由 [`package.json`](./package.json) 和 [`README.md`](./README.md) 直接确认：Next.js 16.2、React 19.2、TypeScript 5.9 严格模式、Tailwind CSS 4、CSS Modules、Zod 4、pnpm 11。

---

## 2. 一次图片生成的完整实现链路

理解这条链路后，后面的 Server Components、BFF、轮询和类型校验就不再是互相独立的技术名词，而是同一个业务流程中的不同环节。

### 阶段一：进入创作页

用户访问 `/generate` 时，首先执行服务端页面 [`src/app/(product)/generate/page.tsx`](<./src/app/(product)/generate/page.tsx>)：

```text
访问 /generate
  -> 产品布局 requireUser() 检查登录状态
  -> 生成页再次取得当前用户
  -> 请求模型列表和默认生成参数
  -> 请求积分预估
  -> 确保默认会话存在
  -> 从 Cookie 恢复上次会话
  -> 并行请求会话任务和收藏夹
  -> 将首屏 DTO 传给 GenerateForm
```

页面声明了 `dynamic = "force-dynamic"`。原因是创作页依赖当前用户 Cookie、积分、会话和任务状态，这些数据具有用户隔离和实时变化特征，不适合被构建时静态化。

任务和收藏夹互不依赖，因此通过 `Promise.all()` 并行读取：

```tsx
const tasksPromise = activeId ? listTasks(current.profile.id, activeId) : Promise.resolve([]);

const [tasks, collections] = await Promise.all([tasksPromise, listCollections(current.profile.id)]);
```

这里的思路是先完成有前后依赖的步骤，例如“模型 -> 默认参数 -> 价格”，再并行执行互相独立的查询，避免所有请求无条件串行。

### 这段 `Promise.all()` 的具体含义

`activeId` 表示当前选中的生成会话 ID。下面的条件表达式先判断当前是否存在有效会话：

```ts
const tasksPromise = activeId ? listTasks(current.profile.id, activeId) : Promise.resolve([]);
```

如果存在 `activeId`，就调用 `listTasks()` 查询当前用户在这个会话下的生成任务：

```ts
listTasks(current.profile.id, activeId);
```

其中：

- `current.profile.id` 用于确定当前用户，并配合服务端进行资源归属校验；
- `activeId` 用于确定需要读取哪个生成会话；
- 返回值是一个 Promise，代表任务查询正在进行，完成后会得到任务数组。

如果当前没有会话，则不发送任务查询请求，而是使用：

```ts
Promise.resolve([]);
```

它表示“立即成功，结果是空数组”。这样设计后，无论有没有 `activeId`，`tasksPromise` 始终都是一个 Promise，后续可以统一放入 `Promise.all()` 中处理。

这里没有直接写成：

```ts
const tasks = await listTasks(current.profile.id, activeId);
```

原因是 `await` 会在当前位置等待任务查询完成，而当前代码希望先启动任务查询，再启动收藏夹查询。调用 `listTasks()` 后保存得到的 `tasksPromise`，相当于保存了一张“任务查询完成后可以取得结果”的凭证；请求本身已经开始执行，但代码暂时不阻塞在这里。

随后执行：

```ts
const [tasks, collections] = await Promise.all([tasksPromise, listCollections(current.profile.id)]);
```

这里同时等待两个异步操作：

1. `tasksPromise`：查询当前会话的生成任务；
2. `listCollections(current.profile.id)`：查询当前用户的收藏夹。

`Promise.all()` 返回结果的顺序与传入 Promise 的顺序一致，与哪个请求先完成无关。因此：

```ts
const [tasks, collections] = results;
```

等价于：

```ts
const results = await Promise.all([tasksPromise, listCollections(current.profile.id)]);

const tasks = results[0];
const collections = results[1];
```

### 为什么这里适合并行查询

任务查询依赖“用户 ID + 当前会话 ID”，收藏夹查询只依赖“用户 ID”。收藏夹不需要等待任务结果，任务也不需要等待收藏夹结果，两个请求之间不存在数据依赖，因此可以同时开始。

串行写法如下：

```ts
const tasks = await listTasks(current.profile.id, activeId);
const collections = await listCollections(current.profile.id);
```

如果任务查询耗时 800 ms，收藏夹查询耗时 500 ms，串行执行的总等待时间大约是：

```text
任务查询       800 ms
收藏夹查询              500 ms
总耗时约       1300 ms
```

使用 `Promise.all()` 后，两个请求几乎同时开始，总等待时间接近耗时较长的任务查询：

```text
任务查询       800 ms
收藏夹查询     500 ms
总耗时约       800 ms
```

因此，这段代码的性能价值不是让单个接口变快，而是减少了服务端页面等待多个独立接口结果时的整体耗时。

### 为什么前面的请求仍然需要串行

并不是所有请求都适合放入 `Promise.all()`。创作页前面存在明确的依赖链：

```text
listModels()
  -> getDefaultOptions(modelOptions)
  -> estimatePrice(initialOptions)
```

必须先取得模型列表，才能计算默认模型和默认参数；必须先有默认参数，才能知道需要估算哪一种模式、比例、画质和生成数量。因此这些步骤需要按顺序执行。

判断原则是：

- 后一个操作需要前一个操作的返回值：串行 `await`；
- 两个操作只依赖已有数据，互相不读取对方结果：使用 `Promise.all()` 并行。

### `Promise.all()` 的失败行为

`Promise.all()` 表示“全部成功后才继续”。如果任务查询或收藏夹查询任意一个失败，整体 `await` 都会抛出异常：

```ts
try {
  const [tasks, collections] = await Promise.all([
    tasksPromise,
    listCollections(current.profile.id),
  ]);
} catch (error) {
  // 任意一个请求失败，都会进入这里
}
```

它不会自动取消另一个已经开始的请求。例如任务查询先失败时，收藏夹请求可能仍然在后台执行，只是本次页面初始化不会使用它的结果。如果未来希望“一个失败不影响另一个模块”，可以改用 `Promise.allSettled()`，分别处理任务和收藏夹的成功、失败状态；当前创作页选择 `Promise.all()`，说明这两个数据都是首屏工作台需要的初始化数据，任意一个关键查询失败时由统一错误边界处理更直接。

这段代码可以在面试中简述为：

> 当前会话任务和用户收藏夹都依赖用户身份，但彼此不依赖对方结果，所以先准备任务 Promise，再用 `Promise.all()` 并行读取两个数据源。这样总等待时间接近较慢请求的耗时，而不是两个请求耗时之和；有依赖的模型、默认参数和积分预估仍按顺序执行。

### 阶段二：用户调整生成参数

参数面板 [`src/features/generation/generation-settings.tsx`](./src/features/generation/generation-settings.tsx) 不自己保存另一份表单状态，而是接收 `GenerateForm` 的 `options`，修改后通过 `onChange` 回传。这样生成参数只有一个数据源。

每次参数变化都会经过 `normalizeOptions()`：

```ts
const nextOptions = { ...value, [key]: nextValue };
onChange(normalizeOptions(nextOptions, modelOptions));
```

归一化逻辑位于 [`src/features/generation/generation-model.ts`](./src/features/generation/generation-model.ts)：

1. 先判断当前模型是否支持刚选择的模式；
2. 不支持时，选择第一个支持该模式的模型；
3. 取得该模型在当前模式下允许的参数集合；
4. 比例、画质或数量仍受支持则保留，否则回退为模型默认值。

例如用户从支持 4K 的模型切换到只支持 2K 的模型时，不能继续把旧的 4K 参数提交给后端。`pickValue()` 保证发送出去的是模型能力集合中的合法值。

### 阶段三：防抖计算积分

`GenerateForm.changeOptions()` 先把 `isEstimating` 设为 `true`，参数 effect 延迟 200 ms 后调用价格接口：

```tsx
const timer = window.setTimeout(async () => {
  const price = await generationTasksApi.estimatePrice({
    model: options.model,
    mode: options.mode,
    ratio: options.ratio,
    quality: options.quality,
    count: options.count,
  });

  if (!isCurrent) return;
  setEstimate(price.requiredPoints);
  setBalance(price.currentPoints);
}, 200);
```

这样连续切换模型、比例和数量时，不会为每次点击立即发送请求。effect 清理函数既会取消尚未执行的计时器，也会将 `isCurrent` 设为 `false`，让已经发出但过期的请求无法覆盖新参数对应的价格。

价格请求经过 `POST /api/generations/estimate`，Route Handler 使用 Zod 校验参数，再由 BFF 调用 Java `/generation/user/price/estimate`。界面显示 `requiredPoints` 和 `currentPoints`，提交前进行余额判断。

需要注意：前端价格只用于展示和提前阻止明显的积分不足。真正创建任务时，Java 适配层的 `createTask()` 会再次调用价格接口，最终扣费仍由后端负责。

### 阶段四：上传参考图

图生图模式需要先把本地文件转换成服务端媒体资产 ID：

```text
用户选择文件
  -> 浏览器校验模型能力、数量、MIME、大小
  -> FormData POST /api/media/upload
  -> Route Handler 再次校验 File、MIME、大小
  -> Java 媒体接口保存文件
  -> 返回 media.id
  -> 前端切换到 edit 模式
  -> 创建任务时只提交 referenceMediaId
```

生成任务不直接携带图片二进制，而是引用已经上传的 `referenceMediaId`。这样文件上传与任务创建解耦，后端可以围绕媒体资产做归属检查、存储和复用。

当前生成工作台的 `maxGenerationInputs` 是 1，因此一次图生图任务只使用一张参考图；`src/utils/media.ts` 中的全局 `maxImageFiles = 4` 还服务于其他媒体场景。面试时应按具体工作台说“一张参考图”，不要把全局上限误说成该生成表单已经支持四张。

### 为什么文件上传需要客户端和服务端双重校验

文件上传的核心原则是：**客户端校验负责体验和成本，服务端校验负责安全和数据边界**。两边检查的规则可能相似，但信任级别完全不同。

浏览器中的文件对象和表单事件都可以被用户控制。用户可以通过开发者工具修改页面逻辑，也可以绕过页面直接使用 curl、Postman 或脚本调用 `/api/media/upload`。因此，客户端判断只能作为“请求发出前的第一道筛选”，不能作为服务端相信文件的依据。

这条上传链路可以拆成以下步骤：

```text
文件选择器
  -> accept 提示可选类型
  -> GenerateForm.addFiles() 客户端校验
  -> uploadFile() 封装为 FormData
  -> generationTasksApi.uploadMedia()
  -> POST /api/media/upload
  -> require login
  -> parseForm() + uploadSchema 服务端校验
  -> Java 媒体服务或开发期 Mock
  -> 校验返回的媒体 ID 和文件名
  -> 返回统一 media DTO
```

下面分别说明每一层具体做了什么。

#### 1. 文件选择器的 `accept` 只是交互提示

[`src/features/generation/prompt-composer.tsx`](./src/features/generation/prompt-composer.tsx) 中的文件输入使用：

```tsx
<input
  type="file"
  accept="image/png,image/jpeg,image/webp"
  multiple
  onChange={(event) => {
    void onFiles(event.target.files);
    event.target.value = "";
  }}
/>
```

`accept` 的作用是告诉浏览器文件选择窗口优先展示 PNG、JPEG 和 WebP 文件，让用户更容易选到正确类型。它不是安全校验：

- 用户仍可能选择其他文件；
- 请求可以完全绕过文件选择器直接构造；
- 用户可以修改 DOM 的 `accept` 值；
- 请求中的 MIME 类型也可以被伪造。

因此不能说“配置了 `accept` 就保证上传安全”。它只改善选择文件时的体验，真正的限制还要在 `addFiles()` 和 Route Handler 中执行。

#### 2. `GenerateForm.addFiles()` 负责快速反馈和减少无效请求

客户端的上传入口位于 [`src/features/generation/generate-form.tsx`](./src/features/generation/generate-form.tsx) 的 `addFiles()`：

```tsx
const supportsEdit = modelOptions.some((model) => model.modes.includes("edit"));
if (!supportsEdit) {
  setNotice({ text: "暂无可用图生图模型", tone: "error" });
  return;
}

const slots = maxGenerationInputs - inputs.length;
if (slots <= 0) {
  setNotice({
    text: `最多上传 ${maxGenerationInputs} 张参考图`,
    tone: "error",
  });
  return;
}
```

这部分先检查业务前置条件：

- 当前模型是否支持图生图；
- 当前创作工作台还剩多少上传位置；
- 当前生成表单是否已经有参考图。

当前 `maxGenerationInputs = 1`，所以这个工作台实际只允许一张参考图。之后客户端截取可用数量，再检查 MIME 类型和文件大小：

```tsx
const selected = Array.from(files).slice(0, slots);
const invalidType = selected.find((file) => !isSupportedImageType(file.type));
const oversized = selected.find((file) => file.size > maxImageBytes);

if (invalidType) {
  setNotice({ text: "仅支持 PNG、JPEG 和 WebP 图片", tone: "error" });
  return;
}
if (oversized) {
  setNotice({ text: "单张图片不能超过 10 MB", tone: "error" });
  return;
}
```

规则来源于 [`src/utils/media.ts`](./src/utils/media.ts)：

```ts
export const maxImageBytes = 10 * 1024 * 1024;
export const imageMimeTypes = ["image/png", "image/jpeg", "image/webp"] as const;

export function isSupportedImageType(type: string) {
  return imageMimeTypes.some((item) => item === type);
}
```

客户端校验的价值有三个：

1. **即时反馈**：用户选中错误文件后，不需要等待网络请求就能看到提示；
2. **减少带宽和服务端压力**：明显不合法的文件不会上传到 BFF；
3. **控制交互状态**：校验通过后才进入 `isUploading`，上传完成后才把媒体对象放进 `inputs`，并自动切换到 `edit` 模式。

上传中的状态也通过 `try/catch/finally` 管理：

```tsx
setUploading(true);
setNotice(null);
try {
  const uploaded = await Promise.all(selected.map(uploadFile));
  setInputs((current) => [...current, ...uploaded].slice(0, maxGenerationInputs));
  setOptions((current) => {
    const nextOptions = { ...current, mode: "edit" as const };
    return normalizeOptions(nextOptions, modelOptions);
  });
} catch (error) {
  showError(error);
} finally {
  setUploading(false);
}
```

这里的 `finally` 很重要。无论上传成功还是失败，`isUploading` 都必须恢复，否则提交按钮和上传入口可能一直处于禁用状态。

#### 3. `uploadFile()` 使用 `FormData` 传输文件

客户端真正发送文件的函数是：

```tsx
async function uploadFile(file: File) {
  const data = new FormData();
  data.set("file", file);
  return (await generationTasksApi.uploadMedia(data)).media;
}
```

浏览器 API 文件函数只负责构造请求，不负责 toast、跳转或业务状态。请求定义位于 [`src/api/generation/tasks.ts`](./src/api/generation/tasks.ts)：

```ts
function uploadMedia(data: FormData) {
  return request<UploadMediaResponse>({
    url: "/api/media/upload",
    method: "POST",
    body: data,
  });
}
```

`request()` 会识别 `FormData` 是浏览器原生 `BodyInit`，直接把它作为请求体发送，不会 JSON 序列化：

```ts
if (isBodyInit(options.data)) {
  body = options.data;
} else {
  headers.set("Content-Type", "application/json");
  body = JSON.stringify(options.data);
}
```

文件上传不能把 `File` 放进 JSON。并且 `Content-Type: multipart/form-data` 不应该手动写死，因为浏览器需要自动补充 multipart boundary；手动设置错误的 boundary 会导致服务端无法解析文件。

#### 4. Route Handler 是真正可信的 HTTP 输入边界

服务端入口位于 [`src/app/api/media/upload/route.ts`](./src/app/api/media/upload/route.ts)。它先做登录校验：

```ts
const current = await getCurrentUserProfile();
if (!current) {
  return jsonError("请先登录", 401);
}
```

这一步解决的是“谁可以上传”，而不是“上传什么文件”。即使客户端页面只有登录用户可以打开，Route Handler 仍然必须独立鉴权，因为任何人都可以绕过页面直接请求 API。

登录通过后，服务端使用 `parseForm(request, uploadSchema)` 解析和校验 multipart 表单：

```ts
const parsed = await parseForm(request, uploadSchema);
if (!parsed.ok) {
  return jsonError(parsed.message);
}
```

`parseForm()` 的实现先读取 `request.formData()`，再调用 Zod 的 `safeParse()`：

```ts
const form = await request.formData().catch(() => null);
if (!form) {
  return { ok: false, message: "请求内容必须是有效表单" };
}

const result = schema.safeParse(Object.fromEntries(form));
```

对应的 `uploadSchema` 是服务端真正执行的规则：

```ts
const uploadSchema = z.object({
  file: z
    .instanceof(File, { error: "请选择文件" })
    .refine((file) => isSupportedImageType(file.type), "仅支持 PNG、JPEG 和 WebP 图片")
    .refine((file) => file.size > 0 && file.size <= maxImageBytes, "单张图片必须小于 10 MB"),
});
```

服务端比客户端多做了一个 `file.size > 0` 判断，避免空文件进入后续媒体处理。这里的 `z.instanceof(File)` 也避免表单字段缺失、字段类型不对或伪造普通字符串时被当作文件使用。

#### 5. 为什么服务端校验不能只依赖客户端结果

假设只保留客户端校验，攻击者可以直接发送一个请求：

```bash
curl -X POST http://localhost:3000/api/media/upload \
  -H "Cookie: zroimg_user_token=..." \
  -F "file=@large-file.bin;type=image/png"
```

这个请求不会经过页面的 `accept`、`addFiles()` 或 React 状态逻辑。服务端如果没有 `uploadSchema`，就可能把：

- 超过限制的大文件；
- 空文件；
- 非图片文件；
- 伪装成图片 MIME 的其他文件；
- 缺少文件字段的请求；

继续传给 Java 媒体服务或对象存储，造成资源浪费、解析异常甚至安全风险。

所以客户端和服务端的信任关系不同：

| 校验位置            | 能否被用户绕过 | 主要目的               | 失败后的处理             |
| ------------------- | -------------- | ---------------------- | ------------------------ |
| `accept`            | 可以           | 引导文件选择           | 浏览器限制选择提示       |
| `addFiles()`        | 可以           | 快速反馈、减少无效上传 | 不发请求，展示提示       |
| `/api/media/upload` | 不应被绕过     | API 安全边界和业务规则 | 返回 400/401，不调用下游 |
| Java/存储服务       | 不能依赖前端   | 最终文件内容和存储安全 | 拒绝、隔离或清理文件     |

双重校验并不是简单重复，而是防御纵深：客户端为正常用户优化路径，服务端为所有请求建立不可绕过的边界。

#### 6. BFF 分支如何处理上传

Route Handler 校验通过后，根据环境选择真实 Java 服务或开发期 Mock：

```ts
if (isJavaBffEnabled()) {
  const body = new FormData();
  body.set("file", parsed.data.file);
  const data = await requestJavaApiData<unknown>("/media/user/assets", {
    method: "POST",
    body,
  });
  const media = javaMediaSchema.parse(data);

  return jsonOk({
    media: {
      id: media.id,
      fileName: media.originalName,
      kind: "input" as const,
    },
  });
}
```

Java 分支会重新创建 `FormData` 转发文件，并用 `javaMediaSchema` 校验后端响应中的 `id` 和 `originalName`。这一步不是再次检查图片格式，而是防止 Java 返回结构不符合约定时，前端拿到一个缺少媒体 ID 的对象。

`requestJavaApiData()` 发现请求体是 `FormData` 时会删除手动的 `content-type`：

```ts
if (options.body instanceof FormData) {
  nextHeaders.delete("content-type");
}
```

让 Fetch 根据新的请求体自动生成 multipart boundary。请求还使用 `cache: "no-store"`，避免动态上传请求被缓存。

开发期 Mock 分支则调用：

```ts
const media = await uploadMedia({
  ownerUserProfileId: current.profile.id,
  fileName: parsed.data.file.name,
  kind: "input",
});
```

两条分支最终都返回统一的：

```json
{
  "success": true,
  "data": {
    "media": {
      "id": "...",
      "fileName": "reference.png",
      "kind": "input"
    }
  }
}
```

因此 `GenerateForm` 不需要知道当前运行的是 Java 还是 Mock，也不需要解析 Java 原始响应。

#### 7. 当前实现的校验边界和可以继续加强的地方

当前代码已经做到：

- 客户端和服务端都限制 PNG、JPEG、WebP；
- 服务端限制文件不能为空；
- 服务端限制单文件不超过 `10 * 1024 * 1024` 字节，即 10 MiB；
- 上传接口要求用户登录；
- Java 响应使用 Zod 校验媒体 ID 和文件名；
- 生成任务只提交 `referenceMediaId`，不让任务接口直接接收图片二进制；
- `tests/media.test.ts` 对 MIME 类型、大小和数量规则进行了纯函数测试。

但当前 `isSupportedImageType(file.type)` 检查的是浏览器或请求声明的 MIME 类型，并没有读取文件头（magic bytes）或真正解码图片。因此面试时不要说“当前已经完成了文件内容安全检测”。更严格的生产实现还可以在服务端增加：

1. 读取 PNG、JPEG、WebP 的文件头，确认真实格式与 MIME 声明一致；
2. 使用图片库尝试解码，并限制图片宽高和像素总数，防止解压炸弹；
3. 必要时重新编码图片并清理 EXIF 等元数据；
4. 对上传内容做病毒扫描或交给对象存储安全检查；
5. 在 Nginx、网关或平台层设置请求体上限，避免超大请求在到达应用前消耗过多资源。

项目中的 `deploy/nginx.dev.conf.example` 已设置 `client_max_body_size 12m`，它属于网关层的请求大小保护；应用层的 10 MiB 校验仍然必须保留，因为网关限制不能替代业务格式和归属校验。

### 面试回答版本

> 文件上传采用客户端和服务端双重校验。客户端在 `GenerateForm.addFiles()` 中根据模型能力、数量、MIME 类型和文件大小做快速校验，减少无效请求并及时反馈；文件输入的 `accept` 只负责引导选择，不能作为安全边界。请求到达 `/api/media/upload` 后，Route Handler 先校验登录，再通过 `parseForm + Zod` 校验 `File` 实例、PNG/JPEG/WebP 类型、非空和 10 MiB 大小限制，防止用户绕过页面直接上传非法文件。通过后 BFF 再调用 Java 媒体服务，并校验返回的媒体 ID，最终生成任务只提交 `referenceMediaId`。当前代码主要校验 MIME 声明，生产环境还应补充文件头、图片解码和像素大小检查。

### 阶段五：提交任务

`GenerateForm.submit()` 在发请求前按顺序执行以下判断：

1. 提示词不能为空；
2. 价格仍在计算或计算失败时不能提交；
3. 当前余额必须覆盖预估积分；
4. 图生图模式必须存在参考图；
5. 没有当前会话时先创建会话。

校验通过后，前端先创建本地临时任务：

```tsx
pendingId = `pending-${Date.now()}`;
const pendingTask: TaskItem = {
  id: pendingId,
  prompt: text,
  mode: options.mode,
  status: "running",
  costCredits: estimate,
  outputs: [],
  // 省略其他展示字段
};

setTasks((current) => [pendingTask, ...current]);
setPrompt("");
```

这是一次有限的乐观更新：它只让界面立即出现“正在生成”的消息，不假设任务一定成功，也不生成虚假的图片结果。

随后调用 `generationTasksApi.createTask()`，经过 BFF 创建真实任务。成功后用真实任务替换临时任务：

```tsx
setTasks((current) => current.map((item) => (item.id === pendingId ? task : item)));
```

同时使用后端返回的 `task.costCredits` 更新界面余额和会话摘要。若请求失败，临时任务会被改为 `failed`，错误信息则由统一错误工具转换成用户可读消息。`finally` 始终恢复提交按钮状态。

### 阶段六：轮询任务

真实任务通常先处于 `queued` 或 `running`。只要当前任务列表存在这两种状态，轮询 effect 就每 2.5 秒请求当前会话任务：

```text
queued/running 存在
  -> 等待 2.5 秒
  -> GET 当前会话任务
  -> 更新 tasks
  -> 仍有未完成任务：安排下一次请求
  -> 全部终态：刷新会话摘要并停止
```

任务状态最终进入：

- `succeeded`：BFF 序列化图片预览、原图和下载地址；
- `failed`：预览区显示失败状态，不再继续轮询该任务。

### 阶段七：展示生成结果

[`src/features/generation/task-preview.tsx`](./src/features/generation/task-preview.tsx) 根据任务状态渲染不同内容：

- `queued/running`：显示状态、画质、比例、数量、积分和生成动画；
- `failed`：显示失败信息；
- 存在 `outputs`：显示图片灯箱、收藏和下载操作。

任务数组在数据层按新到旧保存，展示时通过 `[...tasks].reverse()` 改为对话式的旧到新顺序。`scrollKey` 由任务 ID、状态和输出数量组成，只要轮询带来状态或结果变化，就会滚动到最新内容：

```tsx
const scrollKey = tasks.map((task) => `${task.id}:${task.status}:${task.outputs.length}`).join("|");

useEffect(() => {
  chat.scrollTop = chat.scrollHeight;
}, [scrollKey]);
```

### 这条链路体现的前端能力

这不是简单地“调用一个生成接口”，而是把模型能力、参数联动、价格预估、文件上传、任务创建、状态轮询、结果展示和异常回退组织为一个连续的前端业务流程。

---

## 3. Next.js App Router + React 19 构建 AI 创作工作台

### 简历表述

> 基于 Next.js App Router + React 19 构建 AI 图片生成平台，完成提示词创作、参考图上传、模型选择、图片比例、画质及生成数量配置等核心交互。

### 对应业务问题

AI 图片生成并不是一个简单表单。一次创作会同时涉及：

- 当前创作会话及会话历史；
- 文生图或图生图模式；
- 模型、比例、画质、生成数量等联动参数；
- 参考图上传；
- 积分预估和余额校验；
- 异步任务状态与生成结果预览。

因此页面需要同时兼顾首屏数据加载和高频客户端交互。

### 具体实现

创作页 [`src/app/(product)/generate/page.tsx`](<./src/app/(product)/generate/page.tsx>) 是默认的 Server Component。它在服务端完成以下工作：

1. 通过 `requireUser()` 校验登录状态；
2. 获取可用模型并生成默认参数；
3. 获取当前积分和本次生成的预估价格；
4. 确保用户至少存在一个默认会话；
5. 从 Cookie 恢复上次选中的会话；
6. 并行获取当前会话任务和收藏夹；
7. 将可序列化的首屏数据传给 `GenerateForm`。

关键代码：

```tsx
const current = await requireUser();
const modelOptions = await listModels();
const initialOptions = getDefaultOptions(modelOptions);

await ensureDefaultConversation(current.profile.id);
const conversations = await listConversations(current.profile.id);

const [tasks, collections] = await Promise.all([tasksPromise, listCollections(current.profile.id)]);

return (
  <GenerateForm
    initialChats={items}
    initialTasks={taskList}
    initialBalance={initialPrice.currentPoints}
    initialOptions={initialOptions}
    modelOptions={modelOptions}
  />
);
```

客户端工作台位于 [`src/features/generation/generate-form.tsx`](./src/features/generation/generate-form.tsx)。它负责请求编排和工作区状态，并继续拆分为：

- [`conversation-sidebar.tsx`](./src/features/generation/conversation-sidebar.tsx)：会话选择、创建、重命名和删除；
- [`generation-settings.tsx`](./src/features/generation/generation-settings.tsx)：模式、模型、比例、画质和数量；
- [`prompt-composer.tsx`](./src/features/generation/prompt-composer.tsx)：提示词、参考图和提交；
- [`task-preview.tsx`](./src/features/generation/task-preview.tsx)：任务状态与生成结果预览。

模型发生切换时，不是直接保留可能已经失效的参数，而是通过 [`generation-model.ts`](./src/features/generation/generation-model.ts) 中的 `normalizeOptions()`，根据模型支持的模式和参数集合重新选择合法值。这解决了不同模型能力不一致时的参数联动问题。

### 参考图上传

上传采用“客户端提前校验 + BFF 再次校验”的双层方案：

- 客户端检查当前模型是否支持图生图、上传数量、MIME 类型和 10 MB 大小限制；
- 校验通过后使用 `FormData` 上传，并自动把生成模式切换为 `edit`；
- Route Handler 使用 Zod 再次校验 `File`、格式和大小，不能把客户端校验当作安全边界。

客户端实现在 `GenerateForm.addFiles()`，服务端边界位于 [`src/app/api/media/upload/route.ts`](./src/app/api/media/upload/route.ts)。

### 面试简述

> 创作页使用 App Router。服务端页面先完成鉴权并聚合模型、积分、会话、任务和收藏夹等首屏数据，再把数据传给 React 客户端工作台。客户端按会话、参数、提示词和任务预览拆分组件，负责参数联动、上传和任务提交，从而把数据获取职责与复杂交互职责分开。

---

## 4. Server Components 与 Client Components 分层

### 简历表述

> 采用 Server Components 与 Client Components 分层设计，由服务端处理页面鉴权和首屏数据聚合，客户端承载创作工作台的复杂状态与交互。

### 为什么需要分层

如果把整个页面都设为 Client Component，首屏需要在浏览器挂载后再请求用户、模型、会话和任务数据，会增加加载阶段和客户端状态。反过来，文件上传、输入框、弹层、轮询和浏览器 Cookie 操作又必须运行在客户端。

该项目将边界放在创作工作台：页面和布局留在服务端，真正需要交互的 `GenerateForm` 进入客户端。

### Server Component 层

[`src/app/(product)/layout.tsx`](<./src/app/(product)/layout.tsx>) 在产品路由组入口调用 `requireUser()`，未登录用户会在服务端重定向到登录页。具体页面仍会按资源需要再次取得当前用户。

[`src/server/auth.ts`](./src/server/auth.ts) 的主要实现包括：

- 通过 `next/headers` 的 `cookies()` 读取会话 Cookie；
- 调用 Java `/auth/user/me` 获取当前用户；
- 使用 Zod 校验后端返回的用户结构；
- 使用 React `cache()` 对一次服务端渲染中的用户查询进行复用；
- 提供 `requireUser()` 和 `requireAdmin()` 作为服务端权限入口。

```ts
export const getCurrentUserProfile = cache(async function getCurrentUserProfile() {
  // 根据环境读取 Java 会话或开发期 Mock 会话
});

export async function requireUser() {
  const current = await getCurrentUserProfile();
  if (!current || current.profile.status !== "active") {
    redirect("/login");
  }
  return current;
}
```

### Client Component 层

`GenerateForm` 顶部使用 `"use client"`，通过 `useState` 管理会话、当前任务、提示词、生成参数、积分、上传和提交状态；通过 `useEffect` 处理会话恢复、价格预估防抖和任务轮询；通过 `useRef` 防止重复创建会话并识别过期的异步请求。

### 这句话在代码中的完整对应关系

简历中的这句话可以按“页面壳、数据入口、交互工作台”三层理解：

```text
Server Component：ProductLayout
  -> 负责产品区域的登录入口和页面壳

Server Component：GeneratePage
  -> 负责生成页首屏数据聚合

Client Component：GenerateForm
  -> 负责浏览器状态、事件、上传、表单和轮询
```

对应源码入口是：

| 层级       | 文件                                              | 是否客户端组件 | 主要职责                               |
| ---------- | ------------------------------------------------- | -------------- | -------------------------------------- |
| 产品布局   | `src/app/(product)/layout.tsx`                    | 否             | 产品区域鉴权、页面壳和导航             |
| 生成页面   | `src/app/(product)/generate/page.tsx`             | 否             | 模型、积分、会话、任务和收藏夹首屏数据 |
| 工作台容器 | `src/features/generation/generate-form.tsx`       | 是             | 状态编排、事件处理和异步请求           |
| 参数面板   | `src/features/generation/generation-settings.tsx` | 是             | 模式、模型、比例、分辨率档位、数量     |
| 提示词区域 | `src/features/generation/prompt-composer.tsx`     | 是             | 输入、参考图上传、提交                 |
| 结果区域   | `src/features/generation/task-preview.tsx`        | 是             | 任务状态、图片预览、收藏和下载         |

这不是简单地把文件分成“服务端目录”和“客户端目录”，而是按照代码是否需要浏览器能力来划分边界：

- 需要 Cookie、后端服务、首屏数据和权限判断的逻辑放服务端；
- 需要 `useState`、`useEffect`、文件选择、点击事件、定时器和 `document.cookie` 的逻辑放客户端；
- 只负责展示的客户端子组件不直接访问 Java 服务，而是接收父组件传下来的数据和回调。

### 第一层：布局组件处理登录和页面壳

产品路由布局 [`src/app/(product)/layout.tsx`](<./src/app/(product)/layout.tsx>) 是一个异步 Server Component：

```tsx
export default async function ProductLayout(props: ProductLayoutProps) {
  const children = props.children;

  await requireUser();

  return <ProductFrame topNav={<ProductTopNav autoOpenAnnouncement />}>{children}</ProductFrame>;
}
```

这里没有添加 `"use client"`，因为布局本身不需要管理浏览器状态。它只做三件事：

1. 调用 `requireUser()`，未登录时在服务端重定向到 `/login`；
2. 组织产品区域的页面壳和顶部导航；
3. 通过 `children` 渲染具体业务页面。

把鉴权放在布局层的好处是产品区域下的多个页面都能共享登录入口，例如生成页、历史页、收藏页和账户页，不需要每个页面重复实现“是否登录”的 UI 判断。具体 API 仍然会再次鉴权，因为布局鉴权不能替代接口鉴权。

### 第二层：生成页 Server Component 聚合首屏数据

生成页 [`src/app/(product)/generate/page.tsx`](<./src/app/(product)/generate/page.tsx>) 也没有 `"use client"`，所以可以直接调用服务端函数：

```tsx
const current = await requireUser();
const modelOptions = await listModels();
const initialOptions = getDefaultOptions(modelOptions);
const initialPrice = await estimatePrice(current.profile.id, {
  model: initialOptions.model,
  mode: initialOptions.mode,
  ratio: initialOptions.ratio,
  quality: initialOptions.quality,
  count: initialOptions.count,
});
```

这些函数最终可能读取 Cookie、调用 Java 后端、访问服务端 Mock 或生成签名资源 URL。它们依赖服务端环境，因此不应该从客户端组件直接导入。

页面在服务端把后端领域对象整理成界面需要的 DTO：

```tsx
const items = conversations.map((conversation) => {
  const latestTask = conversation.tasks[0];

  return {
    id: conversation.id,
    title: conversation.title,
    taskCount: conversation._count.tasks,
    latestTaskStatus: latestTask?.status ?? null,
    latestTaskCost: latestTask?.costCredits ?? null,
    lastTaskAt: conversation.lastTaskAt?.toISOString() ?? null,
    updatedAt: conversation.updatedAt.toISOString(),
    createdAt: conversation.createdAt.toISOString(),
  };
});
```

这里没有把后端原始对象直接传给客户端，而是只传页面需要的字符串、数字、布尔值、数组和普通对象。日期也提前转换为 ISO 字符串，避免把 `Date`、数据库对象或服务端内部模型直接跨边界传递。

### 第三层：`GenerateForm` 承载复杂交互

`GenerateForm` 顶部的：

```tsx
"use client";
```

表示从这个文件开始，需要浏览器运行时的交互逻辑。它接收 Server Component 传入的初始 DTO：

```ts
type GenerateFormProps = {
  initialChats: ConversationItem[];
  initialId?: string;
  initialTasks: TaskItem[];
  initialBalance: number;
  initialOptions: GenerationOptions;
  initialEstimate: number;
  initialCollections: FavoriteCollectionItem[];
  modelOptions: GenerationModelOption[];
};
```

这些 props 都是可序列化数据，所以可以从 Server Component 传给 Client Component。进入浏览器后，再初始化本地状态：

```tsx
const [chats, setChats] = useState(initialChats);
const [activeId, setActiveId] = useState(initialId || initialChats[0]?.id || "");
const [tasks, setTasks] = useState(initialTasks);
const [options, setOptions] = useState<GenerationOptions>(initialOptions);
const [balance, setBalance] = useState(initialBalance);
```

这形成了一个清晰的“服务端初始值 -> 客户端可变状态”过程：

```text
服务端查询结果
  -> props
  -> useState 初始值
  -> 用户操作触发 setState
  -> Client Component 重新渲染
```

### 为什么交互逻辑必须放在 Client Component

生成工作台中以下代码都依赖浏览器能力：

#### 1. 表单输入

```tsx
const [prompt, setPrompt] = useState("");

<textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} />;
```

服务端组件不能响应浏览器输入事件，也不能通过 `useState` 保存每次输入后的状态。

#### 2. 文件选择和上传

```tsx
<input
  type="file"
  onChange={(event) => {
    void onFiles(event.target.files);
    event.target.value = "";
  }}
/>
```

`FileList`、`File` 和用户选择事件来自浏览器。服务端可以接收上传后的 `FormData`，但不能直接监听用户在浏览器中的文件选择。

#### 3. 定时轮询

```tsx
useEffect(() => {
  const timer = window.setTimeout(poll, 2500);
  return () => window.clearTimeout(timer);
}, [activeId, pendingKey]);
```

轮询依赖 `useEffect`、`window.setTimeout` 和组件生命周期，适合放在客户端。服务端渲染只负责生成初始任务状态，不能在一次请求中持续等待任务完成。

#### 4. 浏览器 Cookie

工作台用 `document.cookie` 记住当前会话：

```tsx
function readActiveConversationId() {
  const prefix = `${activeConversationCookieName}=`;
  const cookie = document.cookie.split(";").find((item) => item.trim().startsWith(prefix));
  return cookie ? decodeURIComponent(cookie.trim().slice(prefix.length)) : "";
}
```

这和服务端使用 `next/headers` 读取 Cookie 是两种不同场景：服务端使用 `cookies()` 读取请求上下文，客户端只能在浏览器环境中使用 `document.cookie` 读取非 `httpOnly` Cookie。

### 为什么不能把整个页面都写成 Client Component

如果在 `page.tsx` 顶部加上 `"use client"`，页面就不能直接使用当前这些服务端能力：

```tsx
import { requireUser } from "@/server/auth";
import { listModels, listTasks } from "@/server/bff/generation";
```

这些模块包含 `server-only`、Cookie 读取、Java 服务地址和服务端数据访问。客户端组件不能把它们当作浏览器代码执行，否则会破坏服务端边界，甚至把不应该暴露的配置和依赖带进客户端构建。

页面全部客户端化还会带来几个问题：

- 首屏先渲染空壳，再由浏览器请求用户、模型、积分和任务；
- 需要额外处理初始化 loading、登录失效和接口串行请求；
- 首屏数据获取和复杂交互状态混在一个组件中，职责变重；
- 服务端可以复用的数据聚合逻辑无法直接在页面中使用。

所以当前做法是把 Client Component 边界尽量放在真正需要交互的 `GenerateForm`，而不是把整个路由页面变成客户端组件。

### Server Component 如何把数据交给 Client Component

Next.js 会先在服务端执行 `GeneratePage()`，然后把 `GenerateForm` 的可序列化 props 编入 RSC Payload，并生成初始页面。浏览器拿到 HTML 后，客户端 JavaScript 对 `GenerateForm` 进行 hydration，让按钮、输入框、上传和轮询开始工作。

可以把过程理解为：

```text
服务端执行 page.tsx
  -> 得到 HTML + RSC Payload
  -> 浏览器先看到首屏结构和数据
  -> 加载客户端 JS
  -> hydration GenerateForm
  -> 交互事件开始生效
```

这里的关键不是“服务端渲染后客户端再重新请求全部数据”，而是服务端已经把首屏所需数据作为 props 下发，客户端只负责接管交互和后续变化。

### `server-only` 与 `use client` 的边界保护

认证和 BFF 文件使用：

```ts
import "server-only";
```

它表达的是：这个模块只能被服务端代码引用。生成工作台则使用：

```tsx
"use client";
```

它表达的是：这个模块需要客户端运行时。两者共同建立了模块边界：

```text
page.tsx / layout.tsx
  -> 可以引用 server-only 模块
  -> 可以渲染 Client Component

GenerateForm.tsx
  -> 可以使用 React Hooks 和浏览器 API
  -> 不能直接引用 server-only 的 auth/BFF 模块
  -> 只能通过 src/api 请求同源 Route Handler
```

### 面试中如何解释“分层设计”

可以按四句话回答：

1. 产品布局和生成页面保持 Server Component，用于服务端鉴权、首屏数据聚合和页面结构组织；
2. `GenerateForm` 作为最小交互边界使用 Client Component，管理输入、上传、弹层、定时器和任务状态；
3. 服务端把模型、会话、任务、收藏夹和积分整理成可序列化 DTO，通过 props 传给客户端；
4. 客户端后续请求只访问同源 `/api`，不直接依赖 Java 服务或服务端模块。

这样既利用了 Next.js 服务端组件的数据获取能力，又保留了 React 客户端组件处理复杂交互的能力。

关键 effect 都带有清理或失效保护。例如恢复会话时使用 `disposed` 和 `selectionVersionRef`，避免用户已经切换会话后，较早返回的恢复请求覆盖当前界面：

```tsx
const selectionVersion = selectionVersionRef.current;

const data = await generationConversationsApi.fetchConversationTasks(nextId);

if (disposed || selectionVersionRef.current !== selectionVersion) return;
setTasks(data.tasks);
```

### 工作台状态如何划分

当前实现没有引入 Redux 等全局状态库，而是由 `GenerateForm` 作为业务编排组件持有本页面状态，再通过 props 下发给职责更窄的子组件：

| 状态                                    | 业务含义                     | 主要消费者                     |
| --------------------------------------- | ---------------------------- | ------------------------------ |
| `chats/activeId`                        | 会话列表与当前会话           | `ConversationSidebar`          |
| `tasks`                                 | 当前会话的生成任务           | `TaskPreview`、轮询 effect     |
| `prompt/inputs`                         | 提示词与参考图               | `PromptComposer`               |
| `options`                               | 模型、模式、比例、画质、数量 | `GenerationSettings`、提交函数 |
| `estimate/balance`                      | 预计积分与当前余额           | 设置面板、提交区               |
| `isSubmitting/isUploading/isEstimating` | 异步操作状态                 | 禁用按钮、加载图标             |
| `notice/errorCost`                      | 普通异常与积分不足           | 提示区域、积分提示             |

这样选择的原因是这些状态都围绕单个创作工作台协作，并没有形成真正的跨页面共享状态。子组件不直接请求生成接口，主要通过回调把用户意图交还给 `GenerateForm`，请求顺序和状态更新集中在一个位置。

### `useRef` 解决的两个问题

`isCreatingChatRef` 用于同步阻止重复创建会话。仅依赖 `isCreatingChat` 状态不够，因为 React 状态更新不是立即改变当前函数闭包中的值，用户快速点击时可能在下一次渲染前触发两次请求：

```tsx
if (isCreatingChatRef.current) return null;
isCreatingChatRef.current = true;

try {
  // 创建会话
} finally {
  isCreatingChatRef.current = false;
}
```

`selectionVersionRef` 则是一个轻量版本号。用户主动选择或创建会话时版本号递增，页面初始化阶段的异步恢复逻辑返回后会比较版本；版本不一致说明用户已经做出更新选择，旧结果应被丢弃。

这两种 ref 都不用于渲染：一个承担同步互斥标记，一个承担异步结果的新旧判断，因此不会为了改变它们触发额外渲染。

### 分层带来的价值

- 登录校验和首屏数据在服务端完成，浏览器不需要串行发起多次初始化请求；
- Java 后端地址、会话处理和服务端模块不会进入客户端代码；
- 客户端只接收页面需要的 DTO，组件职责更清楚；
- 文件上传、轮询和浏览器事件仍保留完整交互能力。

### 面试简述

> 我没有把整个创作页都客户端化。页面和产品布局使用 Server Components 完成鉴权和首屏数据聚合，只有需要 Hooks、上传和轮询的工作台使用 Client Component。服务端把可序列化 DTO 作为 props 下发，减少了浏览器首屏初始化请求，也避免服务端依赖进入客户端包。

---

## 5. Next.js Route Handlers 构建 BFF

### 简历表述

> 基于 Next.js Route Handlers 构建前端 BFF 层，统一处理生成任务、媒体上传和用户相关请求，集中完成鉴权、参数校验、资源归属检查及后端协议适配。

### BFF 在本项目中的含义

BFF 是 Backend For Frontend。浏览器不直接请求 Java 服务或生成供应商，而是只访问同源 `/api/**`。Route Handler 根据前端页面需要组织请求，再通过 `src/server/bff` 调用 Java 后端或开发期 Mock。

以“创建图片生成任务”为例，真实链路为：

```text
GenerateForm.submit()
  -> generationTasksApi.createTask()
  -> POST /api/generations
  -> 登录校验 + Zod 参数校验
  -> 校验会话归属当前用户
  -> generation facade 的 createTask()
  -> Java 生成接口或 Mock
  -> serializeTask() 转换为前端 DTO
  -> GenerateForm 更新任务、积分和会话状态
```

### 浏览器请求层

[`src/api/generation/tasks.ts`](./src/api/generation/tasks.ts) 只定义同源业务请求，不处理 toast、跳转或组件状态：

```ts
function createTask(data: CreateGenerationTaskRequest) {
  return request<CreateGenerationTaskResponse>({
    url: "/api/generations",
    method: "POST",
    data,
  });
}
```

请求和响应类型集中在 [`src/types/generation.ts`](./src/types/generation.ts)，例如生成模式、任务状态、创建任务参数和任务响应，避免组件、API 层和 BFF 各自维护一套类型。

### Route Handler 输入边界

[`src/app/api/generations/route.ts`](./src/app/api/generations/route.ts) 的 `POST` 请求依次执行：

1. 获取当前用户，未登录返回 401；
2. 使用 Zod 校验 JSON 请求；
3. 对图生图补充业务校验，要求存在参考图；
4. 验证目标会话属于当前用户；
5. 创建任务并转换成前端需要的 DTO。

```ts
const parsed = await parseJson(request, generationSchema);
if (!parsed.ok) return jsonError(parsed.message);

if (payload.mode === "edit" && !payload.referenceMediaId) {
  return jsonError("图生图需要 1 张参考图");
}

await requireConversation(current.profile.id, payload.conversationId);
const task = await createTask({ ... });
return jsonOk({ task: await serializeTask(task) });
```

这里的 Zod 是运行时校验，解决 TypeScript 类型在编译后消失、外部请求仍可能传入非法数据的问题。通用的 JSON/FormData 解析位于 [`src/server/validation.ts`](./src/server/validation.ts)。

### Facade 与 Java 协议适配

[`src/server/bff/generation.ts`](./src/server/bff/generation.ts) 是业务 facade。它根据环境决定调用 Java 实现还是开发期 Mock，页面和 Route Handler 不需要知道数据来源。

[`src/server/bff/internal/java-generation.ts`](./src/server/bff/internal/java-generation.ts) 负责：

- 使用 Zod 校验 Java 返回的模型、会话、任务和价格结构；
- 将 Java 的 `pending/processing` 映射为前端统一的 `queued/running`；
- 将 `text_to_image/image_to_image` 映射为 `text/edit`；
- 将 Java 字段转换为前端统一的 `GenerationTaskView`；
- 将媒体资产 ID 转换为预览地址、原图地址和下载地址。

因此组件只依赖稳定的前端模型，不直接处理 Java 原始字段。

### BFF 内部为什么再拆三层

| 层级          | 示例文件                                 | 职责                                     |
| ------------- | ---------------------------------------- | ---------------------------------------- |
| Route Handler | `app/api/generations/route.ts`           | HTTP 入口、登录校验、输入校验、状态码    |
| 业务 facade   | `server/bff/generation.ts`               | 统一业务函数、选择 Java 或开发期 Mock    |
| Java adapter  | `server/bff/internal/java-generation.ts` | 调用 Java 接口、校验响应、字段与状态映射 |

如果 Route Handler 直接拼 Java URL 和转换字段，那么同一套生成逻辑被 Server Component 使用时还要复制一遍。加入 facade 后，页面首屏读取和 Route Handler 写操作都依赖统一业务入口；Java 协议变化则集中在 adapter 中处理。

### 三层类型与数据校验

这个项目的类型安全不是只依靠 `request<T>()` 泛型，而是分成三层：

1. **TypeScript 静态类型**：`src/types/generation.ts` 约束组件、请求函数和 DTO 的编译期结构；
2. **BFF 入参运行时校验**：Route Handler 使用 Zod 校验浏览器提交的 JSON 或 FormData；
3. **Java 出参运行时校验**：Java adapter 把后端返回值先视为 `unknown`，再通过 Zod schema 解析。

例如 Java 任务响应先由 `javaTaskSchema` 校验，再映射成 `GenerationTaskView`：

```ts
const payload = await requestJavaApiData<unknown>(path);
const tasks = z.array(javaTaskSchema).parse(payload);
return tasks.map(mapTask);
```

这样做的核心原因是 TypeScript 在运行时不存在。`request<CreateGenerationTaskResponse>()` 可以检查前端调用代码，却不能证明网络响应真的符合类型。真正的外部数据保证来自 Route Handler 和 Java adapter 的运行时解析。

### 状态与字段适配

Java 接口使用 `pending/processing` 和 `text_to_image/image_to_image`，前端业务模型使用 `queued/running` 和 `text/edit`。adapter 通过明确函数转换：

```ts
function mapStatus(status: string) {
  if (status === "pending") return "queued" as const;
  if (status === "processing") return "running" as const;
  if (status === "succeeded") return "succeeded" as const;
  return "failed" as const;
}

function toJavaMode(mode: GenerationMode) {
  return mode === "edit" ? "image_to_image" : "text_to_image";
}
```

前端因此可以使用短且稳定的领域状态。后端枚举或字段命名变化时，主要修改适配层，不需要逐个修改 React 组件。

### Cookie 与请求头如何传递

`src/server/java-api.ts` 只转发白名单请求头，包括 `authorization`、`cookie`、`content-type` 和请求追踪相关字段。服务端请求使用 `cache: "no-store"`，防止用户任务、积分等动态数据被错误复用。

上传 `FormData` 时会主动删除手写的 `content-type`，让 Fetch 自动生成包含 boundary 的 multipart 头。否则后端无法正确解析文件。

Java 请求工具提供两种错误处理路径：原样代理请求失败时返回 502 和 `JAVA_UNAVAILABLE`；服务端数据请求失败时抛出状态为 502 的 `JavaApiError`，再由 `handleApi()` 转换成统一 BFF 错误。两条路径都不会在生产环境悄悄回退到 Mock 数据，避免出现看似成功但数据不真实的情况。

### 统一请求与错误归一化

[`src/utils/request.ts`](./src/utils/request.ts) 封装了浏览器 `fetch`，主要处理：

- 查询参数和 JSON/FormData 请求体；
- 默认携带同源 Cookie；
- BFF `{ success, data }` 响应；
- Java `{ code, message, data }` 响应；
- HTTP 非 2xx、业务码失败和网络异常；
- 统一抛出带 `code`、`status`、`url` 和 `method` 的 `ApiRequestError`。

特别是 Java 接口即使 HTTP 为 200，只要 `code !== 200`，请求工具仍按业务失败处理，防止页面把失败响应当作正常数据。

错误处理链路可以概括为：

```text
网络断开
  -> request.ts 捕获 fetch 异常
  -> ApiRequestError(code=NETWORK_ERROR, status=0)

HTTP 4xx/5xx 或 BFF success=false
  -> 解析 message/code/status
  -> ApiRequestError

Java HTTP 200 但 code!=200
  -> 仍判定为业务失败
  -> ApiRequestError

Route Handler 未处理异常
  -> handleApi 隐藏内部堆栈
  -> 对浏览器返回统一 500 envelope
```

`ApiRequestError` 保存 `url`、`method`、`status`、`code` 和原始 `payload`，上层既可以显示 `message`，也能根据错误码做登录跳转、限流提示等差异化处理。

### BFF 的业务价值

- 浏览器只请求同源地址，减少跨域和多环境地址配置；
- 会话 Cookie、Java 地址及服务端密钥留在服务端；
- 鉴权和资源归属检查不依赖“前端隐藏按钮”；
- Java 字段或状态变化集中在适配层处理，降低组件与后端协议的耦合；
- 上传、生成、历史记录等接口使用统一错误模型。

### 面试简述

> 浏览器统一请求同源 `/api`，Route Handler 负责鉴权、Zod 校验和资源归属检查，再通过业务 facade 调用 Java 服务。Java 返回的数据会在服务端适配成统一 DTO，浏览器请求层再统一处理 HTTP 错误和业务错误码，因此组件不需要感知后端 envelope 和字段差异。

---

## 6. React Hooks 实现异步任务轮询与状态管理

### 简历表述

> 基于 React Hooks 实现 AI 生成任务轮询与状态管理，实时同步任务进度、生成结果和历史记录。

### 对应业务问题

AI 图片生成是异步耗时任务。创建接口只能先返回任务，图片结果需要等待生成服务后续写回。前端不能一直阻塞一次 HTTP 请求，需要把任务视为有生命周期的状态：

```text
queued（排队中） -> running（生成中） -> succeeded（成功）
                                      -> failed（失败）
```

状态类型定义在 [`src/types/generation.ts`](./src/types/generation.ts)：

```ts
type GenerationTaskStatus = "queued" | "running" | "succeeded" | "failed";
```

### 提交阶段：乐观占位

`GenerateForm.submit()` 在真正的创建接口返回前，先插入一个临时 `running` 任务，让用户立即看到已提交状态：

```tsx
const pendingTask: TaskItem = {
  id: `pending-${Date.now()}`,
  prompt: text,
  status: "running",
  outputs: [],
  // 其余生成参数
};

setTasks((current) => [pendingTask, ...current]);
```

接口成功后，用服务端返回的真实任务替换临时任务，并根据后端权威的 `costCredits` 更新积分和会话摘要。接口失败则将占位任务改为 `failed`，并在 `finally` 中恢复提交状态。

这种处理减少了点击提交后的空白等待，但积分最终仍以后端返回值为准，前端预估不作为真实扣费依据。

### 轮询阶段：只在存在未完成任务时运行

工作台先从任务列表计算 `pendingKey`，只包含 `queued` 和 `running` 任务。当不存在未完成任务时，轮询 effect 不启动。

```tsx
const pendingKey = tasks
  .filter(isPending)
  .map((task) => `${task.id}:${task.status}`)
  .join("|");

useEffect(() => {
  if (!activeId || !pendingKey) return;
  // 开始轮询
}, [activeId, pendingKey]);
```

轮询每 2.5 秒重新获取当前会话任务。这里使用递归 `setTimeout`，下一次计时在本次请求结束后才创建，可避免请求耗时超过间隔时出现多个轮询请求重叠：

```tsx
async function poll() {
  const data = await generationConversationsApi.fetchConversationTasks(activeId);
  if (disposed) return;

  setTasks(data.tasks);
  if (!data.tasks.some(isPending)) {
    await refreshList();
    return;
  }

  if (!disposed) timer = window.setTimeout(poll, 2500);
}
```

任务全部进入 `succeeded` 或 `failed` 后不再安排下一次轮询，并刷新会话列表，使侧边栏的最新任务状态和任务数量与服务端同步。

### 清理与异常处理

effect 返回清理函数，切换会话、依赖变化或组件卸载时设置 `disposed` 并清除计时器，避免旧请求继续写入新会话状态。暂时性轮询失败不会覆盖当前界面，而是等待下一轮重试。

### 为什么依赖 `pendingKey`，而不是整个 `tasks`

如果 effect 直接依赖 `tasks` 数组，每次轮询执行 `setTasks(data.tasks)` 都会得到一个新数组，即使未完成任务集合没有变化，也可能反复清理并重建计时器。

当前实现只把影响“是否应该继续轮询”的信息压缩成字符串：

```tsx
const pendingKey = tasks
  .filter(isPending)
  .map((task) => `${task.id}:${task.status}`)
  .join("|");
```

只有未完成任务新增、移除或状态变化时，`pendingKey` 才变化。任务全部进入终态后字符串变为空，effect 不再启动。

### 为什么工作台使用递归 `setTimeout`

`setInterval` 按固定时间触发，不关心上一次异步请求是否结束。假设网络请求耗时超过 2.5 秒，下一次请求仍可能开始，造成并发轮询、响应乱序和服务端额外压力。

递归 `setTimeout` 是在本轮 `await` 完成后才安排下一轮，因此两次轮询不会由定时器主动重叠。当前历史记录页的单任务 `TaskPoller` 使用的是 `setInterval`，而创作工作台使用递归 `setTimeout`；简历重点描述的是后者。

### 轮询失败为什么不立即清空界面

轮询属于后台同步请求，短暂断网或服务端偶发超时不代表已有任务数据无效。因此 catch 中保留当前 UI，并继续安排下一轮请求。与创建任务失败不同，轮询失败不会把任务直接改成 `failed`，因为任务的真实状态仍由服务端决定。

### 状态更新与数据权威

- 临时任务 ID、加载动画和本地余额变化属于即时 UI 反馈；
- 真实任务 ID、任务状态、生成结果和实际积分消耗来自后端；
- 创建接口成功后，前端使用真实任务替换本地临时任务；
- 每轮轮询使用服务端任务列表整体替换当前列表，使后续状态逐渐收敛到后端结果；
- 前端不会因为超时自行宣布任务失败。

### 当前实现存在的一处竞态边界

临时任务的状态是 `running`，因此插入后会立即让 `pendingKey` 非空并启动轮询。如果创建任务接口响应超过 2.5 秒，而此时轮询接口返回的服务端列表还没有新任务，`setTasks(data.tasks)` 会先移除临时任务。稍后创建接口成功时，下面的 `map` 已经找不到 `pendingId`，真实任务也不会通过这次更新重新插入：

```tsx
setTasks((current) => current.map((item) => (item.id === pendingId ? task : item)));
```

更稳妥的实现可以任选一种：

1. 临时任务使用独立的 `submitting` 状态，不让它进入轮询条件；
2. 创建成功时先查找 `pendingId`，存在则替换，不存在则插入真实任务；
3. 轮询合并服务端列表时保留尚未确认的本地临时任务；
4. 等创建接口返回真实任务 ID 后再启动轮询。

这属于从当前源码能识别出的改进点。简历可以描述已经实现的乐观占位和轮询，但面试被问到极端并发场景时，说明该边界和改法会比笼统声称“完全解决一致性”更可靠。

历史记录页还使用 [`src/features/history/task-poller.tsx`](./src/features/history/task-poller.tsx) 对单个未完成任务进行轮询。任务进入终态后刷新页面，从服务端重新取得完整生成结果和历史数据。

### 面试简述

> 创建任务后我先插入乐观占位任务，接口成功再替换成真实任务，失败则回写失败状态。只要当前会话存在 queued 或 running 任务，effect 就每 2.5 秒拉取一次最新列表；采用递归 setTimeout 避免请求重叠，任务进入成功或失败终态后停止，并在切换会话或卸载时清理计时器，防止旧请求污染当前状态。

### 可以继续优化的方向

面试官如果追问，可以说明当前轮询方案适合现有规模，还可以继续增加：

- 页面不可见时暂停轮询；
- 连续失败后的指数退避和最大重试次数；
- 使用 `AbortController` 主动取消旧请求；
- 任务量和实时性要求提高后切换到 SSE 或 WebSocket。

这些属于优化方向，不要表述成当前已经实现。

---

## 7. Tailwind CSS 4、CSS Modules 与响应式界面

### 简历表述

> 使用 Tailwind CSS 4、CSS Modules 和设计令牌构建响应式创作界面，并通过统一样式基础设施降低页面样式冲突与重复。

### 样式分层

全局入口 [`src/style/index.css`](./src/style/index.css) 引入 Tailwind CSS 4，并继续加载项目样式：

```css
@import "tailwindcss";
@import "./tokens.css";
@import "./base.css";
@import "./components/buttons.css";
@import "./components/forms.css";
```

样式职责分为三层：

1. Tailwind CSS 用于通用原子类和页面快速布局；
2. `src/style/tokens.css` 定义颜色、字体和阴影等全局设计令牌，并通过 `@theme inline` 接入 Tailwind；
3. 页面私有复杂样式使用 CSS Modules，例如 [`generate-form.module.css`](./src/features/generation/generate-form.module.css)，避免类名污染。

`tokens.css` 同时提供亮色和暗色变量，组件使用 `var(--background)`、`var(--line)`、`var(--foreground)` 等语义变量，不直接散落重复色值。

生成工作台使用稳定的 BEM 风格模块类名，并通过 Grid、Flex、固定工具尺寸、文本截断、滚动容器和媒体查询处理桌面与移动端布局。会话标题通过 `min-width: 0`、`text-overflow: ellipsis` 和 `white-space: nowrap` 防止长文本撑破布局。

图标统一使用 `lucide-react`，条件类名使用 `clsx`，例如工作台侧栏折叠状态和移动端面板状态。

### 响应式工作台的具体思路

工作台从移动端单栏开始设计。桌面宽度达到 1024px 后，布局切换为两列：

```css
@media (min-width: 1024px) {
  .generateForm__layout {
    grid-template-columns: 14.5rem minmax(0, 1fr);
  }

  .generateForm__layoutCollapsed {
    grid-template-columns: 0 minmax(0, 1fr);
  }
}
```

`minmax(0, 1fr)` 和工作区的 `min-width: 0` 很重要：Grid 子项默认可能被长内容撑开，显式允许主区域缩小后，长提示词和图片区域才能在容器内正确截断或滚动。

桌面端会话栏是固定网格列，移动端则变为 fixed overlay；设置面板在桌面端使用绝对定位 dock，在移动端使用最大 `86vw` 的抽屉。两种形态复用同一个 React `settingsPanel`，没有维护两套业务组件。

聊天区使用 `min-height: 0 + flex: 1 + overflow-y: auto`，使中间结果区独立滚动，而顶部工具和底部输入区保持稳定。生成参数使用固定的二列、三列、四列网格，按钮文字变化不会引起列宽抖动。

### 面试简述

> 样式上不是只使用一种方案：Tailwind 负责通用布局和原子样式，设计令牌统一颜色与字体，复杂工作台使用 CSS Modules 隔离私有样式。生成页通过 Grid/Flex、稳定尺寸、文本截断和媒体查询适配桌面与移动端，减少复杂工作台中的布局抖动和样式冲突。

---

## 8. 前端工程质量门禁

### 简历表述

> 基于 ESLint、Prettier、Next.js 路由类型检查、TypeScript、单元测试和生产构建建立前端质量门禁，并通过 GitHub Actions 在提交和合并阶段自动校验。

### 具体实现

[`package.json`](./package.json) 中的 `pnpm check` 串行执行：

```text
Prettier 格式检查
  -> ESLint 静态检查
  -> next typegen + tsc --noEmit
  -> Node.js 单元测试
  -> Next.js 生产构建
```

其中：

- `next typegen` 生成路由类型，再由 TypeScript 检查路由和业务代码；
- `tsc --noEmit` 只做类型检查，不产生构建文件；
- Node.js 内建测试覆盖积分、生成价格、媒体规则、订单状态等纯业务规则；
- `next build` 验证生产环境编译和服务端/客户端边界；
- `pnpm audit:prod` 检查高危生产依赖漏洞。

[`.github/workflows/ci.yml`](./.github/workflows/ci.yml) 会在 Pull Request 以及 `main`、`dev` 分支推送时运行同样的检查。`dev` 分支校验通过后还会构建容器镜像并进入部署流程。

### 当前测试覆盖到什么程度

测试主要覆盖适合提取为纯函数的业务规则，例如：

- 有效会话恢复和已删除会话回退；
- 图片 MIME 类型、单文件大小和数量常量；
- 分辨率展示映射；
- 积分、订单和充值状态等规则。

这里需要准确表述：当前仓库没有用组件测试完整模拟轮询时序，也没有端到端测试覆盖整个生成流程。因此可以说“为纯业务规则建立单元测试并通过生产构建门禁”，不应说“轮询和生成流程已有完整自动化测试”。

### 面试简述

> 本地用 pnpm check 统一执行格式、Lint、路由类型生成、TypeScript、单测和生产构建；CI 对 PR 及主干分支执行同一套门禁，避免本地可运行但生产构建失败的代码进入部署流程。

---

## 9. 五条项目工作的完整面试版本

下面是简历五条内容对应的口头展开，适合每条控制在 30 到 60 秒。

### 1. App Router 与创作工作台

> 我使用 Next.js App Router 和 React 19 实现 AI 图片生成工作台。服务端先取得模型、会话、积分和历史任务，客户端再处理提示词、参考图、模型参数和提交交互。模型切换时会根据后端返回的能力配置重新归一化比例、画质和数量，避免产生不支持的参数组合。

### 2. Server/Client Components 分层

> 页面和布局保留为 Server Components，用于服务端鉴权和首屏数据聚合；只有需要输入、上传、弹层、Cookie 和轮询的工作台使用 Client Component。这样既保留服务端获取数据的能力，也不会把 Java 接口和服务端依赖带到客户端。

### 3. Route Handlers BFF

> 浏览器只访问同源 API。Route Handler 统一做登录校验、Zod 参数校验和资源归属检查，再通过 facade 调用 Java 服务。Java 的状态和字段会映射成前端统一 DTO，请求工具统一识别 HTTP 失败和业务码失败，组件只处理稳定的数据结构。

### 4. 任务轮询

> AI 生成是异步任务。提交后先展示乐观占位任务，再通过 React effect 每 2.5 秒同步 queued 和 running 任务。轮询使用递归 setTimeout 避免请求重叠，进入 succeeded 或 failed 后停止，并在切换会话或卸载时清理计时器。

### 5. 样式与工程化

> 样式上使用 Tailwind、设计令牌和 CSS Modules 分层管理，复杂工作台通过响应式 Grid/Flex、固定控件尺寸和文本截断适配桌面与移动端。工程上通过 Prettier、ESLint、TypeScript、单测和生产构建组成 CI 门禁。

---

## 10. 常见面试追问与回答思路

### 为什么不用 WebSocket，而是轮询？

> 当前任务状态只有排队、生成中、成功和失败，更新频率不高，2.5 秒轮询的实现成本和运维复杂度更低，也能够满足用户对生成进度的感知。代码只在存在未完成任务时轮询，并在终态停止。若后续任务量增大、需要细粒度进度或服务端主动推送，再考虑 SSE 或 WebSocket。

### 为什么不用 React Query/SWR？

> 当前工作台的请求与会话、乐观任务、参数和积分状态绑定较深，而且轮询只集中在一个页面，所以先用 React Hooks 明确控制生命周期。若后续多个页面共享任务缓存、需要统一重试、失焦刷新和请求去重，可以引入 React Query 或 SWR，把服务端状态与本地表单状态进一步分开。

### TypeScript 已经有类型，为什么还用 Zod？

> TypeScript 只保证编译期调用方式，网络请求、Cookie 和 FormData 在运行时仍是不可信输入。Route Handler 用 Zod 校验浏览器入参，Java adapter 也把后端响应先当作 unknown 再解析，这样错误能在系统边界被发现，而不是进入组件后才以 undefined 的形式暴露。

### 为什么需要 BFF，浏览器直接调 Java 不行吗？

> 直接调用会让浏览器感知 Java 地址、响应 envelope 和字段命名，还需要分别处理跨域、Cookie 和错误。BFF 把鉴权、资源归属、运行时校验和协议映射集中在服务端，组件只依赖同源 API 和统一 DTO；同时 Server Component 也能复用同一业务 facade。

### 乐观更新失败后如何保证一致性？

> 乐观更新只创建临时的“生成中”展示，不生成最终结果。创建成功后用后端任务替换，失败则把临时任务标记为失败；后续轮询仍以服务端列表为准。积分也使用后端返回的 costCredits 更新，前端 estimate 只用于提交前提示。当前代码在创建请求特别慢时还存在临时任务被轮询提前覆盖的边界，更稳妥的方式是创建成功后执行“存在则替换、不存在则插入”，或拿到真实任务 ID 后再启动轮询。

### 快速切换会话会不会出现旧请求覆盖新页面？

> 初始化恢复会话使用 selectionVersionRef 和 disposed 标记识别过期结果，轮询在 activeId 变化时会执行 effect cleanup 并清理计时器。当前实现还没有给所有 fetch 接入 AbortController，这是可以继续加强的地方；如果交互频率进一步提高，我会为会话切换请求增加版本校验或主动取消。

### React 19 在这里具体用了什么？

> 项目运行在 React 19.2，但创作工作台核心使用的是 useState、useEffect、useRef 和服务端的 cache 等稳定能力。简历中的 React 19 表示实际项目版本，不应宣称使用了某个代码中不存在的 React 19 独占特性。

### 这个方案最值得强调的点是什么？

> 最值得强调的不是技术名词数量，而是把异步 AI 生成业务拆成了明确的数据边界和生命周期：服务端聚合首屏、客户端编排交互、BFF 校验和适配协议、轮询收敛最终状态，并明确后端才是任务和积分的权威来源。

---

## 11. 面试时需要避免的过度表述

- 不要说“实现了实时通信”。当前核心方案是 2.5 秒轮询，不是 WebSocket 或 SSE。
- 不要说“前端完成积分扣减”。前端只做价格展示和交互反馈，真实扣费以后端返回的 `costCredits` 和后端事务为准。
- 不要说“客户端校验保证了上传安全”。客户端校验改善体验，真正的输入边界是 Route Handler 和存储服务端。
- 不要把 BFF 说成独立后端服务。它是当前 Next.js 应用中的 Route Handlers 和服务端 facade。
- 不要承诺没有数据支持的性能提升百分比。可以准确说明减少了客户端初始化请求、统一了协议和降低了组件耦合。

## 12. 建议重点记忆的源码入口

| 技术点                     | 主要文件                                                                                                 |
| -------------------------- | -------------------------------------------------------------------------------------------------------- |
| 创作页首屏数据             | [`src/app/(product)/generate/page.tsx`](<./src/app/(product)/generate/page.tsx>)                         |
| 客户端工作台与轮询         | [`src/features/generation/generate-form.tsx`](./src/features/generation/generate-form.tsx)               |
| 参数配置面板               | [`src/features/generation/generation-settings.tsx`](./src/features/generation/generation-settings.tsx)   |
| 提示词与上传入口           | [`src/features/generation/prompt-composer.tsx`](./src/features/generation/prompt-composer.tsx)           |
| 任务状态与结果展示         | [`src/features/generation/task-preview.tsx`](./src/features/generation/task-preview.tsx)                 |
| 生成参数与任务类型         | [`src/types/generation.ts`](./src/types/generation.ts)                                                   |
| 参数联动与视图模型         | [`src/features/generation/generation-model.ts`](./src/features/generation/generation-model.ts)           |
| 浏览器生成 API             | [`src/api/generation/tasks.ts`](./src/api/generation/tasks.ts)                                           |
| 创建生成任务 Route Handler | [`src/app/api/generations/route.ts`](./src/app/api/generations/route.ts)                                 |
| 积分预估 Route Handler     | [`src/app/api/generations/estimate/route.ts`](./src/app/api/generations/estimate/route.ts)               |
| 文件上传 Route Handler     | [`src/app/api/media/upload/route.ts`](./src/app/api/media/upload/route.ts)                               |
| 生成业务 facade            | [`src/server/bff/generation.ts`](./src/server/bff/generation.ts)                                         |
| Java 生成协议适配          | [`src/server/bff/internal/java-generation.ts`](./src/server/bff/internal/java-generation.ts)             |
| SSR 登录与权限             | [`src/server/auth.ts`](./src/server/auth.ts)                                                             |
| Route Handler 统一响应     | [`src/server/http.ts`](./src/server/http.ts)                                                             |
| JSON/FormData 运行时校验   | [`src/server/validation.ts`](./src/server/validation.ts)                                                 |
| 浏览器统一请求             | [`src/utils/request.ts`](./src/utils/request.ts)                                                         |
| 媒体格式与大小规则         | [`src/utils/media.ts`](./src/utils/media.ts)                                                             |
| 设计令牌                   | [`src/style/tokens.css`](./src/style/tokens.css)                                                         |
| 工作台响应式样式           | [`src/features/generation/generate-form.module.css`](./src/features/generation/generate-form.module.css) |
| CI 质量门禁                | [`.github/workflows/ci.yml`](./.github/workflows/ci.yml)                                                 |

---

## 13. 登录认证与前后端联调

### 13.1 项目采用的登录技术

当前项目采用“邮箱密码登录 + Java 后端会话 + HttpOnly Cookie + Next.js BFF”的方案，技术组成如下：

```text
Next.js App Router
  + React Client Component
  + Fetch 同源请求封装
  + Next.js Route Handler BFF
  + Zod 运行时参数校验
  + Java 后端账号密码校验
  + HttpOnly Cookie 会话
  + SSR 鉴权与服务端 RBAC 权限校验
```

准确地说，前端代码并没有解码或保存 JWT。前端只识别 Java 登录返回的会话 Cookie zroimg_user_token，具体 Cookie 内部是 JWT、随机会话 ID 还是其他令牌，应以 Java 后端实现为准，面试时不要无依据地说成“前端使用 JWT”。

前端也不会把 token 写入 localStorage。登录成功后，浏览器保存服务端通过 Set-Cookie 返回的会话 Cookie，后续请求由浏览器自动携带。

### 13.2 登录完整请求链路

用户在登录页提交邮箱和密码后的完整链路是：

```text
用户填写邮箱和密码
  -> LoginForm 受控表单收集状态
  -> authApi.loginWithEmail({ email, password })
  -> request() 使用 fetch 请求同源 /api/auth/sign-in/email
  -> Next.js Route Handler 接收 POST
  -> request.clone() + Zod 校验邮箱和密码
  -> 服务端限流检查
  -> proxyRequestToJavaApi(request, "/auth/user/sign-in")
  -> Java 后端校验账号、密码和账号状态
  -> Java 返回用户信息，并通过 Set-Cookie 写入 zroimg_user_token
  -> Next.js BFF 将响应和 Set-Cookie 传回浏览器
  -> request() 解析 Java 响应
  -> LoginForm 根据 role 跳转 /dashboard 或 /admin
  -> router.refresh() 让 Server Components 重新读取会话
```

可以按三层理解：

| 层级           | 主要代码                                             | 责任                                        |
| -------------- | ---------------------------------------------------- | ------------------------------------------- |
| 浏览器层       | LoginForm、authApi、request                          | 采集表单、发起同源请求、展示加载和错误状态  |
| Next.js BFF 层 | app/api/auth/sign-in/email/route.ts、java-api.ts     | 输入校验、限流、代理、Cookie 转发和错误边界 |
| Java 服务层    | /auth/user/sign-in、/auth/user/me、/auth/user/logout | 校验凭证、创建或销毁会话、返回真实用户数据  |

浏览器不需要知道 Java 的域名、接口路径、后端字段细节，也不接触 JAVA_API_BASE_URL。

### 13.3 第一步：确定前后端接口契约

联调前先确认请求字段、响应 envelope、Cookie 名称和失败状态码。否则可能出现“登录接口返回 200，但刷新页面仍然未登录”的问题。

#### 登录请求

浏览器请求 Next.js BFF：

```http
POST /api/auth/sign-in/email
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

Next.js 转发给 Java：

```http
POST {JAVA_API_BASE_URL}/auth/user/sign-in
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

Java 成功响应需要和前端类型约定保持一致，例如：

```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "user": {
      "id": "user-id",
      "username": "小明",
      "email": "user@example.com",
      "role": "user"
    }
  }
}
```

同时响应头需要包含会话 Cookie：

```http
Set-Cookie: zroimg_user_token=...; Path=/; HttpOnly; SameSite=Lax
```

其中 Cookie 的 Domain、过期时间和 Secure 属性由 Java 后端会话策略决定。开发联调时要保证 Cookie 能被当前前端域名正确接收；生产环境使用 HTTPS 时应设置 Secure。

#### 当前用户请求

登录后，Next.js 服务端根据请求 Cookie 调用 Java：

```http
GET {JAVA_API_BASE_URL}/auth/user/me
Cookie: zroimg_user_token=...
```

Java 返回用户资料，Next.js 使用 Zod 校验后转换为应用内部用户模型。页面使用的是 current.profile 和 current.user，而不是 Java 原始响应。

#### 退出登录请求

```http
POST /api/auth/logout
Cookie: zroimg_user_token=...
```

BFF 转发到 Java 的 /auth/user/logout。Java 应使会话失效，并通过 Set-Cookie 清理或覆盖会话 Cookie。

### 13.4 第二步：配置前端到 Java 的连接地址

项目通过服务端环境变量配置 Java 地址：

```dotenv
# .env.local
JAVA_API_BASE_URL=http://localhost:8080
```

对应代码在 [src/server/env.ts](./src/server/env.ts)：

```ts
import "server-only";

function readServerEnv(name: string) {
  return process.env[name]?.trim() || "";
}

export const serverEnv = {
  javaApiBaseUrl: readServerEnv("JAVA_API_BASE_URL"),
};

export function isJavaAuthEnabled() {
  return true;
}
```

这里有三个重要设计：

1. JAVA_API_BASE_URL 没有 NEXT_PUBLIC_ 前缀，因此不会被打包暴露给浏览器。
2. isJavaAuthEnabled() 当前固定返回 true，真实登录走 Java 后端。
3. Mock 登录代码仍存在于 Route Handler 中，但只是开发期兼容结构；Java 不可用时不能在生产环境静默切回 Mock。

服务端代理统一拼接 Java URL：

```ts
function normalizeJavaApiBaseUrl() {
  const value = serverEnv.javaApiBaseUrl;
  if (!value) return "";
  return value.replace(/\/+$/, "");
}

function buildJavaApiUrl(path: string) {
  const baseUrl = normalizeJavaApiBaseUrl();
  if (!baseUrl) {
    throw new Error("JAVA_API_BASE_URL 未配置");
  }

  return baseUrl + (path.startsWith("/") ? path : "/" + path);
}
```

这样 Java 地址只在服务端读取，浏览器端代码只出现 /api/auth/sign-in/email。

### 13.5 第三步：定义前端登录类型

[src/types/auth.ts](./src/types/auth.ts) 定义了登录请求和页面需要的用户字段：

```ts
type AuthUser = {
  id: string;
  username: string;
  email: string;
  role: "user" | "admin";
};

type LoginWithEmailRequest = {
  email: string;
  password: string;
};

type LoginWithEmailResponse = {
  message: string;
  user: AuthUser;
};
```

role 使用 user 或 admin 联合类型，有两个作用：

- 登录成功后的跳转逻辑只能处理项目支持的角色；
- 如果后端增加 operator，TypeScript 会提醒登录跳转和权限逻辑需要同步调整。

TypeScript 只解决编译期问题，不能证明网络响应真实符合这个结构。因此服务端恢复用户时仍使用 Zod 做运行时校验。

### 13.6 第四步：封装浏览器端认证 API

[src/api/auth/email-auth.ts](./src/api/auth/email-auth.ts) 只负责把业务函数映射到同源 API，不处理页面跳转、Toast 或组件状态：

```ts
import { request } from "@/utils/request";
import type {
  LoginWithEmailRequest,
  LoginWithEmailResponse,
  LogoutAccountResponse,
} from "@/types/auth";

function loginWithEmail(data: LoginWithEmailRequest) {
  return request<LoginWithEmailResponse>({
    url: "/api/auth/sign-in/email",
    method: "POST",
    data,
  });
}

function logoutAccount() {
  return request<LogoutAccountResponse>({
    url: "/api/auth/logout",
    method: "POST",
  });
}

export const authApi = {
  loginWithEmail,
  logoutAccount,
};
```

这一层隔离 URL 和组件。如果 BFF 路径变化，只修改 API 层，LoginForm 不需要感知路径变化。

### 13.7 第五步：登录表单使用受控组件

[src/features/auth/login-form.tsx](./src/features/auth/login-form.tsx) 声明 use client，因为它需要处理输入事件、提交事件、加载状态、定时器和客户端路由：

```tsx
"use client";

import { authApi } from "@/api/auth/email-auth";
import { getErrorMessage } from "@/utils/error";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setLoading] = useState(false);
}
```

表单是受控表单：

```tsx
<input
  type="email"
  value={email}
  onChange={(event) => setEmail(event.target.value)}
  required
/>

<input
  type="password"
  value={password}
  onChange={(event) => setPassword(event.target.value)}
  required
/>
```

value 由 React 状态控制，onChange 把输入写回状态。提交时使用状态构造请求：

```tsx
async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault();

  if (isLoading || isCoolingDown || Date.now() < cooldownUntilRef.current) {
    return;
  }

  startCooldown();

  try {
    setLoading(true);
    setMessage("");

    const data = await authApi.loginWithEmail({ email, password });
    const redirectTo = data.user.role === "admin" ? "/admin" : "/dashboard";

    router.push(redirectTo);
    router.refresh();
  } catch (error) {
    setMessage(getErrorMessage(error));
  } finally {
    setLoading(false);
  }
}
```

#### 为什么登录成功后同时使用 router.push() 和 router.refresh()

- router.push(redirectTo) 改变浏览器当前路由；
- router.refresh() 让 App Router 树中的 Server Components 重新执行，从 Cookie 和 Java /auth/user/me 获取最新用户信息。

登录响应中的 data.user 只适合完成当前次跳转。真正决定页面是否登录的是服务端会话，所以刷新服务端组件可以让顶部导航、产品布局和权限布局使用同一个权威结果。

#### loading 和短冷却的作用

isLoading 防止请求尚未返回时重复提交。代码还使用 isCoolingDown 和 cooldownUntilRef 做 1.5 秒短冷却：

```ts
const LOGIN_COOLDOWN_MS = 1500;
const cooldownUntilRef = useRef(0);

function startCooldown() {
  cooldownUntilRef.current = Date.now() + LOGIN_COOLDOWN_MS;
  setCoolingDown(true);

  cooldownTimerRef.current = setTimeout(() => {
    setCoolingDown(false);
    cooldownTimerRef.current = null;
  }, LOGIN_COOLDOWN_MS);
}
```

这个冷却只改善浏览器端重复点击体验，不能替代服务端限流。组件卸载时会清理定时器，避免卸载后的异步回调继续更新状态。

### 13.8 第六步：Route Handler 作为登录 BFF 入口

[src/app/api/auth/sign-in/email/route.ts](./src/app/api/auth/sign-in/email/route.ts) 中导出的 POST 函数就是登录 HTTP 入口。Route Handler 使用 Web 标准的 Request 和 Response API，可以读取请求体和请求头并返回 HTTP 响应。

#### 1. 使用 Zod 校验登录参数

```ts
const signInSchema = z.object({
  email: z
    .string()
    .trim()
    .email("邮箱格式不正确")
    .transform((value) => value.toLowerCase()),
  password: z.string().min(1, "请输入密码").max(128, "密码格式不正确"),
});
```

校验不只是为了表单提示。Route Handler 是公开 HTTP 入口，任何客户端都可以绕过页面直接调用它，因此服务端必须重新校验邮箱格式、密码长度并统一邮箱大小写。

#### 2. 为什么使用 request.clone()

```ts
const parsed = await parseJson(request.clone(), signInSchema);
```

Request body 是可消费流。parseJson() 读取了请求体后，原始 request 的 body 可能已经不能再次读取；但 Java 代理还需要把完整请求体转发给后端，所以这里读取 request.clone()：

```text
request.clone() -> 给 Zod 解析和校验
原始 request   -> 保留给 proxyRequestToJavaApi 转发
```

如果直接把原始 request 传给 parseJson()，随后再把同一个 request 交给代理，可能出现请求体已读、Java 收不到邮箱和密码的问题。

#### 3. 服务端限流

```ts
const { email, password } = parsed.data;
const limit = consumeAuthRateLimit(request, "user-login", email);
if (!limit.ok) {
  const message = "登录请求过于频繁，请 " + limit.retryAfterSeconds + " 秒后再试";
  return jsonError(message, 429);
}
```

当前限流 key 由以下信息组成：

```text
登录场景 + 客户端 IP + 规范化后的邮箱
```

默认规则是 60 秒最多 5 次，超过后阻塞 60 秒，可以降低密码暴力尝试和接口刷请求风险。

需要准确说明部署边界：当前实现使用进程内 Map 保存记录，适合单实例开发或简单部署。多实例生产环境应把限流状态放进 Redis、网关或专门的认证服务，否则不同实例之间的计数无法共享。

#### 4. Java 模式下代理真实登录

```ts
if (isJavaAuthEnabled()) {
  return proxyRequestToJavaApi(request, "/auth/user/sign-in");
}
```

这表示 Next.js 不验证生产密码本身。密码校验、密码哈希比较、账号状态判断、登录审计和会话签发属于 Java 认证服务的职责。前端 BFF 主要负责约束输入格式、做入口限流、转发请求和返回结果。

这样避免在前端或 Next.js Mock Store 中维护生产账号密码，后端也可以统一管理其他客户端的认证规则。

#### 5. Mock 分支的含义

```ts
const bundle = findUserByEmail(email);
if (!bundle || bundle.user.password !== password) {
  return jsonError("邮箱或密码错误", 401);
}
if (bundle.profile.status !== "active") {
  return jsonError("账号已被禁用", 403);
}
```

这是开发期 Mock 分支。401 表示凭证错误或没有通过身份认证；403 表示用户身份存在，但账号被禁用或无权访问。当前 isJavaAuthEnabled() 固定返回 true，所以真实联调不会执行这个分支。

### 13.9 第七步：Java 代理如何转发请求和 Cookie

[src/server/java-api.ts](./src/server/java-api.ts) 中的 proxyRequestToJavaApi() 负责把 Next.js 收到的请求转给 Java：

```ts
export async function proxyRequestToJavaApi(
  request: Request,
  path: string,
  method = request.method,
) {
  try {
    const body = method === "GET" || method === "HEAD" ? undefined : await request.arrayBuffer();

    const response = await fetch(buildJavaApiUrl(path), {
      method,
      headers: buildForwardHeaders(request.headers),
      body,
      cache: "no-store",
    });

    return new Response(response.body, {
      status: response.status,
      headers: buildProxyResponseHeaders(response.headers),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Java 后端暂时不可用，请稍后重试",
        code: "JAVA_UNAVAILABLE",
      },
      { status: 502 },
    );
  }
}
```

#### 请求头白名单

代理不会无条件复制所有请求头，而是使用白名单：

```ts
const FORWARDED_REQUEST_HEADERS = [
  "authorization",
  "content-type",
  "cookie",
  "user-agent",
  "x-forwarded-for",
  "x-forwarded-proto",
  "x-real-ip",
  "x-request-id",
] as const;
```

登录场景最关键的是 content-type 和 cookie：

- content-type 告诉 Java 请求体是 JSON；
- cookie 让已经登录的会话可以继续访问退出登录和其他需要鉴权的接口。

#### 响应头中的 Set-Cookie

登录成功时 Java 通常通过响应头 Set-Cookie 写会话。BFF 必须把它传回浏览器：

```ts
const responseHeaders = source as Headers & {
  getSetCookie?: () => string[];
};

if (typeof responseHeaders.getSetCookie === "function") {
  for (const cookie of responseHeaders.getSetCookie()) {
    nextHeaders.append("set-cookie", cookie);
  }
}
```

如果只转发 JSON body 而丢掉 Set-Cookie，登录接口看起来可能返回成功，但浏览器没有会话；用户跳转到 /dashboard 后，服务端仍会把他当作未登录用户。

#### 为什么动态鉴权请求使用 cache: no-store

用户信息和会话状态是请求相关数据，不能被缓存错误地复用给其他用户。登录、当前用户、积分和任务等动态请求都应避免使用不合适的共享缓存。

### 13.10 第八步：浏览器请求层如何处理 Java 响应

虽然浏览器只请求 Next.js BFF，但 Java 的成功响应可能被原样代理回来。项目在 [src/utils/request.ts](./src/utils/request.ts) 统一识别两种 envelope：

```text
Next.js BFF：{ success: true, data: ... }
Java 后端： { code: 200, message: "...", data: ... }
```

Java 不能只看 HTTP 状态码，因为后端可能返回 HTTP 200，但业务 code 表示失败：

```ts
const failedByJavaCode = Boolean(javaResult && javaResult.code !== 200);

if (!response.ok || failedByEnvelope || failedByJavaCode) {
  throwApiError({
    message: readErrorMessage(payload, "请求失败"),
    code: resolveErrorCode(status, payload),
    status,
    url,
    method,
    payload,
  });
}
```

成功时，客户端请求层将 Java data 取出，并把 message 合并到对象中。于是 LoginForm 可以稳定地写：

```ts
const data = await authApi.loginWithEmail({ email, password });
const redirectTo = data.user.role === "admin" ? "/admin" : "/dashboard";
```

组件不需要判断 data.data.user、data.success 或 Java 的 code，协议差异被请求层吸收了。需要注意，request.ts 的泛型主要是编译期约束；登录响应的具体字段仍应由后端契约和服务端运行时校验共同保证。

### 13.11 第九步：服务端如何恢复登录用户

登录成功的关键不是前端状态里的 data.user，而是浏览器保存了会话 Cookie。后续请求到 Next.js 时，服务端从 Cookie 识别用户。

[src/server/auth.ts](./src/server/auth.ts) 定义 Java 会话 Cookie 名称：

```ts
export const JAVA_SESSION_COOKIE = "zroimg_user_token";
```

getJavaUser() 的核心思路如下，下面的 return 省略了项目中将 Java 用户转换为 current 对象的字段映射：

```ts
async function getJavaUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(JAVA_SESSION_COOKIE)?.value;

  if (!token) return null;

  const payload = await getJavaApiData<unknown>("/auth/user/me");
  const parsed = javaUserSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error("当前用户接口返回格式不正确");
  }

  const javaUser = parsed.data;
  return {
    user: {
      id: javaUser.id,
      email: javaUser.email,
      password: "",
      name: javaUser.username,
      createdAt: new Date(javaUser.createdAt),
    },
    profile: {
      id: javaUser.id,
      userId: javaUser.id,
      username: javaUser.username,
      role: javaUser.role,
      status: "active" as const,
      creditBalance: javaUser.totalPoints,
      bio: javaUser.bio ?? "",
      avatarUrl: javaUser.avatarUrl ?? null,
      createdAt: new Date(javaUser.createdAt),
    },
  };
}
```

实际源码中的 Java 模式还会根据 isMockBffEnabled() 决定是否复用 Mock profile；上面的代码只展示 Java 用户转成应用内部用户模型的核心字段。

项目实际代码还会捕获 Java /auth/user/me 返回的 401，把它视为未登录：

```ts
try {
  payload = await getJavaApiData<unknown>("/auth/user/me");
} catch (error) {
  if (error instanceof JavaApiError && error.status === 401) {
    return null;
  }

  throw error;
}
```

认证恢复分两步：

1. Cookie 不存在：直接认为未登录，避免无意义地请求 Java；
2. Cookie 存在但无效或过期：Java 返回 401，Next.js 仍认为当前用户未登录。

javaUserSchema 会验证后端返回的数据：

```ts
const javaUserSchema = z.object({
  id: javaIdSchema,
  username: z.string(),
  email: z.string(),
  bio: z.string().nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
  role: z.enum(["user", "admin"]),
  status: z.number(),
  totalPoints: z.number(),
  createdAt: z.string(),
});
```

这比直接写 payload as JavaUser 更可靠。后端字段缺失、类型错误或接口升级时，可以在服务端边界尽早暴露问题。

### 13.12 第十步：页面和接口都要做鉴权

#### 页面级鉴权

产品布局是 Server Component：

```tsx
import { requireUser } from "@/server/auth";

export default async function ProductLayout(props: ProductLayoutProps) {
  await requireUser();
  return (
    <ProductFrame topNav={<ProductTopNav autoOpenAnnouncement />}>{props.children}</ProductFrame>
  );
}
```

requireUser() 会取得当前用户，没有有效会话就重定向：

```ts
export async function requireUser() {
  const current = await getCurrentUserProfile();
  if (!current || current.profile.status !== "active") {
    redirect("/login");
  }
  return current;
}
```

管理后台在此基础上增加角色判断：

```ts
export async function requireAdmin() {
  const current = await requireUser();
  if (current.profile.role !== "admin") {
    redirect("/dashboard");
  }
  return current;
}
```

#### Route Handler 级鉴权

不能只依赖页面布局，因为用户可以绕过页面直接调用 /api。账户资料接口在处理写请求前再次检查：

```ts
const current = await getCurrentUserProfile();
if (!current) {
  return jsonError("请先登录", 401);
}
```

生成任务、收藏、上传、订单和账户修改接口都应在服务端验证当前用户及目标资源归属。前端隐藏按钮只能改善界面，不能构成权限控制。

### 13.13 第十一步：退出登录

前端账户菜单调用同一个浏览器 API：

```tsx
async function logout() {
  try {
    setLoggingOut(true);
    await authApi.logoutAccount();
  } finally {
    router.push("/login");
    router.refresh();
  }
}
```

finally 的意义是：即使网络请求报错，也回到登录页，避免用户停留在看起来已经登录、但会话实际失效的页面。更严格的产品实现还可以在失败时展示退出失败提示，并根据后端返回决定是否继续跳转。

真实 Java 模式下由 Java 负责会话销毁或 Cookie 清理；Mock 分支则由 NextResponse 将 Mock Cookie 的 maxAge 设为 0。

### 13.14 注册、验证码和密码重置与登录的关系

当前登录本身是邮箱密码登录，不包含滑块。滑块用于注册流程：

```text
POST /api/auth/slider-challenge
  -> 获取 challengeId 和 targetRatio

POST /api/auth/slider-token
  -> 提交 challengeId、positionRatio、durationMs
  -> 获取一次性 sliderToken

POST /api/auth/send-code
  -> 携带 email + sliderToken 获取邮箱验证码

POST /api/auth/register
  -> 携带 username、email、password、code 完成注册
```

密码重置则是：

```text
POST /api/auth/password-reset/send-code
  -> 获取重置验证码

POST /api/auth/password-reset
  -> 提交 email、code、新密码和确认密码
```

这些流程和登录采用相同的前端分层：features/auth/* 管理表单交互，api/auth/email-auth.ts 管理同源请求，app/api/auth/**/route.ts 作为 BFF 入口，Java 模式下转发到对应的 /auth/user/** 接口，request.ts 统一处理错误。

### 13.15 前后端具体联调流程

#### 阶段 A：准备 Java 后端

后端至少需要提供并确认：

```text
POST /auth/user/sign-in
GET  /auth/user/me
POST /auth/user/logout
```

同时确认：

- 登录请求字段是 email 和 password；
- 成功响应包含 code、message、data.user；
- data.user.role 是 user 或 admin；
- 成功响应通过 Set-Cookie 写入 zroimg_user_token；
- 未登录或会话过期返回 HTTP 401 或业务 code=401；
- 禁止登录的角色或账号状态返回 403；
- Java 服务允许 Next.js 服务端访问；
- Cookie 的 Domain、Path、SameSite、Secure 与部署域名匹配。

#### 阶段 B：启动前端

```bash
corepack enable
pnpm install
cp .env.example .env.local
```

在 .env.local 设置：

```dotenv
JAVA_API_BASE_URL=http://localhost:8080
```

然后启动：

```bash
pnpm dev
```

打开 http://localhost:3000/login。

#### 阶段 C：浏览器验证登录请求

打开浏览器开发者工具的 Network 面板，提交登录表单，重点检查：

1. 请求地址是 http://localhost:3000/api/auth/sign-in/email，而不是 Java 的 8080 地址；
2. Request Payload 是 email 和 password；
3. Response Status 是 200；
4. Response Body 能被 request.ts 识别为 Java 成功 envelope；
5. Application 面板中出现 zroimg_user_token；
6. 登录后跳转到 /dashboard，管理员跳转到 /admin；
7. 刷新页面后头像、用户名和受保护页面仍然存在。

如果第 4 项正确但第 5 项没有 Cookie，问题通常在 Java 的 Set-Cookie、BFF 响应头转发或 Cookie 域配置，而不是 React 表单。

#### 阶段 D：使用 curl 验证 BFF

让 curl 保存服务端返回的 Cookie：

```bash
curl -i -c /tmp/zroimg-cookies.txt \
  -X POST http://localhost:3000/api/auth/sign-in/email \
  -H 'Content-Type: application/json' \
  --data '{"email":"user@example.com","password":"password123"}'
```

查看 Cookie 文件：

```bash
cat /tmp/zroimg-cookies.txt
```

再带 Cookie 请求受保护页面：

```bash
curl -i -b /tmp/zroimg-cookies.txt \
  http://localhost:3000/dashboard
```

退出登录：

```bash
curl -i -b /tmp/zroimg-cookies.txt \
  -X POST http://localhost:3000/api/auth/logout
```

curl 可以帮助确认 Cookie 是否经过 BFF 返回，但最终还要以浏览器是否在当前域名保存 Cookie 为准。

#### 阶段 E：验证服务端权限

用未登录浏览器访问 /dashboard、/generate、/history、/favorites、/settings 和 /admin。

预期结果：

- 普通产品页面被 requireUser() 保护，未登录跳转 /login；
- /admin 需要 requireAdmin()，普通用户跳转 /dashboard；
- 即使手动调用生成、收藏或账户 API，Route Handler 仍返回 401/403，而不是只依赖页面按钮隐藏。

### 13.16 常见联调问题排查

#### 问题一：前端请求 404

检查 Route Handler 是否位于 src/app/api/auth/sign-in/email/route.ts，请求是否是 POST /api/auth/sign-in/email，以及修改文件后是否重启了 Next.js 开发服务。

#### 问题二：返回 502，提示 Java 后端不可用

检查 Java 服务是否启动，.env.local 中 JAVA_API_BASE_URL 是否正确，修改环境变量后是否重启前端，以及 Java 接口路径是否确实是 /auth/user/sign-in。

proxyRequestToJavaApi() 会把连接异常转换为 502 和 JAVA_UNAVAILABLE，不会把网络异常伪装成“邮箱或密码错误”。

#### 问题三：Java 返回 200，但前端进入 catch

检查响应 JSON 的 code。项目会把 Java code 不等于 200 判为失败，即使 HTTP 是 200：

```json
{
  "code": 401,
  "message": "邮箱或密码错误"
}
```

这是业务码和 HTTP 状态码不一致导致的，需要和后端统一约定，不能在前端只判断 response.ok。

#### 问题四：登录成功后马上回到登录页

按顺序排查：

1. Java 是否返回了 Set-Cookie；
2. BFF 是否转发了 Set-Cookie；
3. Cookie 名称是否是 zroimg_user_token；
4. Cookie 的 Domain、Path、SameSite、Secure 是否允许浏览器在 localhost:3000 保存；
5. Next.js 服务端调用 /auth/user/me 时是否把 Cookie 转发给 Java；
6. Java /auth/user/me 是否返回 401；
7. javaUserSchema 是否能解析后端返回字段。

#### 问题五：普通用户能打开管理员页面

检查 src/app/admin/layout.tsx 是否调用 requireAdmin()，并确认管理员判断在服务端执行。不能只通过客户端导航菜单隐藏管理员入口。

#### 问题六：密码出现在 localStorage

这是错误实现。当前登录表单只把密码放在 React 内存中，发送给 HTTPS 下的 BFF；成功后不会写入 localStorage、sessionStorage 或 URL。浏览器只保存服务端下发的会话 Cookie。

### 13.17 这个登录方案的优点和边界

优点：

- 浏览器只依赖同源 API，减少跨域和多环境 Java 地址配置；
- Java 地址和后端认证细节留在服务端；
- Cookie 会话不暴露给 JavaScript，降低 XSS 直接读取 token 的风险；
- router.refresh() 与 Server Components 配合，可以在登录后重新获得服务端用户状态；
- Route Handler 可以集中处理校验、限流、错误码和审计；
- 页面鉴权和接口鉴权都在服务端执行；
- Java 返回结构变化可以在 BFF 或请求层集中适配。

边界和改进方向：

- HttpOnly 不能阻止所有 CSRF，写操作还应结合 SameSite、Origin/Referer 校验或 CSRF Token；
- 当前进程内登录限流不适合多实例生产环境，应迁移到 Redis、网关或认证服务；
- Java 的密码校验、密码哈希、会话失效和 Cookie 过期必须由后端保证；
- 生产必须使用 HTTPS，Cookie 应设置 Secure，并配置合理的过期和注销策略；
- 后端接口契约稳定后，可以用 OpenAPI 生成共享类型和客户端，减少手写字段偏差。

### 13.18 面试中的完整回答

> 这个项目的登录采用邮箱密码认证，前端使用 React 19 Client Component 实现受控表单和登录状态，浏览器通过 Fetch 请求同源的 Next.js Route Handler。Route Handler 使用 Zod 做运行时参数校验，并进行服务端限流，然后通过 BFF 将请求转发给 Java 的认证接口。Java 后端负责账号密码校验和会话签发，通过 HttpOnly Cookie 保存登录态，前端不把 token 写入 localStorage。登录成功后前端根据后端返回的 role 跳转用户端或管理端，并通过 router.refresh() 让 Server Components 重新读取 Cookie 和 /auth/user/me。产品布局使用 requireUser()，管理后台使用 requireAdmin()，API 端点也独立校验当前会话，保证不能只靠前端隐藏按钮做权限控制。

### 13.19 面试追问简答

**问：为什么不把 token 放 localStorage？**

> localStorage 中的 token 能被页面 JavaScript 读取，XSS 一旦发生，攻击脚本更容易直接窃取会话。这里使用 HttpOnly Cookie，让浏览器自动携带会话，前端只通过登录结果和页面状态感知登录，不直接读取 token。

**问：HttpOnly Cookie 是不是绝对安全？**

> 不是。它主要防止 JavaScript 直接读取 Cookie，不能替代 HTTPS、输入输出防护、CSP 和 CSRF 防护。项目使用 SameSite，生产还应做 Origin 校验或 CSRF Token。

**问：为什么要有 Next.js BFF？**

> BFF 让浏览器只依赖同源接口，集中处理 Zod 校验、限流、Cookie 转发和 Java 错误适配。组件不需要知道 Java 域名、后端接口路径和响应 envelope，后端协议变化时修改 BFF 即可。

**问：登录成功后为什么还要请求 /auth/user/me？**

> 登录响应中的用户信息只适合完成当前次跳转；刷新页面或服务端渲染时，Next.js 需要根据 Cookie 向 Java 验证会话并获取权威用户资料。/auth/user/me 是会话恢复入口，不能只依赖客户端内存状态。

**问：登录接口为什么需要 request.clone()？**

> Request body 是可消费流。Route Handler 需要先读取 body 做 Zod 校验，同时还要把原始 body 转给 Java。读取 clone 可以把校验和转发分开，避免原始请求体提前被消费。

**问：普通用户可以自己调用 /admin 或管理员 API 吗？**

> 可以尝试发请求，但不能通过服务端校验。页面由 requireAdmin() 保护，管理员 API 还应检查当前用户角色；前端导航隐藏只是体验层，不能作为授权依据。

### 13.20 需要记住的源码入口

| 技术点                      | 文件                                                                                 |
| --------------------------- | ------------------------------------------------------------------------------------ |
| 登录页                      | [src/app/login/page.tsx](./src/app/login/page.tsx)                                   |
| 登录表单和跳转              | [src/features/auth/login-form.tsx](./src/features/auth/login-form.tsx)               |
| 浏览器认证 API              | [src/api/auth/email-auth.ts](./src/api/auth/email-auth.ts)                           |
| 登录请求类型                | [src/types/auth.ts](./src/types/auth.ts)                                             |
| 登录 BFF Route Handler      | [src/app/api/auth/sign-in/email/route.ts](./src/app/api/auth/sign-in/email/route.ts) |
| 登出 BFF Route Handler      | [src/app/api/auth/logout/route.ts](./src/app/api/auth/logout/route.ts)               |
| Java 请求代理和 Cookie 转发 | [src/server/java-api.ts](./src/server/java-api.ts)                                   |
| 当前用户和会话恢复          | [src/server/auth.ts](./src/server/auth.ts)                                           |
| 服务端环境变量              | [src/server/env.ts](./src/server/env.ts)                                             |
| JSON 运行时校验             | [src/server/validation.ts](./src/server/validation.ts)                               |
| 客户端统一请求和错误处理    | [src/utils/request.ts](./src/utils/request.ts)                                       |
| 产品页面鉴权                | [src/app/(product)/layout.tsx](<./src/app/(product)/layout.tsx>)                     |
| 管理员鉴权                  | [src/app/admin/layout.tsx](./src/app/admin/layout.tsx)                               |
