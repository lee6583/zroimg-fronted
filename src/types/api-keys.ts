// 开放 API 密钥（Java /auth/user/api-keys）。时间字段是 Java LocalDateTime 字符串。

type ApiKeyStatus = "active" | "revoked";

type ApiKey = {
  id: string;
  name: string;
  // 只用于识别的前缀，例如 zk-a1b2c3；完整密钥只在创建时返回一次
  keyPrefix: string;
  status: ApiKeyStatus;
  lastUsedAt: string | null;
  createdAt: string;
  // null 表示永不过期
  expiresAt: string | null;
};

type ApiKeyExpiryDays = 30 | 90 | 365;

type CreateApiKeyRequest = {
  name: string;
  expiresInDays: ApiKeyExpiryDays | null;
};

type CreateApiKeyResponse = ApiKey & {
  // 完整密钥，只在创建响应里出现一次
  key: string;
};

type RevokeApiKeyResponse = null;

export type {
  ApiKeyStatus,
  ApiKey,
  ApiKeyExpiryDays,
  CreateApiKeyRequest,
  CreateApiKeyResponse,
  RevokeApiKeyResponse,
};
