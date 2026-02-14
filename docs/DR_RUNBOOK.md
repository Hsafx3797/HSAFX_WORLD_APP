# Disaster Recovery Runbook — HSAFX WORLD

## 1. Overview

| Service        | Host               | Recovery Target |
| -------------- | ------------------ | --------------- |
| Web (Next.js)  | Vercel             | < 5 min         |
| Admin (Next.js)| Vercel             | < 5 min         |
| FastAPI         | Railway            | < 10 min        |
| PostgreSQL      | Neon (serverless)  | < 15 min        |
| Redis (cache)   | Upstash            | 0 min (ephemeral) |

---

## 2. Database Recovery

### 2.1 Neon Point-in-Time Restore
Neon retains WAL history for 7 days on the Pro plan.

1. Go to **Neon Console → Project → Branches**.
2. Click **Create Branch** → select **From specific point in time**.
3. Pick the timestamp before the incident.
4. Copy the new branch connection string.
5. Update `DATABASE_URL` in Vercel/Railway secrets.
6. Redeploy affected services.

### 2.2 Restore from pg_dump Backup
Backups are created daily by `infra/scripts/pg_backup.sh`.

```bash
# Decompress and restore
gunzip < backups/hsafx_backup_YYYYMMDD_HHMMSS.sql.gz | pg_restore --dbname="$DATABASE_URL" --no-owner --clean --if-exists
```

### 2.3 Verify Integrity
```sql
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM tool_executions;
SELECT MAX(created_at) FROM audit_entries;
```

---

## 3. Service Recovery

### 3.1 Web / Admin (Vercel)
Vercel deployments are immutable. To rollback:

1. Go to **Vercel Dashboard → Project → Deployments**.
2. Find the last known good deployment.
3. Click **⋯ → Promote to Production**.

Or via CLI:
```bash
vercel promote <deployment-url> --scope=hsafx --token=$VERCEL_TOKEN
```

### 3.2 FastAPI (Railway)
```bash
railway up --service fastapi-prod --detach
# Or rollback via Railway dashboard → Deployments → Rollback
```

### 3.3 Redis (Upstash)
Redis is used as a cache only — no data is authoritative there.
If Upstash is down, the app falls back to in-memory caching.
No action needed beyond waiting for Upstash recovery.

---

## 4. DNS / Domain Issues

Domains are managed via Cloudflare.

1. Log in to **Cloudflare Dashboard → hsafx.world**.
2. Verify A/CNAME records point to Vercel / Railway.
3. Check "Under Attack Mode" isn't enabled accidentally.
4. Purge Cloudflare cache if stale content is served.

---

## 5. Secrets Rotation

If secrets are compromised:

1. **Database**: Rotate password in Neon, update `DATABASE_URL` everywhere.
2. **Polar / Stripe**: Rotate API keys in respective dashboards.
3. **Better Auth Secret**: Generate new `BETTER_AUTH_SECRET`, all sessions will be invalidated.
4. **Admin JWT**: Rotate `ADMIN_JWT_SECRET`, all admin sessions will be invalidated.
5. After updating secrets, trigger redeployments.

---

## 6. Maintenance Mode

Enable maintenance mode without downtime:

1. In Admin Panel → Settings → Enable "Maintenance Mode".
2. Or directly in the database:
```sql
UPDATE admin_settings SET value = '"true"' WHERE key = 'maintenance_mode';
```
3. The web app renders a maintenance page for all non-admin requests.
4. Admin panel remains accessible during maintenance.

---

## 7. Communication Checklist

- [ ] Identify incident scope and blast radius
- [ ] Update status page (if configured)
- [ ] Notify affected team members
- [ ] Start incident timeline document
- [ ] Execute appropriate recovery steps above
- [ ] Verify all services are healthy
- [ ] Write post-incident report
