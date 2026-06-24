import React from 'react';
import AuthSelector from '@/components/AuthSelector';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <AuthSelector />
    </div>
  );
}
