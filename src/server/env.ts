import "server-only";

function readServerEnv(name: string) {
  return process.env[name]?.trim() || "";
}

function readBffMode() {
  const mode = readServerEnv("BFF_MODE");
  if (mode === "mock" || mode === "java") return mode;
  return process.env.NODE_ENV === "production" ? "java" : "mock";
}

function readAuthBffMode() {
  const mode = readServerEnv("AUTH_BFF_MODE");
  if (mode === "mock" || mode === "java") return mode;
  return readBffMode();
}

export const serverEnv = {
  bffMode: readBffMode(),
  authBffMode: readAuthBffMode(),
  javaApiBaseUrl: readServerEnv("JAVA_API_BASE_URL"),
};

export function isMockBffEnabled() {
  return serverEnv.bffMode === "mock" && process.env.NODE_ENV !== "production";
}

export function isJavaAuthEnabled() {
  return serverEnv.authBffMode === "java";
}

export function assertMockBffEnabled() {
  if (!isMockBffEnabled()) {
    throw new Error("Mock BFF 已关闭，请完成 Java BFF 接入");
  }
}
