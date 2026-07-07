// TODO(java-backend): replace this in-memory mock store with real backend APIs.
// This file exists only so the migrated frontend can run before the Java service is ready.

export type MockRole = "user" | "admin";
export type MockUserStatus = "active" | "banned";
export type MockPaymentType = "alipay" | "wxpay";
export type MockOrderStatus = "pending" | "paid" | "fulfilled" | "expired" | "cancelled" | "failed";
export type MockTaskStatus = "queued" | "running" | "succeeded" | "failed";
export type MockGenerationMode = "text" | "edit";
export type MockFeedbackType = "bug" | "billing" | "generation" | "account" | "suggestion" | "other";
export type MockFeedbackStatus = "open" | "in_progress" | "resolved" | "closed";
export type MockGalleryCategory = "realistic" | "anime" | "art" | "other";

export type MockUser = {
  id: string;
  email: string;
  password: string;
  name: string;
  createdAt: Date;
};

export type MockUserProfile = {
  id: string;
  userId: string;
  username: string;
  role: MockRole;
  status: MockUserStatus;
  creditBalance: number;
  bio: string;
  createdAt: Date;
};

export type MockCreditPackage = {
  id: string;
  code: string;
  name: string;
  credits: number;
  priceCny: number;
  sortOrder: number;
  isActive: boolean;
};

export type MockCreditLedger = {
  id: string;
  userProfileId: string;
  amount: number;
  balanceAfter: number;
  reason: string;
  type: "grant" | "purchase" | "generation" | "adjustment" | "refund" | "checkin";
  createdAt: Date;
};

export type MockPaymentOrder = {
  id: string;
  userProfileId: string;
  orderNo: string;
  paymentType: MockPaymentType;
  status: MockOrderStatus;
  credits: number;
  amountCny: number;
  creditPackageId: string | null;
  providerTradeNo: string | null;
  payUrl: string | null;
  createdAt: Date;
  paidAt: Date | null;
};

export type MockMediaAsset = {
  id: string;
  ownerUserProfileId: string | null;
  fileName: string | null;
  kind: "input" | "output" | "thumbnail" | "avatar";
  width: number | null;
  height: number | null;
  url: string;
  createdAt: Date;
};

export type MockGenerationConversation = {
  id: string;
  userProfileId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  lastTaskAt: Date | null;
};

