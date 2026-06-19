'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AppWindow,
  Key,
  Copy,
  Plus,
  MoreHorizontal,
  X,
  Loader2,
} from 'lucide-react';
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

  // ✨ Modal State
  const [showModal, setShowModal] = useState(false);
  const [appName, setAppName] = useState('');
  const [appType, setAppType] = useState('SPA');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();
  const AUTH_API =
    process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:3001/api';

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const token = localStorage.getItem('access_token');
        // ✨ Secure Redirect: No token? Go to login!
        if (!token) {
          router.push('/login');
          return;
        }

        const res = await fetch(`${AUTH_API}/applications`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // ✨ Secure Redirect: Token expired? Go to login!
        if (res.status === 401) {
          localStorage.removeItem('access_token');
          router.push('/login');
          return;
        }

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
  }, [AUTH_API, router]); // ✨ Added router to dependencies

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Client ID copied to clipboard!');
  };

  // ✨ Dynamic Create App Function
  const handleCreateApp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        router.push('/login');
        return;
      }

      const res = await fetch(`${AUTH_API}/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: appName, type: appType }),
      });

      if (res.status === 401) {
        localStorage.removeItem('access_token');
        router.push('/login');
        return;
      }

      if (!res.ok) throw new Error('Failed to create application');

      const newApp = await res.json();

      // Add the new app to the top of the list instantly!
      setApps([newApp, ...apps]);
      setShowModal(false);
      setAppName('');

      toast.success('Application created successfully!');
      toast(`Client ID: ${newApp.clientId}`);
    } catch (error: unknown) {
      if (error instanceof Error) toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Applications</h2>
          <p className="text-gray-500 mt-1">
            Setup and manage your registered applications.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Application
        </button>
      </div>

      {/* Applications List */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500 animate-pulse">
            Loading applications...
          </div>
        ) : apps.length === 0 ? (
          <div className="p-12 text-center">
            <AppWindow className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">
              No applications found
            </h3>
            <p className="text-gray-500 mt-1">
              Create your first application to get started.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {apps.map((app) => (
              <li
                key={app.id}
                className="p-6 hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center justify-between">
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
                          Client ID:{' '}
                          <span className="font-mono text-gray-700">
                            {app.clientId.substring(0, 16)}...
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
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

      {/* ✨ CREATE APPLICATION MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">
                Create Application
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateApp} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Application Name
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 outline-none transition-all"
                  placeholder="e.g. My React App"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Application Type
                </label>
                <select
                  value={appType}
                  onChange={(e) => setAppType(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 outline-none transition-all bg-white"
                >
                  <option value="SPA">
                    Single Page Application (React, Vue, Angular)
                  </option>
                  <option value="WEB">
                    Regular Web Application (Node, Python)
                  </option>
                  <option value="M2M">Machine to Machine (API to API)</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !appName}
                  className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
