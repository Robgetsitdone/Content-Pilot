import { db } from "../db/index";
import { videos, strategySettings, instagramSettings, type Video, type InsertVideo, type StrategySettings, type InsertStrategySettings, type InstagramSettings, type InsertInstagramSettings } from "@shared/schema";
import { eq, desc, lte, and } from "drizzle-orm";

export interface IStorage {
  // Videos
  getVideos(userId: string): Promise<Video[]>;
  getVideo(id: number, userId: string): Promise<Video | undefined>;
  createVideo(video: InsertVideo & { userId: string }): Promise<Video>;
  createVideosBatch(videos: (InsertVideo & { userId: string })[]): Promise<Video[]>;
  updateVideo(id: number, userId: string, video: Partial<InsertVideo>): Promise<Video | undefined>;
  deleteVideo(id: number, userId: string): Promise<void>;
  getScheduledPostsReady(): Promise<Video[]>;
  
  // Strategy Settings
  getStrategySettings(userId: string): Promise<StrategySettings | undefined>;
  upsertStrategySettings(userId: string, settings: Omit<InsertStrategySettings, 'userId'>): Promise<StrategySettings>;
  
  // Instagram Settings
  getInstagramSettings(userId: string): Promise<InstagramSettings | undefined>;
  upsertInstagramSettings(userId: string, settings: Omit<InsertInstagramSettings, 'userId'>): Promise<InstagramSettings>;
}

export class DatabaseStorage implements IStorage {
  // Videos - filtered by userId
  async getVideos(userId: string): Promise<Video[]> {
    return db.select().from(videos).where(eq(videos.userId, userId)).orderBy(desc(videos.createdAt));
  }

  async getVideo(id: number, userId: string): Promise<Video | undefined> {
    const result = await db.select().from(videos).where(
      and(eq(videos.id, id), eq(videos.userId, userId))
    );
    return result[0];
  }

  async createVideo(video: InsertVideo & { userId: string }): Promise<Video> {
    const videoData = {
      ...video,
      thumbnail: video.thumbnail || "",
    };
    const result = await db.insert(videos).values(videoData as any).returning();
    return result[0];
  }

  async updateVideo(id: number, userId: string, video: Partial<InsertVideo>): Promise<Video | undefined> {
    const result = await db
      .update(videos)
      .set({ ...video, updatedAt: new Date() } as any)
      .where(and(eq(videos.id, id), eq(videos.userId, userId)))
      .returning();
    return result[0];
  }

  async deleteVideo(id: number, userId: string): Promise<void> {
    await db.delete(videos).where(and(eq(videos.id, id), eq(videos.userId, userId)));
  }

  async createVideosBatch(videosData: (InsertVideo & { userId: string })[]): Promise<Video[]> {
    if (videosData.length === 0) return [];
    const processedVideos = videosData.map(v => ({
      ...v,
      thumbnail: v.thumbnail || "",
    }));
    const result = await db.insert(videos).values(processedVideos as any[]).returning();
    return result;
  }

  // Strategy Settings - filtered by userId
  async getStrategySettings(userId: string): Promise<StrategySettings | undefined> {
    const result = await db.select().from(strategySettings).where(eq(strategySettings.userId, userId)).limit(1);
    return result[0];
  }

  async upsertStrategySettings(userId: string, settings: Omit<InsertStrategySettings, 'userId'>): Promise<StrategySettings> {
    const existing = await this.getStrategySettings(userId);
    
    if (existing) {
      const result = await db
        .update(strategySettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(strategySettings.id, existing.id))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(strategySettings).values({ ...settings, userId }).returning();
      return result[0];
    }
  }

  async getScheduledPostsReady(): Promise<Video[]> {
    const now = new Date();
    return db.select().from(videos).where(
      and(
        eq(videos.status, "scheduled"),
        lte(videos.scheduledDate, now)
      )
    );
  }

  // Instagram Settings - filtered by userId
  async getInstagramSettings(userId: string): Promise<InstagramSettings | undefined> {
    const result = await db.select().from(instagramSettings).where(eq(instagramSettings.userId, userId)).limit(1);
    return result[0];
  }

  async upsertInstagramSettings(userId: string, settings: Omit<InsertInstagramSettings, 'userId'>): Promise<InstagramSettings> {
    const existing = await this.getInstagramSettings(userId);
    
    if (existing) {
      const result = await db
        .update(instagramSettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(instagramSettings.id, existing.id))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(instagramSettings).values({ ...settings, userId }).returning();
      return result[0];
    }
  }
}

export const storage = new DatabaseStorage();
