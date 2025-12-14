import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Video, InsertVideo } from "@shared/schema";

async function fetchVideos(): Promise<Video[]> {
  const response = await fetch("/api/videos");
  if (!response.ok) {
    throw new Error("Failed to fetch videos");
  }
  return response.json();
}

async function createVideo(video: InsertVideo): Promise<Video> {
  const response = await fetch("/api/videos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(video),
  });
  if (!response.ok) {
    throw new Error("Failed to create video");
  }
  return response.json();
}

async function updateVideo(id: number, updates: Partial<InsertVideo>): Promise<Video> {
  const response = await fetch(`/api/videos/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!response.ok) {
    throw new Error("Failed to update video");
  }
  return response.json();
}

async function deleteVideo(id: number): Promise<void> {
  const response = await fetch(`/api/videos/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to delete video");
  }
}

export function useVideos() {
  const query = useQuery({
    queryKey: ["videos"],
    queryFn: fetchVideos,
    // Refetch every 2 seconds while videos are being analyzed
    // This ensures posts show up as soon as captions are ready
    refetchInterval: 2000,
    refetchIntervalInBackground: true,
  });

  return query;
}

export function useCreateVideo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createVideo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videos"] });
    },
  });
}

export function useUpdateVideo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<InsertVideo> }) =>
      updateVideo(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videos"] });
    },
  });
}

export function useDeleteVideo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteVideo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videos"] });
    },
  });
}
