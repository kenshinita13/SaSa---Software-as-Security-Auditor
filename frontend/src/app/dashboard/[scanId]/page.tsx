'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, FileText, Activity } from 'lucide-react';
import ScoreRing from '@/components/ScoreRing';
import OWASPTable from '@/components/OWASPTable';

export default function ScanResultPage() {
  const params = useParams();
  const router = useRouter();
  const scanId = params.scanId as string;
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const fetchScan = async () => {
      try {
        const res = await fetch(`http://localhost:4000/api/v1/scans/${scanId}`);
        const json = await res.json();
        
        if (res.ok) {
          setData(json);
          // If scan is finished, stop polling
          if (json.status === 'COMPLETED' || json.status === 'FAILED') {
            clearInterval(interval);
          }
        } else {
          setError(json.error || 'Failed to fetch scan');
        }
      } catch (err) {
        setError('Network error');
      }
    };

    fetchScan();
    interval = setInterval(fetchScan, 3000); // poll every 3s

    return () => clearInterval(interval);
  }, [scanId]);

  if (error) {
    return <div className="p-8 text-red-600 text-center font-bold">Error: {error}</div>;
  }

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Activity className="w-12 h-12 text-indigo-500 animate-pulse mb-4" />
        <h2 className="text-xl font-bold">Locating scan...</h2>
      </div>
    );
  }

  const isRunning = data.status === 'RUNNING' || data.status === 'PENDING';

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-8 py-4 flex items-center justify-between">
        <button onClick={() => router.push('/dashboard')} className="flex items-center text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
        </button>
        <div className="flex items-center gap-3">
          {isRunning && (
            <span className="flex items-center text-indigo-600 font-bold text-sm bg-indigo-50 px-3 py-1 rounded-full animate-pulse">
              <Activity className="w-4 h-4 mr-2" /> Audit in Progress...
            </span>
          )}
          {!isRunning && (
             <button onClick={() => window.open(`http://localhost:4000/api/v1/scans/${scanId}/pdf`, '_blank')} className="flex items-center bg-gray-900 hover:bg-gray-800 text-white font-bold py-2 px-4 rounded transition-colors text-sm">
                <FileText className="w-4 h-4 mr-2" /> Download PDF Report
             </button>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto py-8 px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Col: Target & Score */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white border p-6 rounded-2xl shadow-sm flex flex-col items-center">
            <h3 className="text-gray-500 font-bold uppercase tracking-wider text-xs mb-6">Overall Security Score</h3>
            {isRunning ? (
              <div className="w-40 h-40 flex items-center justify-center rounded-full border-8 border-gray-100 relative">
                <Activity className="w-12 h-12 text-gray-300 animate-spin" />
              </div>
            ) : (
              <ScoreRing score={data.score ?? 100} />
            )}
            <div className="mt-8 text-center w-full">
               <p className="text-sm text-gray-500 font-medium mb-1">Target URL</p>
               <p className="font-mono bg-gray-100 p-2 rounded text-sm break-all text-gray-900">{data.targetUrl}</p>
            </div>
          </div>
        </div>

        {/* Right Col: Findings */}
        <div className="md:col-span-2">
          <h2 className="text-2xl font-black mb-6 flex items-center text-gray-900">
            Detailed Findings
            <span className="ml-3 bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-sm">
              {data.findings?.length || 0} Issues
            </span>
          </h2>

          {isRunning ? (
             <div className="bg-white border rounded-xl p-12 text-center shadow-sm">
                <Activity className="w-10 h-10 text-indigo-400 animate-bounce mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900">Scanning in progress...</h3>
                <p className="text-gray-500 mt-2">The security engine is actively probing the target.</p>
             </div>
          ) : (
             <OWASPTable findings={data.findings || []} />
          )}
        </div>

      </main>
    </div>
  );
}
