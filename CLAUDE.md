BIOME — Project Context
What Is BIOME?
BIOME is a bounty-based experiment aggregator — the CoinGecko of scientific experiments. Anyone can post an experiment (bounty), participants sign up and earn. BIOME takes a platform fee. Optional paid add-on: BIOME Verification credential for vetting experiments end-to-end.
This is NOT an agency. BIOME does not design experiments. BIOME provides:
1. The participant funnel (the thing every experiment needs and nobody has)
2. The financial infrastructure (bounties, payouts, platform fee)
3. Optional quality layer (BIOME Verified credential)
The Two Flows (Critical — Read This)
Flow 1: Platform Flow (core product)
Experimenter has a ready experiment → Posts bounty on BIOME → Sets reward per participant → Participants discover & sign up → Experimenter gets their cohort → BIOME takes 2.5% platform fee
Flow 2: Verification Flow (add-on service)
Experimenter wants credibility → Pays for BIOME Verified credential → BIOME vets experiment design, safety, compliance → Experiment gets the ✓ BIOME VERIFIED badge → Higher trust = more participants sign up → Separate fee (standardized pricing, ~$1K)
What the badge means for users:
* BIOME VERIFIED ✓ — Experiment vetted end-to-end by BIOME. Safe to participate.
* No badge — Listed on platform but not vetted. Participate at your own discretion.
* Future tiers: Institutional badge (for universities, pharma)
Tech Stack
* Framework: Next.js 14+ (App Router)
* Database + Auth: Supabase (Postgres, RLS, auth)
* Auth provider: Privy (email + wallet login, Web2 + Web3)
* Styling: Tailwind CSS (with custom BIOME design tokens)
* Deployment: Netlify
* Language: TypeScript (strict)
* Payments: Crypto-first via wallet, fiat option later
Visual Identity
Terminal/hacker aesthetic inherited from existing site (biome.to).
Design Tokens (from existing CSS)
--bg: #070c07          (near-black green-tinted) --bg2: #0b120b         (card backgrounds) --bg3: #101a10         (hover states) --green: #4dff80       (primary accent — phosphor green) --green-dim: #1f8c3b   (muted green) --cyan: #00e5ff        (secondary accent) --amber: #ffb300       (waitlist/pending states) --text: #c0d4c4        (body text) --text-dim: #4a6050    (muted text) --text-bright: #e4f0e8 (emphasized text) --text-white: #f2faf4  (headings)
Typography
* Headings: Syne (800 weight, tight letter-spacing)
* Monospace: JetBrains Mono (labels, IDs, status badges, code-feel elements)
* Body: Syne at lower weights for descriptions
Signature Elements (keep from existing site)
* Scan-line overlay (CSS body::after)
* Grid pattern background (CSS body::before)
* Animated ticker bar
* Study cards with top-border reveal on hover
* Blinking dot on status badges
* // SECTION_LABEL prefix pattern
* Isometric SVG hero art with floating labels
* Corner bracket decorations on SVG scenes
UX Architecture (CoinGecko Model)
Homepage = Dashboard
When you land on biome.to, you should immediately see:
1. Compact hero (not full-screen) — one-liner + key platform stats
2. Experiment table (the main event) — CoinGecko-style rows:
   * Experiment name + category tag
   * BIOME VERIFIED badge (or empty)
   * Bounty per participant (reward amount)
   * Total bounty pool
   * Slots (filled/total)
   * Status (Recruiting / Active / Completed)
   * Region / Remote tag
   * Click → deep-dive page
