/**
 * 图片 quality 的展示文案：low/medium/high 显示分辨率档位（1K/2K/4K，不翻译），
 * auto/standard 使用 `task.quality.*`。
 *
 *   const tTask = useTranslations("task");
 *   getImageResolutionLabel(task.quality, tTask);
 *
 * 不传 t 时按 zh-CN 文案返回，仅为兼容尚未迁移的调用方。
 */
type QualityKey = "quality.auto" | "quality.standard";

type QualityTranslator = (key: QualityKey) => string;

const resolutionLabels: Record<string, string> = {
  low: "1K",
  medium: "2K",
  high: "4K",
};

const qualityKeys: Record<string, QualityKey> = {
  auto: "quality.auto",
  standard: "quality.standard",
};

// 与 messages/zh-CN/task.json 的 quality.* 保持一致。
const legacyLabels: Record<QualityKey, string> = {
  "quality.auto": "自动",
  "quality.standard": "标准",
};

function getImageResolutionLabel(quality: string, t?: QualityTranslator) {
  if (Object.hasOwn(resolutionLabels, quality)) {
    return resolutionLabels[quality];
  }
  if (!Object.hasOwn(qualityKeys, quality)) {
    return quality;
  }

  const key = qualityKeys[quality];

  return t ? t(key) : legacyLabels[key];
}

export { getImageResolutionLabel };
export type { QualityTranslator };
