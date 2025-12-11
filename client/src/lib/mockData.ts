import { addDays, subDays } from "date-fns";

export const CATEGORIES = [
  "Family",
  "Fitness",
  "Finances",
  "Travel",
  "Parenting",
  "Sales",
  "Business",
  "Technology",
  "Software",
  "Bay Area",
  "Track and Field",
];

export type VideoStatus = "posted" | "scheduled" | "draft" | "processing";

export interface Video {
  id: string;
  title: string;
  thumbnail: string; // URL or placeholder color
  category: string;
  status: VideoStatus;
  scheduledDate?: Date;
  caption?: string;
  views?: number;
}

export const MOCK_VIDEOS: Video[] = [
  {
    id: "1",
    title: "Morning Routine for Sales Success",
    thumbnail: "bg-indigo-900",
    category: "Sales",
    status: "posted",
    scheduledDate: subDays(new Date(), 2),
    views: 1240,
    caption: "Start your day with these 3 wins... #sales #morningroutine",
  },
  {
    id: "2",
    title: "Tech Trends in Bay Area 2025",
    thumbnail: "bg-blue-900",
    category: "Bay Area",
    status: "posted",
    scheduledDate: subDays(new Date(), 5),
    views: 3500,
    caption: "Is the valley back? Here's what I'm seeing... #tech #bayarea",
  },
  {
    id: "3",
    title: "Family Trip to Tahoe",
    thumbnail: "bg-green-900",
    category: "Family",
    status: "scheduled",
    scheduledDate: addDays(new Date(), 1),
    caption: "Snowboarding with the kids! 🏂 The snow was absolutely perfect this weekend. Here is a quick recap of our trip.",
  },
  {
    id: "4",
    title: "SaaS Metrics 101",
    thumbnail: "bg-purple-900",
    category: "Software",
    status: "scheduled",
    scheduledDate: addDays(new Date(), 3),
    caption: "CAC vs LTV explained simply. If you don't know these numbers, you don't have a business.",
  },
  {
    id: "5",
    title: "Track Workout: Speed Drills",
    thumbnail: "bg-orange-900",
    category: "Track and Field",
    status: "draft",
    caption: "Get faster with these 3 drills.",
  },
  {
    id: "6",
    title: "Investing for Kids",
    thumbnail: "bg-emerald-900",
    category: "Finances",
    status: "draft",
    caption: "Compound interest is the 8th wonder of the world.",
  },
  {
    id: "7",
    title: "Raw Footage_003.mp4",
    thumbnail: "bg-zinc-800",
    category: "Uncategorized",
    status: "processing",
  },
];

export interface StrategySettings {
  dripFrequency: number; // posts per week
  categoryWeights: Record<string, number>; // 0-100
}

export const INITIAL_STRATEGY: StrategySettings = {
  dripFrequency: 5,
  categoryWeights: {
    "Family": 20,
    "Business": 50,
    "Fitness": 30,
    // others default to 0
  },
};

export const POST_IDEAS = [
  {
    id: 1,
    title: "Reaction to OpenAI's Sora",
    category: "Technology",
    reason: "Trending in your niche",
    difficulty: "Easy"
  },
  {
    id: 2,
    title: "How I balance 3 kids + Startup",
    category: "Parenting",
    reason: "High engagement potential",
    difficulty: "Medium"
  },
  {
    id: 3,
    title: "Sales objection handling roleplay",
    category: "Sales",
    reason: "Frequently asked by followers",
    difficulty: "Hard"
  }
];

export const SOCIAL_TRENDS = [
  {
    id: 1,
    tag: "#DayInTheLife",
    volume: "2.4M posts",
    growth: "+15%"
  },
  {
    id: 2,
    tag: "#SaaSGrowth",
    volume: "850K posts",
    growth: "+22%"
  },
  {
    id: 3,
    tag: "Minimalist Setup",
    volume: "1.2M posts",
    growth: "+8%"
  }
];

export const WEEKLY_KPIS = {
  posts: { current: 3, target: 5 },
  reels: { current: 1, target: 3 },
  stories: { current: 12, target: 20 },
  shoutouts: { current: 2, target: 5 }
};
