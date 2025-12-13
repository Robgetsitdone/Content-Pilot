import { useState, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { 
  DndContext, 
  DragEndEvent, 
  DragOverlay,
  DragStartEvent,
  useDraggable, 
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Wand2,
  Film,
  ImageIcon,
  Play,
  GripVertical
} from "lucide-react";
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  addWeeks, 
  subWeeks, 
  addMonths, 
  subMonths,
  isSameDay,
  isSameMonth,
  isToday,
  setHours,
  setMinutes
} from "date-fns";
import type { Video } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

const CATEGORY_COLORS: Record<string, string> = {
  "Business": "#ffffff",
  "Family": "#a1a1aa",
  "Fitness": "#22c55e",
  "Travel": "#3b82f6",
  "Parenting": "#f59e0b",
  "Sales": "#8b5cf6",
  "Technology": "#06b6d4",
  "Software": "#ec4899",
  "Bay Area": "#f97316",
  "Track and Field": "#ef4444",
  "Finances": "#10b981",
  "General": "#71717a",
};

const TIME_SLOTS = [
  { hour: 9, label: "Morning", id: "morning" },
  { hour: 12, label: "Afternoon", id: "afternoon" },
  { hour: 17, label: "Evening", id: "evening" },
];

const DraggableContent = ({ video, isDragging }: { video: Video; isDragging?: boolean }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: video.id,
    data: video,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const categoryColor = CATEGORY_COLORS[video.category] || CATEGORY_COLORS["General"];

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`flex items-center gap-2 p-2 bg-zinc-900 border border-zinc-800 cursor-grab active:cursor-grabbing hover:border-zinc-600 transition-colors group ${isDragging ? 'opacity-50' : ''}`}
      data-testid={`draggable-content-${video.id}`}
    >
      <div 
        className="w-1 h-full min-h-[40px] shrink-0" 
        style={{ backgroundColor: categoryColor }}
      />
      <GripVertical className="w-3 h-3 text-zinc-600 shrink-0" />
      <div className="w-10 h-10 bg-zinc-800 shrink-0 flex items-center justify-center overflow-hidden border border-zinc-700">
        {video.mediaUrl && video.mediaType === "image" ? (
          <img src={video.mediaUrl} alt="" className="w-full h-full object-cover" />
        ) : video.postType === "reel" || video.postType === "short" ? (
          <Film className="w-4 h-4 text-zinc-500" />
        ) : video.postType === "story" ? (
          <Play className="w-4 h-4 text-zinc-500" />
        ) : (
          <ImageIcon className="w-4 h-4 text-zinc-500" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-display text-xs font-medium text-zinc-300 truncate group-hover:text-white">
          {video.title}
        </p>
        <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-600">
          {video.category}
        </span>
      </div>
    </div>
  );
};

