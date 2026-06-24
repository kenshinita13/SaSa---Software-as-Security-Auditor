'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, FileText, Activity, CheckCircle2, XCircle, Clock, AlertTriangle, Globe } from 'lucide-react';
import ScoreRing from '@/components/ScoreRing';
import OWASPTable from '@/components/OWASPTable';

type ScanStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

interface ScanData {
  scanId: string;
  targetUrl: string;
  status: ScanStatus;
  score?: number;
  findings?: Array<{ category: string; title: string; description: string; evidence: string }>;
  createdAt?: string;
}

const statusConfig: Record<ScanStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  PENDING:   { label: 'Pending',    color: 'var(--blue)',   bg: 'var(--blue-bg)',   icon: <Clock size={14} /> },
  RUNNING:   { label: 'Scanning…',  color: 'var(--yellow)', bg: 'var(--yellow-bg)', icon: <Activity size={14} /> },
  COMPLETED: { label: 'Completed',  color: 'var(--green)',  bg: 'var(--green-bg)',  icon: <CheckCircle2 size={14} /> },
  FAILED:    { label: 'Failed',     color: 'var(--red)',    bg: 'var(--red-bg)',    icon: <XCircle size={14} /> },
};

const workerSteps = [
  { id: 'workerA', label: 'Worker A — CORS & Network Probes' },
  { id: 'workerB', label: 'Worker B — Headers & Cookies' },
  { id: 'workerC', label: 'Worker C — JS Bundle Crawl' },
  { id: 'python',  label: 'Python Engine — Deep OWASP Checks' },
];

export default function ScanResultPage() {
  const params = useParams();
  const router = useRouter();
  const scanId = params.scanId as string;
  const [data, setData] = useState<ScanData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [workerProgress, setWorkerProgress] = useState<Record<string, boolean>>({});

  // Simulate progressive worker completion for UI feedback
  useEffect(() => {
    if (!data) return;
    if (data.status === 'RUNNING' || data.status === 'PENDING') {
      const timers = workerSteps.map((w, i) =>
        setTimeout(() => setWorkerProgress(p => ({ ...p, [w.id]: true })), (i + 1) * 4000)
      );
      return () => timers.forEach(clearTimeout);
    }
    if (data.status === 'COMPLETED') {
      setWorkerProgress({ workerA: true, workerB: true, workerC: true, python: true });
    }
  }, [data?.status]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    const fetchScan = async () => {
      try {
        const res = await fetch(`http://localhost:4000/api/v1/scans/${scanId}`);
        const json = await res.json();
        if (res.ok) {
          setData(json);
          if (json.status === 'COMPLETED' || json.status === 'FAILED') {
            clearInterval(interval);
          }
        } else {
          setError(json.error || 'Failed to fetch scan');
        }
      } catch {
        setError('Cannot reach backend. Ensure the API is running on :4000');
      }
    };

    fetchScan();
    interval = setInterval(fetchScan, 3000);
    return () => clearInterval(interval);
  }, [scanId]);

  if (error) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <XCircle size={48} color="var(--red)" style={{ margin: '0 auto 1rem' }} />
        <h2 style={{ fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Error Loading Scan</h2>
        <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
        <button onClick={() => router.push('/dashboard')} className="btn-primary" style={{ marginTop: '1.5rem' }}>
          Return to Dashboard
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', border: '3px solid var(--accent)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', marginBottom: '1.5rem' }} />
        <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Locating scan…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const statusCfg = statusConfig[data.status];
  const isRunning = data.status === 'PENDING' || data.status === 'RUNNING';

  return (
    <div style={{ padding: '2rem', maxWidth: 1100, margin: '0 auto' }}>
      {/* Topbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <button
          onClick={() => router.push('/dashboard')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.875rem' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'}
        >
          <ArrowLeft size={16} /> Dashboard
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="badge" style={{ background: statusCfg.bg, color: statusCfg.color, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            {statusCfg.icon} {statusCfg.label}
          </span>
          {!isRunning && data.status === 'COMPLETED' && (
            <button
              onClick={() => window.open(`http://localhost:4000/api/v1/scans/${scanId}/pdf`, '_blank')}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', padding: '0.5rem 1.25rem' }}
            >
              <FileText size={15} /> Download PDF
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Score card */}
          <div className="glass" style={{ padding: '1.75rem', borderRadius: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1.25rem' }}>
              Security Score
            </p>
            {isRunning ? (
              <div style={{ width: 160, height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 60, height: 60, borderRadius: '50%', border: '4px solid rgba(99,102,241,0.3)', borderTopColor: 'var(--accent)', animation: 'spin 0.8s linear infinite' }} />
              </div>
            ) : (
              <ScoreRing score={data.score ?? 100} />
            )}
          </div>

          {/* Target */}
          <div className="glass" style={{ padding: '1.25rem', borderRadius: '1rem' }}>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>Target URL</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Globe size={14} color="var(--accent-bright)" />
              <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--text-primary)', wordBreak: 'break-all' }}>
                {data.targetUrl}
              </span>
            </div>
          </div>

          {/* Worker progress */}
          <div className="glass" style={{ padding: '1.25rem', borderRadius: '1rem' }}>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.875rem' }}>Engine Status</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {workerSteps.map(w => {
                const done = !!workerProgress[w.id];
                return (
                  <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: done ? 'var(--green-bg)' : isRunning ? 'var(--yellow-bg)' : 'rgba(255,255,255,0.05)',
                      border: `1.5px solid ${done ? 'var(--green)' : isRunning ? 'var(--yellow)' : 'var(--border)'}`,
                    }}>
                      {done
                        ? <CheckCircle2 size={11} color="var(--green)" />
                        : isRunning
                          ? <Activity size={11} color="var(--yellow)" style={{ animation: 'spin 2s linear infinite' }} />
                          : <Clock size={11} color="var(--text-muted)" />
                      }
                    </div>
                    <span style={{ fontSize: '0.72rem', color: done ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: done ? 600 : 400 }}>
                      {w.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right column — findings */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <h2 style={{ fontWeight: 900, fontSize: '1.2rem', color: 'var(--text-primary)' }}>Findings</h2>
            {!isRunning && (
              <span style={{
                background: 'rgba(255,255,255,0.08)', color: 'var(--text-secondary)',
                padding: '0.15rem 0.625rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 700,
              }}>
                {data.findings?.length ?? 0} issues
              </span>
            )}
          </div>
          {isRunning ? (
            <div className="glass" style={{ padding: '3rem 2rem', borderRadius: '1rem', textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', border: '3px solid rgba(99,102,241,0.3)', borderTopColor: 'var(--accent)', animation: 'spin 0.8s linear infinite', margin: '0 auto 1.25rem' }} />
              <h3 style={{ fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Scan in progress</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>The security engine is actively probing the target. Results will appear here automatically.</p>
            </div>
          ) : (
            <OWASPTable findings={data.findings ?? []} />
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
