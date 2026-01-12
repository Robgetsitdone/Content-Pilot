import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, UploadCloud, Wand2, Loader2, Check, ChevronLeft, Music, Sparkles, X } from "lucide-react";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useCreateVideo } from "@/hooks/useVideos";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { celebrateSuccess } from "@/lib/celebrations";
import type { Video } from "@shared/schema";

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

export function UploadModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStage, setUploadStage] = useState<UploadStage>("selecting");
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const createVideo = useCreateVideo();
  const queryClient = useQueryClient();

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

  const handleBatchAnalyze = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No Files Selected",
        description: "Please select at least one file to upload",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    setUploadStage("processing");

    const imagePromises = selectedFiles.map((file) => {
      return new Promise<{ base64: string; filename: string }>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({
            base64: reader.result as string,
            filename: file.name,
          });
        };
        reader.readAsDataURL(file);
      });
    });

    try {
      const images = await Promise.all(imagePromises);
      
      const response = await apiRequest("POST", "/api/videos/batch-analyze", { images });
      const data = await response.json();
      
      const results: AnalysisResult[] = data.results.map((result: any, index: number) => ({
        ...result,
        base64: images[index].base64,
        selectedCaptionId: result.captions[0]?.id || "c1",
      }));

      setAnalysisResults(results);
      setUploadStage("results");
    } catch (error) {
      console.error("Batch analysis error:", error);
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze images. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
      setUploadStage("selecting");
    }
  };

  const updateResultCategory = (index: number, category: string) => {
    setAnalysisResults(prev => prev.map((r, i) => 
      i === index ? { ...r, category } : r
    ));
  };

  const updateResultCaption = (index: number, captionId: string) => {
    setAnalysisResults(prev => prev.map((r, i) => 
      i === index ? { ...r, selectedCaptionId: captionId } : r
    ));
  };

  const handleBulkSave = async () => {
    if (analysisResults.length === 0) return;

    setIsSaving(true);
    
    try {
      const videosToCreate = analysisResults.map((result) => {
        const selectedCaption = result.captions.find(c => c.id === result.selectedCaptionId) || result.captions[0];
        const titleFromCaption = selectedCaption.text.length > 50 
          ? selectedCaption.text.substring(0, 50).trim() + "..." 
          : selectedCaption.text.split('.')[0] || selectedCaption.text;
        
        return {
          title: titleFromCaption,
          thumbnail: "bg-zinc-900",
          mediaUrl: result.base64,
          mediaType: "image" as const,
          category: result.category,
          captionTone: selectedCaption.tone,
          status: "draft" as const,
          caption: selectedCaption.text + "\n\n" + selectedCaption.hashtags.join(" "),
          aiData: {
            captions: result.captions,
            extendedPost: result.extendedPost,
            music: result.music,
            stickers: result.stickers,
          },
          views: 0,
          scheduledDate: null,
        };
      });

      await apiRequest("POST", "/api/videos/batch", { videos: videosToCreate });
      
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      
      celebrateSuccess();
      
      toast({
        title: "🎉 Batch Upload Complete!",
        description: `Successfully created ${analysisResults.length} new assets with AI-generated captions.`,
        duration: 5000,
      });

      setIsOpen(false);
      resetUploadState();
    } catch (error) {
      console.error("Batch save error:", error);
      toast({
        title: "Save Failed",
        description: "Failed to save videos. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const resetUploadState = () => {
    setSelectedFiles([]);
    setAnalysisResults([]);
    setUploadStage("selecting");
    setIsSaving(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { 
      setIsOpen(open); 
      if (!open) resetUploadState(); 
    }}>
      <DialogTrigger asChild>
        <Button className="h-12 px-8 rounded-none bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:from-violet-600 hover:to-fuchsia-600 font-display font-bold text-lg tracking-tight" data-testid="button-upload">
          <Plus className="w-5 h-5 mr-2" />
          UPLOAD ASSET
        </Button>
      </DialogTrigger>
      <DialogContent className={`${uploadStage === "results" ? "sm:max-w-5xl max-h-[90vh]" : "sm:max-w-xl"} bg-[#0a0a0a] border border-white/10 p-0 gap-0 overflow-hidden`}>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="video/mp4,video/quicktime,image/jpeg,image/png,image/gif"
          onChange={handleFileInputChange}
          className="hidden"
          data-testid="input-file-upload"
        />
        
        {uploadStage === "selecting" && (
          <>
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
                      <p className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest">Select multiple photos for batch AI analysis</p>
                    </div>
                </div>
              )}
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <h4 className="font-mono text-xs text-zinc-500 uppercase tracking-widest">Batch Processing</h4>
                <div className="p-4 border border-primary/30 bg-primary/5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-black border border-primary/50">
                      <Wand2 className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm">Gemini Vision AI</div>
                      <div className="text-[10px] text-zinc-500 uppercase">Auto-categorize, caption & tag all files</div>
                    </div>
                  </div>
                </div>
              </div>
              <Button 
                className="w-full h-12 rounded-none bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:from-violet-600 hover:to-fuchsia-600 font-bold uppercase tracking-wide"
                onClick={handleBatchAnalyze}
                disabled={selectedFiles.length === 0}
                data-testid="button-batch-analyze"
              >
                <Wand2 className="w-4 h-4 mr-2" />
                Analyze {selectedFiles.length} File{selectedFiles.length !== 1 ? 's' : ''} with AI
              </Button>
            </div>
          </>
        )}

        {uploadStage === "processing" && (
          <div className="p-12 flex flex-col items-center justify-center min-h-[400px] gap-8">
            <div className="relative">
              <div className="w-24 h-24 border-2 border-primary/30 flex items-center justify-center">
                <Wand2 className="w-10 h-10 text-primary animate-pulse" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary flex items-center justify-center">
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              </div>
            </div>
            <div className="text-center space-y-3">
              <h3 className="font-display text-2xl font-bold text-white uppercase">Deep AI Analysis</h3>
              <p className="font-mono text-xs text-zinc-500 uppercase tracking-widest">
                Individually processing {selectedFiles.length} image{selectedFiles.length !== 1 ? 's' : ''}...
              </p>
            </div>
            
            <div className="w-full max-w-md space-y-4">
              <div className="p-4 border border-primary/30 bg-primary/5 space-y-3">
                <h4 className="font-mono text-xs text-primary uppercase tracking-widest text-center">Each image receives full analysis:</h4>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-zinc-400">
                  <div className="flex items-center gap-2">
                    <Check className="w-3 h-3 text-green-400" />
                    <span>3 unique caption tones</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3 h-3 text-green-400" />
                    <span>Extended post content</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3 h-3 text-green-400" />
                    <span>3 music recommendations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3 h-3 text-green-400" />
                    <span>Sticker suggestions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3 h-3 text-green-400" />
                    <span>Custom hashtags per tone</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3 h-3 text-green-400" />
                    <span>Category auto-detection</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-zinc-900 h-2 overflow-hidden">
                <div className="bg-gradient-to-r from-violet-500 to-fuchsia-500 h-full animate-[loading_2s_ease-in-out_infinite]" style={{ width: '100%' }} />
              </div>
              <p className="font-mono text-[10px] text-zinc-600 text-center uppercase">
                ~5-10 seconds per image for full depth analysis
              </p>
            </div>
          </div>
        )}

        {uploadStage === "results" && (
          <div className="flex flex-col h-full max-h-[85vh]">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div>
                <h3 className="font-display text-xl font-bold text-white uppercase flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  Analysis Complete
                </h3>
                <p className="font-mono text-xs text-zinc-500 uppercase tracking-widest mt-1">
                  {analysisResults.length} file{analysisResults.length !== 1 ? 's' : ''} ready to create
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => { setUploadStage("selecting"); setAnalysisResults([]); }}
                className="font-mono text-xs uppercase"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            </div>
            
            <ScrollArea className="flex-1 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {analysisResults.map((result, index) => (
                  <div key={index} className="border border-zinc-800 bg-zinc-950/50 overflow-hidden" data-testid={`result-card-${index}`}>
                    <div className="aspect-video bg-zinc-900 relative overflow-hidden">
                      <img 
                        src={result.base64} 
                        alt={result.filename}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2 px-2 py-1 bg-black/80 backdrop-blur-sm">
                        <span className="font-mono text-[10px] text-zinc-400 uppercase truncate max-w-[150px] block">{result.filename}</span>
                      </div>
                    </div>
                    
                    <div className="p-4 space-y-4">
                      <div className="space-y-2">
                        <label className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">Category</label>
                        <Select value={result.category} onValueChange={(val) => updateResultCategory(index, val)}>
                          <SelectTrigger className="h-9 bg-zinc-900 border-zinc-800 rounded-none font-mono text-xs" data-testid={`select-category-${index}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-900 border-zinc-800">
                            {CATEGORIES.map((cat) => (
                              <SelectItem key={cat} value={cat} className="font-mono text-xs">
                                {cat}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">Caption</label>
                        <div className="space-y-2">
                          {result.captions.map((caption) => (
                            <button
                              key={caption.id}
                              onClick={() => updateResultCaption(index, caption.id)}
                              className={`w-full p-3 text-left border transition-all ${
                                result.selectedCaptionId === caption.id
                                  ? "border-primary bg-primary/10"
                                  : "border-zinc-800 hover:border-zinc-600"
                              }`}
                              data-testid={`caption-${index}-${caption.id}`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-mono text-[10px] text-primary uppercase">{caption.tone}</span>
                                {result.selectedCaptionId === caption.id && (
                                  <Check className="w-3 h-3 text-primary" />
                                )}
                              </div>
                              <p className="font-mono text-xs text-zinc-300 line-clamp-2">{caption.text}</p>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {caption.hashtags.slice(0, 3).map((tag, i) => (
                                  <span key={i} className="text-[10px] text-zinc-500">{tag}</span>
                                ))}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Extended Post */}
                      {result.extendedPost && (
                        <div className="space-y-2">
                          <label className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-400" /> Extended Post
                          </label>
                          <div className="p-3 bg-zinc-900 border border-amber-500/30 text-[11px] font-mono text-zinc-300 leading-relaxed">
                            {result.extendedPost}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest flex items-center gap-1">
                            <Music className="w-3 h-3 text-cyan-400" /> Music ({result.music.length})
                          </label>
                          <div className="space-y-1">
                            {result.music.map((track, i) => (
                              <div key={i} className="p-2 bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-400">
                                {track}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-purple-400" /> Stickers ({result.stickers.length})
                          </label>
                          <div className="flex flex-wrap gap-1">
                            {result.stickers.map((sticker, i) => (
                              <span key={i} className="p-2 bg-zinc-900 border border-zinc-800 text-sm">
                                {sticker}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="p-6 border-t border-white/10 bg-black/50">
              <Button 
                className="w-full h-12 rounded-none bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:from-violet-600 hover:to-fuchsia-600 font-bold uppercase tracking-wide"
                onClick={handleBulkSave}
                disabled={isSaving}
                data-testid="button-create-all"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Assets...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Create All {analysisResults.length} Assets
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
