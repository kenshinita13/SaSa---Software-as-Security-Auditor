const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// In-memory scan store
const scans = new Map();

// WORKER A - CORS wildcard + HTTP SQLi probe (A01, A03)
async function runWorkerA(url) {
  const findings = [];

  // 1. CORS probe (A01)
  try {
    const res = await axios.options(url, {
      headers: { Origin: 'https://malicious-origin.com' },
      validateStatus: () => true,
      timeout: 8000,
    });
    const acao = res.headers['access-control-allow-origin'];
    if (acao === '*' || acao === 'https://malicious-origin.com') {
      findings.push({
        category: 'A01',
        title: 'Permissive CORS Policy',
        description: 'The endpoint reflects or allows any cross-origin request. Attackers can read authenticated responses from a malicious site.',
        evidence: `Access-Control-Allow-Origin: ${acao}`,
      });
    }
    // Also check ACAC header
    const acac = res.headers['access-control-allow-credentials'];
    if (acao === '*' && acac === 'true') {
      findings.push({
        category: 'A01',
        title: 'CORS Wildcard with Credentials Allowed',
        description: 'The combination of Access-Control-Allow-Origin: * and Access-Control-Allow-Credentials: true is a critical misconfiguration.',
        evidence: `ACAO: ${acao} / ACAC: ${acac}`,
      });
    }
  } catch (_) {}

  // 2. SQLi payloads (A03)
  const sqliPayloads = ["' OR '1'='1", "' OR 1=1 --", "1; DROP TABLE users--", "' UNION SELECT NULL--"];
  for (const payload of sqliPayloads) {
    try {
      const parsedUrl = new URL(url);
      parsedUrl.searchParams.set('id', payload);
      parsedUrl.searchParams.set('q', payload);
      const res = await axios.get(parsedUrl.toString(), {
        validateStatus: () => true,
        timeout: 8000,
      });
      const body = typeof res.data === 'string' ? res.data.toLowerCase() : JSON.stringify(res.data).toLowerCase();
      const sqlErrors = ['syntax error', 'sql syntax', 'mysql_fetch', 'pg_query', 'sqlite_', 'unclosed quotation', 'ora-', 'microsoft ole db'];
      if (sqlErrors.some(e => body.includes(e))) {
        findings.push({
          category: 'A03',
          title: 'SQL Injection Detected',
          description: 'The application returned a database error when injected with a SQL payload, indicating unsanitised query parameters.',
          evidence: `Payload: ${payload}\nError found in response body`,
        });
        break;
      }
    } catch (_) {}
  }

  return findings;
}

