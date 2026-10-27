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
```

---

## 🎬 3-Minute Live Pitch Choreography

1. **0:00 – 0:30 (The Baseline)**: Open the dashboard. Point out nominal schedules on *Sector Alpha* and *Sector Beta*, visualized on both the central vector map and the worker phone emulator on the right.
2. **0:30 – 1:15 (The Compound Crisis)**: Trigger a compound crisis using the Chaos Injector: click **🌧️ Flash Storm** on Sector Alpha, followed by dragging a blight leaf image onto Sector Beta.
3. **1:15 – 2:00 (The Autonomous Triage)**: Highlight the sub-second AI triage card. Read the executive summary: Gemini identified the oncoming storm will wash off pesticides in Sector Alpha, immediately paused the chemical tasks, hijacked Sector Alpha's idle sprayer tractor, and routed it to Sector Beta to contain the outbreak.
4. **2:00 – 2:45 (The HITL Handoff)**: Click **[✓ Approve & Dispatch]**. Watch the SVG tractor animate from Alpha to Beta across the transit corridor, telemetry logs scroll in real-time, and the worker phone flash with updated driving orders.
5. **2:45 – 3:00 (The Close)**: Reiterate the **80% AI cognitive automation / 20% human executive oversight** model solving complex physical cross-farm logistical constraints.

---

## 👥 Team Parallax

- **Vicky Kumar** & Team Parallax
- Built for **Alta Hackoween 2026**
