'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  AppWindow,
  Users,
  Building2,
  ShieldCheck,
  Settings,
  Activity,
  LogOut,
  Loader2,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Applications', href: '/applications', icon: AppWindow },
  { name: 'Authentication', href: '/authentication', icon: ShieldCheck },
  { name: 'Organizations', href: '/organizations', icon: Building2 },
  { name: 'User Management', href: '/users', icon: Users },
  { name: 'Logs & Events', href: '/event-streams', icon: Activity },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function AuthConsoleSidebar() {
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);
  const AUTH_API = process.env['NEXT_PUBLIC_AUTH_API_URL'] || 'http://localhost:3001/api';

  // ✨ Upgraded: Call the secure logout API to destroy HttpOnly cookies! [10]
  const handleSignOut = async () => {
    setLoggingOut(true);
    try {
      await fetch(`${AUTH_API}/auth/logout`, {
        method: 'POST',
        credentials: 'include', // ✨ Required to pass cookie credentials
      });
    } catch {
      // Proceed to clear local storage anyway if API is unreachable
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
    }
  };

  return (
    <aside className="w-64 bg-[#F9FAFB] border-r border-gray-200 flex flex-col h-full">
      {/* Logo Area */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200/60 bg-white">
        <Link
          href="/dashboard"
          className="text-xl font-black italic tracking-tighter text-gray-900 drop-shadow-sm"
        >
          HelloKitty<span className="text-pink-500">.Auth</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-white text-gray-900 shadow-sm border border-gray-200/60'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900 border border-transparent'
              }`}
            >
              <Icon
                className={`w-[18px] h-[18px] ${isActive ? 'text-pink-500' : 'text-gray-400'}`}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Profile / Logout */}
      <div className="p-4 border-t border-gray-200/60 bg-white">
        <button
          onClick={handleSignOut}
          disabled={loggingOut}
          className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-md transition-colors group disabled:opacity-50"
        >
          {loggingOut ? (
            <Loader2 className="w-[18px] h-[18px] animate-spin text-red-500" />
          ) : (
            <LogOut className="w-[18px] h-[18px] group-hover:text-red-500 text-gray-400" />
          )}
          {loggingOut ? 'Signing Out...' : 'Sign Out'}
        </button>
      </div>
    </aside>
  );
}