import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertVideoSchema, insertStrategySettingsSchema, insertInstagramSettingsSchema } from "@shared/schema";
import { generateCaptions, analyzeContent, analyzeImageBatch } from "./gemini";
import { createPostReminder, deletePostReminder } from "./googleCalendar";
import { publishToInstagram, checkAndPublishScheduledPosts } from "./instagram";

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
      const existingVideo = await storage.getVideo(id);
      if (!existingVideo) {
        return res.status(404).json({ error: "Video not found" });
      }

      const updateData = { ...req.body };
      
      // Convert scheduledDate string to Date object if present
      if (updateData.scheduledDate !== undefined) {
        updateData.scheduledDate = updateData.scheduledDate ? new Date(updateData.scheduledDate) : null;
      }

      // Handle calendar reminder if notifyMe is enabled and scheduling
      if (req.body.notifyMe === true && req.body.scheduledDate && req.body.status === "scheduled") {
        try {
          // Delete old calendar event if exists
          if (existingVideo.calendarEventId) {
            await deletePostReminder(existingVideo.calendarEventId);
          }
          // Create new calendar reminder
          const eventId = await createPostReminder(
            existingVideo.title,
            existingVideo.category,
            new Date(req.body.scheduledDate),
            id
          );
          if (eventId) {
            updateData.calendarEventId = eventId;
          }
        } catch (calError) {
          console.error("Calendar reminder error:", calError);
        }
      }

      // If turning off notifyMe, delete the calendar event
      if (req.body.notifyMe === false && existingVideo.calendarEventId) {
        try {
          await deletePostReminder(existingVideo.calendarEventId);
          updateData.calendarEventId = null;
        } catch (calError) {
          console.error("Calendar delete error:", calError);
        }
      }

      const video = await storage.updateVideo(id, updateData);
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

  // Batch Image Analysis with AI
  app.post("/api/videos/batch-analyze", async (req, res) => {
    try {
      const { images } = req.body;
      
      if (!images || !Array.isArray(images) || images.length === 0) {
        return res.status(400).json({ error: "images array is required" });
      }

      const results = await analyzeImageBatch(images);
      res.json({ results });
    } catch (error) {
      console.error("Error analyzing images:", error);
      res.status(500).json({ error: "Failed to analyze images" });
    }
  });

  // Batch Video Creation
  app.post("/api/videos/batch", async (req, res) => {
    try {
      const { videos: videosData } = req.body;
      
      if (!videosData || !Array.isArray(videosData) || videosData.length === 0) {
        return res.status(400).json({ error: "videos array is required" });
      }

      const parsedVideos = videosData.map((v: any) => insertVideoSchema.parse(v));
      const createdVideos = await storage.createVideosBatch(parsedVideos);
      res.status(201).json(createdVideos);
    } catch (error) {
      console.error("Error creating videos batch:", error);
      res.status(400).json({ error: "Invalid video data" });
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

  // Instagram Settings
  app.get("/api/instagram/settings", async (req, res) => {
    try {
      const settings = await storage.getInstagramSettings();
      res.json(settings || { isConnected: false });
    } catch (error) {
      console.error("Error fetching Instagram settings:", error);
      res.status(500).json({ error: "Failed to fetch Instagram settings" });
    }
  });

  app.post("/api/instagram/settings", async (req, res) => {
    try {
      const { accessToken, businessAccountId, igUserId, autoPublish } = req.body;
      
      if (!accessToken || !businessAccountId) {
        return res.status(400).json({ error: "Access token and Business Account ID are required" });
      }

      const settings = await storage.upsertInstagramSettings({
        accessToken,
        businessAccountId,
        igUserId: igUserId || null,
        autoPublish: autoPublish || false,
        isConnected: !!(accessToken && igUserId),
      });
      res.json(settings);
    } catch (error) {
      console.error("Error saving Instagram settings:", error);
      res.status(400).json({ error: "Invalid Instagram settings" });
    }
  });

  app.post("/api/instagram/test", async (req, res) => {
    try {
      const { accessToken, businessAccountId } = req.body;
      
      if (!accessToken || !businessAccountId) {
        return res.status(400).json({ error: "Missing credentials" });
      }

      const response = await fetch(
        `https://graph.facebook.com/v18.0/${businessAccountId}?fields=instagram_business_account{id,username},name&access_token=${accessToken}`
      );
      
      if (!response.ok) {
        const error = await response.json();
        console.error("Instagram API error:", error);
        return res.status(400).json({ error: "Invalid credentials or permissions" });
      }

      const data = await response.json();
      const igAccount = data.instagram_business_account;
      
      if (!igAccount) {
        return res.status(400).json({ error: "No Instagram Business Account linked to this Facebook Page" });
      }

      res.json({ 
        success: true, 
        username: igAccount.username,
        igUserId: igAccount.id,
        pageId: businessAccountId 
      });
    } catch (error) {
      console.error("Error testing Instagram connection:", error);
      res.status(500).json({ error: "Failed to test connection" });
    }
  });

  // Toggle notification endpoint
  app.post("/api/videos/:id/notify", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { notifyMe } = req.body;
      
      const video = await storage.getVideo(id);
      if (!video) {
        return res.status(404).json({ error: "Video not found" });
      }

      const updateData: any = { notifyMe };

      // Create or delete calendar reminder based on toggle
      if (notifyMe && video.scheduledDate && video.status === "scheduled") {
        try {
          if (video.calendarEventId) {
            await deletePostReminder(video.calendarEventId);
          }
          const eventId = await createPostReminder(
            video.title,
            video.category,
            new Date(video.scheduledDate),
            id
          );
          if (eventId) {
            updateData.calendarEventId = eventId;
          }
        } catch (calError) {
          console.error("Calendar reminder error:", calError);
        }
      } else if (!notifyMe && video.calendarEventId) {
        try {
          await deletePostReminder(video.calendarEventId);
          updateData.calendarEventId = null;
        } catch (calError) {
          console.error("Calendar delete error:", calError);
        }
      }

      const updatedVideo = await storage.updateVideo(id, updateData);
      res.json(updatedVideo);
    } catch (error) {
      console.error("Error toggling notification:", error);
      res.status(500).json({ error: "Failed to toggle notification" });
    }
  });

  // Instagram Publish Endpoints
  app.post("/api/videos/:id/publish", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const video = await storage.getVideo(id);
      
      if (!video) {
        return res.status(404).json({ error: "Video not found" });
      }

      if (!video.mediaUrl || !video.caption) {
        return res.status(400).json({ error: "Video must have media and caption to publish" });
      }

      const result = await publishToInstagram(
        video.id,
        video.mediaUrl,
        video.caption,
        video.mediaType || "image"
      );

      if (result.success) {
        const updatedVideo = await storage.updateVideo(id, {
          status: "posted",
          publishedDate: new Date(),
          instagramPostId: result.postId,
        });
        res.json({ success: true, video: updatedVideo, postId: result.postId });
      } else {
        res.status(400).json({ success: false, error: result.error });
      }
    } catch (error) {
      console.error("Error publishing to Instagram:", error);
      res.status(500).json({ error: "Failed to publish to Instagram" });
    }
  });

  app.post("/api/scheduler/run", async (req, res) => {
    try {
      const result = await checkAndPublishScheduledPosts();
      res.json(result);
    } catch (error) {
      console.error("Scheduler error:", error);
      res.status(500).json({ error: "Scheduler failed" });
    }
  });

  // Start scheduler interval (check every minute)
  setInterval(async () => {
    try {
      const result = await checkAndPublishScheduledPosts();
      if (result.published > 0 || result.failed > 0) {
        console.log(`Scheduler: Published ${result.published}, Failed ${result.failed}`);
      }
    } catch (error) {
      console.error("Scheduler interval error:", error);
    }
  }, 60000);

  return httpServer;
}
