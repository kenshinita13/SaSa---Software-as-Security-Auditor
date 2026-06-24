import axios from 'axios';
import { ScanFinding } from '../services/owaspClassifier';

export async function runWorkerB(url: string): Promise<ScanFinding[]> {
  const findings: ScanFinding[] = [];
  try {
    const res = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
      validateStatus: () => true,
      timeout: 10000
    });

    const headers = res.headers as Record<string, string | undefined>;

    // 1. Missing Security Headers (A05)
    if (!headers['content-security-policy']) {
      findings.push({
        category: 'A05',
        title: 'Missing Content-Security-Policy',
        description: 'The server does not enforce a Content Security Policy, making it vulnerable to XSS.',
        evidence: 'Header missing'
      });
    }

    if (!headers['x-frame-options']) {
      findings.push({
        category: 'A05',
        title: 'Missing X-Frame-Options',
        description: 'The server does not prevent clickjacking attacks.',
        evidence: 'Header missing'
      });
    }

    if (!headers['strict-transport-security'] && url.startsWith('https')) {
      findings.push({
        category: 'A02',
        title: 'Missing Strict-Transport-Security',
        description: 'The server does not enforce HSTS, allowing downgrade attacks.',
        evidence: 'Header missing'
      });
    }

    // 2. Cookie Flags (A07)
    const cookies = headers['set-cookie'];
    if (cookies) {
      const cookieArray = Array.isArray(cookies) ? cookies : [cookies];
      for (const cookie of cookieArray) {
        const c = cookie.toLowerCase();
        if (!c.includes('httponly')) {
          findings.push({
            category: 'A07',
            title: 'Missing HttpOnly Flag on Cookie',
            description: 'A session cookie is accessible via JavaScript.',
            evidence: cookie
          });
        }
        if (!c.includes('secure')) {
          findings.push({
            category: 'A07',
            title: 'Missing Secure Flag on Cookie',
            description: 'A session cookie is transmitted over unencrypted connections.',
            evidence: cookie
          });
        }
        if (!c.includes('samesite')) {
          findings.push({
            category: 'A07',
            title: 'Missing SameSite Flag on Cookie',
            description: 'A session cookie is vulnerable to CSRF.',
            evidence: cookie
          });
        }
      }
    }
  } catch (error) {
    console.error(`[Worker B] Error scanning ${url}:`, error);
  }
  return findings;
}
