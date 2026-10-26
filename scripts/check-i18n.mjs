#!/usr/bin/env node
// 比较 messages/*.json 与 zh-CN.json 的 key 结构（无第三方依赖）。
//
// - 缺失或为空字符串的翻译：警告，按语言列出数量和 key（运行时会回退到 zh-CN），不影响退出码。
// - zh-CN 中不存在的多余 key、结构不一致（应为对象却是字符串等）、JSON 无法解析：错误，退出码 1。
// - zh-CN 自身的空值也算错误：默认语言必须完整。
//
// 输出统一走 stdout，保证顺序；结构错误时退出码为 1。
// 用法：pnpm i18n:check            # 每种语言最多列出 20 条缺失 key
//       pnpm i18n:check --verbose  # 列出全部缺失 key

import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const messagesDir = join(root, "messages");
const baseLocale = "zh-CN";
const isVerbose = process.argv.includes("--verbose");
const previewLimit = 20;

function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readJson(file) {
  const text = readFileSync(join(messagesDir, file), "utf8");
  return JSON.parse(text);
}

// 把嵌套对象展开成 { "a.b.c": value }，同时记录类型不合法的叶子。
function flatten(tree, prefix, result, invalid) {
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;

    if (isObject(value)) {
      flatten(value, path, result, invalid);
      continue;
    }

    if (typeof value !== "string") {
      invalid.push(path);
      continue;
    }

    result.set(path, value);
  }

  return result;
}

function collectBranches(tree, prefix, result) {
  for (const [key, value] of Object.entries(tree)) {
    if (!isObject(value)) continue;

    const path = prefix ? `${prefix}.${key}` : key;
    result.add(path);
    collectBranches(value, path, result);
  }

  return result;
}

function printList(title, keys, limit) {
  console.log(`  ${title}: ${keys.length}`);
  const visible = limit ? keys.slice(0, limit) : keys;
  for (const key of visible) {
    console.log(`    - ${key}`);
  }
  if (visible.length < keys.length) {
    console.log(`    ...（还有 ${keys.length - visible.length} 条，使用 --verbose 查看全部）`);
  }
}

const files = readdirSync(messagesDir).filter((file) => file.endsWith(".json"));
let errorCount = 0;

// 第一步：读取并校验基准语言。
const baseFile = `${baseLocale}.json`;
if (!files.includes(baseFile)) {
  console.log(`✖ 缺少基准文案 messages/${baseFile}`);
  process.exit(1);
}

const baseInvalid = [];
const baseTree = readJson(baseFile);
const baseKeys = flatten(baseTree, "", new Map(), baseInvalid);
const baseBranches = collectBranches(baseTree, "", new Set());
const baseEmpty = [...baseKeys].filter(([, value]) => value.trim() === "").map(([key]) => key);

console.log(`messages/${baseFile}: ${baseKeys.size} 条文案`);
if (baseInvalid.length > 0 || baseEmpty.length > 0) {
  errorCount += baseInvalid.length + baseEmpty.length;
  console.log(`✖ ${baseLocale} 必须完整且只包含字符串：`);
  printList("非字符串的值", baseInvalid);
  printList("空字符串", baseEmpty);
}

// 第二步：逐个语言比较。
for (const file of files.sort()) {
  if (file === baseFile) continue;

  const locale = file.replace(/\.json$/, "");
  let tree;
  try {
    tree = readJson(file);
  } catch (error) {
    errorCount += 1;
    console.log(`✖ ${file} 不是合法 JSON：${error.message}`);
    continue;
  }

  const invalid = [];
  const keys = flatten(tree, "", new Map(), invalid);

  const extra = [];
  const shapeErrors = [...invalid];
  for (const key of keys.keys()) {
    if (baseKeys.has(key)) continue;

    if (baseBranches.has(key)) {
      shapeErrors.push(key);
    } else {
      extra.push(key);
    }
  }

  const missing = [];
  for (const key of baseKeys.keys()) {
    const value = keys.get(key);
    if (value === undefined || value.trim() === "") {
      missing.push(key);
    }
  }

  const translated = baseKeys.size - missing.length;
  const percent = Math.floor((translated / baseKeys.size) * 100);
  console.log(`\nmessages/${file}: 已翻译 ${translated}/${baseKeys.size}（${percent}%）`);

  if (extra.length > 0 || shapeErrors.length > 0) {
    errorCount += extra.length + shapeErrors.length;
    console.log(`✖ ${locale} 存在 ${baseLocale} 中没有的 key 或结构不一致：`);
    printList("多余 key（先加到 zh-CN.json，或删除）", extra);
    printList("结构不一致", shapeErrors);
  }

  if (missing.length > 0) {
    console.log(`⚠ ${locale} 有未翻译的文案，运行时回退到 ${baseLocale}：`);
    printList("缺失或为空", missing, isVerbose ? 0 : previewLimit);
  }
}

if (errorCount > 0) {
  console.log(`\n✖ i18n 检查失败：${errorCount} 个结构错误`);
  process.exit(1);
}

console.log("\n✔ i18n 结构检查通过（未翻译只是警告）");
