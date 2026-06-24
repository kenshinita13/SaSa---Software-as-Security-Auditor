'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { History, Search, Filter, CheckCircle2, AlertTriangle, XCircle, Clock, Loader2, ChevronRight } from 'lucide-react';

type ScanStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

interface HistoryScan {
  id: string;
  targetUrl: string;
  status: ScanStatus;
  score?: number;
  createdAt: string;
  findings: number;
}

const MOCK_HISTORY: HistoryScan[] = [
  { id: 'scan-001', targetUrl: 'https://example.com',        status: 'COMPLETED', score: 82, createdAt: new Date(Date.now() - 3600000).toISOString(),   findings: 3  },
  { id: 'scan-002', targetUrl: 'https://test-client.io',     status: 'COMPLETED', score: 47, createdAt: new Date(Date.now() - 7200000).toISOString(),   findings: 8  },
  { id: 'scan-003', targetUrl: 'https://legacy-app.net',     status: 'COMPLETED', score: 21, createdAt: new Date(Date.now() - 86400000).toISOString(),  findings: 14 },
  { id: 'scan-004', targetUrl: 'https://demo.webapp.dev',    status: 'RUNNING',             createdAt: new Date(Date.now() - 120000).toISOString(),    findings: 0  },
  { id: 'scan-005', targetUrl: 'https://staging.myapp.io',   status: 'COMPLETED', score: 91, createdAt: new Date(Date.now() - 172800000).toISOString(), findings: 1  },
  { id: 'scan-006', targetUrl: 'https://broken-site.xyz',    status: 'FAILED',              createdAt: new Date(Date.now() - 259200000).toISOString(),  findings: 0  },
  { id: 'scan-007', targetUrl: 'https://shop.ecommerce.com', status: 'COMPLETED', score: 63, createdAt: new Date(Date.now() - 345600000).toISOString(), findings: 6  },
];

const statusIcon = (s: ScanStatus) => {
  if (s === 'COMPLETED') return <CheckCircle2 size={14} color="var(--green)" />;
  if (s === 'RUNNING')   return <Loader2 size={14} color="var(--yellow)" style={{ animation: 'spin 1s linear infinite' }} />;
  if (s === 'FAILED')    return <XCircle size={14} color="var(--red)" />;
  return <Clock size={14} color="var(--blue)" />;
};

const scoreColor = (score?: number) => {
  if (!score && score !== 0) return 'var(--text-muted)';
  if (score >= 80) return 'var(--green)';
  if (score >= 50) return 'var(--yellow)';
  return 'var(--red)';
};

const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function HistoryPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ScanStatus | 'ALL'>('ALL');

  const filtered = MOCK_HISTORY.filter(s => {
    const matchSearch = s.targetUrl.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div style={{ padding: '2rem', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
        <History size={20} color="var(--accent-bright)" />
        <h1 style={{ fontWeight: 900, fontSize: '1.5rem', color: 'var(--text-primary)' }}>Scan History</h1>
      </div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.75rem' }}>
        All security scans run for your agency.
      </p>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 220, position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="input-dark"
            placeholder="Search by URL…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {(['ALL', 'COMPLETED', 'RUNNING', 'FAILED', 'PENDING'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                padding: '0.5rem 0.875rem', borderRadius: '0.625rem', border: '1px solid',
                fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s ease',
                background: statusFilter === s ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
                borderColor: statusFilter === s ? 'rgba(99,102,241,0.4)' : 'var(--border)',
                color: statusFilter === s ? 'var(--accent-bright)' : 'var(--text-secondary)',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass" style={{ borderRadius: '1rem', overflow: 'hidden' }}>
        {/* Table header */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 140px 120px 80px 40px',
          padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border)',
          fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>
          <span>Target URL</span>
          <span>Date</span>
          <span>Status</span>
          <span>Score</span>
          <span></span>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Filter size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
            <p>No scans match your filters.</p>
          </div>
        ) : (
          filtered.map((scan, i) => (
            <div
              key={scan.id}
              onClick={() => router.push(`/dashboard/${scan.id}`)}
              style={{
                display: 'grid', gridTemplateColumns: '1fr 140px 120px 80px 40px',
                padding: '1rem 1.25rem', borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                cursor: 'pointer', alignItems: 'center', transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', minWidth: 0 }}>
                <div style={{ width: 28, height: 28, borderRadius: '8px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {statusIcon(scan.status)}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {scan.targetUrl}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{scan.findings} findings</div>
                </div>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{formatDate(scan.createdAt)}</div>
              <div>
                <span className={`badge badge-${scan.status.toLowerCase()}`}>{scan.status}</span>
              </div>
              <div style={{ fontWeight: 900, fontSize: '1.1rem', color: scoreColor(scan.score) }}>
                {scan.score !== undefined ? scan.score : '—'}
              </div>
              <ChevronRight size={16} color="var(--text-muted)" />
            </div>
          ))
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
