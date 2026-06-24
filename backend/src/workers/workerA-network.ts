import axios from 'axios';
import { ScanFinding } from '../services/owaspClassifier';

export async function runWorkerA(url: string): Promise<ScanFinding[]> {
  const findings: ScanFinding[] = [];
  try {
    // 1. CORS Audit (A01 - Broken Access Control)
    try {
      const corsRes = await axios.options(url, {
        headers: { Origin: 'https://malicious-origin.com' },
        validateStatus: () => true,
        timeout: 10000
      });
      
      const acao = corsRes.headers['access-control-allow-origin'];
      if (acao === '*' || acao === 'https://malicious-origin.com') {
        findings.push({
          category: 'A01',
          title: 'Permissive CORS Policy',
          description: `The endpoint allows cross-origin requests from any origin or reflects the origin header.`,
          evidence: `Access-Control-Allow-Origin: ${acao}`
        });
      }
    } catch (e) {
      // ignore network errors for this probe
    }

    // 2. Simple HTTP-level SQLi probe (A03 - Injection)
    try {
      const parsedUrl = new URL(url);
      parsedUrl.searchParams.set('id', "' OR 1=1 --");
      const sqliRes = await axios.get(parsedUrl.toString(), {
        validateStatus: () => true,
        timeout: 10000
      });

      const body = typeof sqliRes.data === 'string' 
        ? sqliRes.data.toLowerCase() 
        : JSON.stringify(sqliRes.data).toLowerCase();
      
      if (body.includes('syntax error') || body.includes('sql') || body.includes('mysql') || body.includes('postgres')) {
        findings.push({
          category: 'A03',
          title: 'Potential SQL Injection',
          description: `The endpoint returned database error messages when injected with a standard SQL payload.`,
          evidence: `Payload used: ' OR 1=1 --`
        });
      }
    } catch (e) {
      // ignore
    }
  } catch (error) {
    console.error(`[Worker A] Error scanning ${url}:`, error);
  }
  return findings;
}
