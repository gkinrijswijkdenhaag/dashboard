# GKIN RWDH Dienst Dashboard — Copilot Instructions

## Project Overview
Church service coordination platform (React + Express + PostgreSQL). Six service roles (liturgy, pastor, translation, beamer, music, treasurer) plus an `admin` role. Users authenticate with a role-specific passcode, not a personal password.

## Architecture

### Two Separate Processes
- **Frontend** (`/`): React 19 + Vite + Tailwind CSS 4, runs on port 5173
  - Module system: **ESM** (`import/export`)
- **Backend** (`/server`): Express 5 + Socket.IO + PostgreSQL, runs on port 5000
  - Module system: **CommonJS** (`require/module.exports`)

### Layered Structure
**Frontend**: `src/components` → `src/services/*.js` → `src/services/api.js` (HTTP wrapper)  
**Backend**: `server/routes/*` → `server/controllers/*` → `server/config/db.js` (pg Pool)

All frontend API calls must go through `src/services/api.js`. Never call `fetch`/`axios` directly in components.

### Authentication Flow
1. User picks a role and enters the role passcode (`role_passcodes` DB table)
2. Server issues a JWT; user object (including `token`) saved to `localStorage` as `"currentUser"`
3. `api.js` reads `localStorage.currentUser` for every authenticated request (`Authorization: Bearer <token>`)
4. Backend middleware: `verifyToken` (identity) + `checkRole(roles)` (authorization)

`ProtectedRoute` in the frontend checks `authService.isAuthenticated()`. Admin-only routes use `<ProtectedRoute requireAdmin={true}>` which enforces `role === 'admin'`.

## Dev Workflow

```bash
# Root — frontend
npm run dev        # Vite dev server (port 5173)
npm run build      # Production build → dist/
npm run lint       # ESLint

# /server — backend
npm run dev        # nodemon index.js (port 5000)
npm start          # node index.js

# Database (run from root)
node scripts/backup-database-js.js    # Dumps full DB → scripts/backups/
node scripts/restore-database-js.js   # Restores from a backup file
```

Both processes must run simultaneously during development.

## Deployment
- **Frontend**: Render (static site, serves `dist/` from `npm run build`)
- **Backend**: Railway (Node.js service, runs `node index.js`)
- **Database**: PostgreSQL on Railway (same project as backend)

Set `VITE_API_URL` in Render's environment to the Railway backend URL. Set `ALLOWED_ORIGINS` on Railway to the Render frontend URL.

## Environment Variables
**Frontend** (root `.env`): `VITE_API_URL` (defaults to `http://localhost:5000/api`)  
**Backend** (`server/.env` or Railway env vars): `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRATION`, `PORT`, `ALLOWED_ORIGINS`, `NODE_ENV`

Frontend env is accessed via `src/config/env.js` — never use `import.meta.env` directly in components.

## Database
- Connects via `DATABASE_URL` (Railway provides this automatically for linked PostgreSQL services); SSL auto-enabled when `NODE_ENV=production` or the URL contains `render.com`
- Schema is defined across multiple SQL files in `server/db/` and auto-applied on startup via `server/db/init.js`
- Migrations are standalone scripts (e.g., `migrate_email_history.js`) referenced in `init.js`
- To add a new table: create a `*_schema.sql` file and register it in `initializeDatabase()`

## Real-Time (Socket.IO)
- Server maintains one socket per user; duplicate connections are evicted
- On connect, sockets auto-join two rooms: `user-{id}` and the user's role string
- Targeted events use `io.to('liturgy').emit(...)` or `io.to('user-42').emit(...)`
- `emitActivityUpdate` is injected into controllers via a setter (`setEmitActivityUpdate`) after DB init to avoid circular `require` dependencies — follow this pattern for any new controller that needs to emit events

## Key Conventions
- **Service role IDs** (used in DB and JWT): `liturgy`, `pastor`, `translation`, `beamer`, `music`, `treasurer`, `admin`
- **Workflow task statuses**: `pending`, `in-progress`, `completed`, `skipped`
- **Dates**: service dates are always Sundays in `YYYY-MM-DD` format (see `src/lib/date-utils.js`)
- **Notifications**: use `NotificationContext` for in-app alerts; `window.dispatchEvent(new CustomEvent('authStateChanged'))` is used after login/logout to sync components
- **UI components**: shared primitives live in `src/components/ui/`; role colors are defined per role (blue=liturgy, purple=pastor, green=translation, orange=beamer, pink=music, emerald=treasurer)
- Server responds with `{ message: '...' }` on errors — match this shape in new controllers
