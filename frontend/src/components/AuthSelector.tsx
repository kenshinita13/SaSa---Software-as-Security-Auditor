'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Key, UserSquare, Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function AuthSelector() {
  const router = useRouter();
  const [method, setMethod] = useState<'jwt' | 'apikey'>('jwt');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [apiKey, setApiKey] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate auth delay
    await new Promise(r => setTimeout(r, 800));
    if (method === 'apikey') {
      localStorage.setItem('sasa_api_key', apiKey || 'sk_sasa_demo_key');
    } else {
      localStorage.setItem('sasa_auth_method', 'jwt');
    }
    router.push('/dashboard');
  };

  return (
    <div style={{
      width: '100%', maxWidth: 420,
      background: 'rgba(14, 21, 41, 0.9)',
      border: '1px solid var(--border)',
      borderRadius: '1.25rem',
      padding: '2.5rem',
      backdropFilter: 'blur(24px)',
      boxShadow: '0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.1)',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{
          width: 52, height: 52, margin: '0 auto 1rem',
          background: 'linear-gradient(135deg, #6366f1, #818cf8)',
          borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 24px rgba(99,102,241,0.5)',
        }}>
          <ShieldCheck size={24} color="#fff" />
        </div>
        <h1 style={{ fontWeight: 900, fontSize: '1.6rem', letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
          SaSa
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
          Software as Security Auditor
        </p>
      </div>

      {/* Auth Method Toggle */}
      <div style={{
        display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '0.625rem',
        padding: '4px', marginBottom: '1.75rem', border: '1px solid var(--border)',
      }}>
        {(['jwt', 'apikey'] as const).map(m => (
          <button
            key={m}
            onClick={() => setMethod(m)}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '0.4rem', padding: '0.5rem', borderRadius: '0.45rem',
              border: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
              transition: 'all 0.2s ease',
              background: method === m ? 'rgba(99,102,241,0.2)' : 'transparent',
              color: method === m ? 'var(--accent-bright)' : 'var(--text-secondary)',
              boxShadow: method === m ? '0 0 0 1px rgba(99,102,241,0.3)' : 'none',
            }}
          >
            {m === 'jwt' ? <UserSquare size={14} /> : <Key size={14} />}
            {m === 'jwt' ? 'User Login' : 'API Key'}
          </button>
        ))}
      </div>

      {/* Form */}
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {method === 'jwt' ? (
          <>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Email Address
              </label>
              <input
                type="email" required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@agency.com"
                className="input-dark"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-dark"
                  style={{ paddingRight: '2.75rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  style={{
                    position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                  }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
              API Key
            </label>
            <input
              type="password"
              required
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="sk_sasa_live_..."
              className="input-dark"
              style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
            />
            <p style={{ marginTop: '0.4rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Generate API keys from Dashboard → API Keys
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary"
          style={{ width: '100%', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.9rem' }}
        >
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
              Signing in...
            </span>
          ) : (
            <>Sign In <ArrowRight size={16} /></>
          )}
        </button>
      </form>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
