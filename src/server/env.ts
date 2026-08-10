import "server-only";

function readServerEnv(name: string) {
  return process.env[name]?.trim() || "";
}

export const serverEnv = {
  javaApiBaseUrl: readServerEnv("JAVA_API_BASE_URL"),
};

export function isMockBffEnabled() {
  return false;
}

export function isJavaAuthEnabled() {
  return true;
}

export function isJavaBffEnabled() {
  return true;
}

export function isMockPaymentBffEnabled() {
  return false;
}

export function assertMockBffEnabled() {
  if (!isMockBffEnabled()) {
    throw new Error("Mock BFF 已关闭，请完成 Java BFF 接入");
  }
}
