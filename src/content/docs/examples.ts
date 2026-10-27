import { openApiBaseUrl, placeholderApiKey } from "@/lib/open-api";

// 开放 API 的代码示例。示例代码与语言无关，所有语言的文档共用；正文里用 `::: example <key>` 引用。
// 示例必须可以直接复制运行：只需把占位密钥换成真实密钥。

type CodeLanguage = "curl" | "python" | "javascript";

type CodeExample = Partial<Record<CodeLanguage, string>>;

const apiUrl = `${openApiBaseUrl}/open/v1`;
const key = placeholderApiKey;

const balance: CodeExample = {
  curl: `curl ${apiUrl}/balance \\
  -H "Authorization: Bearer ${key}"`,
  python: `import requests

API_KEY = "${key}"

response = requests.get(
    "${apiUrl}/balance",
    headers={"Authorization": f"Bearer {API_KEY}"},
    timeout=30,
)
response.raise_for_status()
print(response.json())  # {"points": 1280}`,
  javascript: `const API_KEY = "${key}";

const response = await fetch("${apiUrl}/balance", {
  headers: { Authorization: "Bearer " + API_KEY },
});
if (!response.ok) throw new Error(await response.text());
console.log(await response.json()); // { points: 1280 }`,
};

const listModels: CodeExample = {
  curl: `curl ${apiUrl}/models \\
  -H "Authorization: Bearer ${key}"`,
  python: `import requests

API_KEY = "${key}"

response = requests.get(
    "${apiUrl}/models",
    headers={"Authorization": f"Bearer {API_KEY}"},
    timeout=30,
)
response.raise_for_status()
for model in response.json()["data"]:
    print(model["id"], model["type"], model["pricing"])`,
  javascript: `const API_KEY = "${key}";

const response = await fetch("${apiUrl}/models", {
  headers: { Authorization: "Bearer " + API_KEY },
});
if (!response.ok) throw new Error(await response.text());
const { data } = await response.json();
for (const model of data) {
  console.log(model.id, model.type, model.pricing);
}`,
};

const imagesSubmit: CodeExample = {
  curl: `curl ${apiUrl}/images/generations \\
  -H "Authorization: Bearer ${key}" \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: $(uuidgen)" \\
  -d '{
    "model": "gpt-image-2",
    "prompt": "A red fox sitting in a snowy pine forest at dawn, soft light, 35mm photo",
    "mode": "text_to_image",
    "ratio": "16:9",
    "quality": "medium",
    "n": 1
  }'`,
  python: `import uuid
import requests

API_KEY = "${key}"

response = requests.post(
    "${apiUrl}/images/generations",
    headers={
        "Authorization": f"Bearer {API_KEY}",
        "Idempotency-Key": str(uuid.uuid4()),
    },
    json={
        "model": "gpt-image-2",
        "prompt": "A red fox sitting in a snowy pine forest at dawn, soft light, 35mm photo",
        "mode": "text_to_image",
        "ratio": "16:9",
        "quality": "medium",
        "n": 1,
    },
    timeout=30,
)
response.raise_for_status()
task = response.json()
print(task["id"], task["status"], task["cost_points"])`,
  javascript: `const API_KEY = "${key}";

const response = await fetch("${apiUrl}/images/generations", {
  method: "POST",
  headers: {
    Authorization: "Bearer " + API_KEY,
    "Content-Type": "application/json",
    "Idempotency-Key": crypto.randomUUID(),
  },
  body: JSON.stringify({
    model: "gpt-image-2",
    prompt: "A red fox sitting in a snowy pine forest at dawn, soft light, 35mm photo",
    mode: "text_to_image",
    ratio: "16:9",
    quality: "medium",
    n: 1,
  }),
});
if (!response.ok) throw new Error(await response.text());
const task = await response.json();
console.log(task.id, task.status, task.cost_points);`,
};

