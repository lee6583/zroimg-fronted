"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { galleryApi } from "@/api/generation/gallery";
import { useRouter } from "@/i18n/navigation";
import type { GalleryCursorPage, GalleryImage } from "@/types/gallery";
import { ApiRequestError } from "@/utils/request";
import { CreatorCard } from "./creator-card";
import { GalleryCard } from "./gallery-card";
import { GalleryDetail } from "./gallery-detail";
import {
  breakpointIndexFor,
  columnWidthFor,
  heightExpression,
  layoutMasonry,
  masonryBreakpoints,
  placementTop,
  cardFooterHeight,
  toAspectRatio,
  type MasonryItem,
  type MasonryPlacement,
} from "./masonry";
import styles from "./gallery-feed.module.css";

type GalleryFeedProps = {
  category?: string;
  initialPage: GalleryCursorPage<GalleryImage>;
  initialDetail: GalleryImage | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
};

type FeedState = {
  items: GalleryImage[];
  nextCursor: string | null;
  hasMore: boolean;
};

type LoadStatus = "idle" | "loading" | "error";

type SavedFeed = FeedState & {
  scrollY: number;
  savedAt: number;
};

type CreatorTarget = {
  userId: string;
  name: string;
  avatarUrl: string | null;
  anchor: DOMRect | null;
};

type Viewport = {
  breakpoint: number;
  columnWidth: number;
  // 瀑布流容器在页面中的 top，以及当前可视区域（页面坐标）
  offsetTop: number;
  scrollY: number;
  height: number;
};

const pageSize = 24;
const skeletonCount = 8;
const skeletonRatio = 0.8;
// 超过这个数量才开始只渲染屏幕附近的卡片
const virtualizeAfter = 150;
// 屏幕上下各保留约 2 屏的卡片
const overscanScreens = 2;
// 返回时恢复的列表最多保留这么多条，避免 sessionStorage 过大
const maxSavedItems = 480;
const savedTtl = 30 * 60 * 1000;
// 浏览器前进/后退的时间：返回本页时据此判断是否恢复列表（点导航新进入不恢复）
let lastPopstate = { at: 0, href: "" };
let isPopstateTracked = false;
let isFirstMount = true;

function trackPopstate() {
  if (isPopstateTracked) return;
  isPopstateTracked = true;
  // 只注册一次且不移除：离开画廊后按返回键，popstate 先于画廊重新挂载触发
  window.addEventListener("popstate", () => {
    lastPopstate = { at: Date.now(), href: window.location.href };
  });
}

function isHistoryNavigation() {
  // 整页加载（例如从站外返回）时看导航类型；之后的站内返回看最近一次 popstate
  if (isFirstMount) {
    isFirstMount = false;
    const entry = performance.getEntriesByType("navigation")[0];
    if (entry instanceof PerformanceNavigationTiming && entry.type === "back_forward") {
      return true;
    }
  }

  // 开发环境首次编译可能较慢，时间窗放宽；同时要求地址一致，避免误把点导航进入当成返回
  const isRecent = Date.now() - lastPopstate.at < 15000;
  return isRecent && lastPopstate.href === window.location.href;
}

function storageKey(category?: string) {
  return `zroimg:gallery:${category || "all"}`;
}

function readSaved(key: string): SavedFeed | null {
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;
    const saved = JSON.parse(raw) as SavedFeed;
    const isFresh = Date.now() - saved.savedAt < savedTtl;
    if (!isFresh || !Array.isArray(saved.items)) return null;
    return saved;
  } catch {
    return null;
  }
}

function writeSaved(key: string, feed: FeedState) {
  try {
    // 只保留前 maxSavedItems 条；被截断时下一页游标失效，改为从头加载
    const items = feed.items.slice(0, maxSavedItems);
    const isTruncated = items.length < feed.items.length;
    const saved: SavedFeed = {
      items,
      nextCursor: isTruncated ? null : feed.nextCursor,
      hasMore: isTruncated ? false : feed.hasMore,
      scrollY: window.scrollY,
      savedAt: Date.now(),
    };
    window.sessionStorage.setItem(key, JSON.stringify(saved));
  } catch {
    // 存储已满或被禁用：返回时从第一页开始，不影响浏览
  }
}

