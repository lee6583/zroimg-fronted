type MessageTree = { [key: string]: string | MessageTree };

function isTree(value: unknown): value is MessageTree {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * 以默认语言（zh-CN）为底，用目标语言覆盖。目标语言里缺失、为空字符串或结构不一致的 key 保留默认语言文案，
 * 并把 key 路径写进 missing。返回值的结构永远与 base 相同，所以运行时不会出现 MISSING_MESSAGE。
 */
export function mergeMessages(
  base: MessageTree,
  override: unknown,
  missing: string[],
  prefix = "",
) {
  const result: MessageTree = {};

  for (const [key, baseValue] of Object.entries(base)) {
    const path = prefix ? `${prefix}.${key}` : key;
    const overrideValue = isTree(override) ? override[key] : undefined;

    if (isTree(baseValue)) {
      result[key] = mergeMessages(baseValue, overrideValue, missing, path);
      continue;
    }

    const isTranslated = typeof overrideValue === "string" && overrideValue.trim() !== "";
    if (isTranslated) {
      result[key] = overrideValue;
      continue;
    }

    missing.push(path);
    result[key] = baseValue;
  }

  return result;
}

export type { MessageTree };
