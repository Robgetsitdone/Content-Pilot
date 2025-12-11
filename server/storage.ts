import { db } from "../db/index";
import { videos, strategySettings, type Video, type InsertVideo, type StrategySettings, type InsertStrategySettings } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Videos
  getVideos(): Promise<Video[]>;
  getVideo(id: number): Promise<Video | undefined>;
  createVideo(video: InsertVideo): Promise<Video>;
  updateVideo(id: number, video: Partial<InsertVideo>): Promise<Video | undefined>;
  deleteVideo(id: number): Promise<void>;
  
  // Strategy Settings
  getStrategySettings(): Promise<StrategySettings | undefined>;
  upsertStrategySettings(settings: InsertStrategySettings): Promise<StrategySettings>;
}

export class DatabaseStorage implements IStorage {
  // Videos
  async getVideos(): Promise<Video[]> {
    return db.select().from(videos).orderBy(desc(videos.createdAt));
  }

  async getVideo(id: number): Promise<Video | undefined> {
    const result = await db.select().from(videos).where(eq(videos.id, id));
    return result[0];
  }

  async createVideo(video: InsertVideo): Promise<Video> {
    const result = await db.insert(videos).values(video as any).returning();
    return result[0];
  }

  async updateVideo(id: number, video: Partial<InsertVideo>): Promise<Video | undefined> {
    const result = await db
      .update(videos)
      .set({ ...video, updatedAt: new Date() } as any)
      .where(eq(videos.id, id))
      .returning();
    return result[0];
  }

  async deleteVideo(id: number): Promise<void> {
    await db.delete(videos).where(eq(videos.id, id));
  }

  // Strategy Settings
  async getStrategySettings(): Promise<StrategySettings | undefined> {
    const result = await db.select().from(strategySettings).limit(1);
    return result[0];
  }

  async upsertStrategySettings(settings: InsertStrategySettings): Promise<StrategySettings> {
    const existing = await this.getStrategySettings();
    
    if (existing) {
      const result = await db
        .update(strategySettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(strategySettings.id, existing.id))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(strategySettings).values(settings).returning();
      return result[0];
    }
  }
}

export const storage = new DatabaseStorage();
