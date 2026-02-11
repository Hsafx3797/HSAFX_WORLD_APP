# HSAFX World - All-in-One Tool Suite

A comprehensive platform with 448+ professional tools across 5 major categories, built with Next.js, FastAPI, and Rust/WASM.

## 🎯 Project Overview

HSAFX World is a freemium SaaS platform providing access to professional-grade tools:
- **191 Text Tools** (Rust/WASM - client-side)
- **100+ Data Converters** (Node.js)
- **100+ Media Processors** (Python/FFmpeg)
- **100 Generators & Calculators** (JS/Rust)
- **10+ Logistics Tools** (Python scraping)

## 📁 Project Structure

```
hsafx_world_app/
├── apps/
│   ├── web/          # Next.js 15 user application (port 3000)
│   ├── admin/        # Next.js 15 admin panel (port 3001)
│   └── server/       # FastAPI Python backend (port 8000)
├── packages/
│   ├── api/          # tRPC routers & procedures
│   ├── db/           # Drizzle ORM + PostgreSQL schema
│   ├── shared/       # Shared types, constants, utilities
│   ├── tools/        # Tool implementations & engine
│   ├── ui/           # UI components
│   └── wasm/         # Rust/WASM text tools
└── docs/             # Complete documentation (41+ files)
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
   pnpm dev:admin        # Admin panel (port 3001)
   
   # FastAPI server
   cd apps/server && uvicorn src.main:app --reload  # (port 8000)
   ```

## 📚 Documentation

Comprehensive documentation in `docs/planning/`:

- **[EXECUTIVE_SUMMARY.md](docs/planning/EXECUTIVE_SUMMARY.md)** - Project overview
- **[DOCUMENTATION_INDEX.md](docs/planning/DOCUMENTATION_INDEX.md)** - All documents indexed
- **[00_PRODUCT_REQUIREMENTS.md](docs/planning/00_PRODUCT_REQUIREMENTS.md)** - Complete PRD
- **[10_SYSTEM_ARCHITECTURE.md](docs/planning/10_SYSTEM_ARCHITECTURE.md)** - Architecture design
- **[11_TECHNOLOGY_STACK.md](docs/planning/11_TECHNOLOGY_STACK.md)** - Tech decisions
- **[12_FILE_STRUCTURE.md](docs/planning/12_FILE_STRUCTURE.md)** - Monorepo structure
- **[13_DATABASE_SCHEMA.md](docs/planning/13_DATABASE_SCHEMA.md)** - Database design
- **[30_TOOLS_CATALOG.md](docs/planning/30_TOOLS_CATALOG.md)** - All 448 tools listed

See [DOCUMENTATION_INDEX.md](docs/planning/DOCUMENTATION_INDEX.md) for full list.

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
- **FastAPI 0.109** - Python backend (`apps/server`)
- **SQLAlchemy 2.0** - Python ORM
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
- **Stripe** - Payment processing
- **Polar** - Subscription management
- **Inngest** - Background jobs
- **Meilisearch** - Search engine
- **Sentry** - Error tracking
- **Plausible** - Analytics
- **Resend** - Email service

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
cd apps/server

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
cd packages/wasm/text-tools

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

See [49_DEPLOYMENT_GUIDE.md](docs/planning/49_DEPLOYMENT_GUIDE.md) for detailed deployment instructions.

**Quick Deploy:**
- Next.js → Vercel (automatic via Git)
- FastAPI → Railway/Fly.io (Singapore region)
- Database → Neon (ap-southeast-1)

## 🔐 Environment Variables

See [.env.example](.env.example) for all required variables:

- **Database**: Neon PostgreSQL
- **Cache**: Upstash Redis
- **Auth**: Better-Auth + OAuth providers
- **Billing**: Stripe + Polar
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