// WORKER B - Security headers + Cookie flags (A02, A05, A07)
async function runWorkerB(url) {
  const findings = [];
  try {
    const res = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SaSa-Scanner/1.0)' },
      validateStatus: () => true,
      timeout: 10000,
    });
    const headers = res.headers;

    // A05 - Security headers
    if (!headers['content-security-policy']) {
      findings.push({ category: 'A05', title: 'Missing Content-Security-Policy', description: 'No CSP header found. The application is vulnerable to XSS and data injection attacks.', evidence: 'Header absent from HTTP response' });
    }
    if (!headers['x-frame-options'] && !headers['content-security-policy']?.includes('frame-ancestors')) {
      findings.push({ category: 'A05', title: 'Missing X-Frame-Options (Clickjacking)', description: 'Without X-Frame-Options or CSP frame-ancestors, attackers can embed this page in an iframe to trick users.', evidence: 'X-Frame-Options header absent' });
    }
    if (!headers['x-content-type-options']) {
      findings.push({ category: 'A05', title: 'Missing X-Content-Type-Options', description: 'Without nosniff, browsers may MIME-sniff responses as executable scripts.', evidence: 'X-Content-Type-Options header absent' });
    }
    if (!headers['referrer-policy']) {
      findings.push({ category: 'A05', title: 'Missing Referrer-Policy', description: 'Sensitive URL information may leak to third parties via the Referer header.', evidence: 'Referrer-Policy header absent' });
    }
    if (!headers['permissions-policy'] && !headers['feature-policy']) {
      findings.push({ category: 'A05', title: 'Missing Permissions-Policy', description: 'Browser features (camera, microphone, geolocation) are not restricted.', evidence: 'Permissions-Policy header absent' });
    }

    // A02 - TLS / HSTS
    if (url.startsWith('https') && !headers['strict-transport-security']) {
      findings.push({ category: 'A02', title: 'Missing Strict-Transport-Security (HSTS)', description: 'Without HSTS, browsers may connect over HTTP, enabling SSL-stripping attacks.', evidence: 'Strict-Transport-Security header absent on HTTPS endpoint' });
    }

    // Server header leaking version info (A05)
    const server = headers['server'];
    if (server && /\d/.test(server)) {
      findings.push({ category: 'A05', title: 'Server Version Disclosure', description: `The Server header exposes the web server software and version, aiding fingerprinting.`, evidence: `Server: ${server}` });
    }
    const xPowered = headers['x-powered-by'];
    if (xPowered) {
      findings.push({ category: 'A05', title: 'Technology Fingerprinting via X-Powered-By', description: 'The X-Powered-By header reveals backend technology stack to attackers.', evidence: `X-Powered-By: ${xPowered}` });
    }

    // A07 - Cookie flags
    const rawCookies = headers['set-cookie'];
    if (rawCookies) {
      const cookieArray = Array.isArray(rawCookies) ? rawCookies : [rawCookies];
      for (const cookie of cookieArray) {
        const c = cookie.toLowerCase();
        // Only flag cookies that look like session tokens
        const isSession = /sess|auth|token|jwt|user|id/.test(c);
        if (!c.includes('httponly')) {
          findings.push({ category: 'A07', title: 'Missing HttpOnly Flag on Cookie', description: 'Cookie accessible via JavaScript. XSS attacks can steal it.', evidence: cookie });
        }
        if (!c.includes('samesite')) {
          findings.push({ category: 'A07', title: 'Missing SameSite Flag on Cookie', description: 'Cookie sent on cross-site requests, enabling CSRF attacks.', evidence: cookie });
        }
        if (isSession && !c.includes('secure')) {
          findings.push({ category: 'A07', title: 'Session Cookie Missing Secure Flag', description: 'Session cookie can be transmitted over unencrypted HTTP.', evidence: cookie });
        }
      }
    }
  } catch (err) {
    console.error('[Worker B] Error:', err.message);
  }
  return findings;
}

