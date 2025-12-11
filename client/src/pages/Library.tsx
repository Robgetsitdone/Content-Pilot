import { Layout } from "@/components/Layout";
import { type VideoStatus } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, Wand2, UploadCloud, MoreHorizontal, Play } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { CaptionGenerator } from "@/components/CaptionGenerator";
import { useToast } from "@/hooks/use-toast";
import { useVideos, useCreateVideo } from "@/hooks/useVideos";
import type { Video } from "@shared/schema";

const StatusBadge = ({ status }: { status: VideoStatus }) => {
  const styles = {
    posted: "bg-white text-black border-white",
    scheduled: "bg-zinc-800 text-zinc-300 border-zinc-700",
    draft: "border-zinc-800 text-zinc-500",
    processing: "bg-zinc-900 text-zinc-400 border-zinc-800 animate-pulse",
  };

  return (
    <span className={`px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider border ${styles[status]}`}>
      {status}
    </span>
  );
};

const VideoCard = ({ video }: { video: Video }) => (
  <div className="group relative bg-black border border-zinc-900 hover:border-zinc-700 transition-all duration-300 flex flex-col h-full">
    <div className={`aspect-video w-full ${video.thumbnail} relative grayscale group-hover:grayscale-0 transition-all duration-500 overflow-hidden`}>
      <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-all duration-500" />
      
      {/* Play Button Overlay */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="w-12 h-12 bg-white flex items-center justify-center rounded-full transform scale-90 group-hover:scale-100 transition-transform">
          <Play className="w-5 h-5 text-black ml-1" fill="currentColor" />
        </div>
      </div>

      <div className="absolute top-3 left-3">
        <StatusBadge status={video.status} />
      </div>
      
      {video.status === 'processing' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-10">
           <div className="flex flex-col items-center gap-3">
             <Wand2 className="w-6 h-6 text-white animate-spin-slow" />
             <span className="font-mono text-xs text-zinc-400 uppercase tracking-widest">AI Processing</span>
           </div>
        </div>
      )}
    </div>
    
    <div className="p-5 flex flex-col flex-1 gap-4">
      <div className="flex justify-between items-start gap-2">
        <h3 className="font-display text-lg font-bold leading-tight text-zinc-300 group-hover:text-white transition-colors">
          {video.title}
        </h3>
        <button className="text-zinc-600 hover:text-white transition-colors">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>
      
      <div className="mt-auto space-y-4">
        <div className="flex flex-wrap gap-2">
           <span className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider border border-zinc-800 text-zinc-500 group-hover:border-zinc-600 group-hover:text-zinc-400 transition-colors">
             {video.category}
           </span>
        </div>
        
        <div className="grid grid-cols-2 gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
           <Button size="sm" variant="outline" className="h-9 rounded-none border-zinc-700 hover:bg-white hover:text-black font-mono text-xs uppercase tracking-wider">
             Edit
           </Button>
           <Button size="sm" className="h-9 rounded-none bg-zinc-800 hover:bg-white hover:text-black font-mono text-xs uppercase tracking-wider">
             Schedule
           </Button>
        </div>
      </div>
    </div>
  </div>
);

