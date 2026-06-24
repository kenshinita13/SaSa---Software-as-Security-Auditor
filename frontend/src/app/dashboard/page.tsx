'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Link as LinkIcon, Loader2, Zap, Shield, AlertTriangle, CheckCircle2, Clock, TrendingUp } from 'lucide-react';

interface RecentScan {
  id: string;
  targetUrl: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  score?: number;
  createdAt: string;
}

const MOCK_SCANS: RecentScan[] = [
  { id: 'scan-001', targetUrl: 'https://example.com',       status: 'COMPLETED', score: 82, createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: 'scan-002', targetUrl: 'https://test-client.io',    status: 'COMPLETED', score: 47, createdAt: new Date(Date.now() - 7200000).toISOString() },
  { id: 'scan-003', targetUrl: 'https://legacy-app.net',    status: 'COMPLETED', score: 21, createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 'scan-004', targetUrl: 'https://demo.webapp.dev',   status: 'RUNNING',            createdAt: new Date(Date.now() - 120000).toISOString() },
];

const statusIcon = (s: RecentScan['status']) => {
  if (s === 'COMPLETED') return <CheckCircle2 size={14} color="var(--green)" />;
  if (s === 'RUNNING')   return <Loader2 size={14} color="var(--yellow)" style={{ animation: 'spin 1s linear infinite' }} />;
  if (s === 'FAILED')    return <AlertTriangle size={14} color="var(--red)" />;
  return <Clock size={14} color="var(--blue)" />;
};

const scoreColor = (score?: number) => {
  if (score === undefined) return 'var(--text-muted)';
  if (score >= 80) return 'var(--green)';
  if (score >= 50) return 'var(--yellow)';
  return 'var(--red)';
};

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

export default function DashboardPage() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [scanning, setScanning] = useState(false);
  const [recentScans] = useState<RecentScan[]>(MOCK_SCANS);

  const avgScore = Math.round(
    recentScans.filter(s => s.score !== undefined).reduce((a, s) => a + (s.score ?? 0), 0) /
    recentScans.filter(s => s.score !== undefined).length
  );

  const startScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    setScanning(true);
    try {
      const apiKey = localStorage.getItem('sasa_api_key');
      const res = await fetch('http://localhost:4000/api/v1/scans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': apiKey ? `Bearer ${apiKey}` : '',
        },
        body: JSON.stringify({ targetUrl: url }),
      });
      const data = await res.json();
      if (data.scanId) {
        router.push(`/dashboard/${data.scanId}`);
      } else {
        alert('Scan failed: ' + (data.error || 'Unknown error'));
        setScanning(false);
      }
    } catch {
      alert('Could not connect to backend. Make sure the API is running on port 4000.');
      setScanning(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontWeight: 900, fontSize: '1.75rem', letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
          Security Dashboard
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', fontSize: '0.9rem' }}>
          Launch scans, review findings, and download client reports.
        </p>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Total Scans',    value: recentScans.length.toString(),                               icon: Shield,        color: 'var(--accent-bright)' },
          { label: 'Avg. Score',     value: isNaN(avgScore) ? '—' : avgScore.toString(),                icon: TrendingUp,    color: scoreColor(avgScore)   },
          { label: 'Critical Finds', value: recentScans.filter(s => (s.score ?? 100) < 50).length.toString(), icon: AlertTriangle, color: 'var(--red)'           },
          { label: 'Passing',        value: recentScans.filter(s => (s.score ?? 0) >= 80).length.toString(),  icon: CheckCircle2,  color: 'var(--green)'         },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass" style={{ padding: '1.25rem', borderRadius: '0.875rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ width: 40, height: 40, borderRadius: '10px', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={18} color={color} />
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Scan */}
      <div className="glass" style={{ padding: '1.75rem', borderRadius: '1rem', marginBottom: '2rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: -30, right: -30, width: 180, height: 180,
          background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none',
        }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1rem' }}>
          <Zap size={18} color="var(--accent-bright)" />
          <h2 style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)' }}>Launch Security Audit</h2>
        </div>
        <form onSubmit={startScan} style={{ display: 'flex', gap: '0.75rem' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <LinkIcon size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="url"
              required
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://target-app.com"
              className="input-dark"
              style={{ paddingLeft: '2.75rem' }}
            />
          </div>
          <button type="submit" disabled={scanning} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}>
            {scanning ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Zap size={16} />}
            {scanning ? 'Launching...' : 'Run Audit'}
          </button>
        </form>
        <p style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Runs all OWASP A01–A10 checks simultaneously via 4 parallel scan engines.
        </p>
      </div>

      {/* Recent Scans */}
      <div>
        <h2 style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>Recent Scans</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {recentScans.map(scan => (
            <div
              key={scan.id}
              onClick={() => router.push(`/dashboard/${scan.id}`)}
              className="glass"
              style={{
                padding: '1rem 1.25rem', borderRadius: '0.875rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '1rem',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.3)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = 'var(--bg-card)';
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
              }}
            >
              {/* Status icon */}
              <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {statusIcon(scan.status)}
              </div>
              {/* URL */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {scan.targetUrl}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>{timeAgo(scan.createdAt)}</div>
              </div>
              {/* Status badge */}
              <span className={`badge badge-${scan.status.toLowerCase()}`}>{scan.status}</span>
              {/* Score */}
              <div style={{ fontWeight: 900, fontSize: '1.1rem', color: scoreColor(scan.score), minWidth: 36, textAlign: 'right' }}>
                {scan.score !== undefined ? scan.score : '—'}
              </div>
            </div>
          ))}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
