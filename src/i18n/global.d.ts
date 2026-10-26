import type messages from "../../messages/zh-CN.json";
import type { formats } from "./formats";
import type { routing } from "./routing";

// zh-CN.json 是唯一的 key 结构来源：写错 key、漏传 ICU 参数都会让 pnpm typecheck 失败。
declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: typeof messages;
    Formats: typeof formats;
  }
}
