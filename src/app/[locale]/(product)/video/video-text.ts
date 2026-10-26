import { useTranslations } from "next-intl";
import { translateApiError } from "@/i18n/api-error";
import { isVideoMode, VideoPointsShortageError } from "./video-submit";

/** 视频页共用的文案助手：模式名、提交错误。 */
export function useVideoText() {
  const t = useTranslations("video");
  const tError = useTranslations("errors.api");

  function modeLabel(mode: string) {
    if (isVideoMode(mode)) {
      return t(`mode.${mode}`);
    }
    return mode;
  }

  function errorText(error: unknown) {
    if (error instanceof VideoPointsShortageError) {
      return t("errors.insufficientPoints", { points: error.shortagePoints });
    }
    return translateApiError(error, tError);
  }

  return { t, modeLabel, errorText };
}
