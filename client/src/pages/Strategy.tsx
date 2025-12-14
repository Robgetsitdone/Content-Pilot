import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CATEGORIES } from "@/lib/mockData";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Activity, Zap, Layers, Cpu, Calendar, Sparkles } from "lucide-react";

async function apiRequest(method: string, url: string, data?: any) {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: data ? JSON.stringify(data) : undefined,
  });
  if (!res.ok) throw new Error("API error");
  return res.json();
}

const STRATEGY_PRESETS: Record<string, Record<string, number>> = {
  "Family Focus": { Family: 25, Parenting: 20, Lifestyle: 15, Fitness: 5, "Gym + Life + Fitness": 5, Travel: 5, Business: 5, Education: 5, Entertainment: 5, Food: 5, General: 5 },
  "Fitness Heavy": { Fitness: 25, "Gym + Life + Fitness": 20, Lifestyle: 15, Family: 5, Parenting: 5, Travel: 5, Business: 5, Education: 5, Entertainment: 5, Food: 5, General: 5 },
  "Balanced": { Family: 9, Parenting: 9, Fitness: 9, "Gym + Life + Fitness": 9, Travel: 9, Business: 9, Lifestyle: 9, Education: 9, Entertainment: 9, Food: 9, General: 10 },
  "Business Mode": { Business: 25, Education: 20, Lifestyle: 15, Family: 5, Parenting: 5, Fitness: 5, "Gym + Life + Fitness": 5, Travel: 5, Entertainment: 5, Food: 5, General: 5 },
};

