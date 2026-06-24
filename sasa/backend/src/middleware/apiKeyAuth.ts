import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../index';

/**
 * Middleware: Verify API Key from Authorization: Bearer sk_sasa_... header.
 * Looks up hashed key in agency_api_keys table.
 * On success, attaches `req.agencyId` for downstream use.
 */
export async function apiKeyAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer sk_sasa_')) {
    res.status(401).json({ error: 'Unauthorized: invalid API key format.' });
    return;
  }

  const rawKey = authHeader.slice(7); // strip "Bearer "

  try {
    // Fetch all keys — in production, narrow by key_prefix for performance
    const prefix = rawKey.slice(0, 14); // e.g. sk_sasa_live_xx
    const result = await db.query(
      `SELECT id, agency_id, key_hash
       FROM agency_api_keys
       WHERE key_prefix = $1`,
      [prefix],
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: 'Unauthorized: API key not found.' });
      return;
    }

    // Verify the raw key against the stored bcrypt hash
    const keyRecord = result.rows[0];
    const isValid = await bcrypt.compare(rawKey, keyRecord.key_hash);

    if (!isValid) {
      res.status(401).json({ error: 'Unauthorized: API key invalid.' });
      return;
    }

    // Update last_used_at (fire-and-forget)
    db.query(
      'UPDATE agency_api_keys SET last_used_at = NOW() WHERE id = $1',
      [keyRecord.id],
    ).catch(() => { /* non-critical */ });

    req.agencyId = keyRecord.agency_id;
    next();
  } catch (err) {
    console.error('[apiKeyAuth] DB error:', err);
    res.status(500).json({ error: 'Internal server error during auth.' });
  }
}
