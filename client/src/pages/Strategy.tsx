import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { INITIAL_STRATEGY, CATEGORIES } from "@/lib/mockData";
import { useState } from "react";
import { BarChart, Activity, Zap, Layers, Cpu } from "lucide-react";

export default function Strategy() {
  const [weights, setWeights] = useState(INITIAL_STRATEGY.categoryWeights);
  const [frequency, setFrequency] = useState([INITIAL_STRATEGY.dripFrequency]);

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
        </div>
      </div>
    </Layout>
  );
}
