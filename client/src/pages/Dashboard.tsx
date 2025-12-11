import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowUpRight, 
  ArrowDownRight,
  Calendar, 
  TrendingUp, 
  Share2, 
  Bookmark, 
  Eye, 
  CheckCircle2,
  Film,
  ImageIcon,
  Clock,
  AlertTriangle,
  Zap,
  Target,
  FileVideo,
  Play
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import type { Video } from "@shared/schema";

interface DashboardKPIs {
  output: {
    postsThisWeek: number;
    postsWoW: number;
    reelsPublished: number;
    storiesPosted: number;
    shortsPublished: number;
    feedPosts: number;
    consistencyScore: number;
  };
  pipeline: {
    scheduledNext7: number;
    scheduledNext30: number;
    draftsCount: number;
    processingCount: number;
    totalScheduled: number;
  };
  impact: {
    totalEngagement: number;
    engagementRate: string;
    totalShares: number;
    totalSaves: number;
    totalReach: number;
  };
  queues: {
    scheduled: Video[];
    drafts: Video[];
    processing: Video[];
  };
}

const useDashboardKPIs = () => {
  return useQuery<DashboardKPIs>({
    queryKey: ["/api/dashboard/kpis"],
    queryFn: async () => {
      const response = await fetch("/api/dashboard/kpis");
      if (!response.ok) throw new Error("Failed to fetch KPIs");
      return response.json();
    },
  });
};

