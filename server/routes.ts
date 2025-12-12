import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertVideoSchema, insertStrategySettingsSchema } from "@shared/schema";
import { generateCaptions, analyzeContent } from "./gemini";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Video Routes
  app.get("/api/videos", async (req, res) => {
    try {
      const videos = await storage.getVideos();
      res.json(videos);
    } catch (error) {
      console.error("Error fetching videos:", error);
      res.status(500).json({ error: "Failed to fetch videos" });
    }
  });

  app.get("/api/videos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const video = await storage.getVideo(id);
      if (!video) {
        return res.status(404).json({ error: "Video not found" });
      }
      res.json(video);
    } catch (error) {
      console.error("Error fetching video:", error);
      res.status(500).json({ error: "Failed to fetch video" });
    }
  });

  app.post("/api/videos", async (req, res) => {
    try {
      const videoData = insertVideoSchema.parse(req.body);
      const video = await storage.createVideo(videoData);
      res.status(201).json(video);
    } catch (error) {
      console.error("Error creating video:", error);
      res.status(400).json({ error: "Invalid video data" });
    }
  });

  app.patch("/api/videos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const video = await storage.updateVideo(id, req.body);
      if (!video) {
        return res.status(404).json({ error: "Video not found" });
      }
      res.json(video);
    } catch (error) {
      console.error("Error updating video:", error);
      res.status(500).json({ error: "Failed to update video" });
    }
  });

  app.delete("/api/videos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteVideo(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting video:", error);
      res.status(500).json({ error: "Failed to delete video" });
    }
  });

  // AI Caption Generation
  app.post("/api/generate-captions", async (req, res) => {
    try {
      const { contentDescription, category } = req.body;
      
      if (!contentDescription || !category) {
        return res.status(400).json({ error: "contentDescription and category are required" });
      }

      const captions = await generateCaptions(contentDescription, category);
      res.json(captions);
    } catch (error) {
      console.error("Error generating captions:", error);
      res.status(500).json({ error: "Failed to generate captions" });
    }
  });

  // Analytics Chat
  app.post("/api/analytics/chat", async (req, res) => {
    try {
      const { query, analyticsData } = req.body;
      
      if (!query) {
        return res.status(400).json({ error: "query is required" });
      }

      const response = await analyzeContent(query, analyticsData || {});
      res.json({ response });
    } catch (error) {
      console.error("Error analyzing content:", error);
      res.status(500).json({ error: "Failed to analyze content" });
    }
  });

  // Dashboard KPIs
  app.get("/api/dashboard/kpis", async (req, res) => {
    try {
      const videos = await storage.getVideos();
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      
      const lastWeekStart = new Date(startOfWeek);
      lastWeekStart.setDate(lastWeekStart.getDate() - 7);
      
      // Filter by time periods
      const thisWeekPosts = videos.filter(v => 
        v.status === "posted" && v.publishedDate && new Date(v.publishedDate) >= startOfWeek
      );
      const lastWeekPosts = videos.filter(v => 
        v.status === "posted" && v.publishedDate && 
        new Date(v.publishedDate) >= lastWeekStart && new Date(v.publishedDate) < startOfWeek
      );
      
      // Output metrics
      const postsThisWeek = thisWeekPosts.length;
      const postsLastWeek = lastWeekPosts.length;
      const postsWoW = postsLastWeek > 0 ? Math.round(((postsThisWeek - postsLastWeek) / postsLastWeek) * 100) : 0;
      
      // Breakdown by post type
      const reelsPublished = thisWeekPosts.filter(v => v.postType === "reel").length;
      const storiesPosted = thisWeekPosts.filter(v => v.postType === "story").length;
      const shortsPublished = thisWeekPosts.filter(v => v.postType === "short").length;
      const feedPosts = thisWeekPosts.filter(v => v.postType === "post").length;
      
      // Pipeline metrics
      const scheduled = videos.filter(v => v.status === "scheduled");
      const drafts = videos.filter(v => v.status === "draft");
      const processing = videos.filter(v => v.status === "processing");
      
      const next7Days = new Date(now);
      next7Days.setDate(next7Days.getDate() + 7);
      const next30Days = new Date(now);
      next30Days.setDate(next30Days.getDate() + 30);
      
      const scheduledNext7 = scheduled.filter(v => 
        v.scheduledDate && new Date(v.scheduledDate) <= next7Days
      ).length;
      const scheduledNext30 = scheduled.filter(v => 
        v.scheduledDate && new Date(v.scheduledDate) <= next30Days
      ).length;
      
      // Consistency score: planned vs published
      const plannedThisWeek = videos.filter(v => 
        v.scheduledDate && 
        new Date(v.scheduledDate) >= startOfWeek && 
        new Date(v.scheduledDate) <= now
      ).length;
      const consistencyScore = plannedThisWeek > 0 
        ? Math.round((postsThisWeek / plannedThisWeek) * 100) 
        : postsThisWeek > 0 ? 100 : 0;
      
      // Engagement metrics (from posted content)
      const postedVideos = videos.filter(v => v.status === "posted");
      const totalEngagement = postedVideos.reduce((sum, v) => 
        sum + (v.likes || 0) + (v.comments || 0) + (v.shares || 0) + (v.saves || 0), 0
      );
      const totalReach = postedVideos.reduce((sum, v) => sum + (v.reach || 0), 0);
      const totalShares = postedVideos.reduce((sum, v) => sum + (v.shares || 0), 0);
      const totalSaves = postedVideos.reduce((sum, v) => sum + (v.saves || 0), 0);
      const engagementRate = totalReach > 0 ? ((totalEngagement / totalReach) * 100).toFixed(1) : "0";
      
      res.json({
        output: {
          postsThisWeek,
          postsWoW,
          reelsPublished,
          storiesPosted,
          shortsPublished,
          feedPosts,
          consistencyScore,
        },
        pipeline: {
          scheduledNext7,
          scheduledNext30,
          draftsCount: drafts.length,
          processingCount: processing.length,
          totalScheduled: scheduled.length,
        },
        impact: {
          totalEngagement,
          engagementRate,
          totalShares,
          totalSaves,
          totalReach,
        },
        queues: {
          scheduled: scheduled.slice(0, 5),
          drafts: drafts.slice(0, 5),
          processing: processing.slice(0, 3),
        }
      });
    } catch (error) {
      console.error("Error fetching dashboard KPIs:", error);
      res.status(500).json({ error: "Failed to fetch dashboard KPIs" });
    }
  });

  // Strategy Settings Routes
  app.get("/api/strategy", async (req, res) => {
    try {
      const settings = await storage.getStrategySettings();
      res.json(settings || { dripFrequency: 5, categoryWeights: {} });
    } catch (error) {
      console.error("Error fetching strategy settings:", error);
      res.status(500).json({ error: "Failed to fetch strategy settings" });
    }
  });

  app.post("/api/strategy", async (req, res) => {
    try {
      const settingsData = insertStrategySettingsSchema.parse(req.body);
      const settings = await storage.upsertStrategySettings(settingsData);
      res.json(settings);
    } catch (error) {
      console.error("Error saving strategy settings:", error);
      res.status(400).json({ error: "Invalid strategy data" });
    }
  });

  // Auto-schedule unscheduled content
  app.post("/api/videos/auto-schedule", async (req, res) => {
    try {
      const videos = await storage.getVideos();
      const unscheduledDrafts = videos.filter(v => v.status === "draft" && !v.scheduledDate);
      
      if (unscheduledDrafts.length === 0) {
        return res.json({ message: "No unscheduled drafts to schedule", scheduled: 0 });
      }

      // Get strategy settings for optimal scheduling
      const strategy = await storage.getStrategySettings();
      const postsPerWeek = strategy?.dripFrequency || 5;

      // Find existing scheduled slots (with hour granularity) to avoid conflicts
      const scheduledVideos = videos.filter(v => v.status === "scheduled" && v.scheduledDate);
      const occupiedSlots = new Set<string>();
      scheduledVideos.forEach(v => {
        const date = new Date(v.scheduledDate!);
        const slotKey = `${date.toDateString()}-${date.getHours()}`;
        occupiedSlots.add(slotKey);
      });

      // Best posting times (9am, 12pm, 5pm)
      const postingHours = [9, 12, 17];
      
      // Start scheduling from tomorrow
      const now = new Date();
      let currentDate = new Date(now);
      currentDate.setDate(currentDate.getDate() + 1);
      let hourIndex = 0;
      currentDate.setHours(postingHours[hourIndex], 0, 0, 0);

      let scheduledCount = 0;

      for (const draft of unscheduledDrafts) {
        // Skip weekends for business content, allow for personal
        while (
          (draft.category === "Business" || draft.category === "Sales" || draft.category === "Software") &&
          (currentDate.getDay() === 0 || currentDate.getDay() === 6)
        ) {
          currentDate.setDate(currentDate.getDate() + 1);
          hourIndex = 0;
          currentDate.setHours(postingHours[hourIndex], 0, 0, 0);
        }

        // Find next available slot (checking date+hour granularity)
        let slotKey = `${currentDate.toDateString()}-${postingHours[hourIndex]}`;
        while (occupiedSlots.has(slotKey)) {
          hourIndex++;
          if (hourIndex >= postingHours.length) {
            hourIndex = 0;
            currentDate.setDate(currentDate.getDate() + 1);
          }
          currentDate.setHours(postingHours[hourIndex], 0, 0, 0);
          slotKey = `${currentDate.toDateString()}-${postingHours[hourIndex]}`;
        }

        // Schedule this draft
        const scheduledDate = new Date(currentDate);
        await storage.updateVideo(draft.id, {
          scheduledDate,
          status: "scheduled",
        });

        occupiedSlots.add(slotKey);
        scheduledCount++;

        // Move to next slot
        hourIndex++;
        if (hourIndex >= postingHours.length) {
          hourIndex = 0;
          currentDate.setDate(currentDate.getDate() + 1);
        }
        currentDate.setHours(postingHours[hourIndex], 0, 0, 0);
      }

      res.json({ 
        message: `Successfully scheduled ${scheduledCount} posts`,
        scheduled: scheduledCount 
      });
    } catch (error) {
      console.error("Error auto-scheduling:", error);
      res.status(500).json({ error: "Failed to auto-schedule content" });
    }
  });

  return httpServer;
}
