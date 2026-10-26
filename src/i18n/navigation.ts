import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// 用户端页面一律从这里导入 Link / redirect / usePathname / useRouter，路径写不带语言前缀的内部路径。
// 后台 /admin 不做多语言，继续使用 next/link 和 next/navigation。
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
