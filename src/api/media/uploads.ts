import { request } from "@/utils/request";
import type { MediaAsset } from "@/types/generation";

const assetsUrl = "/api/media/user/assets";

/**
 * 图片统一经 Java 后端上传（nginx 不限体积，后端上限见 MEDIA_MAX_IMAGE_BYTES，默认 20 MB）。
 * 不要再让浏览器直传对象存储：R2 桶没有配置 CORS，大于 5 MB 的直传会被浏览器拦截而静默失败。
 */
export function uploadMediaFile(file: File): Promise<MediaAsset> {
  const body = new FormData();
  body.set("file", file);
  return request<MediaAsset>({
    url: assetsUrl,
    method: "POST",
    body,
  });
}
