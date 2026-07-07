import { getStore, resolvePendingGenerations } from "@/server/bff/mock-store";
import type { MockFeedbackStatus, MockOrderStatus, MockTaskStatus } from "@/server/bff/mock-store";

function includesText(value: string | null | undefined, query?: string) {
  if (!query) return true;
  return (value || "").toLowerCase().includes(query.toLowerCase());
}

function userByProfileId(profileId: string) {
  const store = getStore();
  const profile = store.profiles.find((item) => item.id === profileId)!;
  const user = store.users.find((item) => item.id === profile.userId)!;
  return { profile, user };
}

function taskOutputs(taskId: string) {
  const store = getStore();
  return store.generatedImages.filter((item) => item.taskId === taskId);
}

export const prisma = {
  generatedImage: {
    async count(args?: { where?: { userProfileId?: string } }) {
      const store = getStore();
      return store.generatedImages.filter((item) => (args?.where?.userProfileId ? item.userProfileId === args.where.userProfileId : true)).length;
    },
  },
  creditPackage: {
    async findMany(args?: { where?: { isActive?: boolean }; orderBy?: { sortOrder?: "asc" | "desc" } }) {
      const store = getStore();
      return [...store.creditPackages]
        .filter((item) => (typeof args?.where?.isActive === "boolean" ? item.isActive === args.where.isActive : true))
        .sort((a, b) =>
          args?.orderBy?.sortOrder === "desc" ? b.sortOrder - a.sortOrder : a.sortOrder - b.sortOrder,
        );
    },
  },
  paymentOrder: {
    async count(args?: { where?: { userProfileId?: string; status?: MockOrderStatus } }) {
      const items = await prisma.paymentOrder.findMany({ where: args?.where });
      return items.length;
    },
    async findMany(args?: {
      where?: {
        userProfileId?: string;
        status?: MockOrderStatus;
        OR?: Array<{ orderNo?: { contains?: string }; providerTradeNo?: { contains?: string }; userProfile?: { user?: { email?: { contains?: string } } } }>;
      };
      include?: { userProfile?: { include?: { user?: true } }; creditPackage?: true };
      orderBy?: { createdAt?: "asc" | "desc" };
      skip?: number;
      take?: number;
    }) {
      const store = getStore();
      let items = [...store.paymentOrders];

      items = items.filter((order) => {
        if (args?.where?.userProfileId && order.userProfileId !== args.where.userProfileId) return false;
        if (args?.where?.status && order.status !== args.where.status) return false;
        if (args?.where?.OR?.length) {
          const query = args.where.OR[0]?.orderNo?.contains || args.where.OR[1]?.providerTradeNo?.contains || args.where.OR[2]?.userProfile?.user?.email?.contains;
          const { user } = userByProfileId(order.userProfileId);
          if (!includesText(order.orderNo, query) && !includesText(order.providerTradeNo, query) && !includesText(user.email, query)) {
            return false;
          }
        }
        return true;
      });

      items.sort((a, b) =>
        args?.orderBy?.createdAt === "asc"
          ? a.createdAt.getTime() - b.createdAt.getTime()
          : b.createdAt.getTime() - a.createdAt.getTime(),
      );

      const start = args?.skip || 0;
      const end = args?.take ? start + args.take : undefined;

      return items.slice(start, end).map((order) => {
        const creditPackage = store.creditPackages.find((item) => item.id === order.creditPackageId) || null;
        const { profile, user } = userByProfileId(order.userProfileId);
        return {
          ...order,
          ...(args?.include?.creditPackage ? { creditPackage } : {}),
          ...(args?.include?.userProfile
            ? {
                userProfile: {
                  ...profile,
                  ...(args.include.userProfile.include?.user ? { user } : {}),
                },
              }
            : {}),
        };
      });
    },
  },
  userProfile: {
    async count(args?: { where?: { status?: string; OR?: Array<{ username?: { contains?: string }; user?: { email?: { contains?: string } } }> } }) {
      const items = await prisma.userProfile.findMany({ where: args?.where });
      return items.length;
    },
    async findMany(args?: {
      where?: { status?: string; OR?: Array<{ username?: { contains?: string }; user?: { email?: { contains?: string } } }> };
      include?: { user?: true; _count?: { select?: { tasks?: true; paymentOrders?: true; creditLedger?: true } } };
      orderBy?: { createdAt?: "asc" | "desc" };
      skip?: number;
      take?: number;
    }) {
      const store = getStore();
      let items = [...store.profiles];
      const query = args?.where?.OR?.[0]?.username?.contains || args?.where?.OR?.[1]?.user?.email?.contains;

      items = items.filter((profile) => {
        const user = store.users.find((entry) => entry.id === profile.userId)!;
        if (args?.where?.status && profile.status !== args.where.status) return false;
        if (query && !includesText(profile.username, query) && !includesText(user.email, query)) return false;
        return true;
      });

      items.sort((a, b) =>
        args?.orderBy?.createdAt === "asc"
          ? a.createdAt.getTime() - b.createdAt.getTime()
          : b.createdAt.getTime() - a.createdAt.getTime(),
      );

      const start = args?.skip || 0;
      const end = args?.take ? start + args.take : undefined;

      return items.slice(start, end).map((profile) => {
        const user = store.users.find((entry) => entry.id === profile.userId)!;
        return {
          ...profile,
          ...(args?.include?.user ? { user } : {}),
          ...(args?.include?._count
            ? {
                _count: {
                  tasks: store.generationTasks.filter((task) => task.userProfileId === profile.id).length,
                  paymentOrders: store.paymentOrders.filter((order) => order.userProfileId === profile.id).length,
                  creditLedger: store.creditLedger.filter((ledger) => ledger.userProfileId === profile.id).length,
                },
              }
            : {}),
        };
      });
    },
    async findUnique(args: { where: { id: string }; include?: { user?: true } }) {
      const store = getStore();
      const profile = store.profiles.find((item) => item.id === args.where.id);
      if (!profile) return null;
      const user = store.users.find((entry) => entry.id === profile.userId)!;
      return {
        ...profile,
        ...(args.include?.user ? { user } : {}),
      };
    },
  },
  generationTask: {
    async count(args?: { where?: { status?: MockTaskStatus; OR?: Array<{ prompt?: { contains?: string }; model?: { contains?: string }; userProfile?: { user?: { email?: { contains?: string } } } }> } }) {
      const items = await prisma.generationTask.findMany({ where: args?.where });
      return items.length;
    },
    async findMany(args?: {
      where?: {
        userProfileId?: string;
        conversationId?: string;
        status?: MockTaskStatus;
        OR?: Array<{ prompt?: { contains?: string }; model?: { contains?: string }; userProfile?: { user?: { email?: { contains?: string } } } }>;
      };
      include?: { userProfile?: { include?: { user?: true } }; outputs?: true };
      orderBy?: { createdAt?: "asc" | "desc" };
      skip?: number;
      take?: number;
    }) {
      resolvePendingGenerations();
      const store = getStore();
      const query = args?.where?.OR?.[0]?.prompt?.contains || args?.where?.OR?.[1]?.model?.contains || args?.where?.OR?.[2]?.userProfile?.user?.email?.contains;
      const items = [...store.generationTasks].filter((task) => {
        const { user } = userByProfileId(task.userProfileId);
        if (args?.where?.userProfileId && task.userProfileId !== args.where.userProfileId) return false;
        if (args?.where?.conversationId && task.conversationId !== args.where.conversationId) return false;
        if (args?.where?.status && task.status !== args.where.status) return false;
        if (query && !includesText(task.prompt, query) && !includesText(task.model, query) && !includesText(user.email, query)) return false;
        return true;
      });

      items.sort((a, b) =>
        args?.orderBy?.createdAt === "asc"
          ? a.createdAt.getTime() - b.createdAt.getTime()
          : b.createdAt.getTime() - a.createdAt.getTime(),
      );

      const start = args?.skip || 0;
      const end = args?.take ? start + args.take : undefined;

      return items.slice(start, end).map((task) => {
        const { profile, user } = userByProfileId(task.userProfileId);
        return {
          ...task,
          ...(args?.include?.userProfile
            ? { userProfile: { ...profile, ...(args.include.userProfile.include?.user ? { user } : {}) } }
            : {}),
          ...(args?.include?.outputs ? { outputs: taskOutputs(task.id) } : {}),
        };
      });
    },
  },
  feedbackTicket: {
    async count(args?: { where?: { status?: { in?: MockFeedbackStatus[] } } }) {
      const store = getStore();
      return store.feedbackTickets.filter((ticket) => {
        if (args?.where?.status?.in?.length) {
          return args.where.status.in.includes(ticket.status);
        }
        return true;
      }).length;
    },
    async findMany(args?: {
      include?: { userProfile?: { include?: { user?: true } } };
      orderBy?: Array<{ lastMessageAt?: "asc" | "desc" } | { createdAt?: "asc" | "desc" }>;
      take?: number;
    }) {
      const store = getStore();
      const items = [...store.feedbackTickets].sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime());
      return items.slice(0, args?.take || items.length).map((ticket) => {
        const { profile, user } = userByProfileId(ticket.userProfileId);
        return {
          ...ticket,
          ...(args?.include?.userProfile
            ? { userProfile: { ...profile, ...(args.include.userProfile.include?.user ? { user } : {}) } }
            : {}),
        };
      });
    },
  },
  creditLedger: {
    async findMany(args?: { where?: { userProfileId?: string }; orderBy?: { createdAt?: "asc" | "desc" }; take?: number }) {
      const store = getStore();
      const items = store.creditLedger
        .filter((item) => (args?.where?.userProfileId ? item.userProfileId === args.where.userProfileId : true))
        .sort((a, b) =>
          args?.orderBy?.createdAt === "asc"
            ? a.createdAt.getTime() - b.createdAt.getTime()
            : b.createdAt.getTime() - a.createdAt.getTime(),
        );
      return items.slice(0, args?.take || items.length);
    },
  },
  adminAuditLog: {
    async findMany(args?: { include?: { admin?: { include?: { user?: true } } }; orderBy?: { createdAt?: "asc" | "desc" }; take?: number }) {
      const store = getStore();
      const items = [...store.adminAuditLogs].sort((a, b) =>
        args?.orderBy?.createdAt === "asc"
          ? a.createdAt.getTime() - b.createdAt.getTime()
          : b.createdAt.getTime() - a.createdAt.getTime(),
      );

      return items.slice(0, args?.take || items.length).map((log) => {
        const { profile, user } = userByProfileId(log.adminProfileId);
        return {
          ...log,
          ...(args?.include?.admin ? { admin: { ...profile, ...(args.include.admin.include?.user ? { user } : {}) } } : {}),
        };
      });
    },
  },
};
