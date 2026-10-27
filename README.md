# PARALLAX ARM // Autonomous Farm Operations System

> **Problem Statement 1 — The Autonomous Farm Operations System**  
> Built by **Team Parallax** for Alta Hackoween 2026.

An **Agricultural Resource Management (ARM) Command Center** powered by **Next.js 16**, **PostgreSQL**, **Drizzle ORM**, and **Gemini 2.5 Flash Structured Outputs**. Designed to avoid the hackathon trap of sprawling CRUD apps, Parallax ARM delivers a **deterministic, visually arresting state machine** where judges and operators watch unexpected crises trigger autonomous multi-farm resource reallocation in real-time.

---

## ⚡ Key Highlights & Architecture

- **Single-Screen "Mission Control" Cockpit**: Dark glassmorphic interface (`#090A0F` canvas, translucent glass cards, neon tactical indicators) built with Tailwind CSS.
- **2D Tactical Vector Map**: SVG schematic connecting *Sector Alpha* and *Sector Beta* via active transit corridors. Renders pulsing dashed amber Bezier curves during AI proposals and solid emerald animated transit lines upon manager dispatch.
- **Deterministic Chaos Injector (God Mode)**: 1-click stage-ready triggers for:
  - 🌧️ **Flash Storm** (`WEATHER_WEBHOOK`) — halts vulnerable chemical tasks.
  - 🍂 **Fungal Blight CV** (`CV_DISEASE_REPORT`) — multimodal leaf lesion inspection & cross-farm sprayer routing.
  - 🔧 **Tractor Hydraulic Failure** (`EQUIPMENT_FAILURE`) — immediate backup machinery reallocation.
- **Multimodal AI Reasoning Engine (Gemini 2.5 Flash)**:
  - Strict `responseSchema` generating transactional database diffs (`PAUSE_TASK`, `CREATE_TASK`, `REASSIGN_RESOURCE`).
  - Strict conflict rules: Weather Wash-Off prevention, Cross-Farm Resource Borrowing, and Zero Double-Booking.
  - Built-in zero-latency deterministic fallback if API keys or quotas are unavailable.
- **Human-in-the-Loop (HITL) Incident Diff Queue**:
  - Git-diff style previews of physical mutations:
    - 🔴 `PAUSE_TASK` — Halts tasks to prevent chemical runoff or equipment damage.
    - 🟡 `REASSIGN_RESOURCE` — Reroutes specialized machinery across sectors.
    - 🟢 `CREATE_TASK` — Dispatches emergency intervention protocols.
  - 1-Click operator execution (`/api/tickets/[id]/approve`) or executive override (`/api/tickets/[id]/reject`).
- **Edge Worker Mobile Viewport**: Embedded live mobile phone emulator showing active field crew assignments, schedule shifts, and instant red alert flashes when tasks are paused by AI.
- **Live Telemetry Event Log**: High-frequency real-time event streaming via Server-Sent Events (SSE) rendered in monospace telemetry format.

---

## 📐 Layout Architecture (3-Pane Cockpit)

```
+-----------------------------------------------------------------------------------+
| [● LIVE] PARALLAX ARM // AUTONOMOUS FARM OPERATIONS        [Reset Demo] [God Mode]|
+----------------------+-------------------------------------+----------------------+
| PANE 1: TELEMETRY    | PANE 2: CROSS-FARM COMMAND CENTER   | PANE 3: EDGE WORKER  |
| & CHAOS INJECTOR     |                                     | & AUDIT TERMINAL     |
|                      |  +-------------------------------+  |  +----------------+  |
| [Sector Alpha]       |  |   2D TACTICAL VECTOR MAP      |  |  | 📱 WORKER VIEW |  |
| Moisture: 44% [Mono] |  |  [Farm Alpha] ===tractors===> |  |  | Assigned:      |  |
| Weather: STORM ALERT |  |                  [Farm Beta]  |  |  | Unit 04 Tractor|  |
|                      |  +-------------------------------+  |  |                |  |
| [Sector Beta]        |                                     |  | ⚡ REROUTED:   |  |
| Moisture: 28% [Mono] |  +-------------------------------+  |  | Drive to Beta  |  |
| Weather: CLEAR       |  | HITL INCIDENT DIFF QUEUE      |  |  | Sector by 14:30|  |
|                      |  | ⚠️ Fungal Blight + Rain Clash |  |  +----------------+  |
| -------------------- |  |                               |  |                      |
| ⚡ TRIGGER CRISIS:   |  | • PAUSE: Alpha Irrigation     |  |  +----------------+  |
| [🌧️ Flash Storm]     |  | • REROUTE: Tractor 02 (A → B) |  |  | >_ LIVE LOGS   |  |
| [🍂 Upload Leaf Img] |  | • CREATE: Emergency Fungicide |  |  | [14:01] Weather|  |
| [🔧 Tractor Fail]    |  |                               |  |  | [14:02] AI Diff|  |
|                      |  | [✓ Approve Plan] [✕ Override] |  |  | [14:02] Synced |  |
|                      |  +-------------------------------+  |  +----------------+  |
+----------------------+-------------------------------------+----------------------+
```

