'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ShieldCheck,
  LayoutDashboard,
  History,
  FileText,
  Key,
  Settings,
  LogOut,
  Zap,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard',          label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/dashboard/history',  label: 'Scan History', icon: History },
  { href: '/dashboard/reports',  label: 'Reports',      icon: FileText },
  { href: '/dashboard/api-keys', label: 'API Keys',     icon: Key },
  { href: '/dashboard/settings', label: 'Settings',     icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  return (
    <aside
      style={{
        width: 'var(--sidebar-w)',
        minHeight: '100vh',
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 40,
      }}
    >
      {/* Logo */}
      <div style={{ padding: '1.5rem 1.25rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{
            width: 36, height: 36,
            background: 'linear-gradient(135deg, #6366f1, #818cf8)',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 16px rgba(99,102,241,0.4)',
          }}>
            <ShieldCheck size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 900, fontSize: '1.1rem', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>SaSa</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase', marginTop: '-1px' }}>Security Auditor</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.625rem 0.875rem',
                borderRadius: '0.625rem',
                fontSize: '0.875rem',
                fontWeight: active ? 700 : 500,
                color: active ? '#fff' : 'var(--text-secondary)',
                background: active ? 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(129,140,248,0.15))' : 'transparent',
                border: active ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
                textDecoration: 'none',
                transition: 'all 0.15s ease',
                position: 'relative',
              }}
              onMouseEnter={e => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
                  (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                  (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
                }
              }}
            >
              <Icon size={16} style={{ flexShrink: 0, color: active ? 'var(--accent-bright)' : 'inherit' }} />
              {label}
              {active && (
                <div style={{
                  position: 'absolute', right: 10, width: 6, height: 6,
                  borderRadius: '50%', background: 'var(--accent-bright)',
                  boxShadow: '0 0 8px var(--accent)',
                }} />
              )}
            </Link>
          );
        })}

        {/* Quick Scan CTA */}
        <div style={{ marginTop: '1rem', padding: '0 0.125rem' }}>
          <Link
            href="/dashboard"
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.625rem 0.875rem',
              borderRadius: '0.625rem',
              background: 'linear-gradient(135deg, #6366f1, #818cf8)',
              color: '#fff', fontWeight: 700, fontSize: '0.8rem',
              textDecoration: 'none',
              boxShadow: '0 0 20px rgba(99,102,241,0.3)',
              transition: 'all 0.2s ease',
            }}
          >
            <Zap size={14} />
            New Scan
          </Link>
        </div>
      </nav>

      {/* Footer */}
      <div style={{ padding: '1rem 0.75rem', borderTop: '1px solid var(--border)' }}>
        <div style={{
          padding: '0.5rem 0.875rem',
          borderRadius: '0.625rem',
          background: 'rgba(255,255,255,0.03)',
          marginBottom: '0.5rem',
        }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Agency</div>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '2px' }}>Acme Security Corp</div>
        </div>
        <button
          onClick={handleLogout}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '0.5rem 0.875rem', borderRadius: '0.625rem',
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500,
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = 'var(--red-bg)';
            (e.currentTarget as HTMLElement).style.color = 'var(--red)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = 'transparent';
            (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
          }}
        >
          <LogOut size={15} />
          Logout
        </button>
      </div>
    </aside>
  );
}
