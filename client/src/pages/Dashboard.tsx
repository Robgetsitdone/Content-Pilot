import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MOCK_VIDEOS, Video, CATEGORIES } from "@/lib/mockData";
import { ArrowUpRight, Calendar, Play, TrendingUp, Users } from "lucide-react";
import { format } from "date-fns";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const StatCard = ({ title, value, trend, icon: Icon }: any) => (
  <Card className="glass-panel border-white/5">
    <CardContent className="p-6">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h3 className="text-3xl font-bold mt-2 font-mono">{value}</h3>
        </div>
        <div className="p-2 bg-primary/10 rounded-lg">
          <Icon className="w-5 h-5 text-primary" />
        </div>
      </div>
      <div className="flex items-center mt-4 text-xs text-emerald-400 gap-1">
        <ArrowUpRight className="w-3 h-3" />
        <span className="font-medium">{trend}</span>
        <span className="text-muted-foreground ml-1">vs last month</span>
      </div>
    </CardContent>
  </Card>
);

const UpcomingPost = ({ video }: { video: Video }) => (
  <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors border border-transparent hover:border-white/5 group cursor-pointer">
    <div className={`w-16 h-16 rounded-lg ${video.thumbnail} flex items-center justify-center shrink-0`}>
      <Play className="w-6 h-6 text-white/70 group-hover:text-white transition-colors" fill="currentColor" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/20">
          {video.category}
        </span>
        <span className="text-xs text-muted-foreground">
          {video.scheduledDate ? format(video.scheduledDate, "MMM d, h:mm a") : "Unscheduled"}
        </span>
      </div>
      <h4 className="font-medium truncate text-sm md:text-base group-hover:text-primary transition-colors">
        {video.title}
      </h4>
    </div>
  </div>
);

const COLORS = ['#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#3b82f6'];

export default function Dashboard() {
  const scheduledVideos = MOCK_VIDEOS.filter(v => v.status === "scheduled");
  
  // Mock distribution data
  const data = [
    { name: 'Business', value: 400 },
    { name: 'Family', value: 300 },
    { name: 'Fitness', value: 300 },
    { name: 'Travel', value: 200 },
    { name: 'Tech', value: 150 },
  ];

  return (
    <Layout>
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Your content strategy performance at a glance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Views" value="48.2K" trend="+12%" icon={TrendingUp} />
        <StatCard title="Scheduled Posts" value="12" trend="+4" icon={Calendar} />
        <StatCard title="Follower Growth" value="2,340" trend="+8.5%" icon={Users} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart Area */}
        <Card className="lg:col-span-2 glass-panel border-white/5">
          <CardHeader>
            <CardTitle>Content Mix Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0.2)" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {data.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-sm text-muted-foreground">{entry.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Queue */}
        <Card className="glass-panel border-white/5">
          <CardHeader>
            <CardTitle>Up Next</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {scheduledVideos.map(video => (
              <UpcomingPost key={video.id} video={video} />
            ))}
            <div className="pt-4 border-t border-white/5">
               <button className="w-full py-2 text-sm text-center text-muted-foreground hover:text-primary transition-colors">
                 View full calendar →
               </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
