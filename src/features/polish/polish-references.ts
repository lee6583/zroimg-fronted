/** AI 润色最多参考的图片数量（与后端一致）。 */
export const maxPolishReferences = 4;

/** 去掉空值和重复项，最多保留 4 张；没有可用参考图时返回空数组。 */
export function normalizePolishReferences(ids: readonly (string | null | undefined)[] | undefined) {
  const result: string[] = [];
  for (const id of ids ?? []) {
    const value = id?.trim();
    if (!value || result.includes(value)) continue;

    result.push(value);
    if (result.length >= maxPolishReferences) break;
  }

  return result;
}
