import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { INITIAL_STRATEGY, CATEGORIES } from "@/lib/mockData";
import { useState } from "react";
import { BarChart, Activity, Zap } from "lucide-react";

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
       <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold tracking-tight">Strategy Configuration</h1>
        <p className="text-muted-foreground">Fine-tune your content drip and distribution algorithms.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass-panel border-white/5">
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart className="w-5 h-5 text-primary" />
                <CardTitle>Category Weighting</CardTitle>
              </div>
              <CardDescription>
                Adjust how often each topic appears in your feed. Higher weight = higher frequency.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {CATEGORIES.map((category) => (
                <div key={category} className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label className="text-base font-medium">{category}</Label>
                    <span className="font-mono text-sm text-muted-foreground">
                      {weights[category] || 0}%
                    </span>
                  </div>
                  <Slider
                    value={[weights[category] || 0]}
                    max={100}
                    step={5}
                    onValueChange={(val) => handleWeightChange(category, val)}
                    className="[&>.relative>.bg-primary]:bg-gradient-to-r [&>.relative>.bg-primary]:from-indigo-500 [&>.relative>.bg-primary]:to-purple-500"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
           <Card className="glass-panel border-white/5">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                <CardTitle>Drip Frequency</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center py-4">
                <span className="text-5xl font-bold font-mono text-white">{frequency}</span>
                <p className="text-sm text-muted-foreground mt-2">Posts per week</p>
              </div>
              <Slider
                value={frequency}
                min={1}
                max={21}
                step={1}
                onValueChange={setFrequency}
              />
              <p className="text-xs text-muted-foreground text-center">
                Estimated daily volume: ~{Math.round(frequency[0] / 7 * 10) / 10} posts
              </p>
            </CardContent>
          </Card>

          <Card className="glass-panel border-white/5">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-400" />
                <CardTitle>Smart Rules</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
               <div className="flex items-center justify-between">
                 <div className="space-y-0.5">
                   <Label>Avoid Repetition</Label>
                   <p className="text-xs text-muted-foreground">Don't post same category twice in a row</p>
                 </div>
                 <Switch defaultChecked />
               </div>
               
               <div className="flex items-center justify-between">
                 <div className="space-y-0.5">
                   <Label>Weekend Light Mode</Label>
                   <p className="text-xs text-muted-foreground">Reduce frequency on Sat/Sun</p>
                 </div>
                 <Switch defaultChecked />
               </div>

               <div className="flex items-center justify-between">
                 <div className="space-y-0.5">
                   <Label>Auto-Recycle</Label>
                   <p className="text-xs text-muted-foreground">Re-queue top performers after 90 days</p>
                 </div>
                 <Switch />
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
