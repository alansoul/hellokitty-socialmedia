'use client';

import { useState } from 'react';
import { Activity, AppWindow, Users, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function DashboardView() {
  const [loading, setLoading] = useState(false);
  const AUTH_API =
    process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:3001/api';

  const handleCreateApp = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(`${AUTH_API}/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: 'My Awesome React App',
          type: 'SPA',
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to create application');
      }

      const newApp = await res.json();

      toast.success('Application created successfully!');
      toast(`Your new Client ID is: ${newApp.clientId}`);
    } catch (error: unknown) {
      // ✨ ENTERPRISE FIX: Safe error checking without using 'any'!
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-500 mt-1">
          Overview of your HelloKitty Auth tenant.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">1</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
              <AppWindow className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Applications</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-lg">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Logins (24h)</p>
              <p className="text-2xl font-bold text-gray-900">4</p>
            </div>
          </div>
        </div>
      </div>

      {/* Getting Started Section */}
      <div className="bg-gray-900 rounded-xl p-8 text-white mt-8 shadow-md">
        <h3 className="text-xl font-bold mb-2">Getting Started</h3>
        <p className="text-gray-400 mb-6 max-w-2xl">
          To start authenticating users in your own applications, you need to
          register an Application to get a Client ID.
        </p>

        <button
          onClick={handleCreateApp}
          disabled={loading}
          className="flex items-center justify-center gap-2 bg-white text-gray-900 px-5 py-2.5 rounded-lg font-semibold hover:bg-gray-100 transition-colors disabled:opacity-70"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? 'Generating Keys...' : 'Create Application'}
        </button>
      </div>
    </div>
  );
}
