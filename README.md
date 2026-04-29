# HSAFX World - B2B Engine API Platform

A B2B API platform with 28 parameterized engines for text, data, and media processing, built with Next.js, FastAPI, and Rust.

## 🎯 Project Overview

HSAFX World is a B2B API platform providing server-side engine execution:
- **9 Text/Data Engines** (Rust service — case, wrap, filter, transform, encode, hash, counter, unicode, generate-data)
- **11 Code/Format Engines** (Node.js — comment, markup, convert, format, schema, diff, api, generate-web, validate, calculate, unit)
- **8 Media Engines** (FastAPI — image, video, audio, pdf, document, archive, file, font)

## 📁 Project Structure

```
hsafx_world_app/
├── apps/
│   ├── web/          # Next.js 15 B2B API server (port 3000)
│   └── admin/        # Next.js 15 admin panel (port 3002)
├── backend/
│   ├── fastapi/      # FastAPI Python backend (port 8000)
│   └── rust/         # Rust text/data engine service
├── packages/
│   ├── api/          # tRPC routers & procedures
│   ├── db/           # Drizzle ORM + PostgreSQL schema
│   ├── schemas/      # Zod validation schemas
│   ├── shared/       # Shared types, constants, utilities
│   ├── theme/        # Theme system & presets
│   ├── tools/        # 20 engine implementations (Node.js engines)
│   └── ui/           # UI components
└── docs/             # Complete documentation (60+ files)
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+
- Python 3.11+
- Rust 1.75+
- PostgreSQL (or Neon account)
- Redis (or Upstash account)

### Installation

1. **Clone repository**
   ```bash
   git clone <repo-url>
   cd hsafx_world_app
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Setup environment**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

4. **Database setup**
   ```bash
   pnpm db:generate
   pnpm db:push
   ```

5. **Run development servers**
   ```bash
   # All services
   pnpm dev

   # Or individually:
   pnpm dev:web          # Next.js app (port 3000)
   pnpm dev:admin        # Admin panel (port 3002)
   
   # FastAPI server
   cd backend/fastapi && uvicorn src.main:app --reload  # (port 8000)
   ```

## Documentation

Current build documentation in `docs/BUILT/`:

- **[01_ENGINES.md](docs/BUILT/01_ENGINES.md)** - All 30 engines
- **[02_API_SURFACE.md](docs/BUILT/02_API_SURFACE.md)** - API routes
- **[03_DATABASE.md](docs/BUILT/03_DATABASE.md)** - Database schema
- **[04_BILLING.md](docs/BUILT/04_BILLING.md)** - B2B billing
- **[05_AUTH_AND_ROLES.md](docs/BUILT/05_AUTH_AND_ROLES.md)** - Auth system

See [docs/INDEX.md](docs/INDEX.md) for full documentation index.

## 🏗️ Technology Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **Tailwind CSS v4** - Styling
- **shadcn/ui** - Component library
- **tRPC 11** - Type-safe API calls
- **Zustand** - State management
- **Better-Auth** - Authentication

### Backend
- **tRPC API** - Type-safe API layer (`packages/api`)
- **FastAPI 0.109** - Python backend (`backend/fastapi`)
- **Drizzle ORM** - TypeScript database toolkit

### Tool Execution
- **Rust + WASM** - Client-side text tools
- **Node.js** - Server-side converters
- **Python/FFmpeg** - Media processing

### Infrastructure
- **PostgreSQL (Neon)** - Primary database
- **Redis (Upstash)** - Caching & sessions
- **Cloudflare R2** - File storage
- **Vercel** - Next.js deployment
- **Fly.io/Railway** - FastAPI deployment
- **Region**: Singapore (ap-southeast-1)

### External Services
- **Polar** - Payment processing & subscriptions
- **Resend** - Email service
- **Sentry** - Error tracking (planned)
- **Plausible** - Analytics (planned)

## 🔧 Development

### Database

```bash
# Generate migration
pnpm db:generate

# Push schema to database
pnpm db:push

# Run migration
pnpm db:migrate

# Open Drizzle Studio
pnpm db:studio
```

### FastAPI Backend

```bash
cd backend/fastapi

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows

# Install dependencies
pip install -r requirements.txt

# Run server
uvicorn src.main:app --reload --port 8000

# API docs: http://localhost:8000/docs
```

### Tools Package

```bash
cd packages/tools

# Build tools
pnpm build

# Watch mode
pnpm dev
```

### Rust/WASM Tools

```bash
cd backend/rust/text-tools

# Build WASM
wasm-pack build --target web --out-dir ../../../apps/web/public/wasm

# Run tests
cargo test
```

## 🧪 Testing

```bash
# Type check all packages
pnpm typecheck

# Lint all packages
pnpm lint

# Run tests
pnpm test
```

## 📦 Build & Deploy

### Production Build

```bash
# Build all apps
pnpm build

# Build specific app
pnpm build:web
pnpm build:admin
```

### Deployment

See [docs/BUILT/11_DEPLOYMENT.md](docs/BUILT/11_DEPLOYMENT.md) for detailed deployment instructions.

**Quick Deploy:**
- Next.js → Vercel (automatic via Git)
- FastAPI → Railway/Fly.io (Singapore region)
- Database → Neon (ap-southeast-1)

## 🔐 Environment Variables

See [.env.example](.env.example) for all required variables:

- **Database**: Neon PostgreSQL
- **Cache**: Upstash Redis
- **Auth**: Better-Auth + OAuth providers
- **Billing**: Polar
- **Storage**: Cloudflare R2
- **Jobs**: Inngest
- **Search**: Meilisearch
- **Monitoring**: Sentry, Plausible

## 📱 Apps Overview

### Web App (`apps/web`)
- User-facing tool platform
- 448+ tools organized by category
- Dashboard with usage history
- Subscription & billing management
- Settings & preferences

### Admin Panel (`apps/admin`)
- User management
- Tool configuration
- Category management
- Subscription oversight
- Activity logs
- Feature flags
- Billing reports

### Python Server (`apps/server`)
- Media processing API
- File conversion endpoints
- Server-side tool execution
- Background job processing

## 📝 License

Proprietary - All rights reserved

## 👥 Team

**HSAFX** - Full Stack Development

## 📞 Support

- Documentation: `/docs`
- Email: support@hsafx.world

---

Built with ❤️ by HSAFX
