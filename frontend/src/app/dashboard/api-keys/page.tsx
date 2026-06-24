'use client';
import React, { useState } from 'react';
import { Key, Plus, Copy, Trash2, Check, Clock, Eye, EyeOff } from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  created: string;
  lastUsed: string | null;
  active: boolean;
}

const maskKey = (k: string, show: boolean) => show ? k : k.slice(0, 12) + '••••••••••••••••';

const INITIAL_KEYS: ApiKey[] = [
  { id: 'k1', name: 'CI/CD Pipeline',  key: 'sk_sasa_live_a1b2c3d4e5f6g7h8', created: new Date(Date.now() - 604800000).toISOString(), lastUsed: new Date(Date.now() - 3600000).toISOString(),  active: true  },
  { id: 'k2', name: 'Staging Monitor', key: 'sk_sasa_live_x9y8z7w6v5u4t3s2', created: new Date(Date.now() - 1209600000).toISOString(), lastUsed: new Date(Date.now() - 86400000).toISOString(), active: true  },
  { id: 'k3', name: 'Old Integration', key: 'sk_sasa_live_q1w2e3r4t5y6u7i8', created: new Date(Date.now() - 2592000000).toISOString(), lastUsed: null,                                          active: false },
];

const formatDate = (iso: string | null) => {
  if (!iso) return 'Never';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>(INITIAL_KEYS);
  const [newKeyName, setNewKeyName] = useState('');
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    setCreating(true);
    await new Promise(r => setTimeout(r, 600));
    const newKey: ApiKey = {
      id: `k${Date.now()}`,
      name: newKeyName.trim(),
      key: `sk_sasa_live_${Math.random().toString(36).slice(2, 18)}`,
      created: new Date().toISOString(),
      lastUsed: null,
      active: true,
    };
    setKeys(k => [newKey, ...k]);
    setNewKeyName('');
    setShowForm(false);
    setCreating(false);
    // Auto-reveal new key
    setShowKey(prev => ({ ...prev, [newKey.id]: true }));
  };

  const handleCopy = (id: string, key: string) => {
    navigator.clipboard.writeText(key);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleRevoke = (id: string) => {
    if (confirm('Revoke this API key? This cannot be undone.')) {
      setKeys(k => k.map(key => key.id === id ? { ...key, active: false } : key));
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Key size={20} color="var(--accent-bright)" />
          <h1 style={{ fontWeight: 900, fontSize: '1.5rem', color: 'var(--text-primary)' }}>API Keys</h1>
        </div>
        <button
          onClick={() => setShowForm(f => !f)}
          className="btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', padding: '0.5rem 1.25rem' }}
        >
          <Plus size={15} /> New Key
        </button>
      </div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.75rem' }}>
        Use API keys to authenticate CI/CD pipelines or external integrations.
      </p>

      {/* Create form */}
      {showForm && (
        <div className="glass" style={{ padding: '1.5rem', borderRadius: '1rem', marginBottom: '1.5rem', border: '1px solid rgba(99,102,241,0.25)' }}>
          <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>Create New API Key</h3>
          <form onSubmit={handleCreate} style={{ display: 'flex', gap: '0.75rem' }}>
            <input
              className="input-dark"
              style={{ flex: 1 }}
              placeholder="Key name (e.g. GitHub Actions)"
              value={newKeyName}
              onChange={e => setNewKeyName(e.target.value)}
              required
            />
            <button type="submit" disabled={creating} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap' }}>
              {creating ? 'Creating…' : <><Plus size={14} /> Create</>}
            </button>
          </form>
          <p style={{ marginTop: '0.625rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            The full key will only be shown once. Store it securely.
          </p>
        </div>
      )}

      {/* Keys list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {keys.map(k => (
          <div
            key={k.id}
            className="glass"
            style={{
              padding: '1.25rem 1.5rem', borderRadius: '1rem',
              opacity: k.active ? 1 : 0.5,
              borderColor: k.active ? 'var(--border)' : 'rgba(255,255,255,0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {/* Icon */}
              <div style={{
                width: 40, height: 40, borderRadius: '10px', flexShrink: 0,
                background: k.active ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.04)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Key size={16} color={k.active ? 'var(--accent-bright)' : 'var(--text-muted)'} />
              </div>

              {/* Key info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.35rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{k.name}</span>
                  {!k.active && (
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.1rem 0.4rem', borderRadius: '999px', background: 'var(--red-bg)', color: 'var(--red)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Revoked
                    </span>
                  )}
                </div>
                <code style={{
                  fontSize: '0.78rem', fontFamily: 'monospace',
                  color: 'var(--text-secondary)', letterSpacing: '0.03em',
                }}>
                  {maskKey(k.key, !!showKey[k.id])}
                </code>
                <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.4rem' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Clock size={10} /> Created {formatDate(k.created)}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Last used: {formatDate(k.lastUsed)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              {k.active && (
                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                  <button
                    onClick={() => setShowKey(p => ({ ...p, [k.id]: !p[k.id] }))}
                    title={showKey[k.id] ? 'Hide key' : 'Show key'}
                    style={{ width: 34, height: 34, borderRadius: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}
                  >
                    {showKey[k.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button
                    onClick={() => handleCopy(k.id, k.key)}
                    title="Copy key"
                    style={{ width: 34, height: 34, borderRadius: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: copied === k.id ? 'var(--green)' : 'var(--text-secondary)' }}
                  >
                    {copied === k.id ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                  <button
                    onClick={() => handleRevoke(k.id)}
                    title="Revoke key"
                    style={{ width: 34, height: 34, borderRadius: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--red-bg)'; (e.currentTarget as HTMLElement).style.color = 'var(--red)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
