# 🎬 Nuviodeck - Media Catalog & Debrid Stream Manifest Hub

**Nuviodeck** is a personalized media catalog engine and Debrid stream manifest manager (inspired by Xperience / Stremio Addon ecosystems). It generates dynamic, signed manifest URLs (`/manifest/:token/manifest.json`) to serve custom curated catalogs, merged subtitles, and Debrid streams directly to your favorite media players.

---

## 🎯 Core Features

### 1. 🔗 Signed Manifest URL Engine
- **One Link, Always in Sync**: Generate a signed manifest URL (`/manifest/:token/manifest.json`) compatible with Stremio, Kodi, and web players.
- **Rotate & Revoke**: Instantly rotate or revoke manifest access tokens with a single click.
- **Multiple Profiles**: Separate custom profile manifests (e.g., *Movie Night*, *Binge Watch*, *Kids*) with dedicated row layouts and collection rules.

### 2. ⚡ Bring Your Own Debrid (BYOD)
- **Account Stream Integration**: Connect Real-Debrid, AllDebrid, Premiumize, TorBox, or Debrid-Link accounts.
- **Stream Filtering & Formatting**: Filter streams by resolution (4K, 1080p, HDR/DV), audio tracks, seeds, and release groups.

### 3. 📚 1,000+ Catalogs & 29+ Categories
- Drop-in curated catalogs across **29+ categories**:
  - *Trending*, *Streaming Services (Netflix, AppleTV+, HBO)*, *Genres*, *Anime*, *World Cinema*, *Studios*, *Networks*, *Awards*, *Actors*, *Directors*, *Decades*, *Kids & Family*, and more.

### 4. 💬 Merged & Timed Subtitles
- Built-in **OpenSubtitles** and multi-source subtitle aggregator.
- Merges subtitles into a single clean list labeled with exact release timing matches.

### 5. 🎨 Custom Cover Art & Hover GIFs
- Choose from 60+ cover art design sets for folders and collections with animated hover GIFs.

---

## 🏗️ Architecture Overview

```
nuviodeck/
├── apps/
│   ├── web/               # React 19 + TanStack Router + TanStack Query + Zustand + shadcn UI
│   └── server/            # Hono API Server + Manifest Generator + Debrid Engine (Bun + Drizzle ORM)
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
| **Backend API (`apps/server`)** | Hono | Fast API server & Stremio Manifest engine |
| **Database & ORM** | Drizzle ORM + Bun SQLite | Manifest token storage, profiles, & catalog metadata |
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
- 🌐 **Web Control Deck**: `http://localhost:5173`
- ⚙️ **Manifest & API Server**: `http://localhost:3001`
- 📄 **Manifest Endpoint**: `http://localhost:3001/manifest/:token/manifest.json`

---

## 🗺️ Product Development Roadmap

- [x] **Phase 1: Architecture & Foundation**
  - [x] Scaffold monorepo with Turborepo, Bun, Vite, & Hono
  - [x] Set up TanStack Router, TanStack Query, Zustand, RHF + Zod, and Drizzle ORM
  - [x] Establish automated test suite & CI build pipelines
- [ ] **Phase 2: Manifest Token & Profile Manager**
  - [ ] Implement Signed Manifest URL generator (`/manifest/:token/manifest.json`)
  - [ ] Profile switching (*Movie Night*, *Binge Watch*, *Kids*) with token rotation & revocation
- [ ] **Phase 3: Catalogs & Category Builder**
  - [ ] 29+ Category catalog selector (Anime, Trending, Awards, Studios, Decades)
  - [ ] Custom cover art picker (60+ sets) with hover GIFs
- [ ] **Phase 4: Debrid Stream Provider & Subtitles**
  - [ ] Debrid API integration (Real-Debrid, AllDebrid, Premiumize) with stream quality filters
  - [ ] Merged OpenSubtitles aggregator
