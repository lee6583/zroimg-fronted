import clsx from "clsx";
import { Search, X } from "lucide-react";
import Link from "next/link";
import { AppPagination } from "@/components/ui/app-pagination";
import workspace from "@/features/admin/admin-workspace.module.css";
import { GalleryCategoryManager } from "@/features/admin/gallery-category-manager";
import { GalleryReview } from "@/features/admin/gallery-review";
import { requireAdmin } from "@/server/auth";
import { requestJava } from "@/server/java-api";
import type { PageResult } from "@/types/api";
import type {
  AdminGalleryCategory,
  AdminGallerySubmission,
  AdminGallerySubmissionQuery,
  GalleryReviewStats,
} from "@/types/admin";
import type { GalleryCategory, GalleryStatus } from "@/types/gallery";
import { galleryStatusLabels, isGalleryStatus } from "@/utils/gallery";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type AdminGalleryPageProps = {
  searchParams: SearchParams;
};

type HrefInput = {
  status: GalleryStatus;
  category?: GalleryCategory;
  keyword?: string;
  userId?: string;
  pageSize?: number;
};

const statusTabs: GalleryStatus[] = ["pending", "approved", "rejected", "removed", "withdrawn"];
const defaultPageSize = 10;
const pageSizes = [10, 20, 50];

function readParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function normalizePage(value?: string) {
  const page = Number(value || 1);
  if (!Number.isFinite(page)) {
    return 1;
  }

  return Math.max(1, Math.floor(page));
}

function normalizePageSize(value?: string) {
  const size = Number(value || defaultPageSize);
  if (pageSizes.includes(size)) {
    return size;
  }

  return defaultPageSize;
}

function href(input: HrefInput) {
  const params = new URLSearchParams();
  if (input.status !== "pending") params.set("status", input.status);
  if (input.category) params.set("category", input.category);
  if (input.keyword) params.set("keyword", input.keyword);
  if (input.userId) params.set("userId", input.userId);
  if (input.pageSize && input.pageSize !== defaultPageSize) {
    params.set("pageSize", String(input.pageSize));
  }

  const query = params.toString();
  if (!query) {
    return "/admin/gallery";
  }

  return `/admin/gallery?${query}`;
}

export default async function AdminGalleryPage(props: AdminGalleryPageProps) {
  await requireAdmin();
  const searchParams = props.searchParams;
  const params = await searchParams;
  const rawStatus = readParam(params, "status");
  const rawCategory = readParam(params, "category");
  const status = isGalleryStatus(rawStatus) ? rawStatus : "pending";
  const categories = await requestJava<AdminGalleryCategory[]>("/gallery/admin/categories");
  let category: GalleryCategory | undefined;
  if (rawCategory && categories.some((item) => item.code === rawCategory)) {
    category = rawCategory;
  }
  const keyword = readParam(params, "keyword")?.trim() || undefined;
  const userId = readParam(params, "userId")?.trim() || undefined;
  const page = normalizePage(readParam(params, "page"));
  const pageSize = normalizePageSize(readParam(params, "pageSize"));

  const query: AdminGallerySubmissionQuery = {
    pageNo: page,
    pageSize,
    status,
    category,
    keyword,
    userId,
  };
  const [submissionPage, stats] = await Promise.all([
    requestJava<PageResult<AdminGallerySubmission>>("/gallery/admin/submissions", {
      params: query,
    }),
    requestJava<GalleryReviewStats>("/gallery/admin/submissions/stats"),
  ]);
  const filters = { category, keyword, userId, pageSize };

  return (
    <div className={workspace.workspace}>
      <header className={workspace.header}>
        <div className={workspace.headerCopy}>
          <h1 className="page-title">画廊审核</h1>
        </div>
        <div className={workspace.headerActions}>
          <GalleryCategoryManager initialCategories={categories} />
        </div>
      </header>

      <section className={workspace.panel}>
        <div className={workspace.toolbar}>
          <form className={workspace.search}>
            <Search size={15} aria-hidden="true" />
            <input
              name="keyword"
              defaultValue={keyword || ""}
              placeholder="搜索提示词、标题或用户"
            />
            {status !== "pending" ? <input type="hidden" name="status" value={status} /> : null}
            {category ? <input type="hidden" name="category" value={category} /> : null}
            {userId ? <input type="hidden" name="userId" value={userId} /> : null}
            {pageSize !== defaultPageSize ? (
              <input type="hidden" name="pageSize" value={pageSize} />
            ) : null}
            <button type="submit">搜索</button>
          </form>

          <nav className={workspace.filters} aria-label="作品分类筛选">
            <Link
              className={clsx(!category && workspace.filterActive)}
              href={href({ ...filters, status, category: undefined })}
            >
              全部分类
            </Link>
            {categories.map((item) => (
              <Link
                key={item.code}
                className={clsx(category === item.code && workspace.filterActive)}
                href={href({ ...filters, status, category: item.code })}
              >
                {item.nameZh}
                {item.status === "disabled" ? "（停用）" : ""}
              </Link>
            ))}
          </nav>
        </div>

        <div className={workspace.toolbar}>
          <nav className={workspace.filters} aria-label="审核状态筛选">
            {statusTabs.map((item) => {
              let label = galleryStatusLabels[item];
              if (item === "pending") {
                label = "待审核";
              }

              return (
                <Link
                  key={item}
                  className={clsx(status === item && workspace.filterActive)}
                  href={href({ ...filters, status: item })}
                >
                  {label} {stats[item]}
                </Link>
              );
            })}
          </nav>

          {userId ? (
            <Link
              className={workspace.secondaryAction}
              href={href({ ...filters, status, userId: undefined })}
            >
              用户 {userId}
              <X size={13} aria-hidden="true" />
            </Link>
          ) : null}
        </div>

        <GalleryReview
          key={`${status}:${page}:${submissionPage.list.map((item) => item.id).join(",")}`}
          status={status}
          submissions={submissionPage.list}
          categories={categories}
        />

        <footer className={workspace.footer}>
          <AppPagination current={page} pageSize={pageSize} total={submissionPage.total} />
        </footer>
      </section>
    </div>
  );
}
