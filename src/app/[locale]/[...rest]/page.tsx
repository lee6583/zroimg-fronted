import { notFound } from "next/navigation";

// [locale] 下未匹配的路径（例如 /en/unknown）统一渲染 [locale]/not-found.tsx。
export default function CatchAllPage() {
  notFound();
}
