import { Layout } from "@/components/Layout";
import { type VideoStatus } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, MoreHorizontal, Play, Calendar, Clock, ImageIcon, Video as VideoIcon, X, Bell, BellOff, Check, Loader2, ChevronRight, Trash2, RefreshCw, Music, Sparkles, Wand2 } from "lucide-react";
import { useState } from "react";
import { CaptionGenerator } from "@/components/CaptionGenerator";
import { useToast } from "@/hooks/use-toast";
import { useVideos, useCreateVideo } from "@/hooks/useVideos";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Switch } from "@/components/ui/switch";
import type { Video } from "@shared/schema";
import { format } from "date-fns";
import { UploadModal } from "@/components/UploadModal";

const CATEGORIES = [
  "Family", "Parenting", "Fitness", "Gym + Life + Fitness", "Travel", 
  "Business", "Lifestyle", "Education", "Entertainment", "Food", "General"
];

type UploadStage = "selecting" | "processing" | "results";

interface AnalysisResult {
  filename: string;
  base64: string;
  category: string;
  selectedCaptionId: string;
  captions: Array<{
    id: string;
    tone: string;
    text: string;
    hashtags: string[];
  }>;
  extendedPost: string;
  music: string[];
  stickers: string[];
}

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

const VideoDetailModal = ({ video, isOpen, onClose, onNotifyToggle }: { 
  video: Video | null; 
  isOpen: boolean; 
  onClose: () => void;
  onNotifyToggle: (videoId: number, notifyMe: boolean) => void;
}) => {
  if (!video) return null;

  const hasMedia = video.mediaUrl && video.mediaUrl !== "bg-zinc-900";
  const isImage = video.mediaType === "image";
  const music = video.aiData?.music || [];
  const stickers = video.aiData?.stickers || [];
  const isPersonalCategory = video.category === "Family" || video.category === "Parenting";

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${isOpen ? 'block' : 'hidden'}`}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-black border-2 border-white/20 flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-white/10">
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-2xl font-bold text-white mb-2">{video.title}</h2>
            <div className="flex items-center gap-3 flex-wrap">
              <StatusBadge status={video.status} />
              <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider border border-zinc-700 text-zinc-400 bg-black/50">
                {video.category}
              </span>
              {video.scheduledDate && (
                <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider border border-zinc-700 text-zinc-400">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(video.scheduledDate), "MMM d, h:mma")}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors p-2 hover:bg-zinc-900 rounded"
            data-testid="button-close-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 flex flex-col lg:flex-row gap-6 p-6">
          {/* Media Section */}
          <div className="lg:w-2/3 flex flex-col gap-6">
            <div className="bg-zinc-900 border border-zinc-800 aspect-video flex items-center justify-center overflow-hidden">
              {hasMedia ? (
                isImage ? (
                  <img 
                    src={video.mediaUrl!} 
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <video 
                    src={video.mediaUrl!}
                    className="w-full h-full object-cover"
                    muted
                    controls
                  />
                )
              ) : (
                <div className="flex flex-col items-center gap-3 text-zinc-600">
                  {video.mediaType === "video" ? (
                    <VideoIcon className="w-16 h-16" />
                  ) : (
                    <ImageIcon className="w-16 h-16" />
                  )}
                  <p className="font-mono text-sm uppercase">No Media</p>
                </div>
              )}
            </div>

            {/* Caption Section */}
            {video.caption && (
              <div className="border border-zinc-800 bg-zinc-950/50 p-4">
                <h3 className="font-display font-bold text-sm uppercase mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Caption
                </h3>
                <p className="font-mono text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                  {video.caption}
                </p>
              </div>
            )}
          </div>

          {/* AI Recommendations Section */}
          <div className="lg:w-1/3 space-y-4">
            {/* Notify Me Toggle */}
            {video.status === "scheduled" && (
              <div className={`border p-4 ${isPersonalCategory ? 'border-amber-500/50 bg-amber-500/10' : 'border-zinc-800 bg-zinc-950/50'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {video.notifyMe ? (
                      <Bell className="w-4 h-4 text-amber-400" />
                    ) : (
                      <BellOff className="w-4 h-4 text-zinc-500" />
                    )}
                    <div>
                      <h3 className="font-display font-bold text-sm uppercase">Notify Me</h3>
                      <p className="font-mono text-[10px] text-zinc-500">
                        {isPersonalCategory ? "Recommended for personal posts" : "Get a calendar reminder"}
                      </p>
                    </div>
                  </div>
                  <Switch 
                    checked={video.notifyMe || false}
                    onCheckedChange={(checked) => onNotifyToggle(video.id, checked)}
                    data-testid="switch-notify-me"
                  />
                </div>
                {video.notifyMe && (
                  <p className="font-mono text-[10px] text-zinc-400 mt-2 pt-2 border-t border-zinc-800">
                    You'll get a calendar reminder when this post goes live so you can engage with comments.
                  </p>
                )}
              </div>
            )}

            {/* Music */}
            {music.length > 0 && (
              <div className="border border-zinc-800 bg-zinc-950/50 p-4">
                <h3 className="font-display font-bold text-sm uppercase mb-3 flex items-center gap-2">
                  <Music className="w-4 h-4 text-cyan-400" />
                  Music Recommendations
                </h3>
                <div className="space-y-2">
                  {music.map((track, index) => (
                    <div key={index} className="p-2 bg-zinc-900 border border-zinc-800 rounded text-[12px]">
                      <p className="font-mono text-zinc-300">{track}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stickers */}
            {stickers.length > 0 && (
              <div className="border border-zinc-800 bg-zinc-950/50 p-4">
                <h3 className="font-display font-bold text-sm uppercase mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  Sticker Ideas
                </h3>
                <div className="space-y-2">
                  {stickers.map((sticker, index) => (
                    <div key={index} className="p-2 bg-zinc-900 border border-zinc-800 rounded text-[12px]">
                      <p className="font-mono text-zinc-300">{sticker}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Extended Post */}
            {video.aiData?.extendedPost && (
              <div className="border border-zinc-800 bg-zinc-950/50 p-4">
                <h3 className="font-display font-bold text-sm uppercase mb-3">Extended Post</h3>
                <p className="font-mono text-[12px] text-zinc-300 whitespace-pre-wrap">
                  {video.aiData.extendedPost}
                </p>
              </div>
            )}

            {/* Empty State */}
            {music.length === 0 && stickers.length === 0 && !video.aiData?.extendedPost && (
              <div className="border border-zinc-800 bg-zinc-950/50 p-4 text-center">
                <p className="font-mono text-xs text-zinc-600 uppercase">No AI recommendations yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const VideoCard = ({ video, onOpen, deleteMutation, regenerateMutation }: { video: Video; onOpen: (video: Video) => void; deleteMutation: any; regenerateMutation: any }) => {
  const hasMedia = video.mediaUrl && video.mediaUrl !== "bg-zinc-900";
  const isImage = video.mediaType === "image";
  
  return (
    <div 
      className="group relative bg-black border border-zinc-900 hover:border-zinc-700 transition-all duration-300 flex flex-col h-full cursor-pointer"
      onClick={() => onOpen(video)}
      data-testid={`card-video-${video.id}`}
    >
      <div className="aspect-video w-full bg-zinc-900 relative grayscale group-hover:grayscale-0 transition-all duration-500 overflow-hidden">
        {hasMedia ? (
          isImage ? (
            <img 
              src={video.mediaUrl!} 
              alt={video.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <video 
              src={video.mediaUrl!}
              className="absolute inset-0 w-full h-full object-cover"
              muted
            />
          )
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
            {video.mediaType === "video" ? (
              <VideoIcon className="w-12 h-12 text-zinc-700" />
            ) : (
              <ImageIcon className="w-12 h-12 text-zinc-700" />
            )}
          </div>
        )}
        
        <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-all duration-500" />
        
        {/* Play Button Overlay for videos */}
        {video.mediaType === "video" && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="w-12 h-12 bg-white flex items-center justify-center rounded-full transform scale-90 group-hover:scale-100 transition-transform">
              <Play className="w-5 h-5 text-black ml-1" fill="currentColor" />
            </div>
          </div>
        )}

        <div className="absolute top-3 left-3 flex gap-2">
          <StatusBadge status={video.status} />
          {video.mediaType && (
            <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider border border-zinc-700 text-zinc-400 bg-black/50 backdrop-blur-sm">
              {video.mediaType}
            </span>
          )}
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
      
      <div className="p-5 flex flex-col flex-1 gap-3">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-base font-bold leading-tight text-zinc-300 group-hover:text-white transition-colors truncate">
              {video.title}
            </h3>
            {video.captionTone && (
              <span className="text-[10px] font-mono text-primary/70 uppercase tracking-wider mt-1 block">
                {video.captionTone}
              </span>
            )}
          </div>
          <button 
            className="text-zinc-600 hover:text-white transition-colors shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
        
        {/* Caption Preview */}
        {video.caption && (
          <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
            {video.caption.split('\n')[0]}
          </p>
        )}
        
        <div className="mt-auto space-y-3">
          {/* Category & Schedule Info */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider border border-zinc-800 text-zinc-500 group-hover:border-zinc-600 group-hover:text-zinc-400 transition-colors">
              {video.category}
            </span>
            {video.scheduledDate && (
              <span className="flex items-center gap-1 px-2 py-1 text-[10px] font-mono uppercase tracking-wider border border-zinc-800 text-zinc-500">
                <Calendar className="w-3 h-3" />
                {format(new Date(video.scheduledDate), "MMM d")}
                <Clock className="w-3 h-3 ml-1" />
                {format(new Date(video.scheduledDate), "h:mma")}
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-4 gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button 
              size="sm" 
              variant="outline" 
              className="h-9 rounded-none border-zinc-700 hover:bg-white hover:text-black font-mono text-xs uppercase tracking-wider"
              onClick={(e) => e.stopPropagation()}
              data-testid={`button-edit-${video.id}`}
            >
              Edit
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              className="h-9 rounded-none border-purple-900/50 hover:bg-purple-900/20 hover:border-purple-700 text-purple-400 hover:text-purple-300 font-mono text-xs uppercase tracking-wider"
              onClick={(e) => {
                e.stopPropagation();
                regenerateMutation.mutate(video.id);
              }}
              disabled={regenerateMutation.isPending}
              data-testid={`button-regenerate-${video.id}`}
            >
              <RefreshCw className={`w-3 h-3 ${regenerateMutation.isPending ? 'animate-spin' : ''}`} />
            </Button>
            <Button 
              size="sm" 
              className="h-9 rounded-none bg-zinc-800 hover:bg-white hover:text-black font-mono text-xs uppercase tracking-wider"
              onClick={(e) => e.stopPropagation()}
              data-testid={`button-schedule-${video.id}`}
            >
              Schedule
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-9 rounded-none border-red-900/50 hover:bg-red-900/20 hover:border-red-700 text-red-400 hover:text-red-300 font-mono text-xs uppercase tracking-wider"
              onClick={(e) => {
                e.stopPropagation();
                deleteMutation.mutate(video.id);
              }}
              disabled={deleteMutation.isPending}
              data-testid={`button-delete-${video.id}`}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Library() {
  const [filter, setFilter] = useState("all");
  const [isCaptionGenOpen, setIsCaptionGenOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("General");
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const { toast } = useToast();
  
  const { data: videos = [], isLoading } = useVideos();
  const createVideo = useCreateVideo();
  const queryClient = useQueryClient();

  const notifyMutation = useMutation({
    mutationFn: async ({ videoId, notifyMe }: { videoId: number; notifyMe: boolean }) => {
      return apiRequest("POST", `/api/videos/${videoId}/notify`, { notifyMe });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      toast({
        title: notifyMutation.variables?.notifyMe ? "Reminder Set" : "Reminder Removed",
        description: notifyMutation.variables?.notifyMe 
          ? "You'll get a calendar notification when this post goes live." 
          : "Calendar reminder has been removed.",
        duration: 3000,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update notification settings",
        variant: "destructive",
        duration: 3000,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (videoId: number) => {
      return apiRequest("DELETE", `/api/videos/${videoId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      toast({
        title: "Post Deleted",
        description: "Your content has been removed.",
        duration: 2000,
      });
      if (isDetailOpen) {
        setIsDetailOpen(false);
        setSelectedVideo(null);
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete post",
        variant: "destructive",
        duration: 3000,
      });
    },
  });

  const regenerateMutation = useMutation({
    mutationFn: async (videoId: number) => {
      return apiRequest("POST", `/api/videos/${videoId}/regenerate-captions`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      toast({
        title: "Captions Regenerated",
        description: "AI has generated new captions for your content.",
        duration: 3000,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to regenerate captions. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    },
  });

  const handleNotifyToggle = (videoId: number, notifyMe: boolean) => {
    notifyMutation.mutate({ videoId, notifyMe });
    // Update local state immediately for responsiveness
    if (selectedVideo && selectedVideo.id === videoId) {
      setSelectedVideo({ ...selectedVideo, notifyMe });
    }
  };

  const handleDelete = (videoId: number) => {
    deleteMutation.mutate(videoId);
  };

  const filteredVideos = videos.filter(v => 
    filter === "all" ? true : v.status === filter
  );


  const handleCaptionSelect = async (data: {
    caption: string;
    tone: string;
    hashtags: string[];
    category: string;
    aiData: any;
    mediaPreviewUrl?: string;
    mediaType?: "image" | "video";
  }) => {
    try {
      const titleFromCaption = data.caption.length > 50 
        ? data.caption.substring(0, 50).trim() + "..." 
        : data.caption.split('.')[0] || data.caption;
      
      await createVideo.mutateAsync({
        title: titleFromCaption,
        thumbnail: "bg-zinc-900",
        mediaUrl: data.mediaPreviewUrl || null,
        mediaType: data.mediaType || null,
        category: data.category,
        captionTone: data.tone,
        status: "draft",
        caption: data.caption + "\n\n" + data.hashtags.join(" "),
        aiData: data.aiData,
        views: 0,
        scheduledDate: null,
      });
      
      toast({
        title: "Strategy Applied",
        description: `Asset created with "${data.tone}" caption in ${data.category} category.`,
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
      <VideoDetailModal 
        video={selectedVideo} 
        isOpen={isDetailOpen} 
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedVideo(null);
        }}
        onNotifyToggle={handleNotifyToggle}
      />

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
        <div>
          <h1 className="font-display text-6xl md:text-7xl font-bold tracking-tighter text-white uppercase leading-none mb-4">
            Library
          </h1>
          <p className="font-mono text-zinc-500 uppercase tracking-widest text-sm">
            Asset Management & Processing // {isLoading ? "Loading..." : `${filteredVideos.length} Items`}
          </p>
        </div>
        
        <UploadModal />
      </div>

      <CaptionGenerator 
        isOpen={isCaptionGenOpen} 
        onClose={() => {
          setIsCaptionGenOpen(false);
          setSelectedFiles([]);
          setSelectedCategory("General");
        }}
        onSelect={handleCaptionSelect}
        files={selectedFiles}
        category={selectedCategory}
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
            <VideoCard 
              key={video.id} 
              video={video}
              deleteMutation={deleteMutation}
              regenerateMutation={regenerateMutation}
              onOpen={(video) => {
                setSelectedVideo(video);
                setIsDetailOpen(true);
              }}
            />
          ))
        )}
      </div>
    </Layout>
  );
}
