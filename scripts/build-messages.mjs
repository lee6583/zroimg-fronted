#!/usr/bin/env node
// 把 messages/<locale>/<namespace>.json 合并成 messages/<locale>.json（代码和类型只引用合并后的文件）。
//
// 按命名空间拆文件是为了多人并行改文案时互不冲突：只改自己负责的 namespace 文件，
// 然后运行 pnpm i18n:build。不要手改 messages/<locale>.json，它会被覆盖。
// 用法：pnpm i18n:build          # 生成
//       pnpm i18n:build --check  # 只校验生成结果是否最新（CI 用），过期时退出码 1

import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const messagesDir = join(root, "messages");
const isCheck = process.argv.includes("--check");

const locales = readdirSync(messagesDir).filter((name) => {
  return statSync(join(messagesDir, name)).isDirectory();
});

let isStale = false;

for (const locale of locales) {
  const dir = join(messagesDir, locale);
  const files = readdirSync(dir)
    .filter((file) => file.endsWith(".json"))
    .sort();

  const merged = {};
  for (const file of files) {
    const namespace = file.slice(0, -".json".length);
    merged[namespace] = JSON.parse(readFileSync(join(dir, file), "utf8"));
  }

  const output = `${JSON.stringify(merged, null, 2)}\n`;
  const target = join(messagesDir, `${locale}.json`);
  const current = existsSync(target) ? readFileSync(target, "utf8") : "";

  if (current === output) {
    continue;
  }

  if (isCheck) {
    console.log(`messages/${locale}.json 不是最新的，请运行 pnpm i18n:build`);
    isStale = true;
    continue;
  }

  writeFileSync(target, output);
  console.log(`已生成 messages/${locale}.json（${files.length} 个命名空间）`);
}

if (isStale) {
  process.exit(1);
}
