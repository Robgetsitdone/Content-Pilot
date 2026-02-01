import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertVideoSchema, insertStrategySettingsSchema, insertInstagramSettingsSchema, signupSchema, loginSchema } from "@shared/schema";
import { generateCaptions, analyzeContent, analyzeImageBatch, analyzeImageBatchStreaming } from "./gemini";
import { createPostReminder, deletePostReminder } from "./googleCalendar";
import { publishToInstagram, checkAndPublishScheduledPosts } from "./instagram";
import { requireAuth, hashPassword, verifyPassword, createUser, findUserByEmail, findUserByGoogleId } from "./auth";
import { extractVideoFrame, isVideoMimeType } from "./videoProcessing";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // ===== AUTH ROUTES (public) =====
  
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, password, displayName } = signupSchema.parse(req.body);
      
      const existingUser = await findUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }

      const passwordHash = await hashPassword(password);
      const user = await createUser({ email, passwordHash, displayName });
      
      req.session.userId = user.id;
      res.status(201).json({ 
        id: user.id, 
        email: user.email, 
        displayName: user.displayName 
      });
    } catch (error: any) {
      console.error("Signup error:", error);
      if (error.issues) {
        return res.status(400).json({ error: error.issues[0].message });
      }
      res.status(500).json({ error: "Signup failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const user = await findUserByEmail(email);
      if (!user || !user.passwordHash) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const valid = await verifyPassword(password, user.passwordHash);
      if (!valid) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      req.session.userId = user.id;
      res.json({ 
        id: user.id, 
        email: user.email, 
        displayName: user.displayName 
      });
    } catch (error: any) {
      console.error("Login error:", error);
      if (error.issues) {
        return res.status(400).json({ error: error.issues[0].message });
      }
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.clearCookie("connect.sid");
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const user = await findUserByEmail(req.session.userId);
    if (!user) {
      const { findUserById } = await import("./auth");
      const userById = await findUserById(req.session.userId);
      if (!userById) {
        return res.status(401).json({ error: "User not found" });
      }
      return res.json({ 
        id: userById.id, 
        email: userById.email, 
        displayName: userById.displayName 
      });
    }
    res.json({ 
      id: user.id, 
      email: user.email, 
      displayName: user.displayName 
    });
  });

  // ===== PROTECTED ROUTES (require auth) =====
  
  // Video Routes
  app.get("/api/videos", requireAuth, async (req, res) => {
    try {
      const videos = await storage.getVideos(req.user!.id);
      res.json(videos);
    } catch (error) {
      console.error("Error fetching videos:", error);
      res.status(500).json({ error: "Failed to fetch videos" });
    }
  });

  app.get("/api/videos/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const video = await storage.getVideo(id, req.user!.id);
      if (!video) {
        return res.status(404).json({ error: "Video not found" });
      }
      res.json(video);
    } catch (error) {
      console.error("Error fetching video:", error);
      res.status(500).json({ error: "Failed to fetch video" });
    }
  });

  app.post("/api/videos", requireAuth, async (req, res) => {
    try {
      const videoData = insertVideoSchema.parse(req.body);
      const video = await storage.createVideo({ ...videoData, userId: req.user!.id });
      res.status(201).json(video);
    } catch (error) {
      console.error("Error creating video:", error);
      res.status(400).json({ error: "Invalid video data" });
    }
  });

  app.patch("/api/videos/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existingVideo = await storage.getVideo(id, req.user!.id);
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

      const video = await storage.updateVideo(id, req.user!.id, updateData);
      res.json(video);
    } catch (error) {
      console.error("Error updating video:", error);
      res.status(500).json({ error: "Failed to update video" });
    }
  });

  app.delete("/api/videos/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteVideo(id, req.user!.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting video:", error);
      res.status(500).json({ error: "Failed to delete video" });
    }
  });

  app.post("/api/videos/:id/regenerate-captions", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const video = await storage.getVideo(id, req.user!.id);
      if (!video) {
        return res.status(404).json({ error: "Video not found" });
      }
      
      if (!video.mediaUrl) {
        return res.status(400).json({ error: "No media to analyze" });
      }
      
      const results = await analyzeImageBatch([{
        base64: video.mediaUrl,
        filename: video.title || "image.jpg"
      }]);
      
      if (results.length > 0) {
        const result = results[0];
        const updatedVideo = await storage.updateVideo(id, req.user!.id, {
          category: result.category,
          caption: result.captions[0]?.text || video.caption,
          captionTone: result.captions[0]?.tone || video.captionTone,
          aiData: {
            captions: result.captions,
            extendedPost: result.extendedPost,
            music: result.music,
            stickers: result.stickers
          }
        });
        return res.json(updatedVideo);
      }
      
      res.status(500).json({ error: "Failed to analyze image" });
    } catch (error) {
      console.error("Error regenerating captions:", error);
      res.status(500).json({ error: "Failed to regenerate captions" });
    }
  });

  // Batch Image Analysis with AI
  app.post("/api/videos/batch-analyze", requireAuth, async (req, res) => {
    try {
      const { images } = req.body;
      
      console.log("[batch-analyze] Received request with", images?.length || 0, "images");
      
      if (!images || !Array.isArray(images) || images.length === 0) {
        return res.status(400).json({ error: "images array is required" });
      }

      const results = await analyzeImageBatch(images);
      console.log("[batch-analyze] Successfully analyzed", results.length, "images");
      res.json({ results });
    } catch (error: any) {
      console.error("[batch-analyze] Error analyzing images:", error?.message || error);
      console.error("[batch-analyze] Full error:", JSON.stringify(error, null, 2));
      res.status(500).json({ error: "Failed to analyze images", details: error?.message });
    }
  });

  // Streaming Batch Media Analysis - handles both images and videos
  app.post("/api/videos/batch-analyze-stream", requireAuth, async (req, res) => {
    try {
      const { images, generationNote } = req.body;

      console.log("[batch-analyze-stream] Received request with", images?.length || 0, "media items", generationNote ? `(note: "${generationNote.substring(0, 50)}...")` : "");

      if (!images || !Array.isArray(images) || images.length === 0) {
        return res.status(400).json({ error: "images array is required" });
      }

      // Pre-process videos to extract frames
      const processedMedia: Array<{ base64: string; filename: string; originalBase64?: string; isVideo?: boolean; videoDuration?: number; thumbnailBase64?: string }> = [];
      
      for (const item of images) {
        if (isVideoMimeType(item.base64)) {
          console.log(`[batch-analyze-stream] Processing video: ${item.filename}`);
          try {
            const videoResult = await extractVideoFrame(item.base64);
            processedMedia.push({
              base64: videoResult.frameBase64,
              filename: item.filename,
              originalBase64: item.base64,
              isVideo: true,
              videoDuration: videoResult.duration,
              thumbnailBase64: videoResult.frameBase64
            });
            console.log(`[batch-analyze-stream] Extracted frame from video: ${item.filename} (${videoResult.duration.toFixed(1)}s)`);
          } catch (videoError: any) {
            console.error(`[batch-analyze-stream] Failed to process video ${item.filename}:`, videoError?.message);
            console.log(`[batch-analyze-stream] Skipping video analysis for ${item.filename} - ffmpeg extraction failed`);
            processedMedia.push({
              base64: "",
              filename: item.filename,
              originalBase64: item.base64,
              isVideo: true,
              thumbnailBase64: ""
            });
          }
        } else {
          processedMedia.push({
            base64: item.base64,
            filename: item.filename,
            isVideo: false
          });
        }
      }

      // Set headers for streaming newline-delimited JSON
      res.setHeader("Content-Type", "application/x-ndjson");
      res.setHeader("Transfer-Encoding", "chunked");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      // Filter out items with empty base64 (failed video extraction)
      const validMedia = processedMedia.filter(item => item.base64 !== "");
      const skippedMedia = processedMedia.filter(item => item.base64 === "");
      
      // Stream results as they complete
      let streamedCount = 0;
      for await (const { index, total, result } of analyzeImageBatchStreaming(validMedia, generationNote)) {
        const mediaItem = validMedia[index];
        const chunk = JSON.stringify({ 
          index: streamedCount, 
          total: processedMedia.length, 
          result,
          isVideo: mediaItem.isVideo,
          originalBase64: mediaItem.originalBase64,
          videoDuration: mediaItem.videoDuration,
          thumbnailBase64: mediaItem.thumbnailBase64
        }) + "\n";
        res.write(chunk);
        streamedCount++;
        console.log(`[batch-analyze-stream] Sent result ${streamedCount}/${processedMedia.length}: ${result.filename} (${mediaItem.isVideo ? 'video' : 'image'})`);
      }
      
      // Send error results for skipped videos
      for (const skipped of skippedMedia) {
        const errorResult = {
          filename: skipped.filename,
          category: "General",
          captions: [
            { id: "c1", tone: "Quick & Witty", text: "Video ready to share! 💪", hashtags: ["#video", "#content", "#creator"] },
            { id: "c2", tone: "Real Talk", text: "Another video, another story.", hashtags: ["#grind", "#hustle", "#mindset"] },
            { id: "c3", tone: "Authentic", text: "Making moves, one clip at a time.", hashtags: ["#progress", "#growth", "#journey"] }
          ],
          extendedPost: "Check out this video content...",
          music: ["Upbeat hip-hop", "Motivational instrumental", "Lo-fi beats"],
          stickers: ["🔥", "💯", "✨"]
        };
        const chunk = JSON.stringify({ 
          index: streamedCount, 
          total: processedMedia.length, 
          result: errorResult,
          isVideo: true,
          originalBase64: skipped.originalBase64,
          thumbnailBase64: "",
          videoError: true
        }) + "\n";
        res.write(chunk);
        streamedCount++;
        console.log(`[batch-analyze-stream] Sent fallback result for skipped video: ${skipped.filename}`);
      }

      res.end();
      console.log("[batch-analyze-stream] Stream complete");
    } catch (error: any) {
      console.error("[batch-analyze-stream] Error:", error?.message || error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to analyze media", details: error?.message });
      } else {
        res.write(JSON.stringify({ error: error?.message || "Analysis failed" }) + "\n");
        res.end();
      }
    }
  });

  // Batch Video Creation
  app.post("/api/videos/batch", requireAuth, async (req, res) => {
    try {
      const { videos: videosData } = req.body;
      
      if (!videosData || !Array.isArray(videosData) || videosData.length === 0) {
        return res.status(400).json({ error: "videos array is required" });
      }

      const parsedVideos = videosData.map((v: any) => ({
        ...insertVideoSchema.parse(v),
        userId: req.user!.id
      }));
      const createdVideos = await storage.createVideosBatch(parsedVideos);
      res.status(201).json(createdVideos);
    } catch (error) {
      console.error("Error creating videos batch:", error);
      res.status(400).json({ error: "Invalid video data" });
    }
  });

  // AI Caption Generation
  app.post("/api/generate-captions", requireAuth, async (req, res) => {
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
  app.post("/api/analytics/chat", requireAuth, async (req, res) => {
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
  app.get("/api/dashboard/kpis", requireAuth, async (req, res) => {
    try {
      const videos = await storage.getVideos(req.user!.id);
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
  app.get("/api/strategy", requireAuth, async (req, res) => {
    try {
      const settings = await storage.getStrategySettings(req.user!.id);
      res.json(settings || { dripFrequency: 5, categoryWeights: {} });
    } catch (error) {
      console.error("Error fetching strategy settings:", error);
      res.status(500).json({ error: "Failed to fetch strategy settings" });
    }
  });

  app.post("/api/strategy", requireAuth, async (req, res) => {
    try {
      const settingsData = insertStrategySettingsSchema.parse(req.body);
      const settings = await storage.upsertStrategySettings(req.user!.id, settingsData);
      res.json(settings);
    } catch (error) {
      console.error("Error saving strategy settings:", error);
      res.status(400).json({ error: "Invalid strategy data" });
    }
  });

  // Auto-schedule unscheduled content
  app.post("/api/videos/auto-schedule", requireAuth, async (req, res) => {
    try {
      const videos = await storage.getVideos(req.user!.id);
      const unscheduledDrafts = videos.filter(v => v.status === "draft" && !v.scheduledDate);
      
      if (unscheduledDrafts.length === 0) {
        return res.json({ message: "No unscheduled drafts to schedule", scheduled: 0 });
      }

      // Get strategy settings for optimal scheduling
      const strategy = await storage.getStrategySettings(req.user!.id);
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
        await storage.updateVideo(draft.id, req.user!.id, {
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
  app.get("/api/instagram/settings", requireAuth, async (req, res) => {
    try {
      const settings = await storage.getInstagramSettings(req.user!.id);
      res.json(settings || { isConnected: false });
    } catch (error) {
      console.error("Error fetching Instagram settings:", error);
      res.status(500).json({ error: "Failed to fetch Instagram settings" });
    }
  });

  app.post("/api/instagram/settings", requireAuth, async (req, res) => {
    try {
      const { accessToken, businessAccountId, igUserId, autoPublish } = req.body;
      
      if (!accessToken || !businessAccountId) {
        return res.status(400).json({ error: "Access token and Business Account ID are required" });
      }

      const settings = await storage.upsertInstagramSettings(req.user!.id, {
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

  app.post("/api/instagram/test", requireAuth, async (req, res) => {
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
  app.post("/api/videos/:id/notify", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { notifyMe } = req.body;
      
      const video = await storage.getVideo(id, req.user!.id);
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

      const updatedVideo = await storage.updateVideo(id, req.user!.id, updateData);
      res.json(updatedVideo);
    } catch (error) {
      console.error("Error toggling notification:", error);
      res.status(500).json({ error: "Failed to toggle notification" });
    }
  });

  // Instagram Publish Endpoints
  app.post("/api/videos/:id/publish", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const video = await storage.getVideo(id, req.user!.id);
      
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
        const updatedVideo = await storage.updateVideo(id, req.user!.id, {
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

  app.post("/api/scheduler/run", requireAuth, async (req, res) => {
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
