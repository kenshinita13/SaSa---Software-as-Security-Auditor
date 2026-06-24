import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import scansRouter from './routes/scans';

// ─── Database Pool ───────────────────────────────────────────
export const db = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// ─── App Setup ───────────────────────────────────────────────
const app = express();
const PORT = parseInt(process.env.PORT || '4000', 10);

app.use(express.json());
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://your-sasa-domain.com']
    : ['http://localhost:3000'],
  credentials: true,
}));

// ─── Health Check ────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'sasa-backend', ts: new Date().toISOString() });
});

// ─── Routes ──────────────────────────────────────────────────
app.use('/api/v1/scans', scansRouter);

// ─── Start ───────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n✅ SaSa Backend running on http://localhost:${PORT}`);
  console.log(`   Environment : ${process.env.NODE_ENV}`);
  console.log(`   Database    : ${process.env.DATABASE_URL?.split('@')[1] ?? 'unknown'}\n`);
});

export default app;
