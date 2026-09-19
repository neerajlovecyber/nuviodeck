# 🎬 Nuviodeck - Unified Stream & Catalog Management Platform

**Nuviodeck** is a modern, high-performance administration deck designed to manage **live streams**, **video-on-demand (VOD) catalogs**, and **media distribution** in one centralized control panel.

---

## 🎯 Product Purpose & Domain

Nuviodeck eliminates fragmented admin panels by bringing stream control and catalog curation into a single deck:

- 📺 **Live Stream Deck**: Monitor live stream health, bitrate, ingestion URLs, status alerts, and active viewer counts in real time.
- 🍿 **Catalog & Content Management**: Manage movies, TV shows, episodes, genres, metadata tagging, poster assets, and distribution windows.
- 📊 **Unified Analytics**: Real-time insights on bandwidth consumption, server node performance, active sessions, and viewer distribution.
- 🔐 **Access & Rights Management**: Role-based access control (RBAC) for content managers, stream operators, and system administrators.

---

## 🏗️ Architecture Overview

```
nuviodeck/
├── apps/
│   ├── web/               # React 19 + TanStack Router + TanStack Query + Zustand + shadcn UI
│   └── server/            # Hono API Server on Bun + Drizzle ORM (Bun SQLite)
├── packages/
│   └── ui/                # Shared React UI component library (shadcn/ui)
├── turbo.json             # Turborepo task pipeline configuration
├── package.json           # Monorepo scripts & dependencies
└── bun.lock               # Bun lockfile
```

---

## ⚡ Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Runtime & Package Manager** | [Bun](https://bun.sh) | Fast JavaScript runtime & package manager |
| **Monorepo Build System** | [Turborepo](https://turbo.build) | Task pipeline orchestration & incremental caching |
| **Frontend App (`apps/web`)** | React 19 + Vite 8 | High-performance SPA rendering & modern DX |
| **Routing** | TanStack Router | Type-safe file-based client routing |
| **State & Data Fetching** | TanStack Query + Zustand | Server state caching & client state management |
| **Form Validation** | React Hook Form + Zod | Schema-based form validation |
| **Design System** | Tailwind CSS v4 + shadcn/ui | Utility-first styling & accessible UI primitives |
| **Backend API (`apps/server`)** | Hono | Ultra-fast API framework running on Bun |
| **Database & ORM** | Drizzle ORM + Bun SQLite | Type-safe ORM & lightweight SQLite storage |
| **Testing Suite** | Vitest + Bun Test | Unit & integration testing across web & server |

---

## 🚀 Quick Start

### 1. Prerequisites
Ensure you have **Bun** installed:
```bash
bun --version # Recommended: v1.4+
```

### 2. Install Dependencies
```bash
bun install
```

### 3. Start Development Mode
Start both frontend and backend development servers simultaneously:
```bash
bun dev
```
- 🌐 **Web Admin Deck**: `http://localhost:5173`
- ⚙️ **Hono API Server**: `http://localhost:3001`

---

## 📜 Workspace Commands

| Command | Action |
| :--- | :--- |
| `bun dev` | Runs dev servers for all apps in parallel via Turborepo |
| `bun build` | Bundles frontend assets & Hono server (cached via Turborepo) |
| `bun test` | Runs test suites across frontend and server |
| `bun typecheck` | Verifies TypeScript types across all workspace projects |
| `bun lint` | Runs linters across all workspace projects |

---

## 🗺️ Product Roadmap

- [x] **Phase 1: Clean Architecture & Foundation**
  - [x] Scaffold monorepo with Turborepo & Bun Workspaces
  - [x] Integrate TanStack Router, TanStack Query, Zustand, and React Hook Form + Zod
  - [x] Build Hono API backend with Drizzle ORM & Bun SQLite database
  - [x] Integrate Vitest & Bun native testing suite
- [ ] **Phase 2: Stream Management Deck**
  - [ ] Build Live Stream Monitor dashboard (bitrate, server status, stream keys)
  - [ ] Stream health status indicators & active session cards
- [ ] **Phase 3: Catalog Curation & Media Library**
  - [ ] Media catalog management UI (Movies, Shows, Episodes CRUD)
  - [ ] Poster image upload & metadata tagging
- [ ] **Phase 4: Real-Time WebSockets & Analytics**
  - [ ] Hono WebSocket endpoint for real-time stream status pushes
  - [ ] Analytics graphs & bandwidth monitoring charts
