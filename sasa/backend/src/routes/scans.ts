import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../index';
import { jwtAuth } from '../middleware/jwtAuth';
import { apiKeyAuth } from '../middleware/apiKeyAuth';
import { runWorkerA } from '../workers/workerA-network';
import { runWorkerB } from '../workers/workerB-headers';
import { runWorkerC } from '../workers/workerC-bundle';
import { spawnPythonEngine } from '../services/pythonBridge';
import { classifyFindings } from '../services/owaspClassifier';
import { calculateScore } from '../services/scoreCalculator';

const router = Router();

// ─── Input Validation Schema ─────────────────────────────────
const CreateScanSchema = z.object({
  target_url: z
    .string()
    .url({ message: 'target_url must be a valid URL (include http:// or https://)' }),
});

// ─── Auth: Accept either JWT or API Key ───────────────────────
function flexAuth(req: Request, res: Response, next: () => void): void {
  const header = req.headers.authorization ?? '';
  if (header.startsWith('Bearer sk_sasa_')) {
    apiKeyAuth(req, res, next);
  } else {
    jwtAuth(req, res, next);
  }
}

// ─── POST /api/v1/scans ───────────────────────────────────────
// Creates a scan record and fires all workers asynchronously.
// Returns 202 Accepted immediately so the UI never blocks.
router.post('/', flexAuth as any, async (req: Request, res: Response): Promise<void> => {
  // 1. Validate input
  const parsed = CreateScanSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }

  const { target_url } = parsed.data;
  const agencyId = req.agencyId!;
  const scanId = uuidv4();

  try {
    // 2. Insert PENDING scan record
    await db.query(
      `INSERT INTO scans (id, agency_id, target_url, status)
       VALUES ($1, $2, $3, 'PENDING')`,
      [scanId, agencyId, target_url],
    );

    // 3. Return 202 immediately — don't await workers
    res.status(202).json({
      scan_id: scanId,
      status: 'PENDING',
      message: 'Scan initiated. Poll /api/v1/scans/:id for results.',
    });

    // 4. Run all workers + Python engine in parallel (fire-and-forget)
    runScanPipeline(scanId, target_url);
  } catch (err) {
    console.error('[POST /scans] Error creating scan:', err);
    res.status(500).json({ error: 'Failed to create scan.' });
  }
});

// ─── GET /api/v1/scans/:id ────────────────────────────────────
// Poll this endpoint to get scan status and results.
router.get('/:id', flexAuth as any, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const agencyId = req.agencyId!;

  try {
    const result = await db.query(
      `SELECT id, target_url, status, safety_score, raw_results, error_message, created_at, updated_at
       FROM scans
       WHERE id = $1 AND agency_id = $2`,
      [id, agencyId],
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Scan not found.' });
      return;
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('[GET /scans/:id] Error:', err);
    res.status(500).json({ error: 'Failed to retrieve scan.' });
  }
});

// ─── GET /api/v1/scans ───────────────────────────────────────
// Returns all scans for the authenticated agency.
router.get('/', flexAuth as any, async (req: Request, res: Response): Promise<void> => {
  const agencyId = req.agencyId!;

  try {
    const result = await db.query(
      `SELECT id, target_url, status, safety_score, created_at
       FROM scans
       WHERE agency_id = $1
       ORDER BY created_at DESC
       LIMIT 100`,
      [agencyId],
    );

    res.json({ scans: result.rows, count: result.rowCount });
  } catch (err) {
    console.error('[GET /scans] Error:', err);
    res.status(500).json({ error: 'Failed to list scans.' });
  }
});

// ─── Background Scan Pipeline ─────────────────────────────────
async function runScanPipeline(scanId: string, targetUrl: string): Promise<void> {
  try {
    // Mark as RUNNING
    await db.query("UPDATE scans SET status = 'RUNNING' WHERE id = $1", [scanId]);

    // Fire all 4 engines concurrently
    const [workerAResult, workerBResult, workerCResult, pythonResult] = await Promise.allSettled([
      runWorkerA(targetUrl),
      runWorkerB(targetUrl),
      runWorkerC(targetUrl),
      spawnPythonEngine(targetUrl),
    ]);

    // Collect findings (use value if fulfilled, empty array if failed)
    const findings = [
      ...(workerAResult.status === 'fulfilled' ? workerAResult.value : []),
      ...(workerBResult.status === 'fulfilled' ? workerBResult.value : []),
      ...(workerCResult.status === 'fulfilled' ? workerCResult.value : []),
      ...(pythonResult.status === 'fulfilled' ? pythonResult.value : []),
    ];

    // Classify + score
    const classified = classifyFindings(findings);
    const score = calculateScore(classified);

    // Save COMPLETED
    await db.query(
      `UPDATE scans
       SET status = 'COMPLETED', safety_score = $1, raw_results = $2, updated_at = NOW()
       WHERE id = $3`,
      [score, JSON.stringify({ findings: classified }), scanId],
    );

    console.log(`[Pipeline] Scan ${scanId} COMPLETED — Score: ${score}/100`);
  } catch (err) {
    console.error(`[Pipeline] Scan ${scanId} FAILED:`, err);
    await db.query(
      "UPDATE scans SET status = 'FAILED', error_message = $1 WHERE id = $2",
      [String(err), scanId],
    );
  }
}

export default router;
