'use client';
import React, { useState } from 'react';
import { Settings, Upload, Palette, Building2, Save, Check, AlertTriangle } from 'lucide-react';

export default function SettingsPage() {
  const [agencyName, setAgencyName] = useState('Acme Security Corp');
  const [tagline, setTagline] = useState('Professional security auditing for your clients.');
  const [brandColor, setBrandColor] = useState('#6366f1');
  const [saved, setSaved] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await new Promise(r => setTimeout(r, 500));
    localStorage.setItem('sasa_agency_name', agencyName);
    localStorage.setItem('sasa_brand_color', brandColor);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setLogoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: 760, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
        <Settings size={20} color="var(--accent-bright)" />
        <h1 style={{ fontWeight: 900, fontSize: '1.5rem', color: 'var(--text-primary)' }}>Agency Settings</h1>
      </div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '2rem' }}>
        Customize your white-label branding for client-facing PDF reports.
      </p>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* Agency Info */}
        <div className="glass" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <Building2 size={16} color="var(--accent-bright)" />
            <h2 style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>Agency Information</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Agency Name <span style={{ color: 'var(--red)' }}>*</span>
              </label>
              <input
                className="input-dark"
                value={agencyName}
                onChange={e => setAgencyName(e.target.value)}
                placeholder="Acme Security Corp"
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Tagline
              </label>
              <input
                className="input-dark"
                value={tagline}
                onChange={e => setTagline(e.target.value)}
                placeholder="Professional security auditing…"
              />
            </div>
          </div>
        </div>

        {/* Branding */}
        <div className="glass" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <Palette size={16} color="var(--accent-bright)" />
            <h2 style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>Brand Colors</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Primary Brand Color
              </label>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <input
                    type="color"
                    value={brandColor}
                    onChange={e => setBrandColor(e.target.value)}
                    style={{ width: 48, height: 48, border: '1px solid var(--border)', borderRadius: 10, cursor: 'pointer', background: 'transparent', padding: 2 }}
                  />
                </div>
                <input
                  className="input-dark"
                  value={brandColor}
                  onChange={e => setBrandColor(e.target.value)}
                  placeholder="#6366f1"
                  style={{ flex: 1, fontFamily: 'monospace', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            {/* PDF Preview */}
            <div style={{
              padding: '1.25rem', borderRadius: '0.75rem',
              background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
            }}>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.875rem' }}>
                PDF Report Preview
              </p>
              <div style={{
                background: '#ffffff', borderRadius: '0.625rem', padding: '1.25rem',
                display: 'flex', alignItems: 'center', gap: '1rem',
              }}>
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" style={{ width: 48, height: 48, objectFit: 'contain', borderRadius: 8 }} />
                ) : (
                  <div style={{ width: 48, height: 48, borderRadius: '12px', background: brandColor, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 16px ${brandColor}60` }}>
                    <span style={{ color: '#fff', fontWeight: 900, fontSize: '1rem' }}>A</span>
                  </div>
                )}
                <div>
                  <div style={{ fontWeight: 900, fontSize: '1rem', color: '#111', letterSpacing: '-0.02em' }}>{agencyName}</div>
                  <div style={{ fontSize: '0.72rem', color: '#888', marginTop: '2px' }}>{tagline}</div>
                  <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <div style={{ height: 3, width: 48, borderRadius: 2, background: brandColor }} />
                    <span style={{ fontSize: '0.65rem', color: brandColor, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Security Report</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Logo upload */}
        <div className="glass" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <Upload size={16} color="var(--accent-bright)" />
            <h2 style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>Agency Logo</h2>
          </div>
          <div
            style={{
              border: '2px dashed var(--border)', borderRadius: '0.75rem',
              padding: '2rem', textAlign: 'center', position: 'relative', cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.5)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}
          >
            <input
              type="file"
              accept="image/png,image/svg+xml,image/jpeg"
              onChange={handleLogoUpload}
              style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
            />
            {logoPreview ? (
              <img src={logoPreview} alt="Uploaded logo" style={{ maxHeight: 80, maxWidth: 200, objectFit: 'contain', margin: '0 auto' }} />
            ) : (
              <>
                <Upload size={24} color="var(--text-muted)" style={{ margin: '0 auto 0.625rem' }} />
                <p style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Click to upload logo</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem' }}>PNG, SVG or JPEG · Max 2MB</p>
              </>
            )}
          </div>
        </div>

        {/* Data warning */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.625rem',
          padding: '0.875rem 1.25rem', borderRadius: '0.75rem',
          background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)',
        }}>
          <AlertTriangle size={14} color="var(--yellow)" style={{ flexShrink: 0 }} />
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Settings are stored locally for this demo. In production, they sync to your agency profile in the database.
          </p>
        </div>

        {/* Save button */}
        <button
          type="submit"
          className="btn-primary"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', alignSelf: 'flex-start' }}
        >
          {saved ? <><Check size={16} /> Saved!</> : <><Save size={16} /> Save Settings</>}
        </button>
      </form>
    </div>
  );
}