export default function Strategy() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: strategyData } = useQuery({
    queryKey: ["/api/strategy"],
    queryFn: () => fetch("/api/strategy").then(r => r.json()),
  });

  const [weights, setWeights] = useState<Record<string, number>>({});
  const [frequency, setFrequency] = useState([5]);

  useEffect(() => {
    if (strategyData) {
      setWeights(strategyData.categoryWeights || {});
      setFrequency([strategyData.dripFrequency || 5]);
    }
  }, [strategyData]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/strategy", {
        dripFrequency: frequency[0],
        categoryWeights: weights,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/strategy"] });
      toast({
        title: "Strategy Saved",
        description: "Your content strategy has been updated.",
        duration: 3000,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save strategy. Please try again.",
        variant: "destructive",
      });
    },
  });

  const autoScheduleMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/videos/auto-schedule", {});
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      toast({
        title: "Auto-Scheduled!",
        description: `Successfully scheduled ${data.scheduled || 0} posts based on your strategy.`,
        duration: 5000,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to auto-schedule posts. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleWeightChange = (category: string, value: number[]) => {
    setWeights(prev => ({
      ...prev,
      [category]: value[0]
    }));
  };

  return (
    <Layout>
       <div className="flex flex-col gap-4 mb-16">
        <h1 className="font-display text-6xl md:text-7xl font-bold tracking-tighter text-white uppercase leading-none">
          Strategy<br/><span className="text-zinc-800">Engine</span>
        </h1>
        <p className="font-mono text-zinc-500 uppercase tracking-widest text-sm max-w-2xl">
          Configure distribution algorithms and weight parameters for optimal audience engagement.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-12">
          <div className="space-y-6 mb-12">
            <div className="flex items-center gap-4 border-b border-white/10 pb-4">
              <Sparkles className="w-6 h-6 text-white" />
              <h3 className="font-display text-2xl font-bold uppercase tracking-tight">Quick Presets</h3>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(STRATEGY_PRESETS).map(([name, preset]) => (
                <Button
                  key={name}
                  variant="outline"
                  className="h-14 rounded-none border-zinc-700 hover:bg-white hover:text-black font-mono text-xs uppercase tracking-wider"
                  onClick={() => setWeights(preset)}
                  data-testid={`preset-${name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {name}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-8">
             <div className="flex items-center gap-4 border-b border-white/10 pb-4">
                <Layers className="w-6 h-6 text-white" />
                <h3 className="font-display text-2xl font-bold uppercase tracking-tight">Category Weights</h3>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              {CATEGORIES.map((category) => (
                <div key={category} className="space-y-4 group">
                  <div className="flex justify-between items-end">
                    <Label className="font-display text-lg font-bold uppercase tracking-tight text-zinc-400 group-hover:text-white transition-colors">{category}</Label>
                    <span className="font-mono text-xs text-zinc-500 bg-zinc-900 px-2 py-1 border border-zinc-800">
                      {weights[category] || 0}%
                    </span>
                  </div>
                  <div className="relative pt-2">
                    <Slider
                      value={[weights[category] || 0]}
                      max={100}
                      step={5}
                      onValueChange={(val) => handleWeightChange(category, val)}
                      className="[&>.relative>.bg-primary]:bg-white [&>.relative]:h-1 [&>span]:h-4 [&>span]:w-4 [&>span]:border-2 [&>span]:border-white [&>span]:bg-black [&>span]:rounded-none"
                    />
                  </div>
                </div>
              ))}
             </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
           <div className="heavy-card p-6 bg-zinc-900/20 border-white/10">
            <div className="flex items-center gap-3 mb-6">
              <Zap className="w-5 h-5 text-white" />
              <h3 className="font-display text-xl font-bold uppercase">Velocity</h3>
            </div>
            
            <div className="space-y-8">
              <div className="text-center py-8 border border-zinc-800 bg-black/50">
                <span className="text-7xl font-display font-bold text-white tracking-tighter">{frequency}</span>
                <p className="font-mono text-xs text-zinc-500 uppercase tracking-widest mt-2">Posts / Week</p>
              </div>
              
              <Slider
                value={frequency}
                min={1}
                max={21}
                step={1}
                onValueChange={setFrequency}
                className="[&>.relative>.bg-primary]:bg-white [&>.relative]:h-1 [&>span]:h-4 [&>span]:w-4 [&>span]:border-2 [&>span]:border-white [&>span]:bg-black [&>span]:rounded-none"
              />
              
              <div className="flex justify-between text-xs font-mono text-zinc-500 uppercase border-t border-zinc-800 pt-4">
                 <span>Daily Avg</span>
                 <span className="text-white">~{Math.round(frequency[0] / 7 * 10) / 10}</span>
              </div>
            </div>
          </div>

          <div className="heavy-card p-6 bg-zinc-900/20 border-white/10">
            <div className="flex items-center gap-3 mb-6">
              <Cpu className="w-5 h-5 text-white" />
              <h3 className="font-display text-xl font-bold uppercase">Logic Gates</h3>
            </div>
            
            <div className="space-y-6">
               {[
                 { label: "Anti-Repetition", desc: "Prevent consecutive topic posts" },
                 { label: "Weekend Mode", desc: "Reduce frequency Sat/Sun" },
                 { label: "Auto-Recycle", desc: "Re-queue top performers > 90d" }
               ].map((item, i) => (
                 <div key={i} className="flex items-center justify-between group">
                   <div className="space-y-1">
                     <Label className="font-bold text-zinc-300 group-hover:text-white transition-colors">{item.label}</Label>
                     <p className="text-[10px] text-zinc-600 uppercase tracking-wider font-mono">{item.desc}</p>
                   </div>
                   <Switch className="data-[state=checked]:bg-white data-[state=unchecked]:bg-zinc-800 border border-zinc-700" />
                 </div>
               ))}
            </div>
          </div>

          <div className="heavy-card p-6 bg-zinc-900/20 border-white/10">
            <div className="flex items-center gap-3 mb-6">
              <Calendar className="w-5 h-5 text-white" />
              <h3 className="font-display text-xl font-bold uppercase">Actions</h3>
            </div>
            
            <div className="space-y-4">
              <Button
                className="w-full h-12 rounded-none bg-white text-black hover:bg-zinc-200 font-mono text-sm uppercase tracking-wider"
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                data-testid="button-save-strategy"
              >
                {saveMutation.isPending ? "Saving..." : "Save Strategy"}
              </Button>
              
              <Button
                variant="outline"
                className="w-full h-12 rounded-none border-purple-500/50 text-purple-400 hover:bg-purple-500/10 font-mono text-sm uppercase tracking-wider"
                onClick={() => autoScheduleMutation.mutate()}
                disabled={autoScheduleMutation.isPending}
                data-testid="button-auto-schedule"
              >
                {autoScheduleMutation.isPending ? "Scheduling..." : "Auto-Schedule Drafts"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