3. Ticker bar with live stats
4. Minimal footer
Experiment Detail Page (click-through from table)
* Full experiment description
* Bounty details + reward breakdown
* Eligibility criteria (if any)
* "Sign Up" button (auth required)
* Comments section (simple, threaded)
* Experimenter profile card
* BIOME VERIFIED badge (if applicable)
* Updates posted by experimenter
Post a Bounty (for experimenters)
* NOT a long intake form
* Streamlined: Title, description, category, reward per participant, total budget, slots, duration, region, eligibility criteria (optional)
* Payment: deposit bounty pool upfront
* Optional: Apply for BIOME Verification ($1K add-on)
Participant Profile
* Email or wallet-linked
* Participation history (experiments completed = credentials)
* Earnings total
* Region
Experimenter Profile
* Organization/brand info
* Experiments posted
* BIOME Verified count
* Participant satisfaction metrics (future)
Database Schema (Supabase/Postgres)
Core Tables
* profiles — id (FK auth.users), auth_type ('email'|'wallet'), wallet_address, display_name, bio, role ('experimenter'|'participant'|'both'), region, avatar_url, created_at
* experiments — id, experimenter_id FK, title, description, category, status enum, bounty_per_participant (USD), total_bounty_pool, slots_total, slots_filled, duration_weeks, region, is_remote, is_verified (boolean), verification_level ('none'|'biome'|'institutional'), external_comms_url (Discord/Telegram link), created_at, updated_at
* applications — id, experiment_id FK, participant_id FK, status enum, applied_at, approved_at, completed_at, payout_status
* comments — id, experiment_id FK, author_id FK, content, parent_id FK (nullable), created_at
* experiment_updates — id, experiment_id FK, author_id FK, title, content, created_at
Key Enums
* experiment_status: 'draft', 'recruiting', 'active', 'completed', 'cancelled'
* application_status: 'applied', 'approved', 'rejected', 'completed', 'withdrawn'
* payout_status: 'pending', 'paid', 'failed'
* verification_level: 'none', 'biome', 'institutional'
Row Level Security
* Experiments: publicly readable (this is the dashboard), only experimenter can edit own
* Applications: participant sees own, experimenter sees applications to their experiments
* Comments: all authenticated users can read/write
* Profiles: public read, self-edit only
Build Order (MVP Phases)
Phase 1: Foundation
* Supabase project + schema migration
* Privy auth integration (email + wallet)
* Profile creation on first login (role selection)
* Basic layout with BIOME design system (port existing CSS)
Phase 2: The Dashboard (this IS the product)
* Homepage = CoinGecko-style experiment table
* Sortable columns: bounty, slots, status, date
* Filter by: category, status, verified-only, region
* Search bar
* Compact hero with platform stats above the table
Phase 3: Experiment Detail Page
* Full experiment view on click-through
* Bounty breakdown, eligibility, description
* "Sign Up" flow for participants
* BIOME VERIFIED badge display
* Experimenter profile card
Phase 4: Post a Bounty
* Streamlined experiment creation form
* Budget deposit flow (placeholder for now — manual/crypto)
* Category selection
* Optional eligibility criteria
* Preview before publish
Phase 5: Comments + Updates
* Simple threaded comments on experiment pages
* Experimenter can post updates
* Upvote on comments
Phase 6: Participant Dashboard
* My experiments (applied, active, completed)
* Earnings history
* Participation credentials
Phase 7: Polish + Deploy
* Landing page refinement (compact hero)
* Mobile responsive
* SEO meta tags
* Deploy to Netlify
Growth Strategy Context (from sprint call)
* Approach top 10 DeSci projects (VitaDAO, Cerebrum DAO, etc.) to post simple digital experiments
* Platform fee = 0% during launch phase to onboard initial supply
* Universities as participant funnel (students)
* Each experiment gets a visual report → becomes marketing content
* Existing DeSci communities (Biohackers DAO, etc.) as early participant pool
Coding Standards
* TypeScript strict mode, no any
* Supabase client via @supabase/ssr for Next.js
* Server components by default
* All forms validated with zod
* Mobile responsive from day one
* RLS policies on every table — never trust client
* Error + loading states on all async operations
Out of Scope (MVP)
* Automated payments / smart contracts
* Real-time chat between experimenter and participants
* Mobile native app
* Email notifications (in-app only)
* Admin panel
* Prediction markets on experiment outcomes (future feature)
* Token/loyalty points system (future feature)
* Eligibility auto-screening quiz (keep manual for now — experimenter reviews)
Founder Context
Built by Kishore  Non-coder using Claude Code. Keep explanations practical, explain before executing, build incrementally.
