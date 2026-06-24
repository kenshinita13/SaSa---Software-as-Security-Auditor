import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface JwtPayload {
  agencyId: string;
  iat?: number;
  exp?: number;
}

// Extend Express Request to carry the decoded agency context
declare global {
  namespace Express {
    interface Request {
      agencyId?: string;
    }
  }
}

/**
 * Middleware: Verify JWT from HttpOnly cookie or Authorization Bearer header.
 * On success, attaches `req.agencyId` for downstream use.
 */
export function jwtAuth(req: Request, res: Response, next: NextFunction): void {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    res.status(500).json({ error: 'Server misconfiguration: JWT_SECRET not set.' });
    return;
  }

  // 1. Try Authorization: Bearer <token> header
  let token: string | undefined;
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const candidate = authHeader.slice(7);
    // API Keys start with sk_sasa_ — skip JWT check for those
    if (!candidate.startsWith('sk_sasa_')) {
      token = candidate;
    }
  }

  // 2. Fall back to HttpOnly cookie
  if (!token && req.cookies?.sasa_token) {
    token = req.cookies.sasa_token as string;
  }

  if (!token) {
    res.status(401).json({ error: 'Unauthorized: no token provided.' });
    return;
  }

  try {
    const payload = jwt.verify(token, secret) as JwtPayload;
    req.agencyId = payload.agencyId;
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized: invalid or expired token.' });
  }
}
