# Tactix Arena — Real-Time Multiplayer Gaming Platform

Tactix Arena is a full-stack real-time multiplayer gaming platform featuring **Tic-Tac-Toe**, **Dual-Arena Competitive Snake**, and **Rock Paper Scissors**, backed by Node.js, Express, MongoDB/Mongoose, Socket.IO, and React + TypeScript.

## Architecture Overview

- **Client (`src/`)**: React 19, Vite, TypeScript, Tailwind CSS v4, Shadcn UI primitives (Radix UI), Zustand stores, GSAP transitions, and Socket.IO Client.
- **Server (`server.ts` & `server/src/`)**: Express.js REST API, Mongoose ODM schemas (`User`, `Game`, `Invitation`, `MatchHistory`), JWT authentication via HTTP-only cookies, Zod request/payload validation, and an authoritative Socket.IO game server.
- **Database**: Connects to `MONGODB_URI` when configured; automatically starts an embedded MongoDB instance via `mongodb-memory-server` during local development if `MONGODB_URI` is unset.

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure environment variables (copy `.env.example` to `.env`):
   ```bash
   cp .env.example .env
   ```
3. Run development server (Express + Socket.IO + Vite middleware on port 3000):
   ```bash
   npm run dev
   ```
4. Build & run production bundle:
   ```bash
   npm run build
   NODE_ENV=production npm start
   ```

## Environment Variables

| Variable | Description | Default |
| --- | --- | --- |
| `PORT` | HTTP/WebSocket server port | `3000` |
| `MONGODB_URI` | MongoDB connection URI | Embedded `MongoMemoryServer` if unset |
| `JWT_SECRET` | Secret key for signing JWT tokens | Ephemeral dev secret |
| `JWT_EXPIRES_IN` | Token expiration window | `7d` |
| `CLIENT_ORIGIN` | Comma-separated allowed CORS origins | Localhost / same-origin |
| `NODE_ENV` | `development` or `production` | `development` |

## REST API Endpoints

- `POST /api/auth/register` — Register user (`username`, optional `email`, `password`, `avatar`). Sets HTTP-only JWT cookie.
- `POST /api/auth/login` — Authenticate with username or email and password.
- `POST /api/auth/logout` — Clear auth cookie and set user status to `offline`.
- `GET /api/auth/me` — Return authenticated user's profile and statistics.
- `GET /api/users/leaderboard?game=overall|tic-tac-toe|snake|rock-paper-scissors` — Global rankings.
- `GET /api/users/search?q=...` — Search players by username.
- `GET /api/users/:username` — Fetch player public profile & statistics.
- `PATCH /api/users/profile` — Update avatar, bio, and sound/game preferences.
- `PATCH /api/users/password` — Update account password.
- `GET /api/matches/overview` — Platform player & match counts.
- `GET /api/matches/history` — Authenticated user's (or specified player's) match history.
- `GET /api/matches/invitations` — Pending incoming and recent outgoing invitations.
- `GET /api/matches/rooms/:roomId` — Verify room membership and fetch room metadata.

## Socket.IO Events

### Presence & Matchmaking
- `presence:update`, `user:online`, `user:offline`
- `matchmaking:join` (`{ gameType }`) → `matchmaking:queued` / `matchmaking:found`
- `matchmaking:cancel` → `matchmaking:cancelled`

### Private Invitations
- `invitation:send` (`{ recipientUsername, gameType }`) → `invitation:received`
- `invitation:accept` (`{ invitationId }`) → `matchmaking:found`
- `invitation:reject` (`{ invitationId }`) → `invitation:rejected`
- `invitation:expired` (server auto-expiration after 60s)

### Game Rooms & Games
- `room:join`, `room:ready`, `room:leave`, `room:state`, `room:opponent-disconnected`
- `tictactoe:move` (`{ roomId, cellIndex }`) → `tictactoe:update`, `tictactoe:result`
- `snake:input` (`{ roomId, direction }`) → `snake:state`, `snake:score`, `snake:game-over`, `snake:result`
- `rps:submit` (`{ roomId, choice }`) → `rps:reveal`, `rps:round-result`, `rps:match-result`
- `game:finished`, `game:play-again`

## Testing Multiplayer Locally

1. Start the server with `npm run dev`.
2. Open two separate browser contexts (e.g., normal window + incognito window) at `http://localhost:3000`.
3. Register two distinct accounts (e.g. `player_alpha` and `player_beta`).
4. Test **Random Matchmaking** by selecting the same game and clicking **Find Match** in both windows, or test **Private Invitations** by inviting `player_beta` from `player_alpha`'s dashboard.
5. Verify ready-up handshake, server-authoritative gameplay, disconnect grace handling, and persistent stats on the **Leaderboard** and **Match History** pages.
