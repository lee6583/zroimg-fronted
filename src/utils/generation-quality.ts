function getImageResolutionLabel(quality: string) {
  const labels: Record<string, string> = {
    low: "1K",
    medium: "2K",
    high: "4K",
    auto: "自动",
    standard: "标准",
  };

  return labels[quality] ?? quality;
}

export { getImageResolutionLabel };
