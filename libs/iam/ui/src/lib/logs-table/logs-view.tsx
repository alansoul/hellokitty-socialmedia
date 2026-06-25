'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Activity,
  ShieldAlert,
  LogIn,
  AppWindow,
  Building2,
  Plus,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

interface AuditLog {
  id: string;
  action: string;
  actor: string;
  details: string | null;
  createdAt: string;
}

export function LogsView() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const router = useRouter();
  const AUTH_API =
    process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:3001/api';

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        router.push('/login');
        return;
      }

      const res = await fetch(`${AUTH_API}/logs`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        localStorage.removeItem('access_token');
        router.push('/login');
        return;
      }

      if (!res.ok) throw new Error('Failed to load logs');

      const data = await res.json();
      setLogs(data);
    } catch {
      toast.error('Could not load audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✨ A helper to test the system by injecting dummy events
  const handleTestEvent = async () => {
    setIsGenerating(true);
    try {
      const token = localStorage.getItem('access_token');
      const sampleActions = [
        'user.login',
        'app.created',
        'mfa.setup',
        'org.created',
        'user.logout',
      ];
      const randomAction =
        sampleActions[Math.floor(Math.random() * sampleActions.length)];

      const res = await fetch(`${AUTH_API}/logs/test-event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: randomAction,
          details: 'Triggered manually via Admin Console',
        }),
      });

      if (!res.ok) throw new Error('Failed to generate log');

      toast.success(`Generated test event: ${randomAction}`);
      fetchLogs(); // Instantly refresh the table
    } catch (error: unknown) {
      if (error instanceof Error) toast.error(error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Helper to pick the right icon and color based on the action name
  const getEventIcon = (action: string) => {
    if (action.includes('login') || action.includes('logout')) {
      return (
        <div className="p-2 bg-green-50 text-green-600 rounded-lg">
          <LogIn className="w-4 h-4" />
        </div>
      );
    }
    if (action.includes('app')) {
      return (
        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
          <AppWindow className="w-4 h-4" />
        </div>
      );
    }
    if (action.includes('mfa') || action.includes('security')) {
      return (
        <div className="p-2 bg-red-50 text-red-600 rounded-lg">
          <ShieldAlert className="w-4 h-4" />
        </div>
      );
    }
    if (action.includes('org')) {
      return (
        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
          <Building2 className="w-4 h-4" />
        </div>
      );
    }
    return (
      <div className="p-2 bg-gray-100 text-gray-600 rounded-lg">
        <Activity className="w-4 h-4" />
      </div>
    );
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Logs & Events</h2>
          <p className="text-gray-500 mt-1">
            Immutable audit trail of all security and administrative actions.
          </p>
        </div>
        <button
          onClick={handleTestEvent}
          disabled={isGenerating}
          className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          {isGenerating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          Generate Test Event
        </button>
      </div>

      {/* Logs Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500 animate-pulse">
            Fetching audit logs...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center">
            <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">
              No events found
            </h3>
            <p className="text-gray-500 mt-1">
              Activity in this tenant will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Event
                  </th>
                  <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actor
                  </th>
                  <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                  <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        {getEventIcon(log.action)}
                        <span className="font-semibold text-gray-900 font-mono text-sm tracking-tight">
                          {log.action}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-700 font-medium">
                      {log.actor || 'System'}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-500 max-w-xs truncate">
                      {log.details || '-'}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-500 text-right whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