const DragOverlayContent = ({ video }: { video: Video }) => {
  const categoryColor = CATEGORY_COLORS[video.category] || CATEGORY_COLORS["General"];

  return (
    <div className="flex items-center gap-2 p-2 bg-zinc-900 border-2 border-white shadow-2xl cursor-grabbing">
      <div 
        className="w-1 h-full min-h-[40px] shrink-0" 
        style={{ backgroundColor: categoryColor }}
      />
      <div className="w-10 h-10 bg-zinc-800 shrink-0 flex items-center justify-center overflow-hidden border border-zinc-700">
        {video.mediaUrl && video.mediaType === "image" ? (
          <img src={video.mediaUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <ImageIcon className="w-4 h-4 text-zinc-500" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-display text-xs font-medium text-white truncate">
          {video.title}
        </p>
        <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-400">
          {video.category}
        </span>
      </div>
    </div>
  );
};

const DroppableTimeSlot = ({ 
  date,
  slotHour,
  slotLabel,
  videos,
}: {
  date: Date;
  slotHour: number;
  slotLabel: string;
  videos: Video[];
}) => {
  const droppableId = `${date.toISOString()}-${slotHour}`;
  const { isOver, setNodeRef } = useDroppable({
    id: droppableId,
    data: { date, hour: slotHour },
  });

  const slotVideos = videos.filter(v => 
    v.scheduledDate && 
    isSameDay(new Date(v.scheduledDate), date) &&
    new Date(v.scheduledDate).getHours() === slotHour
  );

  return (
    <div
      ref={setNodeRef}
      className={`
        border border-zinc-800 p-2 min-h-[60px] transition-colors rounded
        ${isOver ? "bg-emerald-500/20 border-emerald-500" : "bg-zinc-950/50"}
      `}
      data-testid={`slot-${format(date, "yyyy-MM-dd")}-${slotLabel.toLowerCase()}`}
    >
      <div className="text-[10px] font-mono text-zinc-600 uppercase mb-1.5 tracking-wide">
        {slotLabel}
      </div>
      <div className="space-y-1">
        {slotVideos.map((video) => (
          <DraggableContent key={video.id} video={video} />
        ))}
      </div>
    </div>
  );
};

const DroppableDay = ({ 
  date, 
  videos, 
  isCurrentMonth,
  view
}: { 
  date: Date; 
  videos: Video[]; 
  isCurrentMonth: boolean;
  view: "week" | "month";
}) => {
  const dayVideos = videos.filter(v => 
    v.scheduledDate && isSameDay(new Date(v.scheduledDate), date)
  );

  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
  const droppableId = `day-${date.toISOString()}`;
  const { isOver: dayIsOver, setNodeRef: setDayNodeRef } = useDroppable({
    id: droppableId,
    data: { date, isDay: true },
  });

  // For month view, just show a simpler layout
  if (view === "month") {
    return (
      <div
        ref={setDayNodeRef}
        className={`
          border transition-colors
          ${dayIsOver ? "border-emerald-500 bg-emerald-500/20" : "border-zinc-900"}
          ${isCurrentMonth ? "bg-black" : "bg-zinc-950 opacity-40"}
          ${isWeekend ? "bg-zinc-950" : ""}
          p-2 min-h-[120px]
        `}
        data-testid={`day-${format(date, "yyyy-MM-dd")}`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className={`
            font-display text-sm font-bold
            ${isToday(date) ? "bg-white text-black px-2 py-0.5" : "text-zinc-500"}
          `}>
            {format(date, "d")}
          </span>
        </div>
        <div className="space-y-1">
          {dayVideos.slice(0, 2).map((video) => (
            <DraggableContent key={video.id} video={video} />
          ))}
          {dayVideos.length > 2 && (
            <p className="font-mono text-[9px] text-zinc-600 px-2">
              +{dayVideos.length - 2} more
            </p>
          )}
        </div>
      </div>
    );
  }

  // Week view with time slots
  return (
    <div
      ref={setDayNodeRef}
      className={`
        border transition-colors bg-black p-2 min-h-[200px] flex flex-col gap-2
        ${dayIsOver ? "border-emerald-500" : "border-zinc-900"}
      `}
      data-testid={`day-${format(date, "yyyy-MM-dd")}`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className={`
          font-display text-sm font-bold
          ${isToday(date) ? "bg-white text-black px-2 py-0.5" : "text-zinc-500"}
        `}>
          {format(date, "d")}
        </span>
        <span className="font-mono text-[10px] text-zinc-600 uppercase">
          {format(date, "EEE")}
        </span>
      </div>
      <div className="space-y-1.5 flex-1">
        {TIME_SLOTS.map(({ hour, label }) => (
          <DroppableTimeSlot
            key={label}
            date={date}
            slotHour={hour}
            slotLabel={label}
            videos={videos}
          />
        ))}
      </div>
    </div>
  );
};

const UnscheduledPanel = ({ videos }: { videos: Video[] }) => {
  const unscheduledVideos = videos.filter(v => 
    v.status === "draft" && !v.scheduledDate
  );

  const { isOver: panelIsOver, setNodeRef: setPanelNodeRef } = useDroppable({
    id: "unscheduled-panel",
    data: { isUnscheduled: true },
  });

  return (
    <div 
      ref={setPanelNodeRef}
      className={`
        border transition-colors bg-black p-4
        ${panelIsOver ? "border-emerald-500 bg-emerald-500/10" : "border-zinc-900"}
      `}
    >
      <h3 className="font-display font-bold uppercase text-sm mb-4 flex items-center gap-2">
        <div className="w-2 h-2 bg-yellow-500 rounded-full" />
        Unscheduled Content
        <span className="font-mono text-xs text-zinc-500 ml-auto">{unscheduledVideos.length}</span>
      </h3>
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {unscheduledVideos.length > 0 ? (
          unscheduledVideos.map((video) => (
            <DraggableContent key={video.id} video={video} />
          ))
        ) : (
          <p className="font-mono text-xs text-zinc-600 uppercase text-center py-4">
            All content scheduled
          </p>
        )}
      </div>
    </div>
  );
};

export default function Calendar() {
  const [view, setView] = useState<"week" | "month">("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeId, setActiveId] = useState<number | null>(null);

  const queryClient = useQueryClient();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const { data: videos = [] } = useQuery<Video[]>({
    queryKey: ["/api/videos"],
    queryFn: async () => {
      const response = await fetch("/api/videos");
      if (!response.ok) throw new Error("Failed to fetch videos");
      return response.json();
    },
  });

  const updateVideoMutation = useMutation({
    mutationFn: async ({ id, scheduledDate, status }: { id: number; scheduledDate: Date | null; status: string }) => {
      return apiRequest("PATCH", `/api/videos/${id}`, { 
        scheduledDate: scheduledDate ? scheduledDate.toISOString() : null, 
        status 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/kpis"] });
    },
  });

  const autoScheduleMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/videos/auto-schedule");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/kpis"] });
    },
  });

  const days = useMemo(() => {
    if (view === "week") {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 });
      const end = endOfWeek(currentDate, { weekStartsOn: 0 });
      return eachDayOfInterval({ start, end });
    } else {
      const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
      const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
      return eachDayOfInterval({ start, end });
    }
  }, [view, currentDate]);

  const navigatePrevious = () => {
    if (view === "week") {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };

  const navigateNext = () => {
    if (view === "week") {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const videoId = active.id as number;

    // Drop on unscheduled panel - remove schedule
    if (over.data.current?.isUnscheduled) {
      updateVideoMutation.mutate({ 
        id: videoId, 
        scheduledDate: null as any,
        status: "draft" 
      });
      return;
    }

    // Drop on time slot (week view)
    if (over.data.current?.date && over.data.current?.hour !== undefined) {
      const targetDate = over.data.current.date as Date;
      const targetHour = over.data.current.hour as number;
      const scheduledDate = setMinutes(setHours(targetDate, targetHour), 0);
      
      updateVideoMutation.mutate({ 
        id: videoId, 
        scheduledDate,
        status: "scheduled" 
      });
      return;
    }

    // Drop on day cell (month view or general day)
    if (over.data.current?.date && over.data.current?.isDay) {
      const targetDate = over.data.current.date as Date;
      // Default to morning (9am) when dropping on a day without specific time slot
      const scheduledDate = setMinutes(setHours(targetDate, 9), 0);
      
      updateVideoMutation.mutate({ 
        id: videoId, 
        scheduledDate,
        status: "scheduled" 
      });
      return;
    }
  };

  const activeVideo = activeId ? videos.find(v => v.id === activeId) : null;

  return (
    <Layout>
      <header className="flex flex-col gap-4 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-5xl md:text-6xl font-bold tracking-tighter text-white uppercase leading-[0.85]">
              Content<br/><span className="text-zinc-700">Calendar</span>
            </h1>
          </div>
          <Button
            onClick={() => autoScheduleMutation.mutate()}
            disabled={autoScheduleMutation.isPending}
            className="bg-white text-black hover:bg-zinc-200 font-display uppercase tracking-tight"
            data-testid="button-auto-schedule"
          >
            <Wand2 className="w-4 h-4 mr-2" />
            {autoScheduleMutation.isPending ? "Scheduling..." : "Auto Schedule"}
          </Button>
        </div>
      </header>

      <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={navigatePrevious}
            className="hover:bg-zinc-900"
            data-testid="button-prev"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h2 className="font-display text-2xl font-bold min-w-[200px] text-center">
            {view === "week" 
              ? `${format(days[0], "MMM d")} - ${format(days[6], "MMM d, yyyy")}`
              : format(currentDate, "MMMM yyyy")
            }
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={navigateNext}
            className="hover:bg-zinc-900"
            data-testid="button-next"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            className="font-mono text-xs uppercase"
            data-testid="button-today"
          >
            Today
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={view === "week" ? "default" : "ghost"}
            size="sm"
            onClick={() => setView("week")}
            className={`font-mono text-xs uppercase ${view === "week" ? "bg-white text-black" : ""}`}
            data-testid="button-view-week"
          >
            Week
          </Button>
          <Button
            variant={view === "month" ? "default" : "ghost"}
            size="sm"
            onClick={() => setView("month")}
            className={`font-mono text-xs uppercase ${view === "month" ? "bg-white text-black" : ""}`}
            data-testid="button-view-month"
          >
            Month
          </Button>
        </div>
      </div>

      <DndContext 
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-9">
            {view === "week" && (
              <div className="grid grid-cols-7 gap-1 mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="text-center font-mono text-xs text-zinc-500 uppercase py-2">
                    {day}
                  </div>
                ))}
              </div>
            )}
            {view === "month" && (
              <div className="grid grid-cols-7 gap-1 mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="text-center font-mono text-xs text-zinc-500 uppercase py-2">
                    {day}
                  </div>
                ))}
              </div>
            )}
            <div className={`grid grid-cols-7 gap-1 ${view === "month" ? "grid-rows-5" : ""}`}>
              {days.map((day) => (
                <DroppableDay
                  key={day.toISOString()}
                  date={day}
                  videos={videos}
                  isCurrentMonth={isSameMonth(day, currentDate)}
                  view={view}
                />
              ))}
            </div>
          </div>

          <div className="lg:col-span-3">
            <UnscheduledPanel videos={videos} />
            
            <div className="mt-6 border border-zinc-900 bg-black p-4">
              <h3 className="font-display font-bold uppercase text-sm mb-4">Category Legend</h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(CATEGORY_COLORS).slice(0, 10).map(([category, color]) => (
                  <div key={category} className="flex items-center gap-2">
                    <div className="w-3 h-3 shrink-0" style={{ backgroundColor: color }} />
                    <span className="font-mono text-[10px] text-zinc-500 uppercase truncate">{category}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <DragOverlay>
          {activeVideo && <DragOverlayContent video={activeVideo} />}
        </DragOverlay>
      </DndContext>
    </Layout>
  );
}