const TrendBadge = ({ value, suffix = "%" }: { value: number; suffix?: string }) => {
  const isPositive = value >= 0;
  return (
    <div className={`flex items-center gap-1 px-2 py-1 rounded-sm ${
      isPositive ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
    }`}>
      {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      <span className="font-mono text-xs font-bold">{isPositive ? "+" : ""}{value}{suffix}</span>
    </div>
  );
};

const KPICard = ({ 
  title, 
  value, 
  trend, 
  icon: Icon, 
  subtitle,
  accentColor = "white"
}: { 
  title: string; 
  value: string | number; 
  trend?: number; 
  icon?: any;
  subtitle?: string;
  accentColor?: string;
}) => (
  <Card className="bg-transparent border-none p-0" data-testid={`kpi-${title.toLowerCase().replace(/\s+/g, '-')}`}>
    <CardContent className="p-0">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-zinc-500" />}
          <span className="font-mono text-xs text-zinc-500 uppercase tracking-widest">{title}</span>
        </div>
        <div className="flex items-baseline gap-3">
          <h3 className="text-4xl md:text-5xl font-display font-bold tracking-tighter" style={{ color: accentColor }}>
            {value}
          </h3>
          {trend !== undefined && <TrendBadge value={trend} />}
        </div>
        {subtitle && (
          <span className="font-mono text-[10px] text-zinc-600 uppercase tracking-wider">{subtitle}</span>
        )}
      </div>
    </CardContent>
  </Card>
);

const ConsistencyScore = ({ score }: { score: number }) => (
  <div className="flex flex-col gap-3" data-testid="consistency-score">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Target className="w-4 h-4 text-zinc-500" />
        <span className="font-mono text-xs text-zinc-500 uppercase tracking-widest">Consistency Score</span>
      </div>
      <span className="font-display text-3xl font-bold text-white">{score}%</span>
    </div>
    <Progress value={score} className="h-2 bg-zinc-900" />
    <span className="font-mono text-[10px] text-zinc-600 uppercase tracking-wider">
      {score >= 80 ? "Crushing it! Keep the momentum." : 
       score >= 50 ? "Good progress. Push for more consistency." : 
       "Fill the pipeline to boost your score."}
    </span>
  </div>
);

const PipelineWarning = ({ scheduledCount }: { scheduledCount: number }) => {
  if (scheduledCount >= 3) return null;
  return (
    <div className="flex items-center gap-3 p-4 border border-yellow-500/30 bg-yellow-500/5">
      <AlertTriangle className="w-5 h-5 text-yellow-500" />
      <div>
        <span className="font-display font-bold text-yellow-500">Content Gap Warning</span>
        <p className="font-mono text-xs text-zinc-500">Only {scheduledCount} post{scheduledCount !== 1 ? 's' : ''} scheduled for next 7 days. Fill the pipeline.</p>
      </div>
    </div>
  );
};

const QueueItem = ({ video }: { video: Video }) => (
  <div className="flex items-center gap-4 p-4 border-b border-white/5 hover:bg-white/5 transition-colors group" data-testid={`queue-item-${video.id}`}>
    <div className="w-16 h-10 bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
      {video.postType === "reel" || video.postType === "short" ? (
        <Film className="w-4 h-4 text-zinc-600" />
      ) : video.postType === "story" ? (
        <Play className="w-4 h-4 text-zinc-600" />
      ) : (
        <ImageIcon className="w-4 h-4 text-zinc-600" />
      )}
    </div>
    <div className="flex-1 min-w-0">
      <h4 className="font-display text-sm font-medium text-zinc-300 group-hover:text-white truncate">
        {video.title}
      </h4>
      <div className="flex items-center gap-2 mt-1">
        <span className="font-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 border border-zinc-800 text-zinc-500">
          {video.category}
        </span>
        {video.postType && (
          <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-600">
            {video.postType}
          </span>
        )}
      </div>
    </div>
    <div className="text-right shrink-0">
      {video.scheduledDate ? (
        <>
          <span className="font-display text-sm font-bold text-white">
            {format(new Date(video.scheduledDate), "MMM d")}
          </span>
          <span className="font-mono text-[10px] text-zinc-500 block">
            {format(new Date(video.scheduledDate), "h:mma")}
          </span>
        </>
      ) : (
        <span className="font-mono text-[10px] text-zinc-600 uppercase">Not scheduled</span>
      )}
    </div>
  </div>
);

export default function Dashboard() {
  const { data: kpis, isLoading } = useDashboardKPIs();

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <span className="font-mono text-zinc-500 uppercase tracking-widest animate-pulse">Loading KPIs...</span>
        </div>
      </Layout>
    );
  }

  const output = kpis?.output || { postsThisWeek: 0, postsWoW: 0, reelsPublished: 0, storiesPosted: 0, shortsPublished: 0, feedPosts: 0, consistencyScore: 0 };
  const pipeline = kpis?.pipeline || { scheduledNext7: 0, scheduledNext30: 0, draftsCount: 0, processingCount: 0, totalScheduled: 0 };
  const impact = kpis?.impact || { totalEngagement: 0, engagementRate: "0", totalShares: 0, totalSaves: 0, totalReach: 0 };
  const queues = kpis?.queues || { scheduled: [], drafts: [], processing: [] };

  return (
    <Layout>
      <header className="flex flex-col gap-4 mb-12">
        <h1 className="font-display text-6xl md:text-7xl font-bold tracking-tighter text-white uppercase leading-[0.85]">
          Command<br/><span className="text-zinc-700">Center</span>
        </h1>
        <p className="font-mono text-xs text-zinc-500 uppercase tracking-widest">
          Your Content Output & Performance Dashboard
        </p>
      </header>

      {/* TOP BAR - Output You Control */}
      <section className="mb-12">
        <div className="flex items-center gap-3 border-b border-white/10 pb-4 mb-8">
          <Zap className="w-5 h-5 text-white" />
          <h2 className="font-display text-xl font-bold uppercase tracking-tight text-white">Output You Control</h2>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 mb-8">
          <KPICard 
            title="Posts This Week" 
            value={output.postsThisWeek} 
            trend={output.postsWoW}
            icon={Calendar}
          />
          <KPICard 
            title="Reels" 
            value={output.reelsPublished}
            icon={Film}
            subtitle="Published"
          />
          <KPICard 
            title="Stories" 
            value={output.storiesPosted}
            icon={Play}
            subtitle="Posted"
          />
          <KPICard 
            title="Shorts" 
            value={output.shortsPublished}
            icon={FileVideo}
            subtitle="Published"
          />
          <KPICard 
            title="Next 7 Days" 
            value={pipeline.scheduledNext7}
            icon={Clock}
            subtitle="Planned"
          />
          <KPICard 
            title="Next 30 Days" 
            value={pipeline.scheduledNext30}
            icon={Calendar}
            subtitle="In Pipeline"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-6 border border-zinc-900 bg-black">
            <ConsistencyScore score={output.consistencyScore} />
          </div>
          <div className="p-6 border border-zinc-900 bg-black">
            <PipelineWarning scheduledCount={pipeline.scheduledNext7} />
            {pipeline.scheduledNext7 >= 3 && (
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <div>
                  <span className="font-display font-bold text-emerald-500">Pipeline Healthy</span>
                  <p className="font-mono text-xs text-zinc-500">{pipeline.scheduledNext7} pieces ready for the next 7 days.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* SECOND ROW - Impact Metrics */}
      <section className="mb-12">
        <div className="flex items-center gap-3 border-b border-white/10 pb-4 mb-8">
          <TrendingUp className="w-5 h-5 text-white" />
          <h2 className="font-display text-xl font-bold uppercase tracking-tight text-white">Impact Metrics</h2>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <KPICard 
            title="Engagement Rate" 
            value={`${impact.engagementRate}%`}
            icon={TrendingUp}
            accentColor="#10b981"
          />
          <KPICard 
            title="Shares" 
            value={impact.totalShares.toLocaleString()}
            icon={Share2}
          />
          <KPICard 
            title="Saves" 
            value={impact.totalSaves.toLocaleString()}
            icon={Bookmark}
          />
          <KPICard 
            title="Total Reach" 
            value={impact.totalReach > 1000 ? `${(impact.totalReach / 1000).toFixed(1)}K` : impact.totalReach.toString()}
            icon={Eye}
          />
        </div>
      </section>

      {/* THIRD ROW - Pipeline Queues */}
      <section>
        <div className="flex items-center gap-3 border-b border-white/10 pb-4 mb-8">
          <Calendar className="w-5 h-5 text-white" />
          <h2 className="font-display text-xl font-bold uppercase tracking-tight text-white">Pipeline</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Scheduled Queue */}
          <div className="border border-zinc-900 bg-black">
            <div className="p-4 border-b border-zinc-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                <h3 className="font-display font-bold uppercase text-sm">Scheduled</h3>
              </div>
              <span className="font-mono text-xs text-zinc-500">{pipeline.totalScheduled} total</span>
            </div>
            <div className="max-h-[300px] overflow-y-auto">
              {queues.scheduled.length > 0 ? (
                queues.scheduled.map((video) => (
                  <QueueItem key={video.id} video={video} />
                ))
              ) : (
                <div className="p-8 text-center">
                  <span className="font-mono text-xs text-zinc-600 uppercase">No scheduled posts</span>
                </div>
              )}
            </div>
          </div>

          {/* Drafts Queue */}
          <div className="border border-zinc-900 bg-black">
            <div className="p-4 border-b border-zinc-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                <h3 className="font-display font-bold uppercase text-sm">Drafts</h3>
              </div>
              <span className="font-mono text-xs text-zinc-500">{pipeline.draftsCount} total</span>
            </div>
            <div className="max-h-[300px] overflow-y-auto">
              {queues.drafts.length > 0 ? (
                queues.drafts.map((video) => (
                  <QueueItem key={video.id} video={video} />
                ))
              ) : (
                <div className="p-8 text-center">
                  <span className="font-mono text-xs text-zinc-600 uppercase">No drafts</span>
                </div>
              )}
            </div>
          </div>

          {/* Processing Queue */}
          <div className="border border-zinc-900 bg-black">
            <div className="p-4 border-b border-zinc-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <h3 className="font-display font-bold uppercase text-sm">Processing</h3>
              </div>
              <span className="font-mono text-xs text-zinc-500">{pipeline.processingCount} active</span>
            </div>
            <div className="max-h-[300px] overflow-y-auto">
              {queues.processing.length > 0 ? (
                queues.processing.map((video) => (
                  <QueueItem key={video.id} video={video} />
                ))
              ) : (
                <div className="p-8 text-center">
                  <span className="font-mono text-xs text-zinc-600 uppercase">No items processing</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
