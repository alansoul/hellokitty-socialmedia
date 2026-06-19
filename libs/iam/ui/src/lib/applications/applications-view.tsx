'use client';

import { useEffect, useState } from 'react';
import { AppWindow, Key, Copy, Plus, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';

// Define the shape of our data
interface Application {
  id: string;
  name: string;
  type: string;
  clientId: string;
  createdAt: string;
}

export function ApplicationsView() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  const AUTH_API = process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:3001/api';

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) throw new Error('Not authenticated');

        const res = await fetch(`${AUTH_API}/applications`, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
        });

        if (!res.ok) throw new Error('Failed to load applications');

        const data = await res.json();
        setApps(data);
      } catch {
        toast.error('Could not load applications.');
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [AUTH_API]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Client ID copied to clipboard!');
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Applications</h2>
          <p className="text-gray-500 mt-1">Setup and manage your registered applications.</p>
        </div>
        <button className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-gray-800 transition-colors">
          <Plus className="w-4 h-4" />
          Create Application
        </button>
      </div>

      {/* Applications List */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500 animate-pulse">Loading applications...</div>
        ) : apps.length === 0 ? (
          <div className="p-12 text-center">
            <AppWindow className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No applications found</h3>
            <p className="text-gray-500 mt-1">Create your first application to get started.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {apps.map((app) => (
              <li key={app.id} className="p-6 hover:bg-gray-50 transition-colors group">
                <div className="flex items-center justify-between">
                  
                  {/* Left Side: Icon & Info */}
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gray-100 text-gray-600 rounded-lg">
                      <AppWindow className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-pink-600 transition-colors cursor-pointer">
                        {app.name}
                      </h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                          {app.type}
                        </span>
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <Key className="w-3.5 h-3.5" />
                          Client ID: <span className="font-mono text-gray-700">{app.clientId.substring(0, 16)}...</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Actions */}
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => copyToClipboard(app.clientId)}
                      className="text-gray-400 hover:text-gray-900 px-3 py-1.5 border border-gray-200 bg-white rounded-lg text-sm font-medium shadow-sm transition-colors flex items-center gap-2"
                    >
                      <Copy className="w-4 h-4" />
                      Copy ID
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </div>

                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}