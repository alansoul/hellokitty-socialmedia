'use client';

import { Search, Bell } from 'lucide-react';

export function AuthConsoleTopNav() {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 z-10 sticky top-0">
      
      {/* Left side: Context/Tenant */}
      <div className="flex items-center gap-4">
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Current Tenant</span>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-sm font-medium text-gray-900">us-east-1 (Default)</span>
          </div>
        </div>
      </div>

      {/* Right side: Search & Profile */}
      <div className="flex items-center gap-6">
        {/* Fake Search Bar (Command Palette style) */}
        <div className="hidden md:flex items-center px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-400 w-64 hover:bg-gray-100 transition-colors cursor-text">
          <Search className="w-4 h-4 mr-2" />
          Search or jump to... 
          <span className="ml-auto border border-gray-200 bg-white rounded px-1.5 text-xs text-gray-400 font-mono shadow-sm">⌘K</span>
        </div>

        <button className="text-gray-400 hover:text-gray-600 transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-pink-500 rounded-full border-2 border-white"></span>
        </button>

        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 to-orange-400 border border-gray-200 shadow-sm cursor-pointer hover:opacity-90 transition-opacity"></div>
      </div>
    </header>
  );
}