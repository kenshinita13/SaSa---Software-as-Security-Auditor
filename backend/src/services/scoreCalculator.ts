import { ScanFinding } from './owaspClassifier';

/**
 * Calculates a security score from 0 to 100 based on OWASP findings.
 */
export function calculateScore(findings: ScanFinding[]): number {
  let score = 100;
  
  // Basic scoring logic: deduplicate penalties per category where needed
  for (const finding of findings) {
    switch (finding.category) {
      case 'A01': score -= 15; break; // Broken Access Control
      case 'A02': score -= 20; break; // Cryptographic Failures
      case 'A03': score -= 25; break; // Injection
      case 'A04': score -= 10; break; // Insecure Design
      case 'A05': score -= 10; break; // Security Misconfiguration
      case 'A06': score -= 15; break; // Vulnerable Components
      case 'A07': score -= 10; break; // Auth Failures
      case 'A08': score -= 10; break; // Integrity Failures
      case 'A09': score -= 5;  break; // Logging/Monitoring
      case 'A10': score -= 20; break; // SSRF
      default:    score -= 5;  break;
    }
  }
  
  return Math.max(0, score);
}
