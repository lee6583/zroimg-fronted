// Java LocalDateTime 序列化为不带时区的 "2026-10-25T23:54:22"，语义是北京时间（UTC+8）。
// 直接 new Date() 会按运行环境的本地时区解析，服务端（UTC）和浏览器结果会不一致，所以统一补上 +08:00。
const shanghaiOffset = "+08:00";
const localDateTimePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,9})?)?$/;
const localDatePattern = /^\d{4}-\d{2}-\d{2}$/;

export function parseJavaDateTime(value: string) {
  if (localDateTimePattern.test(value)) {
    return new Date(`${value}${shanghaiOffset}`);
  }

  if (localDatePattern.test(value)) {
    return new Date(`${value}T00:00:00${shanghaiOffset}`);
  }

  // 已带 Z 或偏移量的 ISO 字符串按原样解析。
  return new Date(value);
}