const imagesEdit: CodeExample = {
  curl: `curl ${apiUrl}/images/generations \\
  -H "Authorization: Bearer ${key}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-image-2",
    "prompt": "Turn this photo into a watercolor illustration",
    "mode": "image_to_image",
    "ratio": "1:1",
    "image_urls": ["https://example.com/photo.png"]
  }'`,
  python: `import requests

API_KEY = "${key}"

response = requests.post(
    "${apiUrl}/images/generations",
    headers={"Authorization": f"Bearer {API_KEY}"},
    json={
        "model": "gpt-image-2",
        "prompt": "Replace the masked area with a vase of sunflowers",
        "mode": "inpaint",
        "image_urls": ["https://example.com/room.png"],
        "mask_url": "https://example.com/room-mask.png",
    },
    timeout=30,
)
response.raise_for_status()
print(response.json()["id"])`,
  javascript: `const API_KEY = "${key}";

const response = await fetch("${apiUrl}/images/generations", {
  method: "POST",
  headers: {
    Authorization: "Bearer " + API_KEY,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "gpt-image-2",
    prompt: "Turn this photo into a watercolor illustration",
    mode: "image_to_image",
    ratio: "1:1",
    image_urls: ["https://example.com/photo.png"],
  }),
});
if (!response.ok) throw new Error(await response.text());
console.log((await response.json()).id);`,
};

const videosSubmit: CodeExample = {
  curl: `curl ${apiUrl}/videos/generations \\
  -H "Authorization: Bearer ${key}" \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: $(uuidgen)" \\
  -d '{
    "model": "YOUR_VIDEO_MODEL_ID",
    "prompt": "A paper boat drifting down a rainy street, slow motion, cinematic",
    "mode": "text_to_video",
    "duration": 8,
    "ratio": "16:9"
  }'`,
  python: `import uuid
import requests

API_KEY = "${key}"
VIDEO_MODEL = "YOUR_VIDEO_MODEL_ID"  # an id with type "video" from GET /models

response = requests.post(
    "${apiUrl}/videos/generations",
    headers={
        "Authorization": f"Bearer {API_KEY}",
        "Idempotency-Key": str(uuid.uuid4()),
    },
    json={
        "model": VIDEO_MODEL,
        "prompt": "A paper boat drifting down a rainy street, slow motion, cinematic",
        "mode": "image_to_video",
        "duration": 8,
        "ratio": "16:9",
        "image_urls": ["https://example.com/first-frame.png"],
    },
    timeout=30,
)
response.raise_for_status()
task = response.json()
print(task["id"], task["cost_points"])`,
  javascript: `const API_KEY = "${key}";
const VIDEO_MODEL = "YOUR_VIDEO_MODEL_ID"; // an id with type "video" from GET /models

const response = await fetch("${apiUrl}/videos/generations", {
  method: "POST",
  headers: {
    Authorization: "Bearer " + API_KEY,
    "Content-Type": "application/json",
    "Idempotency-Key": crypto.randomUUID(),
  },
  body: JSON.stringify({
    model: VIDEO_MODEL,
    prompt: "A paper boat drifting down a rainy street, slow motion, cinematic",
    mode: "text_to_video",
    duration: 8,
    ratio: "16:9",
  }),
});
if (!response.ok) throw new Error(await response.text());
const task = await response.json();
console.log(task.id, task.cost_points);`,
};

const taskGet: CodeExample = {
  curl: `curl ${apiUrl}/tasks/TASK_ID \\
  -H "Authorization: Bearer ${key}"`,
  python: `import requests

API_KEY = "${key}"
TASK_ID = "TASK_ID"  # the id returned when the task was submitted

response = requests.get(
    f"${apiUrl}/tasks/{TASK_ID}",
    headers={"Authorization": f"Bearer {API_KEY}"},
    timeout=30,
)
response.raise_for_status()
task = response.json()
print(task["status"], task["progress"], [item["url"] for item in task["data"]])`,
  javascript: `const API_KEY = "${key}";
const TASK_ID = "TASK_ID"; // the id returned when the task was submitted

const response = await fetch("${apiUrl}/tasks/" + TASK_ID, {
  headers: { Authorization: "Bearer " + API_KEY },
});
if (!response.ok) throw new Error(await response.text());
const task = await response.json();
console.log(task.status, task.progress, task.data.map((item) => item.url));`,
};

