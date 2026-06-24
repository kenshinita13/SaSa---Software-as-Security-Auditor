import axios from 'axios';
import * as cheerio from 'cheerio';
import { ScanFinding } from '../services/owaspClassifier';

export async function runWorkerC(url: string): Promise<ScanFinding[]> {
  const findings: ScanFinding[] = [];
  try {
    const res = await axios.get(url, {
      validateStatus: () => true,
      timeout: 10000
    });

    const html = res.data;
    if (typeof html !== 'string') return findings;

    // Direct HTML regex sweeps (A03 - XSS Sinks)
    if (html.includes('dangerouslySetInnerHTML')) {
      findings.push({
        category: 'A03',
        title: 'Usage of dangerouslySetInnerHTML',
        description: 'React component rendering raw HTML, potential XSS sink.',
        evidence: 'dangerouslySetInnerHTML found in main document'
      });
    }

    const $ = cheerio.load(html);
    const scriptUrls: string[] = [];

    // Find all <script src="...">
    $('script').each((_, el) => {
      const src = $(el).attr('src');
      if (src) {
        // Resolve relative URLs
        try {
          const absoluteUrl = new URL(src, url).toString();
          // Only scan same-origin scripts for secrets
          if (new URL(absoluteUrl).origin === new URL(url).origin) {
             scriptUrls.push(absoluteUrl);
          }
        } catch (e) {
          // ignore malformed src
        }
      }
    });

    // Download and regex each script bundle
    await Promise.allSettled(scriptUrls.map(async (scriptUrl) => {
      try {
        const scriptRes = await axios.get(scriptUrl, { timeout: 10000 });
        const scriptText = scriptRes.data;
        if (typeof scriptText !== 'string') return;

        // Stripe Secrets (A02 / A04)
        if (/sk_live_[a-zA-Z0-9]{20,}/.test(scriptText)) {
          findings.push({
            category: 'A02',
            title: 'Leaked Stripe Live Secret',
            description: 'A live Stripe secret key was found exposed in client-side code.',
            evidence: `Found in ${scriptUrl}`
          });
        }
        if (/sk_test_[a-zA-Z0-9]{20,}/.test(scriptText)) {
          findings.push({
            category: 'A02',
            title: 'Leaked Stripe Test Secret',
            description: 'A test Stripe secret key was found exposed in client-side code.',
            evidence: `Found in ${scriptUrl}`
          });
        }

        // Supabase Service Role JWT (A02)
        // Checks for standard JWT header/payload containing .service_role
        if (/eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/.test(scriptText) && scriptText.includes('service_role')) {
           findings.push({
            category: 'A02',
            title: 'Leaked Supabase Service Role JWT',
            description: 'A privileged Supabase JWT was found in client-side code.',
            evidence: `Found in ${scriptUrl}`
          });
        }
        
      } catch (e) {
        console.error(`[Worker C] Failed to fetch script ${scriptUrl}`);
      }
    }));

  } catch (error) {
    console.error(`[Worker C] Error scanning ${url}:`, error);
  }
  return findings;
}
