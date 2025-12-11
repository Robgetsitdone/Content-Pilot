import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MOCK_VIDEOS, Video, CATEGORIES } from "@/lib/mockData";
import { ArrowUpRight, Calendar, Play, TrendingUp, Users, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

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

const UpcomingPost = ({ video }: { video: Video }) => (
  <div className="group flex items-center gap-6 p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer">
    <div className="font-mono text-zinc-600 text-sm group-hover:text-white transition-colors">
      {video.scheduledDate ? format(video.scheduledDate, "HH:mm") : "--:--"}
    </div>
    <div className={`w-24 h-16 ${video.thumbnail} grayscale group-hover:grayscale-0 transition-all duration-500 shrink-0`} />
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-3 mb-1">
        <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 group-hover:text-zinc-300">
          {video.category}
        </span>
      </div>
      <h4 className="font-display text-lg font-medium truncate text-zinc-300 group-hover:text-white transition-colors">
        {video.title}
      </h4>
    </div>
    <ArrowRight className="w-5 h-5 text-zinc-700 group-hover:text-white -translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300" />
  </div>
);

const COLORS = ['#ffffff', '#a1a1aa', '#52525b', '#27272a', '#18181b'];

export default function Dashboard() {
  const scheduledVideos = MOCK_VIDEOS.filter(v => v.status === "scheduled");
  
  const data = [
    { name: 'Business', value: 400 },
    { name: 'Family', value: 300 },
    { name: 'Fitness', value: 300 },
    { name: 'Travel', value: 200 },
    { name: 'Tech', value: 150 },
  ];

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
        {/* Main Chart Area */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          <div className="flex items-end justify-between border-b border-white/10 pb-4">
             <h3 className="font-display text-2xl font-bold uppercase tracking-tight">Mix Distribution</h3>
          </div>
          <div className="h-[400px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={140}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#000', borderColor: '#333', color: '#fff', borderRadius: '0px', fontFamily: 'monospace' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Label */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <span className="block font-display text-4xl font-bold">100%</span>
                <span className="block font-mono text-xs text-zinc-500 uppercase">Balanced</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {data.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-3 p-2 hover:bg-white/5 transition-colors">
                <div className="w-2 h-2" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="font-mono text-sm text-zinc-400 uppercase tracking-wider">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Queue */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          <div className="flex items-end justify-between border-b border-white/10 pb-4">
             <h3 className="font-display text-2xl font-bold uppercase tracking-tight">Production Queue</h3>
             <button className="text-sm font-mono text-zinc-500 hover:text-white transition-colors uppercase tracking-widest">
               View Full Calendar
             </button>
          </div>
          
          <div className="space-y-0">
            {scheduledVideos.map(video => (
              <UpcomingPost key={video.id} video={video} />
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
