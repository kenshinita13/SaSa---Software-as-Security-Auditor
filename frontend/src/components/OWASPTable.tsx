import React from 'react';
import { ShieldAlert } from 'lucide-react';

interface Finding {
  category: string;
  title: string;
  description: string;
  evidence: string;
}

export default function OWASPTable({ findings }: { findings: Finding[] }) {
  if (!findings || findings.length === 0) {
    return (
      <div className="p-8 bg-green-50 border border-green-200 rounded-xl flex items-center space-x-4">
        <ShieldAlert className="text-green-600 w-8 h-8" />
        <div>
          <h3 className="text-green-900 font-bold text-lg">No Vulnerabilities Detected</h3>
          <p className="text-green-700">The application passed all OWASP Top 10 automated checks.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border rounded-xl shadow-sm bg-white">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b">
            <th className="p-4 font-semibold text-gray-600">Category</th>
            <th className="p-4 font-semibold text-gray-600">Vulnerability</th>
            <th className="p-4 font-semibold text-gray-600">Evidence</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {findings.map((f, i) => (
            <tr key={i} className="hover:bg-gray-50 transition-colors">
              <td className="p-4 align-top">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800">
                  {f.category}
                </span>
              </td>
              <td className="p-4 align-top">
                <p className="font-bold text-gray-900">{f.title}</p>
                <p className="text-sm text-gray-600 mt-1">{f.description}</p>
              </td>
              <td className="p-4 align-top">
                <div className="bg-gray-100 text-gray-800 font-mono text-xs p-3 rounded border overflow-x-auto max-w-md">
                  {f.evidence}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
