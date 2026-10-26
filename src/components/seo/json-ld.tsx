import type { JsonLdObject } from "@/lib/structured-data";

type JsonLdProps = {
  data: JsonLdObject | JsonLdObject[];
};

// JSON.stringify 不转义 "<"，用户内容里出现 "</script>" 会提前闭合标签，这里统一转成 <。
export function JsonLd(props: JsonLdProps) {
  const json = JSON.stringify(props.data).replace(/</g, "\\u003c");

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
