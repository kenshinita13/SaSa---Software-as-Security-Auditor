'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Key, UserSquare } from 'lucide-react';

export default function AuthSelector() {
  const router = useRouter();
  const [method, setMethod] = useState<'jwt' | 'apikey'>('jwt');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (method === 'apikey') {
      localStorage.setItem('sasa_api_key', 'sk_sasa_dummy_key');
    }
    router.push('/dashboard');
  };

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-black text-indigo-600 tracking-tight">SaSa</h1>
        <p className="text-gray-500 mt-2 font-medium">Software as Security Auditor</p>
      </div>

      <div className="flex bg-gray-100 p-1 rounded-lg mb-8">
        <button
          onClick={() => setMethod('jwt')}
          className={`flex-1 flex items-center justify-center py-2 text-sm font-semibold rounded-md transition-all ${
            method === 'jwt' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <UserSquare className="w-4 h-4 mr-2" /> User Login
        </button>
        <button
          onClick={() => setMethod('apikey')}
          className={`flex-1 flex items-center justify-center py-2 text-sm font-semibold rounded-md transition-all ${
            method === 'apikey' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Key className="w-4 h-4 mr-2" /> API Key
        </button>
      </div>

      <form onSubmit={handleLogin} className="space-y-5">
        {method === 'jwt' ? (
          <>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
              <input type="email" required className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" placeholder="admin@agency.com" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
              <input type="password" required className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" placeholder="••••••••" />
            </div>
          </>
        ) : (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">API Key</label>
            <input type="password" required className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-mono text-sm" placeholder="sk_sasa_..." />
          </div>
        )}

        <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-lg shadow-indigo-200">
          Sign In
        </button>
      </form>
    </div>
  );
}
