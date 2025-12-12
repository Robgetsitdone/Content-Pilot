import { Layout } from "@/components/Layout";
import { type VideoStatus } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, Wand2, UploadCloud, MoreHorizontal, Play, Calendar, Clock, ImageIcon, Video as VideoIcon, X, Music, Sparkles, Bell, BellOff } from "lucide-react";
import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { CaptionGenerator } from "@/components/CaptionGenerator";
import { useToast } from "@/hooks/use-toast";
import { useVideos, useCreateVideo } from "@/hooks/useVideos";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Switch } from "@/components/ui/switch";
import type { Video } from "@shared/schema";
import { format } from "date-fns";

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

const VideoCard = ({ video, onOpen }: { video: Video; onOpen: (video: Video) => void }) => {
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
          
          <div className="grid grid-cols-2 gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
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
              className="h-9 rounded-none bg-zinc-800 hover:bg-white hover:text-black font-mono text-xs uppercase tracking-wider"
              onClick={(e) => e.stopPropagation()}
              data-testid={`button-schedule-${video.id}`}
            >
              Schedule
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Library() {
  const [filter, setFilter] = useState("all");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isCaptionGenOpen, setIsCaptionGenOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("General");
  const [isDragging, setIsDragging] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const handleNotifyToggle = (videoId: number, notifyMe: boolean) => {
    notifyMutation.mutate({ videoId, notifyMe });
    // Update local state immediately for responsiveness
    if (selectedVideo && selectedVideo.id === videoId) {
      setSelectedVideo({ ...selectedVideo, notifyMe });
    }
  };

  const filteredVideos = videos.filter(v => 
    filter === "all" ? true : v.status === filter
  );

  const handleFilesSelect = (files: FileList) => {
    const validTypes = ["video/mp4", "video/quicktime", "image/jpeg", "image/png", "image/gif"];
    const validFiles: File[] = [];
    const invalidFiles: string[] = [];
    
    Array.from(files).forEach(file => {
      if (validTypes.some(type => file.type.includes(type))) {
        validFiles.push(file);
      } else {
        invalidFiles.push(file.name);
      }
    });
    
    if (invalidFiles.length > 0) {
      toast({
        title: "Some Files Skipped",
        description: `Invalid file types: ${invalidFiles.join(", ")}. Only MP4, MOV, PNG, JPG, GIF allowed.`,
        variant: "destructive",
        duration: 4000,
      });
    }
    
    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFilesSelect(files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0) {
      handleFilesSelect(files);
    }
    e.currentTarget.value = '';
  };

  const handleDropZoneClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleStartUpload = () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No Files Selected",
        description: "Please select at least one file to upload",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
    setIsUploadOpen(false);
    setIsCaptionGenOpen(true);
  };

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
        
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button className="h-12 px-8 rounded-none bg-white text-black hover:bg-zinc-200 font-display font-bold text-lg tracking-tight">
              <Plus className="w-5 h-5 mr-2" />
              UPLOAD ASSET
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl bg-[#0a0a0a] border border-white/10 p-0 gap-0">
             <input
               ref={fileInputRef}
               type="file"
               multiple
               accept="video/mp4,video/quicktime,image/jpeg,image/png,image/gif"
               onChange={handleFileInputChange}
               className="hidden"
               data-testid="input-file-upload"
             />
             <div 
               className={`relative ${selectedFiles.length > 0 ? 'h-auto min-h-[200px]' : 'h-80'} w-full flex flex-col items-center justify-center group cursor-pointer overflow-hidden border-b border-white/10 transition-all ${
                 isDragging 
                   ? "bg-primary/10 border-primary" 
                   : selectedFiles.length > 0
                   ? "bg-zinc-900/50 border-primary/50"
                   : "bg-zinc-900"
               }`}
               onClick={handleDropZoneClick}
               onDrop={handleDrop}
               onDragOver={handleDragOver}
               onDragLeave={handleDragLeave}
             >
                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_25%,rgba(255,255,255,0.05)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.05)_75%,rgba(255,255,255,0.05)_100%)] bg-[length:24px_24px] opacity-20" />
                
                {selectedFiles.length > 0 ? (
                  <div className="relative z-10 w-full p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-xl font-bold text-white uppercase">
                        {selectedFiles.length} File{selectedFiles.length > 1 ? 's' : ''} Selected
                      </h3>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedFiles([]); }}
                        className="font-mono text-xs text-zinc-500 hover:text-white uppercase tracking-widest"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-zinc-800/50 border border-zinc-700">
                          <span className="font-mono text-xs text-zinc-300 truncate max-w-[280px]">{file.name}</span>
                          <button 
                            onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                            className="text-zinc-500 hover:text-red-400 text-xs font-mono uppercase"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                    <p className="font-mono text-xs text-zinc-500 uppercase tracking-widest text-center">Click to add more files</p>
                  </div>
                ) : (
                  <div className="relative z-10 flex flex-col items-center gap-6 transition-transform duration-500 group-hover:scale-105">
                     <div className={`w-24 h-24 border-2 border-dashed flex items-center justify-center rounded-none transition-all ${
                       isDragging
                         ? "border-white bg-white/10"
                         : "border-zinc-700 group-hover:border-white group-hover:bg-white/5"
                     }`}>
                        <UploadCloud className={`w-10 h-10 transition-colors ${
                          isDragging
                            ? "text-white"
                            : "text-zinc-500 group-hover:text-white"
                        }`} />
                     </div>
                     <div className="text-center space-y-2">
                        <h3 className="font-display text-2xl font-bold text-white uppercase">Drop Zone</h3>
                        <p className="font-mono text-xs text-zinc-500 uppercase tracking-widest">Drag files here or click to browse</p>
                        <p className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest">Select multiple photos or videos</p>
                      </div>
                  </div>
                )}
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