function cardStyle(placements: MasonryPlacement[], aspectRatio: number) {
  const style: Record<string, string | number> = { "--ar": aspectRatio };
  placements.forEach((placement, index) => {
    const level = index + 1;
    style[`--c${level}`] = placement.column;
    style[`--s${level}`] = placement.ratioSum.toFixed(4);
    style[`--k${level}`] = placement.count;
  });
  return style as CSSProperties;
}

function mergeItems(current: GalleryImage[], next: GalleryImage[]) {
  const ids = new Set(current.map((item) => item.id));
  const fresh = next.filter((item) => !ids.has(item.id));
  return [...current, ...fresh];
}

export function GalleryFeed(props: GalleryFeedProps) {
  const category = props.category;
  const isLoggedIn = props.isLoggedIn;
  const isAdmin = props.isAdmin;
  const t = useTranslations("gallery");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const key = storageKey(category);

  const [feed, setFeed] = useState<FeedState>({
    items: props.initialPage.items,
    nextCursor: props.initialPage.nextCursor,
    hasMore: props.initialPage.hasMore,
  });
  const [status, setStatus] = useState<LoadStatus>("idle");
  const [viewport, setViewport] = useState<Viewport | null>(null);
  const [creator, setCreator] = useState<CreatorTarget | null>(null);
  const [fetchedDetail, setFetchedDetail] = useState<GalleryImage | null>(props.initialDetail);
  const [detailError, setDetailError] = useState("");
  const masonryRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  // 恢复列表后要滚动到的位置；等恢复的数据真正渲染后再滚动，否则页面高度不够会被截断
  const pendingScrollRef = useRef<{ y: number; items: GalleryImage[] } | null>(null);
  const hasPushedDetailRef = useRef(false);
  const feedRef = useRef(feed);
  const statusRef = useRef(status);

  const items = feed.items;
  const detailId = searchParams.get("image") || "";
  const isLoading = status === "loading";
  const isVirtual = items.length > virtualizeAfter;

  useEffect(() => {
    feedRef.current = feed;
    statusRef.current = status;
  });

  // 第一步：按返回键回到本页时，从 sessionStorage 恢复已加载的列表和滚动位置
  useLayoutEffect(() => {
    const isBack = isHistoryNavigation();
    trackPopstate();
    if (!isBack) return;

    const saved = readSaved(key);
    if (saved && saved.items.length > 0) {
      pendingScrollRef.current = { y: saved.scrollY, items: saved.items };
      // 恢复必须在首帧绘制前完成，否则会先闪一下第一页再跳动
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFeed({ items: saved.items, nextCursor: saved.nextCursor, hasMore: saved.hasMore });
    }
  }, [key]);

  useLayoutEffect(() => {
    const pending = pendingScrollRef.current;
    if (!pending || pending.items !== feed.items) return;
    window.scrollTo(0, pending.y);
    pendingScrollRef.current = null;
  }, [feed]);

  // 第二步：离开页面、滚动时保存，返回时恢复
  useEffect(() => {
    let timer = 0;

    function save() {
      writeSaved(key, feedRef.current);
    }

    function saveLater() {
      window.clearTimeout(timer);
      timer = window.setTimeout(save, 200);
    }

    window.addEventListener("scroll", saveLater, { passive: true });
    window.addEventListener("pagehide", save);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", saveLater);
      window.removeEventListener("pagehide", save);
      save();
    };
  }, [key]);

  useEffect(() => {
    writeSaved(key, feed);
  }, [key, feed]);

  const loadMore = useCallback(async () => {
    const current = feedRef.current;
    if (statusRef.current === "loading" || !current.hasMore || !current.nextCursor) {
      return;
    }

    statusRef.current = "loading";
    setStatus("loading");
    try {
      const page = await galleryApi.listPublicImages({
        category,
        cursor: current.nextCursor,
        limit: pageSize,
      });
      setFeed((previous) => ({
        items: mergeItems(previous.items, page.items),
        nextCursor: page.nextCursor,
        hasMore: page.hasMore,
      }));
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }, [category]);

  // 第三步：哨兵进入底部前 1200px 时加载下一页；每次加载完重新观察，屏幕很高时会继续加载
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !feed.hasMore || status !== "idle") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void loadMore();
        }
      },
      { rootMargin: "0px 0px 1200px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [feed.hasMore, feed.items.length, status, loadMore]);

  // 第四步：列表很长时只渲染屏幕附近的卡片（离开范围的卡片和图片一起卸载，释放内存）
  useEffect(() => {
    if (!isVirtual) return;

    let frame = 0;
    function measure() {
      frame = 0;
      const element = masonryRef.current;
      if (!element) return;
      const rect = element.getBoundingClientRect();
      const breakpoint = breakpointIndexFor(window.innerWidth);
      setViewport({
        breakpoint,
        columnWidth: columnWidthFor(element.clientWidth, breakpoint),
        offsetTop: rect.top + window.scrollY,
        scrollY: window.scrollY,
        height: window.innerHeight,
      });
    }

    function schedule() {
      if (!frame) frame = window.requestAnimationFrame(measure);
    }

    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [isVirtual]);

  // 详情：列表里有就直接用；直接打开分享链接时请求接口（详情里的提示词是完整的）
  useEffect(() => {
    if (!detailId) return;

    let isActive = true;
    galleryApi
      .getPublicImage(detailId)
      .then((detail) => {
        if (!isActive) return;
        setFetchedDetail(detail);
        setDetailError("");
      })
      .catch(() => {
        if (isActive) setDetailError(detailId);
      });

    return () => {
      isActive = false;
    };
  }, [detailId]);

  const masonryItems = useMemo(() => {
    const list: MasonryItem[] = items.map((item) => ({
      key: item.id,
      aspectRatio: toAspectRatio(item.generatedImage.width, item.generatedImage.height),
    }));
    if (isLoading) {
      for (let index = 0; index < skeletonCount; index += 1) {
        list.push({ key: `skeleton-${index}`, aspectRatio: skeletonRatio });
      }
    }
    return list;
  }, [items, isLoading]);

  const layout = useMemo(() => layoutMasonry(masonryItems), [masonryItems]);

  const masonryStyle = useMemo(() => {
    const style: Record<string, string> = {};
    layout.columns.forEach((columns, index) => {
      style[`--h${index + 1}`] = heightExpression(columns);
    });
    return style as CSSProperties;
  }, [layout]);

  function isNearViewport(placement: MasonryPlacement[], aspectRatio: number) {
    if (!isVirtual || !viewport) return true;

    const breakpoint = masonryBreakpoints[viewport.breakpoint];
    const position = placement[viewport.breakpoint];
    const top = viewport.offsetTop + placementTop(position, viewport.columnWidth, breakpoint.gap);
    const height = viewport.columnWidth / aspectRatio + cardFooterHeight;
    const margin = viewport.height * overscanScreens;
    const viewTop = viewport.scrollY - margin;
    const viewBottom = viewport.scrollY + viewport.height + margin;
    return top + height >= viewTop && top <= viewBottom;
  }

  function detailHref(id: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("image", id);
    return `${pathname}?${params.toString()}`;
  }

  function openDetail(item: GalleryImage) {
    setCreator(null);
    hasPushedDetailRef.current = true;
    // 原生 pushState 与 Next 路由同步：只改地址栏，不重新请求页面；返回键即可关闭
    window.history.pushState(null, "", detailHref(item.id));
  }

  function closeDetail() {
    setCreator(null);
    if (hasPushedDetailRef.current) {
      hasPushedDetailRef.current = false;
      window.history.back();
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.delete("image");
    const query = params.toString();
    window.history.replaceState(null, "", query ? `${pathname}?${query}` : pathname);
  }

  function openCreator(item: GalleryImage, anchor: HTMLElement) {
    const name = item.userProfile.username || item.userProfile.user?.name || t("card.anonymous");
    setCreator({
      userId: item.userId,
      name,
      avatarUrl: item.userProfile.avatarUrl,
      anchor: anchor.getBoundingClientRect(),
    });
  }

  function applyLike(id: string, liked: boolean, likeCount: number) {
    const update = (item: GalleryImage) => {
      if (item.id !== id) return item;
      return { ...item, liked, likeCount };
    };
    setFeed((current) => ({ ...current, items: current.items.map(update) }));
    setFetchedDetail((current) => (current ? update(current) : current));
  }

  async function toggleLike(item: GalleryImage) {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    // 先乐观更新，失败时回滚
    const nextLiked = !item.liked;
    const delta = nextLiked ? 1 : -1;
    applyLike(item.id, nextLiked, Math.max(0, item.likeCount + delta));
    try {
      const result = nextLiked ? await galleryApi.like(item.id) : await galleryApi.unlike(item.id);
      applyLike(item.id, result.liked, result.likeCount);
    } catch (error) {
      applyLike(item.id, item.liked, item.likeCount);
      if (error instanceof ApiRequestError && error.status === 401) {
        router.push("/login");
      }
    }
  }

  // 详情数据：优先用列表里的（点赞状态最新），再用接口返回的完整提示词
  const listItem = items.find((item) => item.id === detailId) ?? null;
  let detailItem: GalleryImage | null = null;
  if (detailId && fetchedDetail?.id === detailId) {
    detailItem = fetchedDetail;
    if (listItem) {
      detailItem = { ...fetchedDetail, liked: listItem.liked, likeCount: listItem.likeCount };
    }
  } else if (listItem) {
    detailItem = listItem;
  }
  const isDetailLoading = Boolean(detailId) && fetchedDetail?.id !== detailId;
  const hasDetailError = detailError === detailId;

  let likeDisabledReason: string | undefined;
  if (isAdmin) {
    likeDisabledReason = t("like.adminBlocked");
  }

  let footer = null;
  if (status === "loading") {
    footer = <p className={styles.feed__status}>{t("feed.loadingMore")}</p>;
  } else if (status === "error") {
    footer = (
      <p className={styles.feed__status}>
        {t("feed.error")}
        <button type="button" className={styles.feed__retry} onClick={() => void loadMore()}>
          {t("feed.retry")}
        </button>
      </p>
    );
  } else if (!feed.hasMore && items.length > 0) {
    footer = <p className={styles.feed__status}>{t("feed.end")}</p>;
  }

  return (
    <>
      <div className={styles.feed}>
        <div
          ref={masonryRef}
          className={styles.masonry}
          style={masonryStyle}
          aria-label={t("feed.label")}
          role="feed"
          aria-busy={isLoading}
        >
          {masonryItems.map((entry, index) => {
            const placement = layout.placements[index];
            if (!isNearViewport(placement, entry.aspectRatio)) {
              return null;
            }

            const style = cardStyle(placement, entry.aspectRatio);
            const item = items[index];
            if (!item) {
              return (
                <div key={entry.key} className={styles.skeleton} style={style} aria-hidden="true">
                  <div className={styles.skeleton__media} />
                  <div className={styles.skeleton__line} />
                  <div className={styles.skeleton__lineShort} />
                </div>
              );
            }

            return (
              <GalleryCard
                key={item.id}
                item={item}
                href={detailHref(item.id)}
                style={style}
                isEager={index < 6}
                isLikeDisabled={isAdmin}
                likeDisabledReason={likeDisabledReason}
                onOpen={openDetail}
                onOpenCreator={openCreator}
                onToggleLike={toggleLike}
              />
            );
          })}
        </div>
        <div ref={sentinelRef} className={styles.feed__sentinel} aria-hidden="true" />
        {footer}
      </div>

      <GalleryDetail
        isOpen={Boolean(detailId)}
        item={detailItem}
        isLoading={isDetailLoading}
        hasError={hasDetailError}
        isLikeDisabled={isAdmin}
        likeDisabledReason={likeDisabledReason}
        onClose={closeDetail}
        onToggleLike={toggleLike}
        onOpenCreator={openCreator}
      />

      {creator ? (
        <CreatorCard
          key={creator.userId}
          userId={creator.userId}
          name={creator.name}
          avatarUrl={creator.avatarUrl}
          anchor={creator.anchor}
          onClose={() => setCreator(null)}
        />
      ) : null}
    </>
  );
}
