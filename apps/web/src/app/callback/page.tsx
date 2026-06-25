'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function CallbackContent() {
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  const code = searchParams.get('code');
  const errParam = searchParams.get('error');

  const AUTH_API =
    process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:3001/api';
  const CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID || '';

  useEffect(() => {
    if (errParam) {
      setError('Access Denied. You did not authorize the application.');
      return;
    }

    if (!code) return;

    // ✨ THE MAGIC: Exchange the 60-second code for the real JWT Tokens!
    const exchangeCode = async () => {
      try {
        // ✨ Read the browser-cached verifier to satisfy PKCE S256 verification
        // ✨ Upgraded: Prevent Jest from crashing on sessionStorage in headless runs
        const codeVerifier =
          typeof window !== 'undefined'
            ? sessionStorage.getItem('code_verifier') || ''
            : '';

        const res = await fetch(`${AUTH_API}/oauth/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            grant_type: 'authorization_code',
            client_id: CLIENT_ID,
            code: code,
            redirect_uri: 'http://localhost:3000/callback',
            code_verifier: codeVerifier, // ✨ Send the verifier to prove we are the original client
          }),
          credentials: 'include', // ✨ REQUIRED for cross-origin cookies!
        });

        if (!res.ok) throw new Error('Failed to exchange code for tokens');

        const data = await res.json();

        // Save the tokens in the Social App's Local Storage!
        localStorage.setItem('access_token', data.access_token);
        if (data.refresh_token)
          localStorage.setItem('refresh_token', data.refresh_token);

        // Clear the sessionStorage verifier to keep storage clean
        sessionStorage.removeItem('code_verifier');

        // Success! Send them to the feed!
        router.push('/');
      } catch (err) {
        console.error(err);
        setError('Fatal Error: Could not authenticate with Identity Provider.');
      }
    };

    exchangeCode();
  }, [code, errParam, router, AUTH_API, CLIENT_ID]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-red-600 font-bold p-4 text-center">
        <p>{error}</p>
        <button
          onClick={() => router.push('/')}
          className="mt-4 text-blue-500 underline"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <Loader2 className="w-12 h-12 animate-spin text-pink-500 mb-4" />
      <p className="text-gray-600 font-medium">
        Authenticating with HelloKitty Auth...
      </p>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CallbackContent />
    </Suspense>
  );
}
