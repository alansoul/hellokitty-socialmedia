'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, ChevronDown, Check, Plus, Settings, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface Organization {
  id: string;
  name: string;
  myRole: string;
}

export function OrgSwitcher() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [activeOrg, setActiveOrg] = useState<Organization | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const router = useRouter();
  const AUTH_API = process.env['NEXT_PUBLIC_AUTH_API_URL'] || 'http://localhost:3001/api';

  useEffect(() => {
    const fetchOrgs = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) return;

        const res = await fetch(`${AUTH_API}/organizations`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401) {
          localStorage.removeItem('access_token');
          router.push('/login');
          return;
        }

        if (res.ok) {
          const data: Organization[] = await res.json();
          setOrgs(data);

          // 🔍 Active Context Strategy: Check if there is an active org in local storage
          const savedActiveOrgId = localStorage.getItem('active_org_id');
          const matchedOrg = data.find((o) => o.id === savedActiveOrgId);

          if (matchedOrg) {
            setActiveOrg(matchedOrg);
          } else if (data.length > 0) {
            // Default to the first organization if none is saved
            setActiveOrg(data[0]);
            localStorage.setItem('active_org_id', data[0].id);
          }
        }
      } catch {
        console.error('Failed to load workspaces.');
      }
    };

    fetchOrgs();

    // Close dropdown on click outside
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSwitchOrg = (org: Organization) => {
    setActiveOrg(org);
    localStorage.setItem('active_org_id', org.id);
    setIsOpen(false);
    toast.success(`Switched active workspace to: ${org.name}`);
    
    // Refresh the page to reload active dashboard queries under this new context
    router.refresh();
  };

  return (
    <div className="relative font-sans shrink-0" ref={dropdownRef}>
      {/* Switcher Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 bg-white border border-gray-200 hover:bg-gray-50 px-3.5 py-2 rounded-xl text-sm font-semibold shadow-sm transition-all outline-none"
      >
        <Building2 className="w-4 h-4 text-pink-500" />
        <span className="text-gray-900 truncate max-w-[120px]">
          {activeOrg ? activeOrg.name : 'Personal Account'}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden py-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="px-4 py-2 border-b border-gray-100 mb-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Workspaces ({orgs.length})
            </span>
          </div>

          {orgs.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-400 text-center">
              No workspaces found.
            </div>
          ) : (
            <ul className="max-h-48 overflow-y-auto divide-y divide-gray-50">
              {orgs.map((org) => {
                const isSelected = activeOrg?.id === org.id;
                return (
                  <li key={org.id}>
                    <button
                      onClick={() => handleSwitchOrg(org)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {org.name}
                        </p>
                        <span className="inline-flex items-center gap-1 text-[10px] text-gray-400 font-medium mt-0.5">
                          <Shield className="w-3 h-3 text-pink-400" />
                          {org.myRole}
                        </span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-green-500 shrink-0" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Action Links */}
          <div className="border-t border-gray-100 mt-1 pt-1.5 px-1.5 space-y-0.5">
            <button
              onClick={() => {
                setIsOpen(false);
                router.push('/organizations');
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Create Organization
            </button>
            <button
              onClick={() => {
                setIsOpen(false);
                router.push('/settings');
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              Workspace Settings
            </button>
          </div>
        </div>
      )}
    </div>
  );
}