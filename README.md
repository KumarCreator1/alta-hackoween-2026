# PARALLAX ARM: Autonomous Farm Operations System

PARALLAX ARM (Agricultural Resource Management) is an operations management platform for distributed agricultural enterprises. Built with Next.js 16, TypeScript, Drizzle ORM, and PostgreSQL, the system coordinates field machinery, agronomist field crews, and scheduled field tasks across multiple geographic sectors. It integrates environmental telemetry monitoring, conflict detection, and human-in-the-loop (HITL) incident resolution.

---

## Core Capabilities

### 1. Centralized Multi-Farm Operations
Agricultural operations are distributed across independent geographic sectors with distinct microclimates, soil properties, and equipment stations:
- Sector-level tracking of acreage, soil pH, moisture thresholds, and irrigation infrastructure (Center Pivot, Drip Micro, Flood Gate, Aerial Spraying).
- Live environmental status per sector (temperature, wind velocity, precipitation alerts).
- Dynamic cross-farm resource reallocation and transit routing.

### 2. Fleet and Crew Resource Management
Replaces card grids with an operational table for real-time fleet oversight:
- Tracks machinery implements (tractors, sprayers, harvesters, agricultural drones) and field agronomists.
- Real-time dynamic job assignment linked directly to the task scheduler.
- Operational status state transitions: `IDLE`, `BUSY`, `IN_MAINTENANCE`, `EN_ROUTE`.
- Inline status updating controls for rapid dispatch and servicing.
- Cross-farm redeployment selector to reassign assets between physical sectors.

### 3. Productivity Work Orders and Dispatch
A structured operational scheduler designed around productivity workflows:
- Attribute schema: Priority order (`P1 Urgent`, `P2 High`, `P3 Normal`, `P4 Low`), Task Name, Field Section, Target Hectares, Category, Scheduled Time Window, Responsible Resource, and Status.
- Inline schedule editing with instant persistence.
- Intelligent slot-based employee assignment: Filters workers stationed at the target farm and flags busy time slots to prevent double-booking.
- Environmental conflict alerts: Warns against chemical wash-off during rain alerts or soil compaction during saturated moisture conditions.
- AI Override and Resume: Operators can review AI pause conditions and resume operations when field conditions permit.
- Dual-tier verification workflow:
  1. Worker marks a task as done (`Mark Done`), recording a completion timestamp and transitioning the order to `Needs Owner Verification`.
  2. Owner inspects field results and either confirms completion (`Verify & Approve`) or returns it to progress (`Reject Claim`) with audit notes.

### 4. Human-in-the-Loop (HITL) Incident Queue
- Simulates external operational disruptions: flash storms, fungal blight outbreaks via leaf image analysis, and mechanical equipment failures.
- Evaluates operational disruptions using multimodal reasoning (Google Gemini) with deterministic rule fallbacks.
- Proposes atomic mutation diffs (`PAUSE_TASK`, `REASSIGN_RESOURCE`, `CREATE_TASK`).
- Requires explicit operator authorization (`Approve`) or dismissal (`Reject`) before applying state changes.

### 5. Edge Worker Mobile Viewport
- Mobile interface emulator for field workers and machine operators.
- Synchronizes assigned work orders, active routes, and real-time alerts.
- Provides direct completion submission that feeds into the owner verification pipeline.

---

## Repository Structure

