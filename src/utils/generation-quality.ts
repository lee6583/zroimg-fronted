function getImageResolutionLabel(quality: string) {
  const labels: Record<string, string> = {
    low: "1K",
    medium: "2K",
    high: "4K",
    auto: "自动",
  };

  return labels[quality] ?? quality;
}

export { getImageResolutionLabel };
