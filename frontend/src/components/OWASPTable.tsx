import React from 'react';
import { ShieldCheck, AlertTriangle, AlertOctagon } from 'lucide-react';

interface Finding {
  category: string;
  title: string;
  description: string;
  evidence: string;
}

const OWASP_LABELS: Record<string, string> = {
  A01: 'Broken Access Control',
  A02: 'Cryptographic Failures',
  A03: 'Injection',
  A04: 'Insecure Design',
  A05: 'Security Misconfiguration',
  A06: 'Vulnerable Components',
  A07: 'Auth & Session Failures',
  A08: 'Data Integrity Failures',
  A09: 'Logging & Monitoring',
  A10: 'SSRF',
};

const SEVERITY: Record<string, 'critical' | 'medium' | 'low'> = {
  A01: 'critical', A02: 'critical', A03: 'critical', A10: 'critical', A07: 'critical',
  A04: 'medium',   A05: 'medium',   A06: 'medium',   A08: 'medium',
  A09: 'low',
};

const SEVERITY_STYLES = {
  critical: { bg: 'var(--red-bg)',    color: 'var(--red)',    icon: AlertOctagon,  label: 'Critical' },
  medium:   { bg: 'var(--yellow-bg)', color: 'var(--yellow)', icon: AlertTriangle, label: 'Medium'   },
  low:      { bg: 'var(--blue-bg)',   color: 'var(--blue)',   icon: AlertTriangle, label: 'Low'      },
};

export default function OWASPTable({ findings }: { findings: Finding[] }) {
  if (!findings || findings.length === 0) {
    return (
      <div style={{
        padding: '3rem 2rem', borderRadius: '1rem',
        background: 'var(--green-bg)', border: '1px solid rgba(52,211,153,0.2)',
        display: 'flex', alignItems: 'center', gap: '1.25rem',
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: '14px',
          background: 'rgba(52,211,153,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <ShieldCheck size={24} color="var(--green)" />
        </div>
        <div>
          <h3 style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--green)', marginBottom: '0.25rem' }}>
            No Vulnerabilities Detected
          </h3>
          <p style={{ color: 'rgba(52,211,153,0.7)', fontSize: '0.85rem' }}>
            The application passed all OWASP Top 10 automated checks.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {findings.map((f, i) => {
        const sev = SEVERITY[f.category] ?? 'low';
        const style = SEVERITY_STYLES[sev];
        const Icon = style.icon;
        const owaspLabel = OWASP_LABELS[f.category] ?? f.category;

        return (
          <div
            key={i}
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border)',
              borderLeft: `3px solid ${style.color}`,
              borderRadius: '0.75rem',
              padding: '1rem 1.25rem',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.055)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'; }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}>
              <div style={{
                width: 36, height: 36, borderRadius: '10px',
                background: style.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Icon size={16} color={style.color} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                  <span className={`badge badge-${f.category.toLowerCase()}`}>{f.category}</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{owaspLabel}</span>
                  <span style={{
                    marginLeft: 'auto', fontSize: '0.68rem', fontWeight: 700, padding: '0.15rem 0.5rem',
                    borderRadius: '999px', background: style.bg, color: style.color, letterSpacing: '0.05em', textTransform: 'uppercase',
                  }}>
                    {style.label}
                  </span>
                </div>
                <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{f.title}</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.6rem', lineHeight: 1.5 }}>{f.description}</p>
                {f.evidence && (
                  <div style={{
                    background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '0.5rem', padding: '0.5rem 0.75rem',
                    fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--text-secondary)',
                    overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                  }}>
                    {f.evidence}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
