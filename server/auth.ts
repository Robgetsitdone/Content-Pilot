import bcrypt from "bcrypt";
import crypto from "crypto";
import { Request, Response, NextFunction } from "express";
import session from "express-session";
import pgSession from "connect-pg-simple";
import { Pool } from "pg";
import { db } from "../db/index";
import { users, passwordResetTokens, type User } from "@shared/schema";
import { eq, and, gt, isNull } from "drizzle-orm";

const SALT_ROUNDS = 12;

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function createSessionMiddleware() {
  const PgStore = pgSession(session);
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  return session({
    store: new PgStore({
      pool,
      tableName: "user_sessions",
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || "creator-pulse-session-secret-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  });
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const result = await db.select().from(users).where(eq(users.id, req.session.userId)).limit(1);
    if (!result[0]) {
      req.session.destroy(() => {});
      return res.status(401).json({ error: "User not found" });
    }
    req.user = result[0];
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({ error: "Authentication error" });
  }
}

export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  if (req.session.userId) {
    try {
      const result = await db.select().from(users).where(eq(users.id, req.session.userId)).limit(1);
      if (result[0]) {
        req.user = result[0];
      }
    } catch (error) {
      console.error("Optional auth error:", error);
    }
  }
  next();
}

export async function createUser(data: {
  email: string;
  passwordHash?: string;
  googleId?: string;
  displayName?: string;
}): Promise<User> {
  const result = await db.insert(users).values({
    email: data.email,
    passwordHash: data.passwordHash,
    googleId: data.googleId,
    displayName: data.displayName,
  }).returning();
  return result[0];
}

export async function findUserByEmail(email: string): Promise<User | undefined> {
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result[0];
}

export async function findUserByGoogleId(googleId: string): Promise<User | undefined> {
  const result = await db.select().from(users).where(eq(users.googleId, googleId)).limit(1);
  return result[0];
}

export async function findUserById(id: string): Promise<User | undefined> {
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function createPasswordResetToken(userId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
  
  await db.insert(passwordResetTokens).values({
    userId,
    token,
    expiresAt,
  });
  
  return token;
}

export async function verifyPasswordResetToken(token: string): Promise<string | null> {
  const result = await db.select()
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.token, token),
        gt(passwordResetTokens.expiresAt, new Date()),
        isNull(passwordResetTokens.usedAt)
      )
    )
    .limit(1);
  
  if (!result[0]) {
    return null;
  }
  
  return result[0].userId;
}

export async function markTokenAsUsed(token: string): Promise<void> {
  await db.update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(eq(passwordResetTokens.token, token));
}

export async function updateUserPassword(userId: string, newPasswordHash: string): Promise<void> {
  await db.update(users)
    .set({ passwordHash: newPasswordHash })
    .where(eq(users.id, userId));
}
