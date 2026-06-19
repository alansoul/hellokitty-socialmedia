import { AuthConsoleSidebar, AuthConsoleTopNav } from '@hellokitty/iam-ui';

export default function AuthConsoleLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-white font-sans overflow-hidden">
      
      {/* ✨ The Smart Sidebar Component */}
      <AuthConsoleSidebar />

      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* ✨ The Smart Navbar Component */}
        <AuthConsoleTopNav />

        {/* The Page Content */}
        <main className="flex-1 overflow-y-auto p-8 bg-[#FAFAFA]">
          <div className="max-w-5xl mx-auto">
            {children}
          </div>
        </main>
      </div>

    </div>
  );
}