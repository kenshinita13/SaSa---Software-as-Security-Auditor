import React from 'react';

export const metadata = {
  title: 'Sign In — SaSa',
};

export default function LoginPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background glow orbs */}
      <div style={{
        position: 'absolute', top: '20%', left: '15%',
        width: 400, height: 400,
        background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '15%', right: '10%',
        width: 300, height: 300,
        background: 'radial-gradient(circle, rgba(129,140,248,0.1) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />

      {/* Auth card — dynamically imported to keep server component */}
      <AuthSelectorClient />
    </div>
  );
}

// Inline client wrapper to avoid circular import
import AuthSelector from '@/components/AuthSelector';
function AuthSelectorClient() {
  return <AuthSelector />;
}
