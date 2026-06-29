# CollabEdit - Local-First Collaborative Document Editor

A real-time collaborative document editor built with local-first architecture, deterministic CRDT-based conflict resolution, and offline synchronization.

## Architecture

```
Browser (Client)
├── TipTap Editor ←→ Yjs Y.Doc (local CRDT state)
├── y-indexeddb (persist to IndexedDB — works offline)
├── y-websocket (sync via WebSocket when online)
└── SyncEngine state machine (IDLE → CONNECTING → SYNCED → OFFLINE)

WebSocket Server (Node.js, port 4000)
├── JWT auth on connection upgrade
├── Room management (one Y.Doc per document)
├── Payload validation (size, rate limit)
├── Role enforcement (Viewers cannot push updates)
└── Debounced persistence to PostgreSQL

Next.js App (port 3000)
├── App Router pages (dashboard, editor, auth)
├── API routes (documents CRUD, sharing, versions, AI)
└── Prisma ORM queries (always user-scoped)

PostgreSQL
├── Users, Documents, Access Control, Versions
└── Yjs state stored as binary for efficiency
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, TypeScript) |
| CRDT Engine | Yjs + y-indexeddb + y-websocket |
| Rich Text Editor | TipTap (ProseMirror-based) |
| WebSocket | Custom Node.js server with `ws` |
| Auth | NextAuth.js (JWT strategy) |
| Database | PostgreSQL + Prisma ORM |
| UI | Tailwind CSS + shadcn/ui + Radix UI |
| AI | Vercel AI SDK + OpenAI |
| CI/CD | GitHub Actions |

## Key Features

- **Local-First**: Edit documents offline with zero network dependency. IndexedDB persists all changes.
- **Real-Time Collaboration**: Multiple users edit simultaneously with live cursors and presence indicators.
- **Deterministic Conflict Resolution**: Yjs CRDT merges concurrent edits without data loss, regardless of network conditions.
- **Version History**: Create snapshots, browse timeline, and safely restore previous versions without corrupting other collaborators' state.
- **Role-Based Access**: Owner, Editor, and Viewer roles. Viewers receive updates but cannot push changes.
- **AI Writing Assistant**: Summarize, improve grammar, expand text, and translate using OpenAI.
- **Security**: Payload size limits (1MB), rate limiting (100/min), JWT auth on WebSocket, strict ORM scoping.

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- OpenAI API key (optional, for AI features)

### Setup

```bash
# Install dependencies
npm install --legacy-peer-deps

# Copy environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL and other secrets

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Start the development server (Next.js)
npm run dev

# In a separate terminal, start the WebSocket server
npm run dev:ws
```

Open http://localhost:3000 — register an account and start editing.

### Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Secret for JWT signing |
| `NEXTAUTH_URL` | App URL (http://localhost:3000) |
| `NEXT_PUBLIC_WS_URL` | WebSocket server URL (ws://localhost:4000) |
| `OPENAI_API_KEY` | OpenAI key for AI features (optional) |

## Design Decisions

### Why Yjs for Conflict Resolution?
Yjs is a CRDT that provides deterministic merge semantics. When two users edit the same paragraph offline, their changes merge automatically on reconnect using Lamport timestamps and client ID ordering. No manual conflict resolution needed.

### Why a Custom WebSocket Server?
Vercel and serverless platforms don't support persistent WebSocket connections. Real-time collaboration requires long-lived connections and shared in-memory state (document rooms).

### How Version Restore Works Safely
Restoring a version doesn't replace the document state. Instead, the target version's state is applied as a new CRDT update that flows through the normal sync channel — preserving other collaborators' cursors and pending edits.

### Security: Preventing OOM Attacks
- WebSocket messages are rejected if > 1MB
- Rate limited to 100 updates/minute per client
- Yjs updates are decoded in a try/catch to reject malformed payloads
- All database queries are scoped to the authenticated user's permissions

## Project Structure

```
collaborative-editor/
├── app/                    # Next.js App Router pages and API routes
├── components/             # React components (editor, collaboration, UI)
├── lib/                    # Core libraries (CRDT, auth, database, security)
├── server/                 # WebSocket server (rooms, handler, validation)
├── prisma/                 # Database schema
├── hooks/                  # Custom React hooks
└── .github/workflows/      # CI/CD pipeline
```

## Author

**Mayur Dhavan**
- GitHub: https://github.com/MayurDhavan
- LinkedIn: https://linkedin.com/in/MayurDhavan
