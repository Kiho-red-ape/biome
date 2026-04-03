# BIOME Deployment Guide

## Domain: biome.to (Namecheap)

### Step 1: Add domain in Vercel
1. Go to vercel.com → your biome project → Settings → Domains
2. Add: biome.to
3. Add: www.biome.to (redirects to biome.to)
4. Vercel will show you the required DNS records

### Step 2: Configure DNS in Namecheap
1. Log in to namecheap.com
2. Go to Domain List → biome.to → Manage
3. Click "Advanced DNS" tab
4. Delete any existing A records or CNAME records for @ and www
5. Add these records:

| Type | Host | Value | TTL |
|------|------|-------|-----|
| A Record | @ | 76.76.21.21 | Automatic |
| CNAME Record | www | cname.vercel-dns.com. | Automatic |

6. If there's a "URL Redirect Record" for @ or www, delete it
7. Save changes
8. DNS propagation takes 5 minutes to 48 hours (usually under 30 minutes for Namecheap)

### Step 3: Add staging subdomain
1. In Vercel → Settings → Domains → Add: staging.biome.to
2. In Vercel → Settings → Git → configure "staging" branch to deploy to staging.biome.to
3. In Namecheap → Advanced DNS → add:

| Type | Host | Value | TTL |
|------|------|-------|-----|
| CNAME Record | staging | cname.vercel-dns.com. | Automatic |

### Step 4: Environment variables in Vercel
Go to Vercel → Settings → Environment Variables

**For Production (biome.to — main branch):**
Scope: Production only
- NEXT_PUBLIC_SUPABASE_URL = [your PRODUCTION Supabase URL — create new project]
- NEXT_PUBLIC_SUPABASE_ANON_KEY = [your PRODUCTION Supabase anon key]
- NEXT_PUBLIC_PRIVY_APP_ID = [same Privy app ID]
- NEXT_PUBLIC_IS_STAGING = [DO NOT SET — absence means banner won't show]

**For Preview/Staging (staging.biome.to — staging branch):**
Scope: Preview only
- NEXT_PUBLIC_SUPABASE_URL = [your CURRENT Supabase URL — the one with seeded data]
- NEXT_PUBLIC_SUPABASE_ANON_KEY = [your CURRENT Supabase anon key]
- NEXT_PUBLIC_PRIVY_APP_ID = [same Privy app ID]
- NEXT_PUBLIC_IS_STAGING = true

### Step 5: Create production Supabase project
1. Go to supabase.com → New project
2. Name: biome-production
3. Region: Mumbai (closest to India)
4. Save the new Project URL and anon public key
5. Run ALL migrations from supabase/migrations/ folder in order on the new project
6. Do NOT run any seed scripts — production starts clean
7. Use the new URL and anon key for the Production environment variables in Vercel

### Step 6: Verify
- biome.to → shows the production site (clean, no seeded data, no staging banner)
- staging.biome.to → shows the staging site (seeded data, cyan banner at top saying "staging environment")
- Both are editable via Claude Code by switching branches

### Branch workflow
- main branch → deploys to biome.to (production)
- staging branch → deploys to staging.biome.to (staging with sample data)
- To update both: make changes on main, then merge main into staging
- To update staging only: make changes directly on staging branch
