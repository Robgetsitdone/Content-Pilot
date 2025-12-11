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

  return httpServer;
}
