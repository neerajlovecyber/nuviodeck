# Nuviodeck Clean Monorepo

Nuviodeck is a modern, high-performance web and desktop management platform built on a lean, ultra-fast monorepo architecture powered by **Bun**, **Turborepo**, **Vite**, **shadcn UI**, **Hono**, and **Vitest**.

---

## 🏗️ Architecture Overview

```
nuviodeck/
├── apps/
│   ├── web/               # React 19 + Vite + Tailwind CSS v4 + shadcn/ui
│   └── server/            # Hono API Server running natively on Bun
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
| **Frontend App (`apps/web`)** | React 19 + Vite 8 | Fast SPA rendering & modern DX |
| **Design System** | Tailwind CSS v4 + shadcn/ui | Premium utility-first styling & accessible components |
| **Backend API (`apps/server`)** | Hono | Lightweight, high-speed API framework for Bun |
| **Testing Suite** | Vitest | Fast unit & integration testing for React & Hono |

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

### 3. Development Mode
Start both frontend and backend development servers simultaneously:
```bash
bun dev
```
- **Web App**: `http://localhost:5173`
- **Hono API**: `http://localhost:3001`

---

## 📜 Workspace Scripts

| Command | Action |
| :--- | :--- |
| `bun dev` | Runs dev servers for all apps in parallel via Turborepo |
| `bun build` | Compiles frontend assets & bundles Hono server (cached via Turborepo) |
| `bun test` | Runs Vitest test suites across frontend and server |
| `bun typecheck` | Verifies TypeScript types across all workspace apps and packages |
| `bun lint` | Runs linters across all workspace projects |

---

## 🗺️ Product Roadmap

- [x] **Phase 1: Architecture & Foundation**
  - [x] Scaffold clean monorepo with Turborepo & Bun Workspaces
  - [x] Configure Vite 8 + React 19 + shadcn UI frontend (`apps/web`)
  - [x] Build Hono API backend (`apps/server`) with CORS & health endpoints
  - [x] Integrate Vitest testing suite across web & server
- [ ] **Phase 2: Core Dashboard & Navigation**
  - [ ] Implement responsive app layout and sidebar navigation
  - [ ] Add user authentication & state management
- [ ] **Phase 3: Real-Time Features & API Integration**
  - [ ] Connect Hono backend endpoints with React Query / TanStack Query
  - [ ] Implement WebSocket server for live updates
- [ ] **Phase 4: Optimization & Deployment**
  - [ ] Automated CI/CD build checks via GitHub Actions
  - [ ] Production build deployment

---

## 🤝 Commit Conventions

Keep commits focused and semantic:
- `feat:` New features
- `fix:` Bug fixes
- `refactor:` Code restructuring without functional changes
- `chore:` Dependency or build system updates
