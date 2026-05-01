# Collaborative Team Hub

A premium full-stack monorepo application for team collaboration, featuring real-time updates, analytics, and clean architecture.

## Tech Stack
- **Frontend**: Next.js 14, Zustand, Tailwind CSS, Recharts, Axios, Socket.io-client.
- **Backend**: Express.js, Prisma ORM, Socket.io, JWT + Cookies.
- **Database**: PostgreSQL (Neon.tech).

## Key Features
- **Real-time Collaboration**: Instant updates for goals, kanban items, and announcements using Socket.io.
- **Optimistic UI**: Immediate feedback on user actions for a snappy experience.
- **Audit Logging**: Comprehensive activity tracking for every workspace action.
- **Analytics Dashboard**: Visualized team performance using interactive charts.
- **Premium Design**: Modern aesthetics with glassmorphism, animations, and dark mode support.

## Getting Started

### 1. Backend Setup
1. `cd apps/api`
2. `npm install`
3. Configure `.env` (see `setup_guide.md`)
4. `npx prisma db push`
5. `npm run dev`

### 2. Frontend Setup
1. `cd apps/web`
2. `npm install`
3. `npm run dev`

## Project Structure
- `apps/api`: Express server and Prisma schema.
- `apps/web`: Next.js frontend application.
- `apps/web/src/store`: Zustand state management.
- `apps/web/src/hooks`: Custom hooks for Socket, Optimistic UI, etc.
