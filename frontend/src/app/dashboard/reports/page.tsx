'use client';
import React, { useState } from 'react';
import { FileText, Download, Loader2, CheckCircle2, Eye } from 'lucide-react';

interface Report {
  id: string;
  targetUrl: string;
  score: number;
  findings: number;
  createdAt: string;
  generating?: boolean;
  ready?: boolean;
}

const MOCK_REPORTS: Report[] = [
  { id: 'scan-001', targetUrl: 'https://example.com',        score: 82, findings: 3,  createdAt: new Date(Date.now() - 3600000).toISOString()   },
  { id: 'scan-002', targetUrl: 'https://test-client.io',     score: 47, findings: 8,  createdAt: new Date(Date.now() - 7200000).toISOString()   },
  { id: 'scan-003', targetUrl: 'https://legacy-app.net',     score: 21, findings: 14, createdAt: new Date(Date.now() - 86400000).toISOString()  },
  { id: 'scan-005', targetUrl: 'https://staging.myapp.io',   score: 91, findings: 1,  createdAt: new Date(Date.now() - 172800000).toISOString() },
  { id: 'scan-007', targetUrl: 'https://shop.ecommerce.com', score: 63, findings: 6,  createdAt: new Date(Date.now() - 345600000).toISOString() },
];

const scoreColor = (score: number) => {
  if (score >= 80) return 'var(--green)';
  if (score >= 50) return 'var(--yellow)';
  return 'var(--red)';
};

const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>(MOCK_REPORTS);

  const handleGenerate = async (id: string) => {
    setReports(r => r.map(rep => rep.id === id ? { ...rep, generating: true } : rep));
    // Simulate PDF generation
    await new Promise(res => setTimeout(res, 1800));
    setReports(r => r.map(rep => rep.id === id ? { ...rep, generating: false, ready: true } : rep));
    // In production: window.open(`http://localhost:4000/api/v1/scans/${id}/pdf`, '_blank');
  };

  return (
    <div style={{ padding: '2rem', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
        <FileText size={20} color="var(--accent-bright)" />
        <h1 style={{ fontWeight: 900, fontSize: '1.5rem', color: 'var(--text-primary)' }}>Reports</h1>
      </div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.75rem' }}>
        Generate white-labeled PDF audit reports for your clients.
      </p>

      {/* Info banner */}
      <div style={{
        padding: '1rem 1.25rem', borderRadius: '0.75rem', marginBottom: '1.5rem',
        background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
        display: 'flex', alignItems: 'center', gap: '0.75rem',
      }}>
        <Eye size={16} color="var(--accent-bright)" style={{ flexShrink: 0 }} />
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
          Reports are white-labeled with your agency name and brand color. Configure them in <strong style={{ color: 'var(--accent-bright)' }}>Settings</strong>.
        </p>
      </div>

      {/* Reports grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
        {reports.map(rep => (
          <div key={rep.id} className="glass" style={{ padding: '1.5rem', borderRadius: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Score ring + URL */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: 52, height: 52, borderRadius: '50%',
                border: `3px solid ${scoreColor(rep.score)}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 0 16px ${scoreColor(rep.score)}40`,
                flexShrink: 0,
              }}>
                <span style={{ fontWeight: 900, fontSize: '1rem', color: scoreColor(rep.score) }}>{rep.score}</span>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {rep.targetUrl}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {formatDate(rep.createdAt)} · {rep.findings} findings
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => handleGenerate(rep.id)}
                disabled={!!rep.generating}
                className="btn-primary"
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: '0.4rem', fontSize: '0.82rem', padding: '0.5rem 1rem',
                }}
              >
                {rep.generating ? (
                  <><Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Generating…</>
                ) : rep.ready ? (
                  <><CheckCircle2 size={14} /> Download PDF</>
                ) : (
                  <><Download size={14} /> Generate PDF</>
                )}
              </button>
              {rep.ready && (
                <div style={{
                  width: 36, height: 36, borderRadius: '0.625rem',
                  background: 'var(--green-bg)', border: '1px solid rgba(52,211,153,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <CheckCircle2 size={16} color="var(--green)" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