---

## 🌐 Centralized Multi-Farm Operations & Complete REST CRUD

Parallax ARM centralizes operations for agricultural enterprises running multiple distributed sectors (varied acreage, microclimates, soil compositions, irrigation systems, and appointed fleets).

### Full REST CRUD API Matrix

| Resource | Method & Route | Purpose |
|---|---|---|
| **Farms / Sectors** | `GET /api/farms` | List all registered agricultural sectors |
| | `POST /api/farms` or `/api/farms/create` | Register new farm sector (acreage, soil pH, moisture range, irrigation rig) |
| | `GET /api/farms/[id]` | Inspect farm details, appointed machinery & active tasks |
| | `POST /api/farms/[id]/update` | Update telematics, soil targets, or weather status |
| | `POST /api/farms/[id]/delete` | Decommission and remove sector |
| **Fleet & Workers** | `GET /api/resources` | List all machinery implements and agronomists (`?farmId=X` filter) |
| | `POST /api/resources` or `/api/resources/create` | Deploy tractor, harvester, drone, or agronomist to a sector |
| | `GET /api/resources/[id]` | Inspect resource telematics, battery/fuel, speed, CAN-bus status |
| | `POST /api/resources/[id]/update` | Reallocate cross-farm (`status: EN_ROUTE`), service/repair, refuel |
| | `POST /api/resources/[id]/delete` | Retire equipment from operational roster |
| **Work Orders** | `GET /api/tasks` | List all operational missions (`?farmId=X` filter) |
| | `POST /api/tasks` or `/api/tasks/create` | Issue scheduled work order with priority and implement assignment |
| | `GET /api/tasks/[id]` | Retrieve mission parameters and AI reasoning |
| | `POST /api/tasks/[id]/update` | Update mission status (`SCHEDULED`, `IN_PROGRESS`, `PAUSED_BY_AI`, `COMPLETED`) |
| | `POST /api/tasks/[id]/delete` | Cancel and delete mission |
| **HITL Tickets** | `GET /api/tickets` | Query active incident mutation tickets |
| | `POST /api/tickets/[id]/approve` | 1-Click operator execution of proposed mutations |
| | `POST /api/tickets/[id]/reject` | Operator override and dismissal of AI recommendations |
| | `POST /api/tickets/[id]/delete` | Purge ticket from dispatch queue |
| **Telemetry & Ingestion** | `POST /api/events/ingest` | Ingest weather webhooks, leaf vision assays, or hardware faults |
| | `GET /api/logs` | Real-time NASA-style event log stream |
| | `GET /api/state` | Composite ACID state snapshot |
| | `POST /api/reset` | 1-Click demo state reseed across all locations |

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (React 19, App Router)
- **Styling**: Tailwind CSS, CSS Custom Properties & Animations
- **Database & ORM**: PostgreSQL, Drizzle ORM
- **AI Orchestration**: Google Gemini 2.5 Flash (Multimodal & Structured Outputs via `@google/generative-ai`)
- **Real-Time Data**: Server-Sent Events (SSE) & React State Sync
- **Language**: TypeScript 5 (Strict Mode)

---

## 🚀 Quick Start

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/KumarCreator1/alta-hackoween-2026.git
cd alta-hackoween-2026
npm install
```

### 2. Configure Environment Variables

Create a `.env` file based on `.env.example`:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/arm_command_center
GEMINI_API_KEY=your_gemini_api_key_here
```

*(Note: The system includes a built-in deterministic heuristic fallback engine, ensuring full demo functionality even without an active Gemini API key or live Postgres instance).*

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production

```bash
npm run build
npm start
---
## 👥 Team Parallax

- **Vicky Kumar** & Team Parallax
- Built for **Alta Hackoween 2026**