```
arm-command-center/
|-- public/                             # Static web assets and icons
|-- src/
|   |-- app/                            # Next.js App Router pages and API routes
|   |   |-- layout.tsx                  # Root HTML shell and font configurations
|   |   |-- page.tsx                    # Main operations command center container
|   |   |-- globals.css                 # Global styling rules and design tokens
|   |   |-- api/                        # REST API routing layer
|   |       |-- events/
|   |       |   `-- ingest/             # Incident simulation webhook ingestion
|   |       |-- farms/                  # Farm sector CRUD endpoints
|   |       |   |-- route.ts            # GET all sectors / POST create sector
|   |       |   |-- create/             # Alternative creation endpoint
|   |       |   `-- [id]/
|   |       |       |-- route.ts        # GET sector details and assigned assets
|   |       |       |-- update/         # POST update sector parameters
|   |       |       `-- delete/         # POST delete sector
|   |       |-- resources/              # Fleet and worker CRUD endpoints
|   |       |   |-- route.ts            # GET all resources / POST create resource
|   |       |   |-- create/             # Resource deployment endpoint
|   |       |   `-- [id]/
|   |       |       |-- route.ts        # GET resource details
|   |       |       |-- update/         # POST update status, farm, or telemetry
|   |       |       `-- delete/         # POST retire resource
|   |       |-- tasks/                  # Work orders CRUD endpoints
|   |       |   |-- route.ts            # GET all tasks / POST create task
|   |       |   |-- create/             # Task creation endpoint
|   |       |   `-- [id]/
|   |       |       |-- route.ts        # GET task details
|   |       |       |-- update/         # POST update status, schedule, or verification
|   |       |       `-- delete/         # POST cancel task
|   |       |-- tickets/                # HITL incident proposals
|   |       |   |-- route.ts            # GET active proposal tickets
|   |       |   `-- [id]/
|   |       |       |-- approve/        # POST apply proposed atomic mutations
|   |       |       |-- reject/         # POST reject proposal
|   |       |       `-- delete/         # POST remove ticket
|   |       |-- state/                  # GET full composite database snapshot
|   |       |-- logs/                   # GET telemetry audit log stream
|   |       `-- reset/                  # POST reseed database to default state
|   |-- components/                     # Modular interface components
|   |   |-- AddFarmModal.tsx            # Modal dialogue to register new sectors
|   |   |-- AddTaskModal.tsx            # Modal dialogue for work orders with slot checks
|   |   |-- CrisisCard.tsx              # Incident injection controls
|   |   |-- EdgeTrackerCard.tsx         # Active worker field telemetry card
|   |   |-- FleetGauge.tsx              # Telematics fuel/battery display widget
|   |   |-- LeafUploader.tsx            # Multimodal image upload for pathology assays
|   |   |-- LiveTerminal.tsx            # Monospace operational audit log feed
|   |   |-- Sidebar.tsx                 # Navigation sidebar and operational metrics
|   |   |-- TacticalMap.tsx             # 2D topological SVG map with transit routes
|   |   |-- TeamCollaboration.tsx       # Operator roster summary widget
|   |   |-- TelemetryPane.tsx           # Sector environmental cards and alerts
|   |   |-- TicketQueue.tsx             # HITL mutation diff cards with approval actions
|   |   |-- TopBar.tsx                  # Global header, search, and system triggers
|   |   |-- WorkerPhone.tsx             # Embedded field technician mobile interface
|   |   `-- views/                      # Dedicated view modes
|   |       |-- TasksView.tsx           # Productivity table work orders view
|   |       |-- FleetView.tsx           # Machinery fleet operational table
|   |       |-- SectorsView.tsx         # Sector administrator view
|   |       |-- CrewView.tsx            # Field personnel roster view
|   |       |-- TacticalMapView.tsx     # Fullscreen geographic schematic
|   |       |-- IncidentsView.tsx       # HITL incident management view
|   |       |-- ChaosView.tsx           # Crisis simulation panel
|   |       |-- TerminalView.tsx        # Fullscreen system log console
|   |       `-- WorkerView.tsx          # Standalone field worker viewport
|   |-- db/                             # Persistence layer
|   |   |-- schema.ts                   # Drizzle PostgreSQL schema definitions
|   |   |-- actions.ts                  # Typed database query and mutation functions
|   |   |-- index.ts                    # PostgreSQL connection pooler and Drizzle client
|   |   |-- migrate.ts                  # Schema migration execution script
|   |   `-- seed.ts                     # Enterprise multi-farm seed dataset
|   `-- lib/
|       `-- orchestrate.ts              # Gemini structured reasoning and fallback logic
|-- .env.example                        # Template for environment configuration
|-- drizzle.config.ts                   # Drizzle ORM CLI configuration
|-- next.config.ts                      # Next.js build and compiler configuration
|-- package.json                        # Project dependencies and script definitions
|-- postcss.config.mjs                  # PostCSS plugins configuration
|-- tailwind.config.ts                  # Tailwind CSS styling configuration
`-- tsconfig.json                       # TypeScript compiler options
```

