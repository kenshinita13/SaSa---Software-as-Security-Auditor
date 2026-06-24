# SaSa — Software as Security Auditor
## Implementation Plan (v2 — Full OWASP Top 10 + Resolved Architecture)

A full-stack, multi-language SaaS security scanner that audits web applications against the **complete OWASP Top 10 (2021)** and generates white-labeled PDF compliance reports for client delivery.

---

## 📖 Table of Contents

1. [How SaSa Works](#how-sasa-works)
2. [What You Need (Prerequisites)](#what-you-need-prerequisites)
3. [Installation Guide](#installation-guide)
4. [How to Navigate the Dashboard](#how-to-navigate-the-dashboard)
5. [How to Run Your First Scan](#how-to-run-your-first-scan)
6. [Architecture Decisions](#architecture-decisions-resolved)
7. [Full Tech Stack](#full-tech-stack)
8. [System Architecture Overview](#system-architecture-overview)
9. [Complete OWASP Top 10 Coverage](#complete-owasp-top-10-2021-coverage)
10. [Project Structure](#proposed-project-structure)
11. [Build Sequence](#build-sequence-10-phases)
12. [Testing Pyramid](#testing-pyramid)
13. [Verification Plan](#verification-plan)

---

## 💡 How SaSa Works

SaSa is an automated security auditing platform. You give it a web application URL — it does the rest.

```
👤 You (Agency/Engineer)
     │
     │  1. Log in to the SaSa Dashboard
     │  2. Paste a target URL (e.g., https://client-app.com)
     │  3. Click "Start Scan"
     ▼
┌─────────────────────────────────────────────────────┐
│                  SaSa Backend                       │
│                                                     │
│  ① Records scan → Status: PENDING                  │
│  ② Fires 4 parallel scan engines simultaneously:   │
│                                                     │
│     🔌 Worker A — checks CORS, open ports, SQLi    │
│     📡 Worker B — checks HTTP headers & cookies    │
│     📦 Worker C — crawls JS bundles for secrets    │
│     🐍 Python Engine — deep OWASP A01–A10 probes   │
│                                                     │
│  ③ Aggregates all findings                         │
│  ④ Maps every issue to an OWASP Top 10 category    │
│  ⑤ Calculates a Security Score (0–100)             │
│  ⑥ Updates scan → Status: COMPLETED               │
└─────────────────────────────────────────────────────┘
     │
     ▼
📊 Dashboard updates in real-time — you see results instantly
📄 Download a white-labeled PDF report to hand to your client
```

**In plain English:** SaSa acts like a security inspector that visits a website, tries dozens of known attack techniques, records everything it finds, grades the site from 0–100, and produces a professional PDF report — all in under 60 seconds.

---

## ✅ What You Need (Prerequisites)

Before installing SaSa, make sure the following are installed on your machine:

### Required Software

| Tool | Version | Purpose | Install Link |
|---|---|---|---|
| **Node.js** | v20 LTS or higher | Backend API + Next.js frontend | [nodejs.org](https://nodejs.org) |
| **npm** | v10+ (comes with Node.js) | Node package manager | Bundled with Node.js |
| **Python** | 3.11 or higher | Security scanner engine | [python.org](https://python.org) |
| **pip** | Latest (comes with Python) | Python package manager | Bundled with Python |
| **PostgreSQL** | 15 or higher | Database | [postgresql.org](https://postgresql.org) |
| **Git** | Any recent version | Clone the repository | [git-scm.com](https://git-scm.com) |
| **Google Chrome** | Latest stable | Puppeteer PDF rendering | [chrome.google.com](https://chrome.google.com) |

### Optional (for AWS cloud deployment)

| Tool | Purpose |
|---|---|
| **AWS CLI v2** | Deploying to ECS Fargate |
| **Docker Desktop** | Local container testing before deploy |
| **Terraform** | Infrastructure-as-code for AWS setup |

### Verify Your Setup

Run these commands in your terminal to confirm everything is installed:

```bash
node --version        # Should print v20.x.x or higher
npm --version         # Should print 10.x.x or higher
python --version      # Should print Python 3.11.x or higher
pip --version         # Should print pip 24.x or higher
psql --version        # Should print psql (PostgreSQL) 15.x or higher
git --version         # Should print git version 2.x.x
```

> [!CAUTION]
> Do **not** use Python 3.9 or below — the `match` statement syntax used in `owasp_mapper.py` requires Python 3.10+. Always use 3.11+ for stability.

---

## 🚀 Installation Guide

### Step 1 — Clone the Repository

```bash
git clone https://github.com/your-org/sasa.git
cd sasa
```

### Step 2 — Set Up the Database

```bash
# Open PostgreSQL and create the database
psql -U postgres
```

```sql
CREATE DATABASE sasa_db;
\q
```

```bash
# Run the schema script
psql -U postgres -d sasa_db -f backend/src/db/schema.sql
```

You should see:
```
CREATE TABLE  (agencies)
CREATE TABLE  (scans)
CREATE INDEX
✅ Schema ready
```

### Step 3 — Configure Environment Variables

Create a `.env` file in the `backend/` folder:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your values:

```env
# Database
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/sasa_db

# Auth
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Server
PORT=4000
NODE_ENV=development

# Python Engine
PYTHON_ENGINE_PATH=../python-engine/main.py
```

### Step 4 — Install Backend Dependencies (Node.js)

```bash
cd backend
npm install
```

### Step 5 — Install Python Engine Dependencies

```bash
cd ../python-engine
pip install -r requirements.txt
```

Expected output:
```
Successfully installed requests-2.31.0 python-nmap-0.7.1
scapy-2.5.0 beautifulsoup4-4.12.0 pytest-8.0.0 bandit-1.7.8 ...
```

### Step 6 — Install Frontend Dependencies (Next.js)

```bash
cd ../frontend
npm install
```

### Step 7 — Start All Services

Open **3 terminal windows** and run each in its own tab:

**Terminal 1 — Backend API:**
```bash
cd backend
npm run dev
# ✅ Server running on http://localhost:4000
```

**Terminal 2 — Python Engine (on-demand via API, but test it directly):**
```bash
cd python-engine
python main.py --url https://example.com --test
# ✅ Python engine responding
```

**Terminal 3 — Frontend Dashboard:**
```bash
cd frontend
npm run dev
# ✅ Dashboard running on http://localhost:3000
```

### Step 8 — Open SaSa

Navigate to **[http://localhost:3000](http://localhost:3000)** in your browser.

> [!NOTE]
> The first time you open SaSa, you will be directed to the **Agency Setup Wizard** to create your first agency account and choose your auth method (JWT or API Key).

---

## 🧭 How to Navigate the Dashboard

```
📌 Sidebar Navigation
├── 🏠 Dashboard          → Overview: recent scans, score trends, quick stats
├── ➕ New Scan            → Paste a target URL and launch a scan
├── 📋 Scan History       → All past scans with status and scores
├── 📄 Reports            → Download white-label PDF reports
├── 🔑 API Keys           → Generate and manage API keys for CI/CD
├── ⚙️ Agency Settings    → Brand colors, logo upload, company name
└── 👤 Account            → Auth method, password, logout
```

### Page-by-Page Breakdown

#### 🏠 Dashboard (Home)
- Shows your **last 5 scans** with color-coded score rings
- Displays **aggregate vulnerability stats** across all scans
- Quick-launch button: **"Scan a New URL"**

#### ➕ New Scan
- Single input field: paste the target URL
- Click **"Start Scan"** → page transitions to a live progress view
- You see each worker's status update in real-time:
  - `Worker A: ✅ Complete`
  - `Worker B: ⏳ Running...`
  - `Python Engine: ✅ Complete`

#### 📋 Scan History
- Table of all scans: URL, date, score, status badge (`PENDING / RUNNING / COMPLETED / FAILED`)
- Click any row → opens the full detailed result view
- Filter by score range, date, or OWASP category

#### 📄 Reports
- Lists all completed scans eligible for PDF export
- Click **"Generate PDF"** → Puppeteer renders the white-labeled report in seconds
- Your agency **logo, brand colors, and company name** are automatically embedded

#### 🔑 API Keys
- Generate keys for CI/CD pipelines: `sk_sasa_live_xxxxxxxx`
- Revoke keys at any time
- Each key shows last-used timestamp

#### ⚙️ Agency Settings
- Upload your white-label logo (PNG/SVG)
- Set brand hex color (used in the PDF score ring and report header)
- Update company name printed on reports

---

## 🔍 How to Run Your First Scan

1. **Log in** to [http://localhost:3000](http://localhost:3000)
2. Click **"New Scan"** in the sidebar
3. Enter a target URL: `https://target-client.com`
4. Click **"Start Scan"**
5. Watch the **live progress tracker** as workers run in parallel
6. When status shows `COMPLETED`, click **"View Results"**
7. Review the:
   - 🔴/🟡/🟢 **Security Score ring** (0–100)
   - **OWASP findings table** — all 10 categories listed
   - **Detailed vulnerability log** — exact paths, headers, and payloads flagged
8. Click **"Download PDF Report"** to generate a client-ready white-labeled document

### Running a Scan via API (CI/CD)

```bash
curl -X POST https://your-sasa-domain.com/api/v1/scans \
  -H "Authorization: Bearer sk_sasa_live_yourkey" \
  -H "Content-Type: application/json" \
  -d '{"target_url": "https://client-site.com"}'

# Response:
# { "scan_id": "uuid-here", "status": "PENDING" }
```

```bash
# Poll for result (or use webhook in future versions)
curl https://your-sasa-domain.com/api/v1/scans/uuid-here \
  -H "Authorization: Bearer sk_sasa_live_yourkey"

# Response when done:
# { "status": "COMPLETED", "safety_score": 74, "raw_results": {...} }
```

---

## ✅ Architecture Decisions (Resolved)

### Q1 — Auth Layer: **JWT + API Key Hybrid**

> [!IMPORTANT]
> **Decision**: Implement **both** — agencies choose which they use from the dashboard.

| Mode | Use Case | How It Works |
|---|---|---|
| 🔐 **JWT** | Human login via SaSa dashboard | Short-lived access token (15min) + refresh token (7d). Stored in HttpOnly cookie. |
| 🗝️ **API Key** | Programmatic / CI-CD access | Long-lived hashed key stored in DB. Passed as `Authorization: Bearer sk_sasa_...` header. |
| 🌐 **OAuth 2.0** | *(Future phase)* | Reserved for third-party SSO integrations (Google Workspace, GitHub). Not in v1. |

- Agency dashboard shows a **"Choose Auth Method"** screen on first login setup
- Both JWT and API Key flow through the same middleware chain
- All keys are hashed with `bcrypt` before storage — plaintext never persists

---

### Q2 — Deployment Target: **AWS ECS Fargate + Private VPC + WAF**

> [!IMPORTANT]
> **Recommended**: AWS ECS Fargate inside a locked-down Private VPC — the gold standard for enterprise security tooling.

**Why this is the strongest choice for a security auditor:**

| Layer | Component | Security Benefit |
|---|---|---|
| **Compute** | ECS Fargate (serverless containers) | No exposed EC2 instances to attack. No SSH surface. |
| **Network** | Private VPC + Private Subnets | SaSa API never has a public IP. Only reachable via WAF. |
| **Edge Protection** | AWS WAF + CloudFront | Blocks SQLi, XSS, rate limiting, geo-restrictions on the scanner itself. |
| **Database** | RDS PostgreSQL (private subnet) | Zero public internet exposure. VPC-internal only. |
| **Secrets** | AWS Secrets Manager | API keys, DB creds never in `.env` files or code. |
| **Admin Access** | AWS Systems Manager (SSM) | No bastion host, no open port 22. Shell access only via SSM Session Manager. |
| **Logs** | CloudWatch + CloudTrail | Full audit trail of every scan and API call. |
| **Scanning Isolation** | Each scan runs in an ephemeral Fargate task | Malicious target URLs cannot affect the main API container. |

```
Internet → CloudFront → WAF → ALB (public subnet)
                                  ↓
                          ECS Fargate API (private subnet)
                                  ↓
                   ┌──────────────┼──────────────┐
                   ↓              ↓               ↓
           Fargate Worker   Python Engine    RDS PostgreSQL
           (private subnet) (private subnet) (private subnet)
```

> [!NOTE]
> Estimated monthly cost at launch: ~$80–$150/month (Fargate + RDS t3.medium). Scales automatically without re-architecture.

---

### Q3 — Frontend Framework: **Next.js (App Router)**

> [!IMPORTANT]
> **Recommended**: Next.js — enterprise-proven, TypeScript-native, and the least likely to break.

**Why Next.js over alternatives:**

| Framework | Verdict | Reason |
|---|---|---|
| ✅ **Next.js** | **Recommended** | SSR + SSG, built-in API routes, TypeScript first-class, massive ecosystem, stable release cycle |
| React + Vite | Good alternative | Lighter but needs manual routing, auth, and SSR setup — more to maintain |
| SvelteKit | Lightweight | Smaller ecosystem, fewer enterprise UI libraries, riskier long-term |
| Plain HTML/JS | ❌ Not viable | Cannot scale for real-time scan status, charts, and auth flows |

**Next.js gives SaSa:**
- Real-time scan status via **Server-Sent Events** or **WebSocket** without a separate server
- Built-in **API routes** that can proxy to the Node.js backend (no CORS config needed in dev)
- **shadcn/ui** component library — enterprise-grade UI with zero design effort
- TypeScript shared types between frontend and backend

---

### Q4 — Tenancy: **Single-Tenant Now, Multi-Tenant Ready**

> [!NOTE]
> **Decision**: Launch as single-tenant. But the database schema is designed **multi-tenant from day one** so no painful migration later.

**Growth Path:**

```
Phase 1 (Now):     Single agency → one row in agencies table
Phase 2 (3–6mo):   Row-Level Security (RLS) in PostgreSQL → isolate per agency_id
Phase 3 (6–12mo):  Schema-per-tenant → full data isolation for enterprise clients
Phase 4 (12mo+):   Database-per-tenant → maximum isolation for regulated industries (HIPAA, SOC2)
```

**Single-tenant launch benefits:**
- Simpler auth (no tenant resolution middleware)
- Faster to build and ship
- agency_id FK exists in schema from day 1 — no breaking changes to upgrade

**Future multi-tenant ideas to explore:**
- Invite-based agency onboarding flow
- Per-agency white-label subdomain (`acme.sasa.io`)
- Tiered scan quotas (Free: 5 scans/mo, Pro: unlimited)
- Agency sub-users with role-based access (Admin, Auditor, Read-Only)

---

## Full Tech Stack

| Layer | Language / Tool | Purpose |
|---|---|---|
| **API Gateway** | Node.js + TypeScript + Express | REST routes, async dispatch, scan lifecycle |
| **Workers (A/B/C)** | Node.js + TypeScript | Header scan, bundle crawl, CORS probe |
| **Security Test Engine** | Python 3.11+ | Deep port probing, payload fuzzing, CVE checks, SSRF, SRI |
| **Frontend** | Next.js (App Router) + TypeScript | Agency dashboard, real-time scan status, results viewer |
| **UI Components** | shadcn/ui + Tailwind CSS | Enterprise-grade dashboard components |
| **Auth** | JWT (HttpOnly cookie) + API Key | Dual-mode agency authentication |
| **Database** | PostgreSQL + JSONB | Multi-tenant-ready scan storage |
| **PDF Engine** | Puppeteer (Node.js) | Headless white-label report compiler |
| **Deployment** | AWS ECS Fargate + VPC + WAF | Enterprise-grade isolated cloud infrastructure |
| **Test Framework** | pytest + Jest | Python security tests + Node.js unit tests |
| **SAST** | Bandit (Python) + ESLint | Static analysis on SaSa's own codebase |

---

## System Architecture Overview

```mermaid
flowchart TD
    A[🌐 Next.js Dashboard] -->|POST /api/v1/scans| B[Node.js API Gateway]
    B -->|Insert PENDING record| C[(RDS PostgreSQL — Private Subnet)]
    B -->|202 Accepted + scan_id| A
    B --> D[Async Dispatch]

    D --> E[Worker A: CORS + Header Network]
    D --> F[Worker B: Header Interceptor]
    D --> G[Worker C: Bundle Crawler]
    D --> PY[🐍 Python Security Engine]

    E --> H[Payload Aggregator]
    F --> H
    G --> H
    PY --> H

    H --> I[OWASP Risk Classifier — All 10]
    I --> J[Score Calculator]
    J --> K[(Update DB: COMPLETED)]

    K --> L[Dev Portal: Detailed Log]
    K --> M[Puppeteer PDF Engine]
    M --> N[📄 White-Label SaSa Report]
```

---

## Complete OWASP Top 10 (2021) Coverage

| # | Category | Scanner | Tool | Test File |
|---|---|---|---|---|
| **A01** | Broken Access Control | CORS wildcard probe, unauth route access | `requests` | `test_owasp_a01.py` |
| **A02** | Cryptographic Failures | TLS 1.0/1.1 detection, plain-text cookies, HSTS | `ssl` + `socket` | `test_owasp_a02.py` |
| **A03** | Injection (XSS / SQLi) | SQLi payload fuzzer, `dangerouslySetInnerHTML` detection | `requests` + regex | `test_owasp_a03.py` |
| **A04** | Insecure Design | Probe `/admin`, `/internal`, `/api/users` unauth access | `requests` + wordlist | `test_owasp_a04.py` |
| **A05** | Security Misconfiguration | Open DB ports, missing CSP/X-Frame/HSTS headers | `python-nmap` + `Axios` | `test_owasp_a05.py` |
| **A06** | Vulnerable & Outdated Components | Parse `package.json`, check versions vs OSV / CVE database | `requests` + `packaging` | `test_owasp_a06.py` |
| **A07** | Auth & Session Failures | Missing `HttpOnly`, `Secure`, `SameSite` cookie flags | `Axios` header parse | `test_owasp_a07.py` |
| **A08** | Software & Data Integrity Failures | Missing SRI (`integrity=`) on CDN scripts and stylesheets | `BeautifulSoup4` + `hashlib` | `test_owasp_a08.py` |
| **A09** | Security Logging & Monitoring Failures | Send malformed requests, detect raw stack trace / DB error leaks | `requests` + body pattern match | `test_owasp_a09.py` |
| **A10** | Server-Side Request Forgery (SSRF) | Inject cloud metadata URLs (`169.254.169.254`), internal service probes | `httpx` + timing analysis | `test_owasp_a10.py` |

---

## Proposed Project Structure

```
sasa/
├── backend/                                   # Node.js API & Workers
│   ├── src/
│   │   ├── routes/
│   │   │   └── scans.ts                       # POST /api/v1/scans
│   │   ├── middleware/
│   │   │   ├── jwtAuth.ts                     # JWT verification middleware
│   │   │   └── apiKeyAuth.ts                  # API Key verification middleware
│   │   ├── workers/
│   │   │   ├── workerA-network.ts             # CORS + HTTP-level probes
│   │   │   ├── workerB-headers.ts             # Header + cookie scanner
│   │   │   └── workerC-bundle.ts              # JS bundle scraper
│   │   ├── services/
│   │   │   ├── owaspClassifier.ts             # Maps findings → OWASP (all 10)
│   │   │   ├── scoreCalculator.ts             # Risk score 0–100
│   │   │   └── pythonBridge.ts                # Spawns Python engine
│   │   ├── pdf/
│   │   │   └── puppeteerRenderer.ts           # PDF engine
│   │   ├── db/
│   │   │   └── schema.sql                     # PostgreSQL schema (multi-tenant ready)
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
│
├── python-engine/                             # 🐍 Python Security Test Engine
│   ├── scanners/
│   │   ├── port_scanner.py                    # A05: python-nmap (5432, 27017, 3306)
│   │   ├── sqli_fuzzer.py                     # A03: SQLi payload dispatcher
│   │   ├── tls_checker.py                     # A02: TLS 1.0/1.1 detection
│   │   ├── secret_hunter.py                   # A02/A04: Stripe, Supabase JWT regex
│   │   ├── route_prober.py                    # A04: Insecure design route wordlist probe
│   │   ├── component_checker.py               # A06: package.json CVE lookup (OSV API)
│   │   ├── sri_checker.py                     # A08: SRI integrity attribute scanner
│   │   ├── error_leak_detector.py             # A09: Stack trace / DB error leak probe
│   │   └── ssrf_prober.py                     # A10: SSRF metadata URL injection
│   ├── classifiers/
│   │   └── owasp_mapper.py                    # Maps all findings → OWASP categories
│   ├── main.py                                # CLI entrypoint (called by pythonBridge.ts)
│   ├── requirements.txt
│   └── pyproject.toml
│
├── tests/                                     # All test suites
│   ├── unit/
│   │   ├── python/
│   │   │   ├── test_port_scanner.py
│   │   │   ├── test_sqli_fuzzer.py
│   │   │   ├── test_tls_checker.py
│   │   │   ├── test_secret_hunter.py
│   │   │   ├── test_route_prober.py
│   │   │   ├── test_component_checker.py
│   │   │   ├── test_sri_checker.py
│   │   │   ├── test_error_leak_detector.py
│   │   │   └── test_ssrf_prober.py
│   │   └── node/
│   │       ├── owaspClassifier.test.ts
│   │       └── scoreCalculator.test.ts
│   ├── integration/
│   │   ├── test_api_gateway.py
│   │   └── test_worker_pipeline.py
│   └── security/                              # Full OWASP Top 10 assertion suite
│       ├── test_owasp_a01.py                  # Broken Access Control
│       ├── test_owasp_a02.py                  # Cryptographic Failures
│       ├── test_owasp_a03.py                  # Injection
│       ├── test_owasp_a04.py                  # Insecure Design
│       ├── test_owasp_a05.py                  # Security Misconfiguration
│       ├── test_owasp_a06.py                  # Vulnerable Components
│       ├── test_owasp_a07.py                  # Auth Failures
│       ├── test_owasp_a08.py                  # Data Integrity Failures
│       ├── test_owasp_a09.py                  # Logging & Monitoring Failures
│       └── test_owasp_a10.py                  # SSRF
│
├── frontend/                                  # Next.js Dashboard
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx                 # JWT / API Key auth selector
│   │   │   └── setup/page.tsx                 # Agency first-time setup
│   │   ├── dashboard/
│   │   │   ├── page.tsx                       # Scan history + new scan trigger
│   │   │   └── [scanId]/page.tsx              # Real-time scan result viewer
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ScoreRing.tsx                      # 🟢🟡🔴 Animated risk score ring
│   │   ├── OWASPTable.tsx                     # All 10 OWASP findings table
│   │   └── AuthSelector.tsx                   # JWT vs API Key choice UI
│   ├── package.json
│   └── tsconfig.json
│
└── pdf-template/
    └── report-template.html                   # White-label SaSa PDF layout
```

---

## Build Sequence (10 Phases)

| Phase | Description |
|---|---|
| **1** | PostgreSQL schema (multi-tenant-ready, single-tenant launch) |
| **2** | JWT + API Key auth middleware + AuthSelector UI |
| **3** | API Gateway: `POST /api/v1/scans` + Zod validation + 202 dispatch |
| **4** | Worker A: CORS, HTTP-level SQLi, pre-flight OPTIONS |
| **5** | Worker B: Header + cookie flag scanner |
| **6** | Worker C: JS bundle crawler + Stripe/Supabase regex |
| **7** | Python Engine: All 8 scanners (A02–A10) + `owasp_mapper.py` |
| **8** | OWASP Classifier + Score Calculator (all 10 categories) |
| **9** | Puppeteer PDF Engine + white-label template |
| **10** | Next.js Dashboard: real-time scan status, OWASP table, score ring |

---

## Python Dependencies (`requirements.txt`)

```text
requests>=2.31.0
httpx>=0.27.0
python-nmap>=0.7.1
scapy>=2.5.0
beautifulsoup4>=4.12.0
packaging>=24.0
pytest>=8.0.0
pytest-asyncio>=0.23.0
pytest-cov>=5.0.0
bandit>=1.7.8
```

---

## Testing Pyramid

```mermaid
graph TD
    A["🔺 Security Tests — Full OWASP A01–A10<br/>pytest tests/security/"] --> B
    B["🔷 Integration Tests — API + Full Pipeline<br/>pytest tests/integration/"] --> C
    C["🟩 Unit Tests — All Python Scanners + Node Services<br/>pytest tests/unit/python/ + jest tests/unit/node/"]
```

| Suite | Command | Coverage Goal |
|---|---|---|
| Python Unit | `pytest tests/unit/python/ -v --cov=python-engine` | >90% per scanner |
| Node Unit | `npx jest tests/unit/node/` | >85% per service |
| Integration | `pytest tests/integration/ -v` | All pipeline stages pass |
| OWASP Security | `pytest tests/security/ -v` | All 10 categories asserted |
| SAST (Bandit) | `bandit -r python-engine/ -ll` | Zero HIGH severity findings |

---

## Verification Plan

### Automated
```bash
# Full Python test suite
pytest tests/ -v --cov=python-engine --cov-report=term-missing

# Node.js unit tests
npx jest tests/unit/node/ --coverage

# SAST — SaSa's own code must be clean
bandit -r python-engine/ -ll
```

### CI/CD Gate (AWS CodePipeline / GitHub Actions)
- All `pytest` + `jest` suites run on every PR
- `bandit` HIGH severity → hard block on merge
- Coverage drop below 85% → hard block on merge
- Fargate deployment only triggers after all gates pass

### Manual
- Submit a deliberately misconfigured local server as target URL
- Verify `scans` table: `PENDING → RUNNING → COMPLETED`
- Confirm all 10 OWASP rows populated in results JSON
- Download and verify white-labeled SaSa PDF