export default function Library() {
  const [filter, setFilter] = useState("all");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isCaptionGenOpen, setIsCaptionGenOpen] = useState(false);
  const { toast } = useToast();
  
  const { data: videos = [], isLoading } = useVideos();
  const createVideo = useCreateVideo();

  const filteredVideos = videos.filter(v => 
    filter === "all" ? true : v.status === filter
  );

  const handleStartUpload = () => {
    setIsUploadOpen(false);
    setIsCaptionGenOpen(true);
  };

  const handleCaptionSelect = async (caption: string, aiData: any) => {
    try {
      await createVideo.mutateAsync({
        title: "New Video Upload",
        thumbnail: "bg-zinc-900",
        category: "General",
        status: "draft",
        caption,
        aiData,
        views: 0,
        scheduledDate: null,
      });
      
      toast({
        title: "Strategy Applied",
        description: "Asset has been created with AI-generated caption.",
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create video",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  return (
    <Layout>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
        <div>
          <h1 className="font-display text-6xl md:text-7xl font-bold tracking-tighter text-white uppercase leading-none mb-4">
            Library
          </h1>
          <p className="font-mono text-zinc-500 uppercase tracking-widest text-sm">
            Asset Management & Processing // {isLoading ? "Loading..." : `${filteredVideos.length} Items`}
          </p>
        </div>
        
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button className="h-12 px-8 rounded-none bg-white text-black hover:bg-zinc-200 font-display font-bold text-lg tracking-tight">
              <Plus className="w-5 h-5 mr-2" />
              UPLOAD ASSET
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl bg-[#0a0a0a] border border-white/10 p-0 gap-0">
             <div className="relative h-80 w-full bg-zinc-900 flex flex-col items-center justify-center group cursor-pointer overflow-hidden border-b border-white/10">
                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_25%,rgba(255,255,255,0.05)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.05)_75%,rgba(255,255,255,0.05)_100%)] bg-[length:24px_24px] opacity-20" />
                
                <div className="relative z-10 flex flex-col items-center gap-6 transition-transform duration-500 group-hover:scale-105">
                   <div className="w-24 h-24 border-2 border-dashed border-zinc-700 flex items-center justify-center rounded-none group-hover:border-white group-hover:bg-white/5 transition-all">
                      <UploadCloud className="w-10 h-10 text-zinc-500 group-hover:text-white transition-colors" />
                   </div>
                   <div className="text-center space-y-2">
                      <h3 className="font-display text-2xl font-bold text-white uppercase">Drop Zone</h3>
                      <p className="font-mono text-xs text-zinc-500 uppercase tracking-widest">or click to browse Google Drive</p>
                   </div>
                </div>
             </div>
             <div className="p-8 space-y-6">
                <div className="space-y-4">
                   <h4 className="font-mono text-xs text-zinc-500 uppercase tracking-widest">Processing Intelligence</h4>
                   <div className="grid grid-cols-2 gap-4">
                      <button className="flex items-center gap-3 p-4 border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 hover:border-zinc-600 transition-all text-left group">
                         <div className="p-2 bg-black border border-zinc-800 group-hover:border-primary/50 transition-colors">
                           <Wand2 className="w-4 h-4 text-white group-hover:text-primary transition-colors" />
                         </div>
                         <div>
                           <div className="font-bold text-white text-sm">Gemini AI</div>
                           <div className="text-[10px] text-zinc-500 uppercase">Auto-Caption & Tag</div>
                         </div>
                      </button>
                      <button className="flex items-center gap-3 p-4 border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 hover:border-zinc-600 transition-all text-left">
                         <div className="p-2 bg-black border border-zinc-800">
                           <Search className="w-4 h-4 text-white" />
                         </div>
                         <div>
                           <div className="font-bold text-white text-sm">Manual</div>
                           <div className="text-[10px] text-zinc-500 uppercase">Custom Entry</div>
                         </div>
                      </button>
                   </div>
                </div>
                <Button 
                  className="w-full h-12 rounded-none bg-white text-black hover:bg-zinc-200 font-bold uppercase tracking-wide"
                  onClick={handleStartUpload}
                >
                  Process with AI
                </Button>
             </div>
          </DialogContent>
        </Dialog>
      </div>

      <CaptionGenerator 
        isOpen={isCaptionGenOpen} 
        onClose={() => setIsCaptionGenOpen(false)}
        onSelect={handleCaptionSelect}
      />

      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-xl border-b border-white/10 pb-6 mb-8 pt-2">
        <div className="flex flex-col md:flex-row gap-6 items-center">
          <div className="relative flex-1 w-full group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-white transition-colors" />
            <Input 
              placeholder="SEARCH ASSETS..." 
              className="pl-12 h-12 bg-zinc-900/50 border-zinc-800 focus:border-white rounded-none font-mono text-sm uppercase tracking-wider placeholder:text-zinc-700" 
            />
          </div>
          <Tabs defaultValue="all" className="w-full md:w-auto" onValueChange={setFilter}>
            <TabsList className="bg-zinc-900/50 border border-zinc-800 h-12 p-1 rounded-none w-full md:w-auto">
              {['all', 'posted', 'scheduled', 'draft'].map((tab) => (
                <TabsTrigger 
                  key={tab} 
                  value={tab}
                  className="rounded-none h-full px-6 font-mono text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-black transition-all"
                >
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading ? (
          <div className="col-span-full text-center py-12">
            <p className="font-mono text-zinc-500 uppercase tracking-widest text-sm">Loading assets...</p>
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="font-mono text-zinc-500 uppercase tracking-widest text-sm">No assets found</p>
          </div>
        ) : (
          filteredVideos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))
        )}
      </div>
    </Layout>
  );
}
