import { Layout } from "@/components/Layout";
import { MOCK_VIDEOS, VideoStatus, CATEGORIES } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Filter, Plus, Wand2, UploadCloud } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import generatedImage from '@assets/generated_images/abstract_dark_data_flow_background_with_subtle_grid_and_violet_accents.png';

const StatusBadge = ({ status }: { status: VideoStatus }) => {
  const styles = {
    posted: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    scheduled: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    draft: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
    processing: "bg-purple-500/10 text-purple-400 border-purple-500/20 animate-pulse",
  };

  return (
    <Badge variant="outline" className={`${styles[status]} capitalize border`}>
      {status}
    </Badge>
  );
};

const VideoCard = ({ video }: { video: any }) => (
  <div className="group relative overflow-hidden rounded-xl border border-white/5 bg-card hover:border-primary/50 transition-all duration-300">
    <div className={`aspect-video w-full ${video.thumbnail} relative`}>
      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
      <div className="absolute top-2 right-2">
        <StatusBadge status={video.status} />
      </div>
      {video.status === 'processing' && (
        <div className="absolute inset-0 flex items-center justify-center backdrop-blur-sm bg-black/40">
           <div className="flex flex-col items-center gap-2">
             <Wand2 className="w-8 h-8 text-primary animate-spin-slow" />
             <span className="text-xs font-medium text-white">AI Processing...</span>
           </div>
        </div>
      )}
    </div>
    
    <div className="p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
          {video.title}
        </h3>
      </div>
      
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
           <Badge variant="secondary" className="text-[10px] bg-secondary/50 text-muted-foreground hover:bg-secondary">
             {video.category}
           </Badge>
        </div>
        
        {video.caption && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {video.caption}
          </p>
        )}
      </div>

      <div className="pt-2 flex gap-2">
         <Button size="sm" variant="outline" className="w-full text-xs h-8">Edit</Button>
         <Button size="sm" className="w-full text-xs h-8 bg-primary/90 hover:bg-primary">Schedule</Button>
      </div>
    </div>
  </div>
);

export default function Library() {
  const [filter, setFilter] = useState("all");
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const filteredVideos = MOCK_VIDEOS.filter(v => 
    filter === "all" ? true : v.status === filter
  );

  return (
    <Layout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Content Library</h1>
          <p className="text-muted-foreground">Manage, caption, and schedule your media assets.</p>
        </div>
        
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Add Content
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl bg-card border-white/10 p-0 overflow-hidden">
             <div className="relative h-64 w-full bg-black flex flex-col items-center justify-center border-b border-white/10 group cursor-pointer overflow-hidden">
                <img 
                  src={generatedImage}
                  className="absolute inset-0 opacity-30 object-cover w-full h-full group-hover:scale-105 transition-transform duration-700" 
                  alt="Upload background"
                />
                <div className="relative z-10 flex flex-col items-center gap-4">
                   <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center border border-primary/50 group-hover:scale-110 transition-transform">
                      <UploadCloud className="w-8 h-8 text-primary" />
                   </div>
                   <div className="text-center space-y-1">
                      <h3 className="text-lg font-semibold text-white">Drag & drop videos here</h3>
                      <p className="text-sm text-zinc-400">or click to browse from Google Drive</p>
                   </div>
                </div>
             </div>
             <div className="p-6 space-y-4">
                <div className="space-y-2">
                   <h4 className="text-sm font-medium text-white">Processing Options</h4>
                   <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg border border-white/10 bg-secondary/20 hover:bg-secondary/40 cursor-pointer transition-colors">
                         <div className="flex items-center gap-2 mb-1">
                            <Wand2 className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium">Auto-Caption</span>
                         </div>
                         <p className="text-xs text-muted-foreground">Generate captions with AI</p>
                      </div>
                      <div className="p-3 rounded-lg border border-white/10 bg-secondary/20 hover:bg-secondary/40 cursor-pointer transition-colors">
                         <Filter className="w-4 h-4 text-blue-400" />
                         <span className="text-sm font-medium">Auto-Tag</span>
                         <p className="text-xs text-muted-foreground">Categorize based on content</p>
                      </div>
                   </div>
                </div>
                <Button className="w-full bg-primary" onClick={() => setIsUploadOpen(false)}>Start Upload</Button>
             </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search videos..." 
            className="pl-9 bg-secondary/50 border-white/5 focus-visible:ring-primary" 
          />
        </div>
        <Tabs defaultValue="all" className="w-full md:w-auto" onValueChange={setFilter}>
          <TabsList className="bg-secondary/50 border border-white/5">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="posted">Posted</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
            <TabsTrigger value="draft">Drafts</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredVideos.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>
    </Layout>
  );
}
