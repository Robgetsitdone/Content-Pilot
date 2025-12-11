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
    caption: "Snowboarding with the kids! 🏂 #family #travel",
  },
  {
    id: "4",
    title: "SaaS Metrics 101",
    thumbnail: "bg-purple-900",
    category: "Software",
    status: "scheduled",
    scheduledDate: addDays(new Date(), 3),
    caption: "CAC vs LTV explained simply. #saas #business",
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