// WORKER C - JS bundle secrets + SRI + XSS sinks (A02, A03, A08)
async function runWorkerC(url) {
  const findings = [];
  try {
    const res = await axios.get(url, { validateStatus: () => true, timeout: 10000 });
    const html = typeof res.data === 'string' ? res.data : '';

    // XSS sinks in HTML
    if (html.includes('document.write(') || html.includes('innerHTML =') || html.includes('.innerHTML=')) {
      findings.push({ category: 'A03', title: 'XSS Sink Detected (innerHTML/document.write)', description: 'Unsanitised DOM manipulation sinks detected in rendered HTML.', evidence: 'innerHTML or document.write found in page source' });
    }
    if (html.includes('eval(')) {
      findings.push({ category: 'A03', title: 'eval() Usage Detected', description: 'Usage of eval() with dynamic input is a high-risk XSS vector.', evidence: 'eval( found in page source' });
    }

    const $ = cheerio.load(html);

    // SRI check (A08)
    $('script[src], link[rel="stylesheet"]').each((_, el) => {
      const elSrc = $(el).attr('src') || $(el).attr('href') || '';
      const integrity = $(el).attr('integrity');
      if (elSrc && !elSrc.startsWith('/') && !elSrc.startsWith(new URL(url).origin) && !integrity) {
        // External resource without SRI
        findings.push({ category: 'A08', title: 'Missing Subresource Integrity (SRI)', description: 'An external script/stylesheet is loaded without an integrity hash. If the CDN is compromised, malicious code executes.', evidence: `<${el.name} src="${elSrc}">` });
      }
    });

    // Secret scanning in inline scripts (A02)
    const inlineScripts = [];
    $('script:not([src])').each((_, el) => { inlineScripts.push($(el).html() || ''); });
    const inlineContent = inlineScripts.join('\n');
    if (/sk_live_[a-zA-Z0-9]{20,}/.test(inlineContent)) {
      findings.push({ category: 'A02', title: 'Leaked Stripe Live Secret Key', description: 'A live Stripe secret key was found in client-side JavaScript.', evidence: 'sk_live_*** (truncated)' });
    }
    if (/sk_test_[a-zA-Z0-9]{20,}/.test(inlineContent)) {
      findings.push({ category: 'A02', title: 'Leaked Stripe Test Key', description: 'A Stripe test key was found in client-side JavaScript.', evidence: 'sk_test_*** (truncated)' });
    }
    if (/(?:api[_\-]?key|apikey|secret)['":\s]+['"][a-zA-Z0-9_\-]{16,}['"]/i.test(inlineContent)) {
      findings.push({ category: 'A02', title: 'Hardcoded API Key/Secret in Client Code', description: 'An API key or secret was found hardcoded in inline JavaScript.', evidence: 'Pattern: apikey/secret = "***"' });
    }

    // Fetch external scripts and scan them
    const scriptUrls = [];
    $('script[src]').each((_, el) => {
      const src = $(el).attr('src');
      if (src) {
        try {
          const abs = new URL(src, url).toString();
          if (new URL(abs).origin === new URL(url).origin) scriptUrls.push(abs);
        } catch (_) {}
      }
    });

    await Promise.allSettled(scriptUrls.slice(0, 5).map(async (scriptUrl) => {
      try {
        const r = await axios.get(scriptUrl, { timeout: 8000 });
        const text = typeof r.data === 'string' ? r.data : '';
        if (/sk_live_[a-zA-Z0-9]{20,}/.test(text)) {
          findings.push({ category: 'A02', title: 'Leaked Stripe Live Secret (in JS bundle)', description: 'A live Stripe secret key was found in a JavaScript bundle.', evidence: `Found in ${scriptUrl}` });
        }
        if (/(?:password|passwd|secret|apikey)['":\s=]+['"][^'"]{6,}['"]/i.test(text)) {
          findings.push({ category: 'A02', title: 'Hardcoded Credential in JS Bundle', description: 'A hardcoded credential was found in a JavaScript bundle.', evidence: `Found in ${scriptUrl}` });
        }
      } catch (_) {}
    }));
  } catch (err) {
    console.error('[Worker C] Error:', err.message);
  }
  return findings;
}

// PYTHON ENGINE - Spawn python-engine/main.py
function runPythonEngine(url) {
  return new Promise((resolve) => {
    const pythonScript = path.join(__dirname, '..', 'python-engine', 'main.py');
    const bundledPython = path.join(process.env.USERPROFILE || '', '.cache', 'codex-runtimes', 'codex-primary-runtime', 'dependencies', 'python', 'python.exe');
    const pythonBins = [
      process.env.PYTHON_BIN,
      fs.existsSync(bundledPython) ? bundledPython : null,
      'python',
      process.platform === 'win32' ? 'py' : 'python3',
    ].filter(Boolean);

    const runWith = (index) => {
      const pythonBin = pythonBins[index];
      if (!pythonBin) {
        console.error('[Python Engine] No usable Python interpreter found.');
        resolve([]);
        return;
      }

      const proc = spawn(pythonBin, [pythonScript, '--url', url, '--output', 'json'], {
        timeout: 60000,
      });

      let stdout = '';
      let stderr = '';
      proc.stdout.on('data', d => { stdout += d.toString(); });
      proc.stderr.on('data', d => { stderr += d.toString(); });

      proc.on('close', (code) => {
        if (code !== 0) {
          console.error('[Python Engine] Exited with code', code, 'using', pythonBin, ':', stderr);
          resolve([]);
          return;
        }
        try {
          // Find the JSON array in stdout (may have debug lines before it)
          const jsonMatch = stdout.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const findings = JSON.parse(jsonMatch[0]);
            resolve(Array.isArray(findings) ? findings : []);
          } else {
            resolve([]);
          }
        } catch (e) {
          console.error('[Python Engine] JSON parse error:', e.message, '| stdout:', stdout);
          resolve([]);
        }
      });

      proc.on('error', (e) => {
        console.error('[Python Engine] Spawn error with', pythonBin, ':', e.message);
        runWith(index + 1);
      });
    };

    runWith(0);
  });
}

