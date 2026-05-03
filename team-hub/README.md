# Collaborative Team Hub

A premium full-stack monorepo application for team collaboration, featuring real-time updates, analytics, and clean architecture.

## 🚀 Live Demo
- **Frontend:** [https://meticulous-nature-production-8177.up.railway.app](https://meticulous-nature-production-8177.up.railway.app)
- **Backend API:** [https://team-hub-production-0506.up.railway.app/api](https://team-hub-production-0506.up.railway.app/api)


## ✨ Key Features
- **Real-time Collaboration**: Instant updates for goals, kanban items, and announcements using Socket.io.
- **Workspaces**: Multi-tenant workspace management with role-based member invites.
- **Kanban & List Views**: Dual-view action item tracking with real-time status syncing.
- **Rich Text Announcements**: Post formatted updates with @mentions, comments, and emoji reactions.
- **Analytics Dashboard**: Velocity and distribution charts using Recharts + CSV data export.

## 🛠️ Advanced Features Built
1.  **Audit Log**: A complete, immutable history of all workspace changes (creation of goals, member invites, etc.) accessible via a dedicated Activity tab.
2.  **Optimistic UI**: Implemented in the "Strategic Goals" section to provide instant feedback on creation and status toggles, ensuring a zero-latency feel.
3.  **Real-time Presence**: Visual green-pulse indicators showing which team members are currently online in the workspace.

## 📦 Setup Instructions

### 1. Prerequisites
- Node.js 18+
- PostgreSQL database
- Cloudinary account (for avatars)

### 2. Installation
```bash
git clone <your-repo-url>
cd team-hub
npm install
```

### 3. Environment Variables
Create a `.env` file in `apps/api`:
- `DATABASE_URL`: Your PostgreSQL connection string.
- `JWT_ACCESS_SECRET`: Random string for token signing.
- `JWT_REFRESH_SECRET`: Random string for refresh tokens.
- `CLOUDINARY_CLOUD_NAME`: Cloudinary name.
- `CLOUDINARY_API_KEY`: Cloudinary API key.
- `CLOUDINARY_API_SECRET`: Cloudinary secret.

### 4. Running the App
```bash
# Push schema to DB
cd apps/api && npx prisma db push

# Start both frontend and backend
cd ../.. && npm run dev
```

## 📝 Known Limitations
- Mentions are currently text-based (parsing @name) rather than a dropdown-autocomplete.
- Rich text support is optimized for desktop; mobile formatting may vary.
