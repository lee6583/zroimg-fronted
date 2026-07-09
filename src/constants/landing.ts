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

export type LandingIconCard = {
  icon: LucideIcon;
  title: string;
  text: string;
};

export const landingStats = [
  { value: "10K+", label: "已生成图片" },
  { value: "500+", label: "活跃用户" },
  { value: "95%", label: "满意度" },
];

export const landingFeatures: LandingIconCard[] = [
  {
    icon: MessageSquare,
    title: "对话式创作",
    text: "像聊天一样描述画面，人物、场景、光线、风格，都可以用一句话慢慢调整。",
  },
  {
    icon: Palette,
    title: "多种风格",
    text: "写实、动漫、水彩、油画、极简海报、商品视觉，为不同场景快速找到合适气质。",
  },
  {
    icon: Layers,
    title: "批量探索",
    text: "一次生成多张变体，适合探索方向、挑选构图，也适合把灵感快速铺开。",
  },
  {
    icon: ImagePlus,
    title: "参考图再创作",
    text: "上传参考图，保留主体、替换背景、调整风格，让旧素材长出新的可能。",
  },
  {
    icon: Download,
    title: "高清输出",
    text: "适合头像、封面、海报、商品图和社媒配图，让作品能直接进入使用场景。",
  },
  {
    icon: Coins,
    title: "灵活积分",
    text: "按需购买积分，用多少生成多少；适合轻量尝试，也适合持续创作。",
  },
];

export const landingSteps: LandingIconCard[] = [
  {
    icon: Settings,
    title: "注册账号",
    text: "几秒钟即可免费注册，无需信用卡。注册后立即获得积分。",
  },
  {
    icon: MessageSquare,
    title: "描述你的构想",
    text: "开启对话，描述你想要的画面。持续迭代，直到触动你的灵感。",
  },
  {
    icon: Sparkles,
    title: "AI 生成作品",
    text: "AI 解读你的提示词，数秒内产出高质量图像。生成多个变体探索方向。",
  },
  {
    icon: Download,
    title: "下载分享",
    text: "将作品高清下载或直接分享。所有图片都保留在画廊中，随时回看。",
  },
];

export const landingAdvantages = [
  "不需要会画画，也能把脑海里的构图讲清楚。",
  "从头像、商品图到海报封面，都能快速探索方向。",
  "每一次生成都会留下记录，满意的图可以继续编辑。",
  "积分按需购买，适合偶尔创作，也适合长期产出。",
];
