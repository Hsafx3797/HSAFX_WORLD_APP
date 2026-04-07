# Setup Guide

This guide walks you through setting up the HSAFX World development environment.

## Step 1: Prerequisites

Install required tools:

### Node.js & pnpm
```bash
# Install Node.js 20+ from nodejs.org
# Then install pnpm
npm install -g pnpm@9
```

### Python & uv
```bash
# Install Python 3.11+ from python.org
# Then install uv (fast Python package manager)
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### Rust
```bash
# Install Rust toolchain
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install wasm-pack for WebAssembly
cargo install wasm-pack
```

## Step 2: Clone & Install

```bash
# Clone repository
git clone <repo-url>
cd hsafx_world_app

# Install Node.js dependencies
pnpm install

# Install Python dependencies (FastAPI)
cd backend/fastapi
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements.txt
cd ../..
```

## Step 3: External Services Setup

### 1. Database (Neon)
- Sign up at [neon.tech](https://neon.tech)
- Create project in Singapore region (ap-southeast-1)
- Copy connection string

### 2. Redis (Upstash)
- Sign up at [upstash.com](https://upstash.com)
- Create Redis database
- Copy URL and token

### 3. Authentication (Better-Auth)
- Google OAuth: [console.cloud.google.com](https://console.cloud.google.com)
  - Create project → APIs & Services → Credentials
  - OAuth 2.0 Client ID (Web application)
  - Authorized redirect: `https://yourdomain.com/api/auth/callback/google`

- GitHub OAuth: [github.com/settings/developers](https://github.com/settings/developers)
  - New OAuth App
  - Callback URL: `https://yourdomain.com/api/auth/callback/github`

- Meta OAuth: [developers.facebook.com](https://developers.facebook.com)
  - Create App → Add Facebook Login
  - Valid OAuth Redirect: `https://yourdomain.com/api/auth/callback/facebook`

### 4. Billing

**Polar** (Subscriptions):
- Sign up at [polar.sh](https://polar.sh)
- Create subscription plans
- Copy API keys and webhook secret

**Stripe** (Payments):
- Sign up at [stripe.com](https://stripe.com)
- Get API keys (test + live)
- Setup webhook endpoint
- Copy webhook signing secret

### 5. Storage (Cloudflare R2)
- Sign up at [cloudflare.com](https://cloudflare.com)
- Create R2 bucket
- Generate API token with R2 permissions
- Copy account ID, access key, secret key, bucket name

### 6. Background Jobs (Inngest) — Optional
- Sign up at [inngest.com](https://inngest.com)
- Create project
- Copy event key and signing key
- Note: The system uses a Redis-based job worker by default

### 7. Search (Meilisearch) — Not Yet Integrated
- Planned for future integration
- Self-host or use [Meilisearch Cloud](https://cloud.meilisearch.com)

### 8. Monitoring

**Sentry** (Errors):
- Sign up at [sentry.io](https://sentry.io)
- Create project
- Copy DSN

**Plausible** (Analytics):
- Sign up at [plausible.io](https://plausible.io) or self-host
- Add domain
- Copy script URL

## Step 4: Environment Configuration

```bash
# Copy example
cp .env.example .env

# Edit .env with your credentials
nano .env  # or use your editor
```

Fill in all values from Step 3.

## Step 5: Database Setup

```bash
# Generate Drizzle schema
pnpm db:generate

# Run migrations
pnpm db:migrate

# (Optional) Open Drizzle Studio to view database
pnpm --filter @hsafx/db studio
```

## Step 6: Build WASM Tools

```bash
cd backend/rust/text-tools

# Build WebAssembly package
wasm-pack build --target web --out-dir ../../../apps/web/public/wasm

cd ../../..
```

## Step 7: Start Development Servers

### Option A: All services
```bash
pnpm dev
```

This starts:
- Next.js app on http://localhost:3000
- FastAPI on http://localhost:8000

### Option B: Individual services
```bash
# Terminal 1: Next.js
pnpm --filter @hsafx/web dev

# Terminal 2: FastAPI
cd backend/fastapi
.venv\Scripts\python.exe -m uvicorn src.main:app --reload --port 8000
```

## Step 8: Verify Setup

1. **Next.js App**: http://localhost:3000
   - Should see homepage
   - Try signing up/signing in

2. **FastAPI**: http://localhost:8000/docs
   - Should see API documentation
   - Test health endpoint

3. **Database**:
   ```bash
   pnpm --filter @hsafx/db studio
   ```
   - Should see all 28 tables

4. **Authentication**:
   - Try creating account with email
   - Try OAuth login (Google, GitHub, Meta)

## Step 9: Seed Database (Optional)

```bash
# Create seed script (to be implemented)
pnpm --filter @hsafx/db seed
```

This will populate:
- Default roles (admin, moderator, user, guest)
- Subscription plans (Free, Basic, Professional, Enterprise)
- Tool categories
- Sample tools

## Troubleshooting

### Database connection fails
- Verify DATABASE_URL is correct
- Check if Neon project is in correct region
- Ensure IP is allowed (Neon auto-allows all by default)

### OAuth not working
- Verify redirect URLs match exactly
- Check client IDs and secrets
- Ensure NEXT_PUBLIC_APP_URL is correct

### WASM build fails
- Ensure wasm-pack is installed: `cargo install wasm-pack`
- Check Rust version: `rustc --version` (need 1.75+)

### Port already in use
```bash
# Kill process on port 3000
npx kill-port 3000

# Or change port
PORT=3001 pnpm --filter @hsafx/web dev
```

## Next Steps

1. **Read Documentation**: Start with [DOCUMENTATION_INDEX.md](docs/PLANNING/DOCUMENTATION_INDEX.md)
2. **Implement Tools**: See [30_TOOLS_CATALOG.md](docs/PLANNING/30_TOOLS_CATALOG.md) for all 451 tools
3. **Setup Admin Panel**: Configure at `/admin`
4. **Test Billing Flow**: Create test subscription
5. **Deploy**: Follow [49_DEPLOYMENT_GUIDE.md](docs/PLANNING/49_DEPLOYMENT_GUIDE.md)

## Getting Help

- Check [README.md](README.md) for overview
- Review planning docs in `docs/planning/`
- Email: support@hsafx.world

---

Setup complete! 🎉 Start building at http://localhost:3000
