'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Plus, Link as LinkIcon, Loader2 } from 'lucide-react';

export default function Dashboard() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [scanning, setScanning] = useState(false);

  const startScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setScanning(true);
    try {
      const apiKey = localStorage.getItem('sasa_api_key');
      const res = await fetch('http://localhost:4000/api/v1/scans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': apiKey ? `Bearer ${apiKey}` : ''
        },
        body: JSON.stringify({ targetUrl: url })
      });

      const data = await res.json();
      if (data.scanId) {
        router.push(`/dashboard/${data.scanId}`);
      } else {
        alert('Scan failed: ' + (data.error || 'Unknown error'));
        setScanning(false);
      }
    } catch (err) {
      console.error(err);
      alert('Network error starting scan');
      setScanning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-8 h-8 text-indigo-600" />
          <h1 className="text-2xl font-black tracking-tight text-gray-900">SaSa Dashboard</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-500">Agency ID: acme_corp_89</span>
          <button onClick={() => {
            localStorage.clear();
            router.push('/login');
          }} className="text-sm font-bold text-red-600 hover:bg-red-50 px-3 py-1.5 rounded">Logout</button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-12 px-4">
        <div className="bg-white rounded-2xl shadow-sm border p-8">
          <h2 className="text-2xl font-bold mb-6">Start New Security Audit</h2>
          
          <form onSubmit={startScan} className="flex gap-4">
            <div className="flex-1 relative">
              <LinkIcon className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
              <input 
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none text-gray-900"
              />
            </div>
            <button 
              type="submit" 
              disabled={scanning}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-8 py-3 rounded-xl font-bold transition-colors flex items-center gap-2 shadow-lg shadow-indigo-200"
            >
              {scanning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              {scanning ? 'Initiating Scan...' : 'Run Audit'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
