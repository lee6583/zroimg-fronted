import { getStore, resolvePendingGenerations } from "@/server/bff/mock-store";
import type { MockFeedbackStatus, MockOrderStatus, MockTaskStatus } from "@/server/bff/mock-store";

function includesText(value: string | null | undefined, query?: string) {
  // 没有搜索关键词时，默认匹配成功。
  if (!query) {
    return true;
  }

  const safeValue = value || "";
  const lowerValue = safeValue.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const isIncluded = lowerValue.includes(lowerQuery);

  return isIncluded;
}

function userByProfileId(profileId: string) {
  const store = getStore();
  const profile = store.profiles.find((item) => {
    return item.id === profileId;
  });

  if (!profile) {
    throw new Error(`没有找到用户资料：${profileId}`);
  }

  const user = store.users.find((item) => {
    return item.id === profile.userId;
  });

  if (!user) {
    throw new Error(`没有找到用户：${profile.userId}`);
  }

  return { profile, user };
}

function taskOutputs(taskId: string) {
  const store = getStore();

  const outputs = store.generatedImages.filter((image) => {
    return image.taskId === taskId;
  });

  return outputs;
}

export const prisma = {
  generatedImage: {
    async count(args?: { where?: { userProfileId?: string } }) {
      const store = getStore();
      const userProfileId = args?.where?.userProfileId;

      const images = store.generatedImages.filter((image) => {
        if (!userProfileId) {
          return true;
        }

        return image.userProfileId === userProfileId;
      });

      return images.length;
    },
  },
  creditPackage: {
    async findMany(args?: {
      where?: { isActive?: boolean };
      orderBy?: { sortOrder?: "asc" | "desc" };
    }) {
      const store = getStore();
      const direction = args?.orderBy?.sortOrder ?? "asc";
      const isDescending = direction === "desc";
      const activeFilter = args?.where?.isActive;

      // 第一步：复制套餐列表，避免直接修改 mock 原始数据顺序。
      let items = [...store.creditPackages];

      // 第二步：如果传入启用状态，则按启用状态过滤。
      if (typeof activeFilter === "boolean") {
        items = items.filter((item) => {
          return item.isActive === activeFilter;
        });
      }

      // 第三步：按照后台配置的排序值排序。
      items.sort((itemA, itemB) => {
        const orderA = itemA.sortOrder;
        const orderB = itemB.sortOrder;

        if (isDescending) {
          return orderB - orderA;
        }

        return orderA - orderB;
      });

      return items;
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
        OR?: Array<{
          orderNo?: { contains?: string };
          providerTradeNo?: { contains?: string };
          userProfile?: { user?: { email?: { contains?: string } } };
        }>;
      };
      include?: { userProfile?: { include?: { user?: true } }; creditPackage?: true };
      orderBy?: { createdAt?: "asc" | "desc" };
      skip?: number;
      take?: number;
    }) {
      const store = getStore();
      let items = [...store.paymentOrders];
      const where = args?.where;
      const query =
        where?.OR?.[0]?.orderNo?.contains ||
        where?.OR?.[1]?.providerTradeNo?.contains ||
        where?.OR?.[2]?.userProfile?.user?.email?.contains;

      // 第一步：按用户、状态和关键词过滤订单。
      items = items.filter((order) => {
        if (where?.userProfileId && order.userProfileId !== where.userProfileId) {
          return false;
        }

        if (where?.status && order.status !== where.status) {
          return false;
        }

        if (where?.OR?.length) {
          const { user } = userByProfileId(order.userProfileId);

          const orderNoMatched = includesText(order.orderNo, query);
          const tradeNoMatched = includesText(order.providerTradeNo, query);
          const emailMatched = includesText(user.email, query);

          if (!orderNoMatched && !tradeNoMatched && !emailMatched) {
            return false;
          }
        }

        return true;
      });

      // 第二步：按创建时间排序。
      const direction = args?.orderBy?.createdAt ?? "desc";
      const isAscending = direction === "asc";
      items.sort((orderA, orderB) => {
        const timeA = orderA.createdAt.getTime();
        const timeB = orderB.createdAt.getTime();

        if (isAscending) {
          return timeA - timeB;
        }

        return timeB - timeA;
      });

      const start = args?.skip || 0;
      const end = args?.take ? start + args.take : undefined;
      const pageItems = items.slice(start, end);

      // 第三步：给当前页订单补充套餐和用户信息。
      const orders = pageItems.map((order) => {
        const foundPackage = store.creditPackages.find((item) => {
          return item.id === order.creditPackageId;
        });
        const creditPackage = foundPackage || null;
        const { profile, user } = userByProfileId(order.userProfileId);
        type OrderResult = typeof order & {
          creditPackage?: typeof creditPackage;
          userProfile?: typeof profile & { user?: typeof user };
        };

        const result: OrderResult = { ...order };

        if (args?.include?.creditPackage) {
          result.creditPackage = creditPackage;
        }

        if (args?.include?.userProfile) {
          const userProfile: typeof profile & { user?: typeof user } = { ...profile };

          if (args.include.userProfile.include?.user) {
            userProfile.user = user;
          }

          result.userProfile = userProfile;
        }

        return result;
      });

      return orders;
    },
  },
  userProfile: {
    async count(args?: {
      where?: {
        status?: string;
        OR?: Array<{ username?: { contains?: string }; user?: { email?: { contains?: string } } }>;
      };
    }) {
      const items = await prisma.userProfile.findMany({ where: args?.where });
      return items.length;
    },
    async findMany(args?: {
      where?: {
        status?: string;
        OR?: Array<{ username?: { contains?: string }; user?: { email?: { contains?: string } } }>;
      };
      include?: {
        user?: true;
        _count?: { select?: { tasks?: true; paymentOrders?: true; creditLedger?: true } };
      };
      orderBy?: { createdAt?: "asc" | "desc" };
      skip?: number;
      take?: number;
    }) {
      const store = getStore();
      let items = [...store.profiles];
      const where = args?.where;
      const query = where?.OR?.[0]?.username?.contains || where?.OR?.[1]?.user?.email?.contains;

      // 第一步：按状态和关键词过滤用户资料。
      items = items.filter((profile) => {
        const user = store.users.find((entry) => {
          return entry.id === profile.userId;
        });

        if (!user) {
          throw new Error(`没有找到用户：${profile.userId}`);
        }

        if (where?.status && profile.status !== where.status) {
          return false;
        }

        const usernameMatched = includesText(profile.username, query);
        const emailMatched = includesText(user.email, query);

        if (query && !usernameMatched && !emailMatched) {
          return false;
        }

        return true;
      });

      // 第二步：按创建时间排序。
      const direction = args?.orderBy?.createdAt ?? "desc";
      const isAscending = direction === "asc";
      items.sort((profileA, profileB) => {
        const timeA = profileA.createdAt.getTime();
        const timeB = profileB.createdAt.getTime();

        if (isAscending) {
          return timeA - timeB;
        }

        return timeB - timeA;
      });

      const start = args?.skip || 0;
      const end = args?.take ? start + args.take : undefined;
      const pageItems = items.slice(start, end);

      // 第三步：给当前页用户补充关联用户和统计数量。
      const profiles = pageItems.map((profile) => {
        const user = store.users.find((entry) => {
          return entry.id === profile.userId;
        });

        if (!user) {
          throw new Error(`没有找到用户：${profile.userId}`);
        }

        const tasks = store.generationTasks.filter((task) => {
          return task.userProfileId === profile.id;
        });

        const paymentOrders = store.paymentOrders.filter((order) => {
          return order.userProfileId === profile.id;
        });

        const creditLedger = store.creditLedger.filter((ledger) => {
          return ledger.userProfileId === profile.id;
        });

        type ProfileResult = typeof profile & {
          user?: typeof user;
          _count?: {
            tasks: number;
            paymentOrders: number;
            creditLedger: number;
          };
        };

        const result: ProfileResult = { ...profile };

        if (args?.include?.user) {
          result.user = user;
        }

        if (args?.include?._count) {
          const count = {
            tasks: tasks.length,
            paymentOrders: paymentOrders.length,
            creditLedger: creditLedger.length,
          };

          result._count = count;
        }

        return result;
      });

      return profiles;
    },
    async findUnique(args: { where: { id: string }; include?: { user?: true } }) {
      const store = getStore();
      const profile = store.profiles.find((item) => item.id === args.where.id);
      if (!profile) return null;
      const user = store.users.find((entry) => {
        return entry.id === profile.userId;
      });

      if (!user) {
        throw new Error(`没有找到用户：${profile.userId}`);
      }

      const result: typeof profile & { user?: typeof user } = { ...profile };

      if (args.include?.user) {
        result.user = user;
      }

      return result;
    },
  },
  generationTask: {
    async count(args?: {
      where?: {
        status?: MockTaskStatus;
        OR?: Array<{
          prompt?: { contains?: string };
          model?: { contains?: string };
          userProfile?: { user?: { email?: { contains?: string } } };
        }>;
      };
    }) {
      const items = await prisma.generationTask.findMany({ where: args?.where });
      return items.length;
    },
    async findMany(args?: {
      where?: {
        userProfileId?: string;
        conversationId?: string;
        status?: MockTaskStatus;
        OR?: Array<{
          prompt?: { contains?: string };
          model?: { contains?: string };
          userProfile?: { user?: { email?: { contains?: string } } };
        }>;
      };
      include?: { userProfile?: { include?: { user?: true } }; outputs?: true };
      orderBy?: { createdAt?: "asc" | "desc" };
      skip?: number;
      take?: number;
    }) {
      resolvePendingGenerations();
      const store = getStore();
      const where = args?.where;
      const query =
        where?.OR?.[0]?.prompt?.contains ||
        where?.OR?.[1]?.model?.contains ||
        where?.OR?.[2]?.userProfile?.user?.email?.contains;

      // 第一步：按用户、对话、状态和关键词过滤任务。
      const items = store.generationTasks.filter((task) => {
        const { user } = userByProfileId(task.userProfileId);

        if (where?.userProfileId && task.userProfileId !== where.userProfileId) {
          return false;
        }

        if (where?.conversationId && task.conversationId !== where.conversationId) {
          return false;
        }

        if (where?.status && task.status !== where.status) {
          return false;
        }

        const promptMatched = includesText(task.prompt, query);
        const modelMatched = includesText(task.model, query);
        const emailMatched = includesText(user.email, query);

        if (query && !promptMatched && !modelMatched && !emailMatched) {
          return false;
        }

        return true;
      });

      // 第二步：按创建时间排序。
      const direction = args?.orderBy?.createdAt ?? "desc";
      const isAscending = direction === "asc";
      items.sort((taskA, taskB) => {
        const timeA = taskA.createdAt.getTime();
        const timeB = taskB.createdAt.getTime();

        if (isAscending) {
          return timeA - timeB;
        }

        return timeB - timeA;
      });

      const start = args?.skip || 0;
      const end = args?.take ? start + args.take : undefined;
      const pageItems = items.slice(start, end);

      // 第三步：给当前页任务补充用户和输出图片。
      const tasks = pageItems.map((task) => {
        const { profile, user } = userByProfileId(task.userProfileId);
        type TaskResult = typeof task & {
          userProfile?: typeof profile & { user?: typeof user };
          outputs?: ReturnType<typeof taskOutputs>;
        };

        const result: TaskResult = { ...task };

        if (args?.include?.userProfile) {
          const profileWithUser: typeof profile & { user?: typeof user } = { ...profile };

          if (args.include.userProfile.include?.user) {
            profileWithUser.user = user;
          }

          result.userProfile = profileWithUser;
        }

        if (args?.include?.outputs) {
          result.outputs = taskOutputs(task.id);
        }

        return result;
      });

      return tasks;
    },
  },
  feedbackTicket: {
    async count(args?: { where?: { status?: { in?: MockFeedbackStatus[] } } }) {
      const store = getStore();
      const tickets = store.feedbackTickets.filter((ticket) => {
        if (args?.where?.status?.in?.length) {
          return args.where.status.in.includes(ticket.status);
        }

        return true;
      });

      return tickets.length;
    },
    async findMany(args?: {
      include?: { userProfile?: { include?: { user?: true } } };
      orderBy?: Array<{ lastMessageAt?: "asc" | "desc" } | { createdAt?: "asc" | "desc" }>;
      take?: number;
    }) {
      const store = getStore();
      const items = [...store.feedbackTickets];

      // 第一步：按照最后回复时间，从新到旧排序。
      items.sort((ticketA, ticketB) => {
        const timeA = ticketA.lastMessageAt.getTime();
        const timeB = ticketB.lastMessageAt.getTime();

        return timeB - timeA;
      });

      // 第二步：截取需要展示的数量。
      const take = args?.take || items.length;
      const pageItems = items.slice(0, take);

      // 第三步：按需补充用户信息。
      const tickets = pageItems.map((ticket) => {
        const { profile, user } = userByProfileId(ticket.userProfileId);
        type TicketResult = typeof ticket & {
          userProfile?: typeof profile & { user?: typeof user };
        };

        const result: TicketResult = { ...ticket };

        if (args?.include?.userProfile) {
          const profileWithUser: typeof profile & { user?: typeof user } = { ...profile };

          if (args.include.userProfile.include?.user) {
            profileWithUser.user = user;
          }

          result.userProfile = profileWithUser;
        }

        return result;
      });

      return tickets;
    },
  },
  creditLedger: {
    async findMany(args?: {
      where?: { userProfileId?: string };
      orderBy?: { createdAt?: "asc" | "desc" };
      take?: number;
    }) {
      const store = getStore();
      const direction = args?.orderBy?.createdAt ?? "desc";
      const isAscending = direction === "asc";
      const userProfileId = args?.where?.userProfileId;

      // 第一步：按用户过滤积分流水。
      const items = store.creditLedger.filter((item) => {
        if (!userProfileId) {
          return true;
        }

        return item.userProfileId === userProfileId;
      });

      // 第二步：按创建时间排序。
      items.sort((itemA, itemB) => {
        const timeA = itemA.createdAt.getTime();
        const timeB = itemB.createdAt.getTime();

        if (isAscending) {
          return timeA - timeB;
        }

        return timeB - timeA;
      });

      // 第三步：截取需要展示的数量。
      const take = args?.take || items.length;
      const pageItems = items.slice(0, take);

      return pageItems;
    },
  },
  adminAuditLog: {
    async findMany(args?: {
      include?: { admin?: { include?: { user?: true } } };
      orderBy?: { createdAt?: "asc" | "desc" };
      take?: number;
    }) {
      const store = getStore();
      const direction = args?.orderBy?.createdAt ?? "desc";
      const isAscending = direction === "asc";
      const items = [...store.adminAuditLogs];

      // 第一步：按创建时间排序。
      items.sort((logA, logB) => {
        const timeA = logA.createdAt.getTime();
        const timeB = logB.createdAt.getTime();

        if (isAscending) {
          return timeA - timeB;
        }

        return timeB - timeA;
      });

      // 第二步：截取需要展示的数量。
      const take = args?.take || items.length;
      const pageItems = items.slice(0, take);

      // 第三步：按需补充管理员用户信息。
      const logs = pageItems.map((log) => {
        const { profile, user } = userByProfileId(log.adminProfileId);
        type LogResult = typeof log & {
          admin?: typeof profile & { user?: typeof user };
        };

        const result: LogResult = { ...log };

        if (args?.include?.admin) {
          const admin: typeof profile & { user?: typeof user } = { ...profile };

          if (args.include.admin.include?.user) {
            admin.user = user;
          }

          result.admin = admin;
        }

        return result;
      });

      return logs;
    },
  },
};