const taskList: CodeExample = {
  curl: `curl "${apiUrl}/tasks?limit=20&page=1&status=succeeded&type=image" \\
  -H "Authorization: Bearer ${key}"`,
  python: `import requests

API_KEY = "${key}"

page = 1
while True:
    response = requests.get(
        "${apiUrl}/tasks",
        headers={"Authorization": f"Bearer {API_KEY}"},
        params={"limit": 50, "page": page, "status": "succeeded"},
        timeout=30,
    )
    response.raise_for_status()
    result = response.json()
    for task in result["data"]:
        print(task["id"], task["type"], task["status"], task["created_at"])
    if not result["has_more"]:
        break
    page += 1`,
  javascript: `const API_KEY = "${key}";

for (let page = 1; ; page += 1) {
  const url = new URL("${apiUrl}/tasks");
  url.searchParams.set("limit", "50");
  url.searchParams.set("page", String(page));
  url.searchParams.set("status", "succeeded");

  const response = await fetch(url, {
    headers: { Authorization: "Bearer " + API_KEY },
  });
  if (!response.ok) throw new Error(await response.text());
  const result = await response.json();
  for (const task of result.data) {
    console.log(task.id, task.type, task.status, task.created_at);
  }
  if (!result.has_more) break;
}`,
};

const polish: CodeExample = {
  curl: `curl ${apiUrl}/prompts/polish \\
  -H "Authorization: Bearer ${key}" \\
  -H "Content-Type: application/json" \\
  -d '{"prompt": "a cat on a windowsill", "scene": "image"}'`,
  python: `import requests

API_KEY = "${key}"

response = requests.post(
    "${apiUrl}/prompts/polish",
    headers={"Authorization": f"Bearer {API_KEY}"},
    json={"prompt": "a cat on a windowsill", "scene": "image"},
    timeout=60,
)
response.raise_for_status()
result = response.json()
print(result["prompt"])
print("cost:", result["cost_points"], "balance:", result["balance"])`,
  javascript: `const API_KEY = "${key}";

const response = await fetch("${apiUrl}/prompts/polish", {
  method: "POST",
  headers: {
    Authorization: "Bearer " + API_KEY,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ prompt: "a cat on a windowsill", scene: "image" }),
});
if (!response.ok) throw new Error(await response.text());
const result = await response.json();
console.log(result.prompt);
console.log("cost:", result.cost_points, "balance:", result.balance);`,
};

