import { cn } from "@/lib/utils";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Send, Bot, Sparkles, TrendingUp, ArrowUpRight, BarChart2, MessageSquare } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

interface Message {
  role: "user" | "assistant";
  content: React.ReactNode;
}

const ANALYTICS_DATA = [
  { day: 'Mon', views: 2400, engagement: 120 },
  { day: 'Tue', views: 3600, engagement: 250 },
  { day: 'Wed', views: 3200, engagement: 180 },
  { day: 'Thu', views: 4800, engagement: 320 },
  { day: 'Fri', views: 5200, engagement: 450 },
  { day: 'Sat', views: 6100, engagement: 580 },
  { day: 'Sun', views: 5800, engagement: 510 },
];

export default function Analytics() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "I've analyzed your performance across all channels. Your 'Fitness' content is outperforming 'Business' by 24% this week. Would you like me to draft more fitness-focused captions or dig deeper into the data?"
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMsg = inputValue;
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setInputValue("");

    // Simulate AI response
    setTimeout(() => {
      let responseContent: React.ReactNode = "I can help with that.";
      
      if (userMsg.toLowerCase().includes("caption")) {
        responseContent = (
          <div className="space-y-4">
            <p>Here are 3 caption options optimized for high engagement based on your top performing 'Fitness' posts:</p>
            <div className="space-y-3">
              <div className="p-4 bg-white/5 border border-white/10 rounded-lg hover:border-emerald-500/50 transition-colors cursor-pointer group">
                <div className="flex justify-between mb-2">
                  <span className="text-[10px] uppercase font-mono text-emerald-500">High Energy</span>
                  <ArrowUpRight className="w-3 h-3 text-zinc-500 group-hover:text-emerald-500" />
                </div>
                <p className="text-zinc-300 text-sm">"Consistency {'>'} Intensity. 🏋️‍♂️ It's not about the one hour you spend in the gym, it's about the 23 hours you spend recovering. #fitnessmindset #growth"</p>
              </div>
              <div className="p-4 bg-white/5 border border-white/10 rounded-lg hover:border-emerald-500/50 transition-colors cursor-pointer group">
                <div className="flex justify-between mb-2">
                  <span className="text-[10px] uppercase font-mono text-indigo-500">Educational</span>
                  <ArrowUpRight className="w-3 h-3 text-zinc-500 group-hover:text-indigo-500" />
                </div>
                <p className="text-zinc-300 text-sm">"3 drills to instantly improve your sprint mechanics. Save this for your next track session. ⚡️ #trackandfield #speedtraining"</p>
              </div>
            </div>
          </div>
        );
      } else if (userMsg.toLowerCase().includes("trend") || userMsg.toLowerCase().includes("perform")) {
         responseContent = (
           <div className="space-y-4">
             <p>Your engagement rate spiked on Saturday following the "Morning Routine" reel. Here is the breakdown:</p>
             <div className="h-[200px] w-full bg-white/5 rounded-lg border border-white/10 p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={ANALYTICS_DATA}>
                    <defs>
                      <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#000', borderColor: '#333', color: '#fff' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Area type="monotone" dataKey="engagement" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorEngagement)" />
                  </AreaChart>
                </ResponsiveContainer>
             </div>
           </div>
         );
      }

      setMessages(prev => [...prev, { role: "assistant", content: responseContent }]);
    }, 1500);
  };

  return (
    <Layout>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-8rem)]">
        {/* Left Column: Visual Analytics */}
        <div className="lg:col-span-8 flex flex-col gap-6 h-full overflow-y-auto pr-2">
          <div className="flex flex-col gap-2">
            <h1 className="font-display text-5xl font-bold tracking-tighter text-white uppercase leading-none">
              Intelligence
            </h1>
            <p className="font-mono text-zinc-500 uppercase tracking-widest text-sm">
              Real-time performance metrics & insight generation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <Card className="bg-zinc-900/30 border-white/10">
               <CardContent className="p-6">
                 <div className="flex items-center gap-2 mb-4 text-zinc-500">
                   <TrendingUp className="w-4 h-4" />
                   <span className="font-mono text-xs uppercase tracking-wider">Avg Engagement</span>
                 </div>
                 <div className="text-4xl font-display font-bold text-white">8.4%</div>
                 <div className="text-emerald-500 text-xs font-mono mt-2">+2.1% vs last week</div>
               </CardContent>
             </Card>
             <Card className="bg-zinc-900/30 border-white/10">
               <CardContent className="p-6">
                 <div className="flex items-center gap-2 mb-4 text-zinc-500">
                   <BarChart2 className="w-4 h-4" />
                   <span className="font-mono text-xs uppercase tracking-wider">Top Category</span>
                 </div>
                 <div className="text-4xl font-display font-bold text-white">Fitness</div>
                 <div className="text-zinc-500 text-xs font-mono mt-2">45% of total reach</div>
               </CardContent>
             </Card>
             <Card className="bg-zinc-900/30 border-white/10">
               <CardContent className="p-6">
                 <div className="flex items-center gap-2 mb-4 text-zinc-500">
                   <MessageSquare className="w-4 h-4" />
                   <span className="font-mono text-xs uppercase tracking-wider">Comments</span>
                 </div>
                 <div className="text-4xl font-display font-bold text-white">842</div>
                 <div className="text-emerald-500 text-xs font-mono mt-2">+124 new today</div>
               </CardContent>
             </Card>
          </div>

          <Card className="flex-1 bg-black border border-white/10 min-h-[300px]">
             <CardContent className="p-6 h-full flex flex-col">
               <div className="flex justify-between items-center mb-6">
                 <h3 className="font-display text-xl font-bold text-white">Reach Velocity</h3>
                 <div className="flex gap-2">
                   {['7D', '30D', '90D'].map(range => (
                     <button key={range} className="px-3 py-1 text-[10px] font-mono border border-zinc-800 hover:bg-white hover:text-black transition-colors uppercase text-zinc-500">
                       {range}
                     </button>
                   ))}
                 </div>
               </div>
               <div className="flex-1 w-full min-h-0">
                 <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={ANALYTICS_DATA}>
                      <XAxis dataKey="day" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                      <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} dx={-10} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#000', borderColor: '#333', color: '#fff' }}
                        itemStyle={{ color: '#fff' }}
                        cursor={{ stroke: '#333', strokeWidth: 1 }}
                      />
                      <Line type="monotone" dataKey="views" stroke="#fff" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#fff' }} />
                      <Line type="monotone" dataKey="engagement" stroke="#52525b" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                    </LineChart>
                 </ResponsiveContainer>
               </div>
             </CardContent>
          </Card>
        </div>

        {/* Right Column: AI Chat Interface */}
        <div className="lg:col-span-4 h-full">
          <Card className="h-full bg-[#09090b] border border-white/10 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-white/10 bg-zinc-900/30 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-black" />
              </div>
              <div>
                <h3 className="font-display text-sm font-bold text-white">Strategy Assistant</h3>
                <p className="text-[10px] font-mono text-emerald-500 uppercase flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Online
                </p>
              </div>
            </div>

            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-6">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    {msg.role === 'assistant' && (
                       <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 mt-1">
                         <Bot className="w-3 h-3 text-zinc-400" />
                       </div>
                    )}
                    <div 
                      className={cn(
                        "p-3 text-sm max-w-[85%]",
                        msg.role === 'user' 
                          ? "bg-white text-black font-medium" 
                          : "text-zinc-300 bg-transparent"
                      )}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="p-4 border-t border-white/10 bg-black">
              <div className="relative">
                <Input 
                  placeholder="Ask for insights or captions..." 
                  className="bg-zinc-900/50 border-zinc-800 focus:border-white pr-10 h-11 font-mono text-sm"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <Button 
                  size="icon" 
                  className="absolute right-1 top-1 h-9 w-9 bg-white text-black hover:bg-zinc-200"
                  onClick={handleSendMessage}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