// SCORE CALCULATOR
function calculateScore(findings) {
  const penalties = { A01: 15, A02: 20, A03: 25, A04: 10, A05: 5, A06: 15, A07: 10, A08: 10, A09: 5, A10: 20 };
  // Penalise once per category to avoid a single category dominating
  const seenCategories = new Set();
  let score = 100;
  for (const f of findings) {
    const cat = f.category;
    const penalty = penalties[cat] ?? 5;
    // First finding: full penalty. Extra findings in same category: half penalty
    if (!seenCategories.has(cat)) {
      score -= penalty;
      seenCategories.add(cat);
    } else {
      score -= Math.floor(penalty / 2);
    }
  }
  return Math.max(0, score);
}

// DEDUPLICATION
function deduplicateFindings(findings) {
  const seen = new Set();
  return findings.filter(f => {
    const key = `${f.category}::${f.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ROUTES

// POST /api/v1/scans - Launch a scan
app.post('/api/v1/scans', async (req, res) => {
  const { targetUrl } = req.body;
  if (!targetUrl) return res.status(400).json({ error: 'targetUrl is required' });

  const scanId = 'scan-' + Date.now();
  const scan = {
    scanId,
    targetUrl,
    status: 'RUNNING',
    score: null,
    findings: [],
    createdAt: new Date().toISOString(),
  };
  scans.set(scanId, scan);

  console.log(`[API] Starting scan ${scanId} -> ${targetUrl}`);
  res.status(202).json({ scanId, status: 'RUNNING' });

  // Run all 4 engines in parallel (non-blocking)
  setImmediate(async () => {
    try {
      console.log(`[Scan ${scanId}] Running Workers A, B, C + Python in parallel...`);
      const [aFindings, bFindings, cFindings, pyFindings] = await Promise.all([
        runWorkerA(targetUrl),
        runWorkerB(targetUrl),
        runWorkerC(targetUrl),
        runPythonEngine(targetUrl),
      ]);

      console.log(`[Scan ${scanId}] A:${aFindings.length} B:${bFindings.length} C:${cFindings.length} Py:${pyFindings.length}`);

      const allFindings = deduplicateFindings([
        ...aFindings,
        ...bFindings,
        ...cFindings,
        ...pyFindings,
      ]);

      scan.findings = allFindings;
      scan.score = calculateScore(allFindings);
      scan.status = 'COMPLETED';
      console.log(`[Scan ${scanId}] COMPLETED - ${allFindings.length} findings, score: ${scan.score}`);
    } catch (err) {
      console.error(`[Scan ${scanId}] FAILED:`, err.message);
      scan.status = 'FAILED';
    }
  });
});

// GET /api/v1/scans/:id - Poll scan status
app.get('/api/v1/scans/:id', (req, res) => {
  const scan = scans.get(req.params.id);
  if (!scan) return res.status(404).json({ error: 'Scan not found' });
  res.json(scan);
});

// GET /api/v1/scans/:id/pdf - PDF stub
app.get('/api/v1/scans/:id/pdf', (req, res) => {
  const scan = scans.get(req.params.id);
  if (!scan) return res.status(404).json({ error: 'Scan not found' });
  res.setHeader('Content-Type', 'text/plain');
  res.send(`SaSa Security Report\nScan ID: ${req.params.id}\nTarget: ${scan.targetUrl}\nScore: ${scan.score}\nFindings: ${scan.findings.length}`);
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`SaSa Real Backend running on http://localhost:${PORT}`);
  console.log(`   Workers A, B, C (Node.js) + Python Engine are active`);
});