const endToEnd: CodeExample = {
  python: `"""Generate an image with the ZroImg API and save the results.

pip install requests
"""
import time
import uuid

import requests

API_KEY = "${key}"
BASE_URL = "${apiUrl}"
HEADERS = {"Authorization": f"Bearer {API_KEY}"}


def call(method, path, **kwargs):
    """Send a request; wait and retry when the API answers 429."""
    headers = {**HEADERS, **kwargs.pop("headers", {})}
    for _ in range(5):
        response = requests.request(method, BASE_URL + path, headers=headers, timeout=30, **kwargs)
        if response.status_code != 429:
            break
        time.sleep(int(response.headers.get("Retry-After", "5")))
    if response.status_code >= 400:
        error = response.json()["error"]
        raise RuntimeError(f"{response.status_code} {error['code']}: {error['message']}")
    return response.json()


def submit(prompt):
    # Reuse the same Idempotency-Key if you retry this call: you are charged only once.
    idempotency_key = str(uuid.uuid4())
    return call(
        "POST",
        "/images/generations",
        headers={"Idempotency-Key": idempotency_key},
        json={"model": "gpt-image-2", "prompt": prompt, "ratio": "1:1", "quality": "medium", "n": 1},
    )


def wait(task_id, interval=4, timeout=900):
    deadline = time.time() + timeout
    while time.time() < deadline:
        task = call("GET", f"/tasks/{task_id}")
        if task["status"] == "succeeded":
            return task
        if task["status"] == "failed":
            # Points for failed tasks are refunded automatically.
            raise RuntimeError(f"task failed: {task['error']['message']}")
        progress = task.get("progress") or {}
        print(f"{task['status']} {progress.get('percent', '')}")
        time.sleep(interval)
    raise TimeoutError(f"task {task_id} is still running, check it again later")


if __name__ == "__main__":
    task = submit("An isometric cozy reading room, warm evening light, highly detailed")
    print(f"submitted {task['id']}, cost {task['cost_points']} points")

    result = wait(task["id"])
    for index, item in enumerate(result["data"]):
        # Result URLs are signed and expire after 24 hours: download them now.
        content = requests.get(item["url"], timeout=120).content
        filename = f"{task['id']}-{index}.png"
        with open(filename, "wb") as file:
            file.write(content)
        print("saved", filename)

    print("balance:", call("GET", "/balance")["points"])`,
  javascript: `// Generate an image with the ZroImg API and save the results.
// Node.js 18+ (built-in fetch). Save as generate.mjs and run: node generate.mjs
import { writeFile } from "node:fs/promises";

const API_KEY = "${key}";
const BASE_URL = "${apiUrl}";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Send a request; wait and retry when the API answers 429.
async function call(method, path, options = {}) {
  let response;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    response = await fetch(BASE_URL + path, {
      method,
      headers: {
        Authorization: "Bearer " + API_KEY,
        "Content-Type": "application/json",
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    if (response.status !== 429) break;
    await sleep(Number(response.headers.get("Retry-After") ?? 5) * 1000);
  }
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(response.status + " " + payload.error.code + ": " + payload.error.message);
  }
  return payload;
}

async function submit(prompt) {
  // Reuse the same Idempotency-Key if you retry this call: you are charged only once.
  const idempotencyKey = crypto.randomUUID();
  return call("POST", "/images/generations", {
    headers: { "Idempotency-Key": idempotencyKey },
    body: { model: "gpt-image-2", prompt, ratio: "1:1", quality: "medium", n: 1 },
  });
}

async function wait(taskId, intervalMs = 4000, timeoutMs = 900_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const task = await call("GET", "/tasks/" + taskId);
    if (task.status === "succeeded") return task;
    if (task.status === "failed") {
      // Points for failed tasks are refunded automatically.
      throw new Error("task failed: " + task.error.message);
    }
    console.log(task.status, task.progress?.percent ?? "");
    await sleep(intervalMs);
  }
  throw new Error("task " + taskId + " is still running, check it again later");
}

const task = await submit("An isometric cozy reading room, warm evening light, highly detailed");
console.log("submitted", task.id, "cost", task.cost_points, "points");

const result = await wait(task.id);
for (const [index, item] of result.data.entries()) {
  // Result URLs are signed and expire after 24 hours: download them now.
  const file = await fetch(item.url);
  const filename = task.id + "-" + index + ".png";
  await writeFile(filename, Buffer.from(await file.arrayBuffer()));
  console.log("saved", filename);
}

const { points } = await call("GET", "/balance");
console.log("balance:", points);`,
};

export const codeExamples = {
  balance,
  listModels,
  imagesSubmit,
  imagesEdit,
  videosSubmit,
  taskGet,
  taskList,
  polish,
  endToEnd,
} satisfies Record<string, CodeExample>;

type CodeExampleKey = keyof typeof codeExamples;

export function isCodeExampleKey(value: string): value is CodeExampleKey {
  return Object.hasOwn(codeExamples, value);
}

export const codeLanguages: CodeLanguage[] = ["curl", "python", "javascript"];

export type { CodeLanguage, CodeExample, CodeExampleKey };