export type MockGenerationTask = {
  id: string;
  userProfileId: string;
  conversationId: string;
  prompt: string;
  mode: MockGenerationMode;
  status: MockTaskStatus;
  model: string;
  size: string;
  quality: "low" | "medium" | "high";
  outputFormat: "png" | "webp" | "jpeg";
  imageCount: number;
  costCredits: number;
  error: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type MockGeneratedImage = {
  id: string;
  userProfileId: string;
  taskId: string;
  outputAssetId: string;
  thumbnailAssetId: string | null;
  width: number | null;
  height: number | null;
  createdAt: Date;
};

export type MockGalleryImage = {
  id: string;
  generatedImageId: string;
  userProfileId: string;
  prompt: string;
  title: string | null;
  category: MockGalleryCategory;
  isPublic: boolean;
  createdAt: Date;
};

export type MockFavoriteCollection = {
  id: string;
  userProfileId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
};

export type MockFavoriteCollectionItem = {
  id: string;
  collectionId: string;
  generatedImageId: string;
  createdAt: Date;
};

export type MockFeedbackTicket = {
  id: string;
  userProfileId: string;
  type: MockFeedbackType;
  status: MockFeedbackStatus;
  subject: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt: Date;
};

export type MockFeedbackMessage = {
  id: string;
  ticketId: string;
  authorProfileId: string;
  isAdmin: boolean;
  body: string;
  createdAt: Date;
};

export type MockCheckInRecord = {
  id: string;
  userProfileId: string;
  dayKey: string;
  credits: number;
  createdAt: Date;
};

export type MockAdminAuditLog = {
  id: string;
  adminProfileId: string;
  action: string;
  targetType: string;
  targetId: string | null;
  detailJson: Record<string, unknown>;
  createdAt: Date;
};

export type MockSliderToken = {
  token: string;
  email: string;
  expiresAt: number;
  used: boolean;
};

export type MockVerificationCode = {
  id: string;
  email: string;
  code: string;
  expiresAt: number;
};

export type MockSettingsState = {
  generation: {
    enabled: boolean;
    baseUrl: string | null;
    model: string;
    apiKey: string | null;
  };
  smtp: {
    enabled: boolean;
    host: string | null;
    port: number;
    secure: boolean;
    user: string | null;
    password: string | null;
    from: string;
  };
  easypay: {
    enabled: boolean;
    apiBase: string | null;
    pid: string | null;
    key: string | null;
    notifyUrl: string;
    returnUrl: string;
  };
  checkin: {
    dailyCredits: number;
  };
  docs: unknown;
};

export type MockStore = {
  users: MockUser[];
  profiles: MockUserProfile[];
  creditPackages: MockCreditPackage[];
  creditLedger: MockCreditLedger[];
  paymentOrders: MockPaymentOrder[];
  mediaAssets: MockMediaAsset[];
  generationConversations: MockGenerationConversation[];
  generationTasks: MockGenerationTask[];
  generatedImages: MockGeneratedImage[];
  galleryImages: MockGalleryImage[];
  favoriteCollections: MockFavoriteCollection[];
  favoriteCollectionItems: MockFavoriteCollectionItem[];
  feedbackTickets: MockFeedbackTicket[];
  feedbackMessages: MockFeedbackMessage[];
  checkInRecords: MockCheckInRecord[];
  adminAuditLogs: MockAdminAuditLog[];
  sliderTokens: MockSliderToken[];
  verificationCodes: MockVerificationCode[];
  settings: MockSettingsState;
  counters: Record<string, number>;
};

function base64(input: string) {
  return Buffer.from(input, "utf8").toString("base64");
}

function svgDataUrl(title: string, accent = "#111111", soft = "#f5f5f5") {
  const safeTitle = title.replace(/[<&>"]/g, "");
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="768" height="768" viewBox="0 0 768 768" overflow="hidden">
      <rect width="768" height="768" fill="${soft}" />
      <rect x="32" y="32" width="704" height="704" rx="28" fill="white" stroke="#e5e5e5" />
      <rect x="96" y="112" width="576" height="320" rx="28" fill="${accent}" opacity="0.14" />
      <text x="96" y="510" font-size="28" fill="#737373" font-family="Inter, sans-serif">ZroCodeImg Mock Output</text>
      <text x="96" y="566" font-size="54" fill="#111111" font-family="Georgia, serif">${safeTitle.slice(0, 26)}</text>
      <text x="96" y="622" font-size="24" fill="#525252" font-family="Inter, sans-serif">Frontend preview</text>
      <text x="96" y="658" font-size="24" fill="#525252" font-family="Inter, sans-serif">Before Java backend integration</text>
    </svg>
  `;
  return `data:image/svg+xml;base64,${base64(svg)}`;
}

function nowMinus(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

function monthDayKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function createStore(): MockStore {
  const users: MockUser[] = [
    {
      id: "user-admin",
      email: "admin@zrocodeimg.dev",
      password: "admin123456",
      name: "Lee Admin",
      createdAt: nowMinus(240),
    },
    {
      id: "user-creator",
      email: "creator@zrocodeimg.dev",
      password: "creator123456",
      name: "Mina Creator",
      createdAt: nowMinus(168),
    },
  ];

  const profiles: MockUserProfile[] = [
    {
      id: "profile-admin",
      userId: "user-admin",
      username: "lee6583",
      role: "admin",
      status: "active",
      creditBalance: 9999,
      bio: "站点管理员",
      createdAt: nowMinus(240),
    },
    {
      id: "profile-creator",
      userId: "user-creator",
      username: "Mina",
      role: "user",
      status: "active",
      creditBalance: 430,
      bio: "偏爱电影感与产品视觉。",
      createdAt: nowMinus(168),
    },
  ];

  const creditPackages: MockCreditPackage[] = [
    { id: "package-1", code: "STARTER_100", name: "轻量试创", credits: 100, priceCny: 19.9, sortOrder: 1, isActive: true },
    { id: "package-2", code: "PRO_500", name: "创作者", credits: 500, priceCny: 79.9, sortOrder: 2, isActive: true },
    { id: "package-3", code: "MAX_1200", name: "灵感工作室", credits: 1200, priceCny: 169.9, sortOrder: 3, isActive: true },
  ];

  const mediaAssets: MockMediaAsset[] = [
    {
      id: "asset-output-1",
      ownerUserProfileId: "profile-creator",
      fileName: "retro-cafe.png",
      kind: "output",
      width: 1024,
      height: 1024,
      url: svgDataUrl("雨夜咖啡店", "#171717"),
      createdAt: nowMinus(40),
    },
    {
      id: "asset-thumb-1",
      ownerUserProfileId: "profile-creator",
      fileName: "retro-cafe-thumb.webp",
      kind: "thumbnail",
      width: 640,
      height: 640,
      url: svgDataUrl("雨夜咖啡店", "#171717", "#fafafa"),
      createdAt: nowMinus(40),
    },
    {
      id: "asset-output-2",
      ownerUserProfileId: "profile-creator",
      fileName: "aurora-fox.png",
      kind: "output",
      width: 1152,
      height: 864,
      url: svgDataUrl("极光机械狐", "#2563eb"),
      createdAt: nowMinus(18),
    },
    {
      id: "asset-thumb-2",
      ownerUserProfileId: "profile-creator",
      fileName: "aurora-fox-thumb.webp",
      kind: "thumbnail",
      width: 640,
      height: 480,
      url: svgDataUrl("极光机械狐", "#2563eb", "#eff6ff"),
      createdAt: nowMinus(18),
    },
  ];

  const generationConversations: MockGenerationConversation[] = [
    {
      id: "conversation-1",
      userProfileId: "profile-creator",
      title: "产品海报探索",
      createdAt: nowMinus(48),
      updatedAt: nowMinus(18),
      lastTaskAt: nowMinus(18),
    },
    {
      id: "conversation-2",
      userProfileId: "profile-creator",
      title: "角色设定",
      createdAt: nowMinus(24),
      updatedAt: nowMinus(6),
      lastTaskAt: nowMinus(6),
    },
  ];

  const generationTasks: MockGenerationTask[] = [
    {
      id: "task-1",
      userProfileId: "profile-creator",
      conversationId: "conversation-1",
      prompt: "雨夜街角的复古咖啡店，电影感灯光，橱窗里有暖黄色反射",
      mode: "text",
      status: "succeeded",
      model: "gpt-image-2",
      size: "1024x1024",
      quality: "medium",
      outputFormat: "png",
      imageCount: 1,
      costCredits: 15,
      error: null,
      createdAt: nowMinus(40),
      updatedAt: nowMinus(40),
    },
    {
      id: "task-2",
      userProfileId: "profile-creator",
      conversationId: "conversation-2",
      prompt: "一只白色机械狐狸站在雪地里，远处是极光，电影感，高细节",
      mode: "text",
      status: "succeeded",
      model: "gpt-image-2",
      size: "1152x864",
      quality: "medium",
      outputFormat: "png",
      imageCount: 1,
      costCredits: 15,
      error: null,
      createdAt: nowMinus(18),
      updatedAt: nowMinus(18),
    },
    {
      id: "task-3",
      userProfileId: "profile-creator",
      conversationId: "conversation-2",
      prompt: "霓虹城市上空的飞行列车，广角构图",
      mode: "text",
      status: "queued",
      model: "gpt-image-2",
      size: "1360x768",
      quality: "low",
      outputFormat: "png",
      imageCount: 1,
      costCredits: 10,
      error: null,
      createdAt: nowMinus(0.02),
      updatedAt: nowMinus(0.02),
    },
  ];

  const generatedImages: MockGeneratedImage[] = [
    {
      id: "generated-1",
      userProfileId: "profile-creator",
      taskId: "task-1",
      outputAssetId: "asset-output-1",
      thumbnailAssetId: "asset-thumb-1",
      width: 1024,
      height: 1024,
      createdAt: nowMinus(40),
    },
    {
      id: "generated-2",
      userProfileId: "profile-creator",
      taskId: "task-2",
      outputAssetId: "asset-output-2",
      thumbnailAssetId: "asset-thumb-2",
      width: 1152,
      height: 864,
      createdAt: nowMinus(18),
    },
  ];

  const galleryImages: MockGalleryImage[] = [
    {
      id: "gallery-1",
      generatedImageId: "generated-1",
      userProfileId: "profile-creator",
      prompt: generationTasks[0].prompt,
      title: "暖光雨夜",
      category: "realistic",
      isPublic: true,
      createdAt: nowMinus(30),
    },
    {
      id: "gallery-2",
      generatedImageId: "generated-2",
      userProfileId: "profile-creator",
      prompt: generationTasks[1].prompt,
      title: "极光机械狐",
      category: "art",
      isPublic: true,
      createdAt: nowMinus(12),
    },
  ];

  const favoriteCollections: MockFavoriteCollection[] = [
    {
      id: "favorite-1",
      userProfileId: "profile-creator",
      name: "品牌海报灵感",
      createdAt: nowMinus(28),
      updatedAt: nowMinus(12),
    },
  ];

  const favoriteCollectionItems: MockFavoriteCollectionItem[] = [
    {
      id: "favorite-item-1",
      collectionId: "favorite-1",
      generatedImageId: "generated-1",
      createdAt: nowMinus(12),
    },
  ];

  const feedbackTickets: MockFeedbackTicket[] = [
    {
      id: "ticket-1",
      userProfileId: "profile-creator",
      type: "generation",
      status: "open",
      subject: "生成结果比预期更暗",
      content: "同样的提示词在第二次生成时整体偏暗，希望有更稳定的亮度控制。",
      createdAt: nowMinus(36),
      updatedAt: nowMinus(8),
      lastMessageAt: nowMinus(8),
    },
    {
      id: "ticket-2",
      userProfileId: "profile-creator",
      type: "billing",
      status: "resolved",
      subject: "订单到账时间咨询",
      content: "上一次订单到账很快，想确认是否都是实时到账。",
      createdAt: nowMinus(96),
      updatedAt: nowMinus(90),
      lastMessageAt: nowMinus(90),
    },
  ];

  const feedbackMessages: MockFeedbackMessage[] = [
    {
      id: "message-1",
      ticketId: "ticket-1",
      authorProfileId: "profile-creator",
      isAdmin: false,
      body: "希望可以在提示词优化里增加亮度建议。",
      createdAt: nowMinus(36),
    },
    {
      id: "message-2",
      ticketId: "ticket-1",
      authorProfileId: "profile-admin",
      isAdmin: true,
      body: "已记录，后续会在提示词优化与默认曝光策略上一起处理。",
      createdAt: nowMinus(8),
    },
    {
      id: "message-3",
      ticketId: "ticket-2",
      authorProfileId: "profile-admin",
      isAdmin: true,
      body: "当前 mock 环境下订单是即时到账；后续 Java 后端接入后，会以真实支付回调为准。",
      createdAt: nowMinus(90),
    },
  ];

  const paymentOrders: MockPaymentOrder[] = [
    {
      id: "order-1",
      userProfileId: "profile-creator",
      orderNo: "MOCK202607060001",
      paymentType: "alipay",
      status: "fulfilled",
      credits: 500,
      amountCny: 79.9,
      creditPackageId: "package-2",
      providerTradeNo: "TRADE-10001",
      payUrl: "/billing/result?order=MOCK202607060001",
      createdAt: nowMinus(120),
      paidAt: nowMinus(119.9),
    },
    {
      id: "order-2",
      userProfileId: "profile-creator",
      orderNo: "MOCK202607060002",
      paymentType: "wxpay",
      status: "fulfilled",
      credits: 100,
      amountCny: 19.9,
      creditPackageId: "package-1",
      providerTradeNo: "TRADE-10002",
      payUrl: "/billing/result?order=MOCK202607060002",
      createdAt: nowMinus(20),
      paidAt: nowMinus(19.9),
    },
  ];

  const creditLedger: MockCreditLedger[] = [
    {
      id: "ledger-1",
      userProfileId: "profile-creator",
      amount: 10,
      balanceAfter: 10,
      reason: "注册赠送积分",
      type: "grant",
      createdAt: nowMinus(168),
    },
    {
      id: "ledger-2",
      userProfileId: "profile-creator",
      amount: 500,
      balanceAfter: 510,
      reason: "套餐购买 PRO_500",
      type: "purchase",
      createdAt: nowMinus(120),
    },
    {
      id: "ledger-3",
      userProfileId: "profile-creator",
      amount: -15,
      balanceAfter: 495,
      reason: "创建生成任务",
      type: "generation",
      createdAt: nowMinus(40),
    },
    {
      id: "ledger-4",
      userProfileId: "profile-creator",
      amount: 100,
      balanceAfter: 595,
      reason: "套餐购买 STARTER_100",
      type: "purchase",
      createdAt: nowMinus(20),
    },
    {
      id: "ledger-5",
      userProfileId: "profile-creator",
      amount: -15,
      balanceAfter: 580,
      reason: "创建生成任务",
      type: "generation",
      createdAt: nowMinus(18),
    },
    {
      id: "ledger-6",
      userProfileId: "profile-creator",
      amount: -10,
      balanceAfter: 570,
      reason: "创建生成任务",
      type: "generation",
      createdAt: nowMinus(0.02),
    },
    {
      id: "ledger-7",
      userProfileId: "profile-creator",
      amount: -140,
      balanceAfter: 430,
      reason: "历史 mock 扣费修正",
      type: "adjustment",
      createdAt: nowMinus(0.01),
    },
  ];

  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const checkInRecords: MockCheckInRecord[] = [
    {
      id: "checkin-1",
      userProfileId: "profile-creator",
      dayKey: monthDayKey(yesterday),
      credits: 5,
      createdAt: yesterday,
    },
  ];

  const adminAuditLogs: MockAdminAuditLog[] = [
    {
      id: "audit-1",
      adminProfileId: "profile-admin",
      action: "update_generation_settings",
      targetType: "systemSetting",
      targetId: "generation",
      detailJson: { model: "gpt-image-2", enabled: true },
      createdAt: nowMinus(5),
    },
    {
      id: "audit-2",
      adminProfileId: "profile-admin",
      action: "reply_feedback",
      targetType: "feedbackTicket",
      targetId: "ticket-1",
      detailJson: { ticketId: "ticket-1" },
      createdAt: nowMinus(8),
    },
  ];

  return {
    users,
    profiles,
    creditPackages,
    creditLedger,
    paymentOrders,
    mediaAssets,
    generationConversations,
    generationTasks,
    generatedImages,
    galleryImages,
    favoriteCollections,
    favoriteCollectionItems,
    feedbackTickets,
    feedbackMessages,
    checkInRecords,
    adminAuditLogs,
    sliderTokens: [],
    verificationCodes: [],
    settings: {
      generation: {
        enabled: true,
        baseUrl: "https://api.openai.com/v1",
        model: "gpt-image-2",
        apiKey: "sk-mock-platform-key",
      },
      smtp: {
        enabled: false,
        host: "smtp.qq.com",
        port: 465,
        secure: true,
        user: "admin@zrocodeimg.dev",
        password: null,
        from: "ZroCodeImg <noreply@zrocodeimg.dev>",
      },
      easypay: {
        enabled: true,
        apiBase: "https://pay.mock.local",
        pid: "1000",
        key: "mock-easypay-key",
        notifyUrl: "http://localhost:3000/api/pay/easypay/notify",
        returnUrl: "http://localhost:3000/billing/result",
      },
      checkin: {
        dailyCredits: 5,
      },
      docs: null,
    },
    counters: {
      conversation: 3,
      task: 4,
      media: 3,
      generated: 3,
      gallery: 3,
      favoriteCollection: 2,
      favoriteCollectionItem: 2,
      order: 3,
      ledger: 8,
      ticket: 3,
      message: 4,
      slider: 1,
      verification: 1,
      audit: 3,
      checkin: 2,
      user: 3,
      profile: 3,
    },
  };
}

declare global {
  var __zroimgMockStore: MockStore | undefined;
}

export function getStore() {
  if (!globalThis.__zroimgMockStore) {
    globalThis.__zroimgMockStore = createStore();
  }
  return globalThis.__zroimgMockStore;
}

export function nextId(prefix: keyof MockStore["counters"] | string) {
  const store = getStore();
  store.counters[prefix] = (store.counters[prefix] || 0) + 1;
  return `${prefix}-${store.counters[prefix]}`;
}

export function findUserByEmail(email: string) {
  const store = getStore();
  const user = store.users.find((item) => item.email.toLowerCase() === email.trim().toLowerCase());
  if (!user) return null;
  const profile = store.profiles.find((item) => item.userId === user.id);
  if (!profile) return null;
  return { user, profile };
}

export function findProfileById(profileId: string) {
  const store = getStore();
  return store.profiles.find((item) => item.id === profileId) || null;
}

export function findUserBundleByProfileId(profileId: string) {
  const profile = findProfileById(profileId);
  if (!profile) return null;
  const user = getStore().users.find((item) => item.id === profile.userId);
  if (!user) return null;
  return { user, profile };
}

export function findUserBundleByUserId(userId: string) {
  const store = getStore();
  const user = store.users.find((item) => item.id === userId);
  const profile = store.profiles.find((item) => item.userId === userId);
  if (!user || !profile) return null;
  return { user, profile };
}

export function addAuditLog(input: Omit<MockAdminAuditLog, "id" | "createdAt">) {
  const store = getStore();
  store.adminAuditLogs.unshift({
    id: nextId("audit"),
    createdAt: new Date(),
    ...input,
  });
}

export function maskSecret(secret: string | null) {
  if (!secret) return null;
  if (secret.length <= 8) return "********";
  return `${secret.slice(0, 4)}...${secret.slice(-4)}`;
}

export function createMediaAsset(input: {
  ownerUserProfileId: string | null;
  fileName: string | null;
  kind: MockMediaAsset["kind"];
  width?: number;
  height?: number;
  label?: string;
}) {
  const store = getStore();
  const asset: MockMediaAsset = {
    id: nextId("media"),
    ownerUserProfileId: input.ownerUserProfileId,
    fileName: input.fileName,
    kind: input.kind,
    width: input.width ?? 1024,
    height: input.height ?? 1024,
    url: svgDataUrl(input.label || input.fileName || "Mock Asset"),
    createdAt: new Date(),
  };
  store.mediaAssets.push(asset);
  return asset;
}

export function listTaskOutputs(taskId: string) {
  const store = getStore();
  return store.generatedImages.filter((item) => item.taskId === taskId);
}

export function ensureTaskOutputs(taskId: string) {
  const store = getStore();
  const task = store.generationTasks.find((item) => item.id === taskId);
  if (!task) return [];
  const existing = listTaskOutputs(taskId);
  if (existing.length > 0) return existing;

  const outputs: MockGeneratedImage[] = [];

  for (let index = 0; index < task.imageCount; index += 1) {
    const outputAsset = createMediaAsset({
      ownerUserProfileId: task.userProfileId,
      fileName: `generated-${task.id}-${index + 1}.png`,
      kind: "output",
      width: Number(task.size.split("x")[0]) || 1024,
      height: Number(task.size.split("x")[1]) || 1024,
      label: `${task.prompt.slice(0, 18)} ${index + 1}`,
    });
    const thumbnailAsset = createMediaAsset({
      ownerUserProfileId: task.userProfileId,
      fileName: `generated-${task.id}-${index + 1}.webp`,
      kind: "thumbnail",
      width: 640,
      height: 640,
      label: `${task.prompt.slice(0, 18)} ${index + 1}`,
    });
    const generated: MockGeneratedImage = {
      id: nextId("generated"),
      userProfileId: task.userProfileId,
      taskId: task.id,
      outputAssetId: outputAsset.id,
      thumbnailAssetId: thumbnailAsset.id,
      width: outputAsset.width,
      height: outputAsset.height,
      createdAt: new Date(),
    };
    store.generatedImages.push(generated);
    outputs.push(generated);
  }

  return outputs;
}

export function resolvePendingGenerations() {
  const store = getStore();
  const now = Date.now();

  for (const task of store.generationTasks) {
    if (task.status !== "queued" && task.status !== "running") continue;

    const age = now - task.createdAt.getTime();

    if (task.status === "queued" && age >= 1200) {
      task.status = "running";
      task.updatedAt = new Date();
      continue;
    }

    if (age >= 2600) {
      task.status = "succeeded";
      task.updatedAt = new Date();
      ensureTaskOutputs(task.id);
    }
  }
}

export function adjustProfileCredits(userProfileId: string, amount: number, reason: string, type: MockCreditLedger["type"]) {
  const store = getStore();
  const profile = store.profiles.find((item) => item.id === userProfileId);
  if (!profile) {
    throw new Error("用户不存在");
  }
  profile.creditBalance += amount;
  store.creditLedger.unshift({
    id: nextId("ledger"),
    userProfileId,
    amount,
    balanceAfter: profile.creditBalance,
    reason,
    type,
    createdAt: new Date(),
  });
  return profile;
}

export function createMockUser(input: { username: string; email: string; password: string }) {
  const store = getStore();
  const userId = nextId("user");
  const profileId = nextId("profile");
  const user: MockUser = {
    id: userId,
    email: input.email.trim().toLowerCase(),
    password: input.password,
    name: input.username,
    createdAt: new Date(),
  };
  const profile: MockUserProfile = {
    id: profileId,
    userId,
    username: input.username.trim(),
    role: "user",
    status: "active",
    creditBalance: 10,
    bio: "",
    createdAt: new Date(),
  };
  store.users.push(user);
  store.profiles.push(profile);
  store.creditLedger.unshift({
    id: nextId("ledger"),
    userProfileId: profileId,
    amount: 10,
    balanceAfter: 10,
    reason: "注册赠送积分",
    type: "grant",
    createdAt: new Date(),
  });
  return { user, profile };
}
