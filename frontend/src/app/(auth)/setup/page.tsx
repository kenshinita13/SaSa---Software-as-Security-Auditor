'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Building2, Palette, ArrowRight, Check } from 'lucide-react';

const steps = [
  { id: 1, label: 'Agency Info',   icon: Building2 },
  { id: 2, label: 'Branding',      icon: Palette },
  { id: 3, label: 'Confirm',       icon: Check },
];

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [agencyName, setAgencyName] = useState('');
  const [brandColor, setBrandColor] = useState('#6366f1');
  const [tagline, setTagline] = useState('');

  const handleFinish = () => {
    localStorage.setItem('sasa_agency_name', agencyName || 'My Agency');
    localStorage.setItem('sasa_brand_color', brandColor);
    router.push('/dashboard');
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary)', padding: '2rem',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'fixed', top: '30%', left: '30%',
        width: 500, height: 500,
        background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: 520, position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 48, height: 48, margin: '0 auto 0.75rem',
            background: 'linear-gradient(135deg, #6366f1, #818cf8)',
            borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 24px rgba(99,102,241,0.4)',
          }}>
            <ShieldCheck size={22} color="#fff" />
          </div>
          <h1 style={{ fontWeight: 900, fontSize: '1.5rem', color: 'var(--text-primary)' }}>Agency Setup</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Configure your white-label workspace
          </p>
        </div>

        {/* Step indicators */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', alignItems: 'center', justifyContent: 'center' }}>
          {steps.map((s, i) => {
            const done = s.id < step;
            const active = s.id === step;
            return (
              <React.Fragment key={s.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: done ? 'var(--green-bg)' : active ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
                    border: `2px solid ${done ? 'var(--green)' : active ? 'var(--accent)' : 'var(--border)'}`,
                    color: done ? 'var(--green)' : active ? 'var(--accent-bright)' : 'var(--text-muted)',
                    fontSize: '0.75rem', fontWeight: 700,
                    transition: 'all 0.3s ease',
                  }}>
                    {done ? <Check size={14} /> : s.id}
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: active ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    {s.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div style={{ flex: 1, height: 1, background: done ? 'var(--green)' : 'var(--border)', transition: 'all 0.3s ease' }} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(14,21,41,0.9)', border: '1px solid var(--border)',
          borderRadius: '1.25rem', padding: '2rem',
          backdropFilter: 'blur(24px)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
        }}>
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h2 style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)' }}>Agency Information</h2>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  Agency Name <span style={{ color: 'var(--red)' }}>*</span>
                </label>
                <input
                  className="input-dark"
                  value={agencyName}
                  onChange={e => setAgencyName(e.target.value)}
                  placeholder="Acme Security Corp"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  Tagline (optional)
                </label>
                <input
                  className="input-dark"
                  value={tagline}
                  onChange={e => setTagline(e.target.value)}
                  placeholder="Professional security for your clients"
                />
              </div>
              <button
                className="btn-primary"
                onClick={() => { if (agencyName) setStep(2); }}
                disabled={!agencyName}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}
              >
                Next <ArrowRight size={15} />
              </button>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h2 style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)' }}>Brand Colours</h2>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  Primary Brand Color
                </label>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={brandColor}
                    onChange={e => setBrandColor(e.target.value)}
                    style={{ width: 48, height: 48, border: 'none', borderRadius: 8, cursor: 'pointer', background: 'transparent' }}
                  />
                  <input
                    className="input-dark"
                    value={brandColor}
                    onChange={e => setBrandColor(e.target.value)}
                    placeholder="#6366f1"
                    style={{ flex: 1, fontFamily: 'monospace', fontSize: '0.85rem' }}
                  />
                </div>
                <p style={{ marginTop: '0.5rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  This color is used in your PDF reports and score rings.
                </p>
              </div>
              {/* Preview */}
              <div style={{
                padding: '1.25rem', borderRadius: '0.75rem',
                background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
              }}>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Report Preview</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '10px',
                    background: brandColor,
                    boxShadow: `0 0 16px ${brandColor}60`,
                  }} />
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>{agencyName}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Security Audit Report</div>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={() => setStep(1)}
                  style={{
                    flex: 1, padding: '0.625rem', borderRadius: '0.625rem',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
                    color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem',
                  }}
                >
                  Back
                </button>
                <button className="btn-primary" onClick={() => setStep(3)} style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  Next <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <h2 style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)' }}>Ready to Launch</h2>
              {[
                { label: 'Agency Name', value: agencyName },
                { label: 'Brand Color', value: brandColor },
                { label: 'Tagline', value: tagline || '(none)' },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.625rem', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{label}</span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: label === 'Brand Color' ? 'monospace' : 'inherit' }}>{value}</span>
                </div>
              ))}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={() => setStep(2)}
                  style={{
                    flex: 1, padding: '0.625rem', borderRadius: '0.625rem',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
                    color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem',
                  }}
                >
                  Back
                </button>
                <button className="btn-primary" onClick={handleFinish} style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <Check size={15} /> Launch Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
