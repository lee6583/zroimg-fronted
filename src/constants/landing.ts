import type { LucideIcon } from "lucide-react";
import {
  Coins,
  Download,
  ImagePlus,
  Layers,
  MessageSquare,
  Palette,
  Settings,
  Sparkles,
} from "lucide-react";

// 落地页只在这里定义结构和图标；标题和正文在 messages 的 landing.* 下，key 与这里的 key 一一对应。

type LandingFeatureKey = "conversation" | "styles" | "batch" | "reference" | "hd" | "credits";
type LandingStepKey = "register" | "describe" | "generate" | "share";
type LandingStatKey = "images" | "users" | "satisfaction";
type LandingAdvantageKey = "noDrawing" | "explore" | "history" | "credits";

type LandingIconCard<K extends string> = {
  key: K;
  icon: LucideIcon;
};

type LandingStat = {
  key: LandingStatKey;
  value: string;
};

export const landingStats: LandingStat[] = [
  { key: "images", value: "10K+" },
  { key: "users", value: "500+" },
  { key: "satisfaction", value: "95%" },
];

export const landingFeatures: Array<LandingIconCard<LandingFeatureKey>> = [
  { key: "conversation", icon: MessageSquare },
  { key: "styles", icon: Palette },
  { key: "batch", icon: Layers },
  { key: "reference", icon: ImagePlus },
  { key: "hd", icon: Download },
  { key: "credits", icon: Coins },
];

export const landingSteps: Array<LandingIconCard<LandingStepKey>> = [
  { key: "register", icon: Settings },
  { key: "describe", icon: MessageSquare },
  { key: "generate", icon: Sparkles },
  { key: "share", icon: Download },
];

export const landingAdvantages: LandingAdvantageKey[] = [
  "noDrawing",
  "explore",
  "history",
  "credits",
];
