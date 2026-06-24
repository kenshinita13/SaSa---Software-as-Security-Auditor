export interface ScanFinding {
  category: string; // e.g. 'A01', 'A02'
  title: string;
  description: string;
  evidence: string;
}

/**
 * Normalizes and deduplicates findings from all workers.
 * (Future logic: aggregate similar findings under one umbrella)
 */
export function classifyFindings(findings: ScanFinding[]): ScanFinding[] {
  // Simple deduplication by title + evidence
  const unique = new Map<string, ScanFinding>();
  
  for (const finding of findings) {
    const key = `${finding.category}-${finding.title}-${finding.evidence}`;
    if (!unique.has(key)) {
      unique.set(key, finding);
    }
  }

  return Array.from(unique.values());
}
