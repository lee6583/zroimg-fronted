import type { GenerationMode, GenerationQuality } from "@/types/generation";

export const generationBaseCredits: Record<GenerationMode, number> = {
  text: 10,
  edit: 15,
};

export function estimateGenerationCredits(input: {
  mode: GenerationMode;
  quality: GenerationQuality;
  size: string;
  count: number;
}) {
  const [width, height] = input.size.split("x").map(Number);
  const pixels = Number.isFinite(width) && Number.isFinite(height) ? width * height : 1024 * 1024;
  let qualityRate = 1;
  if (input.quality === "high") {
    qualityRate = 2;
  } else if (input.quality === "medium") {
    qualityRate = 1.5;
  }

  let sizeRate = 3;
  if (pixels <= 1_100_000) {
    sizeRate = 1;
  } else if (pixels <= 1_600_000) {
    sizeRate = 1.5;
  } else if (pixels <= 3_000_000) {
    sizeRate = 2;
  }

  return Math.ceil(generationBaseCredits[input.mode] * qualityRate * sizeRate * input.count);
}
