/**
 * 从粘贴事件里取出图片文件。
 * 只在剪贴板里有图片、且没有文字时才算"粘贴图片"：从 Word / 网页复制带图的内容时同时含文字，
 * 此时按普通文本粘贴，避免吞掉用户想要的文字。
 */
export function getPastedImages(data: DataTransfer | null) {
  if (!data) return [];

  const images = Array.from(data.files).filter((file) => file.type.startsWith("image/"));
  if (images.length === 0) return [];
  if (data.getData("text/plain").trim()) return [];

  return images.map(ensureFileName);
}

// 截图粘贴出来的文件通常叫 image.png，重名不影响上传，但补一个时间戳便于在列表里分辨。
function ensureFileName(file: File) {
  if (file.name && file.name !== "image.png") return file;

  const extension = file.type.split("/")[1] || "png";
  const stamp = new Date()
    .toISOString()
    .replace(/[-:T.Z]/g, "")
    .slice(0, 14);
  return new File([file], `pasted-${stamp}.${extension}`, {
    type: file.type,
    lastModified: file.lastModified,
  });
}