---

## REST API Reference

### Sectors and Farms
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/farms` | List all registered farm sectors |
| `POST` | `/api/farms` or `/api/farms/create` | Register a new farm sector |
| `GET` | `/api/farms/:id` | Fetch sector record, assigned equipment, and active tasks |
| `POST` | `/api/farms/:id/update` | Update sector parameters, soil target ranges, or weather |
| `POST` | `/api/farms/:id/delete` | Remove a farm sector |

### Fleet and Crew Resources
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/resources` | List resources (optional `?farmId=:id` query parameter) |
| `POST` | `/api/resources` or `/api/resources/create` | Deploy machinery or appoint worker |
| `GET` | `/api/resources/:id` | Retrieve resource telematics, status, and assigned tasks |
| `POST` | `/api/resources/:id/update` | Update status, reassign farm, or set operational state |
| `POST` | `/api/resources/:id/delete` | Retire resource from active operations |

### Work Orders
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/tasks` | List work orders (optional `?farmId=:id` query parameter) |
| `POST` | `/api/tasks` or `/api/tasks/create` | Dispatch a new work order |
| `GET` | `/api/tasks/:id` | Fetch task details and AI reasoning log |
| `POST` | `/api/tasks/:id/update` | Update status, scheduled slot, or verification flags |
| `POST` | `/api/tasks/:id/delete` | Cancel and delete work order |

### Incident Resolution (HITL)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/tickets` | Query pending mutation proposal tickets |
| `POST` | `/api/tickets/:id/approve` | Execute proposed mutations in a single transaction |
| `POST` | `/api/tickets/:id/reject` | Dismiss proposed mutations |
| `POST` | `/api/tickets/:id/delete` | Purge ticket from queue |

### Telemetry and System State
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/state` | Returns composite state snapshot (farms, resources, tasks, tickets, logs) |
| `POST` | `/api/events/ingest` | Ingest incident webhooks (weather, disease CV, equipment faults) |
| `GET` | `/api/logs` | Query chronological operational log entries |
| `POST` | `/api/reset` | Reseed database to default multi-farm operational state |

---

## Technical Stack

- **Application Framework**: Next.js 16 (App Router, Server and Client Components)
- **Programming Language**: TypeScript 5 (Strict Mode)
- **Database Layer**: PostgreSQL via Supabase Connection Pooler
- **Object-Relational Mapping**: Drizzle ORM
- **Styling**: Tailwind CSS
- **AI Orchestration**: Google Gemini API (`@google/generative-ai`) with deterministic rule fallback
- **Connection Protocol**: PostgreSQL pooling with TLS/SSL enabled

---

## Getting Started

### Prerequisites
- Node.js 18.18 or higher (Node.js 20+ recommended)
- Access to a PostgreSQL instance or Supabase project

### 1. Clone Repository and Install Dependencies
```bash
git clone https://github.com/KumarCreator1/alta-hackoween-2026.git
cd alta-hackoween-2026/arm-command-center
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Set the required environment keys in `.env`:
```env
# PostgreSQL connection string (use IPv4 pooler for hosted instances such as Supabase)
DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
SUPA_DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres

# Supabase API Credentials
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_REF].supabase.co
SUPA_PROJECT_URL=https://[PROJECT_REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[ANON_KEY]
SUPA_PUBLISHABLE_KEY=[ANON_KEY]

# Google Gemini API
GEMINI_API_KEY=[GEMINI_API_KEY]
```

### 3. Initialize Database Schema and Seed Data
```bash
npx tsx src/db/seed.ts
```

### 4. Run Development Server
```bash
npm run dev
```
Navigate to `http://localhost:3000` in your browser.

### 5. Build for Production
```bash
npm run build
npm start
```
