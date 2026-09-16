import "server-only";

type AuthRateLimitScope = "user-login" | "admin-login";

type AuthRateLimitRecord = {
  count: number;
  windowStartedAt: number;
  blockedUntil: number;
};

type AuthRateLimitResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      retryAfterSeconds: number;
    };

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 60 * 1000;
const BLOCK_MS = 60 * 1000;
const MAX_RECORDS = 1000;

const records = new Map<string, AuthRateLimitRecord>();
let lastCleanupAt = 0;

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

function normalizeIdentifier(identifier: string) {
  return identifier.trim().toLowerCase() || "anonymous";
}

function getKey(request: Request, scope: AuthRateLimitScope, identifier: string) {
  const ip = getClientIp(request);
  const normalizedIdentifier = normalizeIdentifier(identifier);

  return `${scope}:${ip}:${normalizedIdentifier}`;
}

function cleanupExpiredRecords(now: number) {
  const shouldCleanup = records.size > MAX_RECORDS || now - lastCleanupAt > WINDOW_MS;
  if (!shouldCleanup) {
    return;
  }

  lastCleanupAt = now;

  for (const [key, record] of records) {
    const windowExpired = now - record.windowStartedAt > WINDOW_MS;
    const blockExpired = record.blockedUntil > 0 && now > record.blockedUntil;

    if (windowExpired && (record.blockedUntil === 0 || blockExpired)) {
      records.delete(key);
    }
  }
}

function getRetryAfterSeconds(blockedUntil: number, now: number) {
  const remainingMs = Math.max(blockedUntil - now, 0);

  return Math.ceil(remainingMs / 1000);
}

export function consumeAuthRateLimit(
  request: Request,
  scope: AuthRateLimitScope,
  identifier: string,
): AuthRateLimitResult {
  const now = Date.now();
  cleanupExpiredRecords(now);

  const key = getKey(request, scope, identifier);
  const current = records.get(key);

  if (!current) {
    records.set(key, {
      count: 1,
      windowStartedAt: now,
      blockedUntil: 0,
    });

    return { ok: true };
  }

  if (current.blockedUntil > now) {
    return {
      ok: false,
      retryAfterSeconds: getRetryAfterSeconds(current.blockedUntil, now),
    };
  }

  const windowExpired = now - current.windowStartedAt > WINDOW_MS;
  if (windowExpired) {
    current.count = 1;
    current.windowStartedAt = now;
    current.blockedUntil = 0;

    return { ok: true };
  }

  current.count += 1;

  if (current.count > MAX_ATTEMPTS) {
    current.blockedUntil = now + BLOCK_MS;

    return {
      ok: false,
      retryAfterSeconds: getRetryAfterSeconds(current.blockedUntil, now),
    };
  }

  return { ok: true };
}

export function clearAuthRateLimit(
  request: Request,
  scope: AuthRateLimitScope,
  identifier: string,
) {
  const key = getKey(request, scope, identifier);
  records.delete(key);
}
