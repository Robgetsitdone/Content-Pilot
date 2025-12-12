# ContentFlow - AI-Powered Content Strategy Platform

## Overview

ContentFlow is an AI-powered content strategy and drip scheduling platform for social media content creators. The application helps users manage video content, generate AI-powered captions using Google's Gemini API, schedule posts, and analyze content performance. It features a dark, modern UI designed for content creators who want to streamline their social media workflow.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, using Vite as the build tool
- **Routing**: Wouter for client-side routing (lightweight alternative to React Router)
- **State Management**: TanStack React Query for server state and data fetching
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with a custom dark theme (ultra-dark, heavy aesthetic)
- **Fonts**: Inter for body text, Space Grotesk for display/headings

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript compiled with tsx for development, esbuild for production
- **API Design**: RESTful endpoints under `/api/*` prefix
- **Build Process**: Custom build script that bundles server with esbuild and client with Vite

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` contains all database table definitions
- **Validation**: Zod schemas generated from Drizzle schemas via drizzle-zod
- **Database Connection**: Connection pool via `pg` package using `DATABASE_URL` environment variable

### Key Data Models
- **Videos**: Content items with title, thumbnail, category, status (posted/scheduled/draft/processing), captions, and AI-generated metadata
- **Strategy Settings**: Configuration for content drip frequency and category weights
- **Users**: Basic authentication structure with username/password

### AI Integration
- **Provider**: Google Gemini AI (`@google/genai` package)
- **Features**: Caption generation with specific voice guidelines, content analysis for analytics
- **Voice Rules**: Enforces masculine, authentic tone with strict anti-LLM-slop guidelines

### Application Pages
- **Dashboard**: Overview with stats, upcoming posts, and quick actions
- **Library**: Video content management with filtering, AI caption generation, and "Notify Me" toggle for post reminders
- **Calendar**: Drag-and-drop scheduling with Morning/Afternoon/Evening time slots (9am, 12pm, 5pm)
- **Strategy**: Configure drip frequency and category weight distribution
- **Analytics**: AI-powered chat interface for content performance insights
- **Settings**: Platform connections for Instagram and Google Calendar

### Social Media Integration
- **Instagram Publishing**: 
  - Instagram Graph API integration for auto-publishing posts
  - Supports image and video (Reels) posting
  - Auto-publish toggle for scheduled posts
  - Scheduler runs every 60 seconds to publish ready posts
- **Google Calendar**: 
  - Calendar reminders for posts with "Notify Me" enabled
  - Auto-enabled for Family/Parenting category posts
  - Creates events at post scheduled time for real-time comment engagement

### Key Features
- **11 Content Categories**: Family, Parenting, Fitness, Gym + Life + Fitness, Travel, Business, Lifestyle, Education, Entertainment, Food, General
- **Time Slot Scheduling**: Morning (9am), Afternoon (12pm), Evening (5pm) slots per day
- **AI Caption Generation**: Gemini-powered with masculine, hardworking, witty voice
- **Multi-file Upload**: Batch upload support for images and videos

## External Dependencies

### AI Services
- **Google Gemini API**: Used for caption generation and content analysis
  - Environment variable: `AI_INTEGRATIONS_GEMINI_API_KEY`

### Database
- **PostgreSQL**: Primary data store
  - Environment variable: `DATABASE_URL`
  - Session storage: `connect-pg-simple` for Express sessions

### Development Tools
- **Replit Plugins**: Custom Vite plugins for development environment
  - `@replit/vite-plugin-runtime-error-modal`: Error overlay
  - `@replit/vite-plugin-cartographer`: Dev tooling
  - `@replit/vite-plugin-dev-banner`: Development banner

### UI Dependencies
- **Radix UI**: Full suite of accessible UI primitives
- **Recharts**: Charting library for analytics visualizations
- **date-fns**: Date formatting utilities
- **Lucide React**: Icon library