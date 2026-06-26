'use client'; // ✨ This layout now runs client-side to check localStorage

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthConsoleSidebar, AuthConsoleTopNav, StepUpProvider  } from '@hellokitty/iam-ui';
import { Loader2 } from 'lucide-react'; // ✨ Loading spinner

export default function AuthConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ✨ Add the checking state
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // ✨ Instantly check for the token when ANY dashboard page loads
    const token = localStorage.getItem('access_token');

    if (!token) {
      router.push('/login'); // Kick them out!
    } else {
      setIsCheckingAuth(false); // Let them in!
    }
  }, [router]);

  // ✨ Show a spinner while checking to prevent UI flickering
  if (isCheckingAuth) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  // ✨ If they have a token, render the beautiful shell
  return (
    // ✨ Wrap the entire dashboard console shell
    <StepUpProvider>
      <div className="flex h-screen bg-white font-sans overflow-hidden">
        <AuthConsoleSidebar />

        <div className="flex-1 flex flex-col relative overflow-hidden">
          <AuthConsoleTopNav />

          <main className="flex-1 overflow-y-auto p-8 bg-[#FAFAFA]">
            <div className="max-w-5xl mx-auto">{children}</div>
          </main>
        </div>
      </div>
    </StepUpProvider>
  );
}
