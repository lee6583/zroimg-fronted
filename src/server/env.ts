function readServerEnv(name: string) {
  return process.env[name]?.trim() || "";
}

export const serverEnv = {
  javaApiBaseUrl: readServerEnv("JAVA_API_BASE_URL"),
};

