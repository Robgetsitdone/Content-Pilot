import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { MOCK_VIDEOS, Video, POST_IDEAS, SOCIAL_TRENDS } from "@/lib/mockData";
import { ArrowUpRight, Calendar, TrendingUp, Users, ArrowRight, Lightbulb, RefreshCw, Flame } from "lucide-react";
import { format } from "date-fns";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const StatCard = ({ title, value, trend, icon: Icon }: any) => (
  <Card className="bg-transparent border-none p-0">
    <CardContent className="p-0">
      <div className="flex flex-col gap-1">
        <span className="font-mono text-xs text-zinc-500 uppercase tracking-widest">{title}</span>
        <div className="flex items-baseline gap-4">
          <h3 className="text-5xl md:text-6xl font-display font-bold text-white tracking-tighter">{value}</h3>
          <div className="flex items-center text-emerald-500 gap-1 bg-emerald-500/10 px-2 py-1 rounded-sm">
            <ArrowUpRight className="w-3 h-3" />
            <span className="font-mono text-xs font-bold">{trend}</span>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

const CATEGORY_COLORS: Record<string, string> = {
  "Business": "#ffffff",
  "Family": "#a1a1aa",
  "Fitness": "#52525b",
  "Travel": "#27272a",
  "Tech": "#18181b",
  "Sales": "#e4e4e7",
  "Software": "#d4d4d8"
};

const UpcomingPost = ({ video }: { video: Video }) => {
  const color = CATEGORY_COLORS[video.category] || "#52525b";
  
  return (
    <div className="group flex items-start gap-6 p-6 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer relative overflow-hidden">
      {/* Category Color Line */}
      <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: color }} />
      
      <div className="flex flex-col gap-1 min-w-[80px]">
        <span className="font-display text-xl font-bold text-white">
          {video.scheduledDate ? format(video.scheduledDate, "HH:mm") : "--:--"}
        </span>
        <span className="font-mono text-xs text-zinc-500 uppercase">
          {video.scheduledDate ? format(video.scheduledDate, "MMM dd") : "TBD"}
        </span>
      </div>

      <div className={`w-32 h-20 ${video.thumbnail} grayscale group-hover:grayscale-0 transition-all duration-500 shrink-0 border border-white/10`} />
      
      <div className="flex-1 min-w-0 flex flex-col justify-between h-20 py-1">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="font-mono text-[10px] uppercase tracking-widest px-2 py-0.5 border border-zinc-800 text-zinc-400 group-hover:text-white group-hover:border-zinc-600 transition-colors">
              {video.category}
            </span>
          </div>
          <h4 className="font-display text-lg font-medium truncate text-zinc-200 group-hover:text-white transition-colors leading-none">
            {video.title}
          </h4>
        </div>
        <p className="text-sm text-zinc-500 truncate font-mono group-hover:text-zinc-400">
          {video.caption || "No caption added yet..."}
        </p>
      </div>
      
      <ArrowRight className="w-5 h-5 text-zinc-700 group-hover:text-white self-center -translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300" />
    </div>
  );
};

const COLORS = ['#ffffff', '#a1a1aa', '#52525b', '#27272a', '#18181b'];

export default function Dashboard() {
  const scheduledVideos = MOCK_VIDEOS.filter(v => v.status === "scheduled");
  
  // Initial state for distribution
  const [data, setData] = useState([
    { name: 'Business', value: 400 },
    { name: 'Family', value: 300 },
    { name: 'Fitness', value: 300 },
    { name: 'Travel', value: 200 },
    { name: 'Tech', value: 150 },
  ]);

  const handleResetMix = () => {
    setData([
      { name: 'Business', value: 20 },
      { name: 'Family', value: 20 },
      { name: 'Fitness', value: 20 },
      { name: 'Travel', value: 20 },
      { name: 'Tech', value: 20 },
    ]);
  };

  const handleSliceClick = (index: number) => {
    // Simple mock interaction: boost the clicked category slightly
    const newData = [...data];
    newData[index].value += 50;
    setData(newData);
  };

  return (
    <Layout>
      <header className="flex flex-col gap-4 mb-16">
        <h1 className="font-display text-7xl md:text-8xl font-bold tracking-tighter text-white uppercase leading-[0.8]">
          Command<br/><span className="text-zinc-800">Center</span>
        </h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16 border-y border-white/10 py-12">
        <StatCard title="Total Views" value="48.2K" trend="+12%" icon={TrendingUp} />
        <StatCard title="Queue" value="12" trend="+4" icon={Calendar} />
        <StatCard title="Audience" value="2.3K" trend="+8.5%" icon={Users} />
      </div>

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
               >
                 <RefreshCw className="w-3 h-3 mr-2" />
                 Reset
               </Button>
            </div>
            <div className="h-[300px] w-full relative group">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
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
                    {data.map((entry, index) => (
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
              {data.map((entry, index) => (
                <div 
                  key={entry.name} 
                  className="flex items-center gap-2 px-3 py-1 border border-zinc-800 hover:border-zinc-600 transition-colors cursor-pointer"
                  onClick={() => handleSliceClick(index)}
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
                <div key={trend.id} className="p-4 border border-zinc-900 bg-zinc-900/20 hover:border-zinc-700 transition-colors">
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

        {/* Right Column: Queue & Ideas */}
        <div className="lg:col-span-8 flex flex-col gap-12">
          {/* Post Ideas */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
               <Lightbulb className="w-5 h-5 text-white" />
               <h3 className="font-display text-2xl font-bold uppercase tracking-tight">Personalized Ideas</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {POST_IDEAS.map((idea) => (
                <div key={idea.id} className="p-6 border border-zinc-800 bg-black hover:bg-zinc-900 hover:border-zinc-600 transition-all cursor-pointer group">
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

          {/* Production Queue */}
          <div className="flex flex-col gap-6">
            <div className="flex items-end justify-between border-b border-white/10 pb-4">
               <h3 className="font-display text-2xl font-bold uppercase tracking-tight">Production Queue</h3>
               <button className="text-sm font-mono text-zinc-500 hover:text-white transition-colors uppercase tracking-widest">
                 View Full Calendar
               </button>
            </div>
            
            <div className="space-y-0 border-x border-t border-white/5">
              {scheduledVideos.map(video => (
                <UpcomingPost key={video.id} video={video} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
