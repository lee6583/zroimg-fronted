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

function readBooleanEnv(name: string) {
  const value = readServerEnv(name).toLowerCase();
  return value === "true" || value === "1" || value === "yes";
}

export const serverEnv = {
  bffMode: readBffMode(),
  authBffMode: readAuthBffMode(),
  allowMockBff: readBooleanEnv("ALLOW_MOCK_BFF"),
  javaApiBaseUrl: readServerEnv("JAVA_API_BASE_URL"),
};

export function isMockBffEnabled() {
  const isProduction = process.env.NODE_ENV === "production";
  return serverEnv.bffMode === "mock" && (!isProduction || serverEnv.allowMockBff);
}

export function isJavaAuthEnabled() {
  return serverEnv.authBffMode === "java";
}

export function assertMockBffEnabled() {
  if (!isMockBffEnabled()) {
    throw new Error("Mock BFF 已关闭，请完成 Java BFF 接入");
  }
}
