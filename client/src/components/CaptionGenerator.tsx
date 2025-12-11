import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MOCK_AI_RESPONSE, AIMetadata } from "@/lib/mockData";
import { Wand2, Check, Copy, Music, Sticker, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface CaptionGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (caption: string) => void;
  file?: File | null;
}

export function CaptionGenerator({ isOpen, onClose, onSelect }: CaptionGeneratorProps) {
  const [step, setStep] = useState<"analyzing" | "generating" | "results">("analyzing");
  const [selectedCaptionId, setSelectedCaptionId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStep("analyzing");
      // Simulate API delays
      setTimeout(() => setStep("generating"), 2000);
      setTimeout(() => setStep("results"), 4500);
    }
  }, [isOpen]);

  const handleSelect = () => {
    if (selectedCaptionId) {
      const caption = MOCK_AI_RESPONSE.captions.find(c => c.id === selectedCaptionId);
      if (caption) {
        onSelect(caption.text + "\n\n" + caption.hashtags.join(" "));
        onClose();
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl bg-[#09090b] border border-white/10 p-0 overflow-hidden min-h-[600px] flex flex-col">
        {step !== "results" ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-8">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse" />
              <div className="relative w-24 h-24 border border-white/10 bg-black/50 rounded-2xl flex items-center justify-center backdrop-blur-md">
                {step === "analyzing" ? (
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                ) : (
                  <Sparkles className="w-10 h-10 text-primary animate-pulse" />
                )}
              </div>
            </div>
            <div className="space-y-2 max-w-md">
              <h3 className="font-display text-2xl font-bold text-white tracking-tight">
                {step === "analyzing" ? "Analyzing Visual Content..." : "Crafting Strategy..."}
              </h3>
              <p className="font-mono text-sm text-zinc-500">
                {step === "analyzing" 
                  ? "Gemini Vision API is identifying key elements, mood, and context."
                  : "Generating high-engagement captions, hashtag clusters, and audio pairings."}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col h-full">
            <DialogHeader className="p-6 border-b border-white/10 bg-zinc-900/30">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <DialogTitle className="font-display text-xl font-bold tracking-tight text-white flex items-center gap-2">
                    <Wand2 className="w-5 h-5 text-primary" />
                    AI Strategy Results
                  </DialogTitle>
                  <p className="font-mono text-xs text-zinc-500 uppercase tracking-widest">
                    Based on "Ultimate Caption Prompt" Template
                  </p>
                </div>
                <Button variant="outline" size="sm" className="h-8 border-white/10 text-zinc-400 hover:text-white hover:bg-white/5">
                  <RefreshCw className="w-3 h-3 mr-2" />
                  Regenerate
                </Button>
              </div>
            </DialogHeader>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
              {/* Left: Captions */}
              <div className="md:col-span-8 border-r border-white/10 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-white/10 bg-zinc-900/10">
                  <h4 className="font-mono text-xs text-zinc-500 uppercase tracking-widest font-bold">Caption Variations</h4>
                </div>
                <ScrollArea className="flex-1 p-6">
                  <div className="space-y-6">
                    {MOCK_AI_RESPONSE.captions.map((caption) => (
                      <div 
                        key={caption.id}
                        onClick={() => setSelectedCaptionId(caption.id)}
                        className={cn(
                          "group p-6 border transition-all duration-200 cursor-pointer relative",
                          selectedCaptionId === caption.id
                            ? "bg-primary/5 border-primary/50 shadow-[0_0_30px_-10px_rgba(124,58,237,0.3)]"
                            : "bg-black border-white/5 hover:border-white/20 hover:bg-white/5"
                        )}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <span className={cn(
                            "px-2 py-1 text-[10px] font-mono uppercase tracking-widest border",
                            selectedCaptionId === caption.id
                              ? "border-primary/50 text-primary"
                              : "border-white/10 text-zinc-500"
                          )}>
                            {caption.tone}
                          </span>
                          {selectedCaptionId === caption.id && (
                            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                        <p className="font-sans text-zinc-300 leading-relaxed text-sm md:text-base mb-4 group-hover:text-white transition-colors">
                          {caption.text}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {caption.hashtags.map((tag) => (
                            <span key={tag} className="text-xs text-primary/70 font-medium">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Right: Metadata */}
              <div className="md:col-span-4 bg-[#050505] flex flex-col overflow-hidden">
                <div className="p-4 border-b border-white/10 bg-zinc-900/10">
                  <h4 className="font-mono text-xs text-zinc-500 uppercase tracking-widest font-bold">Suggested Extras</h4>
                </div>
                <ScrollArea className="flex-1 p-6">
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-zinc-400">
                        <Music className="w-4 h-4" />
                        <span className="font-display text-sm font-bold uppercase tracking-tight">Audio Pairings</span>
                      </div>
                      <div className="space-y-2">
                        {MOCK_AI_RESPONSE.music.map((track, i) => (
                          <div key={i} className="flex items-center gap-3 p-3 bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                            <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-mono text-zinc-400">
                              {i + 1}
                            </div>
                            <span className="text-xs text-zinc-300 font-medium truncate">{track}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-zinc-400">
                        <Sticker className="w-4 h-4" />
                        <span className="font-display text-sm font-bold uppercase tracking-tight">Sticker Ideas</span>
                      </div>
                      <div className="space-y-2">
                        {MOCK_AI_RESPONSE.stickers.map((sticker, i) => (
                          <div key={i} className="p-3 bg-white/5 border border-white/5 text-xs text-zinc-300">
                            {sticker}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </ScrollArea>
                
                <div className="p-6 border-t border-white/10 bg-black">
                  <Button 
                    className="w-full h-12 bg-white text-black hover:bg-zinc-200 font-bold font-display uppercase tracking-tight disabled:opacity-50"
                    disabled={!selectedCaptionId}
                    onClick={handleSelect}
                  >
                    Use Selected Strategy
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
