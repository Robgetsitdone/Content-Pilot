import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { UploadModal } from "@/components/UploadModal";
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
  Play,
  Lightbulb,
  RefreshCw,
  Flame,
  UploadCloud,
  Wand2,
  Plus
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { Video } from "@shared/schema";
import { POST_IDEAS, SOCIAL_TRENDS } from "@/lib/mockData";

const COLORS = ['#ffffff', '#a1a1aa', '#52525b', '#27272a', '#18181b'];

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
  
  const [mixData, setMixData] = useState([
    { name: 'Business', value: 400 },
    { name: 'Family', value: 300 },
    { name: 'Fitness', value: 300 },
    { name: 'Travel', value: 200 },
    { name: 'Tech', value: 150 },
  ]);

  const handleResetMix = () => {
    setMixData([
      { name: 'Business', value: 20 },
      { name: 'Family', value: 20 },
      { name: 'Fitness', value: 20 },
      { name: 'Travel', value: 20 },
      { name: 'Tech', value: 20 },
    ]);
  };

  const handleSliceClick = (index: number) => {
    const newData = [...mixData];
    newData[index].value += 50;
    setMixData(newData);
  };

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
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-8">
        <div>
          <h1 className="font-display text-6xl md:text-7xl font-bold tracking-tighter text-white uppercase leading-[0.85]">
            Command<br/><span className="text-zinc-700">Center</span>
          </h1>
          <p className="font-mono text-xs text-zinc-500 uppercase tracking-widest">
            Your Content Output & Performance Dashboard
          </p>
        </div>
        <UploadModal />
      </header>

      <section className="mb-12">
        <UploadModal 
          trigger={
            <button 
              className="w-full group relative overflow-hidden border-2 border-dashed border-primary/40 hover:border-primary bg-gradient-to-r from-violet-500/5 to-fuchsia-500/5 hover:from-violet-500/10 hover:to-fuchsia-500/10 transition-all duration-300 p-8 cursor-pointer"
              data-testid="button-quick-upload"
            >
              <div className="flex items-center justify-center gap-6">
                <div className="w-16 h-16 border-2 border-dashed border-primary/60 group-hover:border-primary flex items-center justify-center transition-all group-hover:scale-110">
                  <UploadCloud className="w-8 h-8 text-primary/80 group-hover:text-primary transition-colors" />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-display text-2xl font-bold text-white uppercase">Quick Upload</h3>
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-primary/20 border border-primary/30">
                      <Wand2 className="w-3 h-3 text-primary" />
                      <span className="font-mono text-[10px] text-primary uppercase">AI Powered</span>
                    </div>
                  </div>
                  <p className="font-mono text-xs text-zinc-500 uppercase tracking-widest">
                    Drop images here for instant AI analysis & caption generation
                  </p>
                </div>
                <Plus className="w-10 h-10 text-primary/50 group-hover:text-primary transition-colors ml-auto" />
              </div>
            </button>
          }
        />
      </section>

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

      {/* FOURTH ROW - Ideas & Inspiration */}
      <section className="mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Column: Mix & Trends */}
          <div className="lg:col-span-4 flex flex-col gap-12">
            {/* Mix Distribution */}
            <div className="flex flex-col gap-8">
              <div className="flex items-end justify-between border-b border-white/10 pb-4">
                <h3 className="font-display text-2xl font-bold uppercase tracking-tight">Mix Control</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleResetMix}
                  className="text-xs font-mono uppercase hover:bg-white hover:text-black h-6"
                  data-testid="button-reset-mix"
                >
                  <RefreshCw className="w-3 h-3 mr-2" />
                  Reset
                </Button>
              </div>
              <div className="h-[300px] w-full relative group">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={mixData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                      onClick={(_, index) => handleSliceClick(index)}
                      className="cursor-pointer outline-none"
                    >
                      {mixData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]} 
                          className="hover:opacity-80 transition-opacity outline-none"
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#000', borderColor: '#333', color: '#fff', borderRadius: '0px', fontFamily: 'monospace' }}
                      itemStyle={{ color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center group-hover:scale-110 transition-transform">
                    <span className="block font-display text-3xl font-bold">Mix</span>
                    <span className="block font-mono text-[10px] text-zinc-500 uppercase">Interactive</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {mixData.map((entry, index) => (
                  <div 
                    key={entry.name} 
                    className="flex items-center gap-2 px-3 py-1 border border-zinc-800 hover:border-zinc-600 transition-colors cursor-pointer"
                    onClick={() => handleSliceClick(index)}
                    data-testid={`mix-category-${entry.name.toLowerCase()}`}
                  >
                    <div className="w-2 h-2" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="font-mono text-xs text-zinc-400 uppercase tracking-wider">{entry.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Trending Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                <Flame className="w-5 h-5 text-white" />
                <h3 className="font-display text-2xl font-bold uppercase tracking-tight">Trending Now</h3>
              </div>
              <div className="space-y-3">
                {SOCIAL_TRENDS.map((trend) => (
                  <div key={trend.id} className="p-4 border border-zinc-900 bg-zinc-900/20 hover:border-zinc-700 transition-colors" data-testid={`trend-${trend.id}`}>
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-white">{trend.tag}</span>
                      <span className="text-emerald-500 text-xs font-mono">{trend.growth}</span>
                    </div>
                    <span className="text-xs text-zinc-500 font-mono uppercase">{trend.volume}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Post Ideas */}
          <div className="lg:col-span-8 flex flex-col gap-12">
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                <Lightbulb className="w-5 h-5 text-white" />
                <h3 className="font-display text-2xl font-bold uppercase tracking-tight">Personalized Ideas</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {POST_IDEAS.map((idea) => (
                  <div key={idea.id} className="p-6 border border-zinc-800 bg-black hover:bg-zinc-900 hover:border-zinc-600 transition-all cursor-pointer group" data-testid={`idea-${idea.id}`}>
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-[10px] font-mono uppercase border border-zinc-800 px-2 py-0.5 text-zinc-500">
                        {idea.difficulty}
                      </span>
                      <ArrowUpRight className="w-4 h-4 text-zinc-700 group-hover:text-white transition-colors" />
                    </div>
                    <h4 className="font-display text-lg font-bold text-zinc-200 group-hover:text-white mb-2 leading-tight">
                      {idea.title}
                    </h4>
                    <p className="text-xs text-zinc-500 font-mono">
                      Why: {idea.reason}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
