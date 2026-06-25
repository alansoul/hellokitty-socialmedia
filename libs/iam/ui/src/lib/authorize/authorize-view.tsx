'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldAlert, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

function AuthorizeContent() {
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const router = useRouter();
  const searchParams = useSearchParams();

  // Extract OAuth2 standard parameters from the URL
  const clientId = searchParams.get('client_id');
  const redirectUri = searchParams.get('redirect_uri');
  const state = searchParams.get('state');

  // ✨ Read the PKCE challenge fields from the URL parameters
  const codeChallenge = searchParams.get('code_challenge');
  const codeChallengeMethod =
    searchParams.get('code_challenge_method') || 'S256';

  const AUTH_API =
    process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:3001/api';

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      // Pass the current full URL so the login page knows where to send them back!
      const currentUrl = encodeURIComponent(
        window.location.pathname + window.location.search,
      );
      router.push(`/login?returnTo=${currentUrl}`);
    } else {
      setCheckingAuth(false);
    }
  }, [router]);

  const handleAuthorize = async () => {
    if (!clientId || !redirectUri) {
      toast.error('Missing client_id or redirect_uri');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');

      // 1. Call our secure backend to generate the 60-second code
      const res = await fetch(`${AUTH_API}/oauth/authorize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          client_id: clientId,
          redirect_uri: redirectUri,
          code_challenge: codeChallenge, // ✨ Forward challenge
          code_challenge_method: codeChallengeMethod, // ✨ Forward method
        }),
        credentials: 'include', // ✨ REQUIRED for cross-origin cookies!
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Authorization failed');
      }

      const data = await res.json();

      // 2. We got the code! Now we redirect the user BACK to the 3rd-party app.
      // We also pass back the 'state' parameter if they provided one (OAuth2 Security standard).
      const finalRedirectUrl = `${redirectUri}?code=${data.code}${state ? `&state=${state}` : ''}`;

      toast.success('Authorized! Redirecting...');

      // Send them back to the app!
      window.location.href = finalRedirectUrl;
    } catch (error: unknown) {
      if (error instanceof Error) toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeny = () => {
    if (!redirectUri) return router.push('/');
    // Standard OAuth2 error redirect
    window.location.href = `${redirectUri}?error=access_denied&error_description=The user denied access`;
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  if (!clientId || !redirectUri) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-red-100">
          <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900">Invalid Request</h2>
          <p className="text-gray-500 mt-2">
            Missing required OAuth parameters (client_id or redirect_uri).
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 max-w-md w-full overflow-hidden">
        {/* Header Branding */}
        <div className="bg-gray-900 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 to-orange-400"></div>
          <h2 className="text-2xl font-black italic tracking-tighter text-white mb-2">
            HelloKitty.
          </h2>
          <p className="text-gray-400 text-sm">Identity Provider</p>
        </div>

        {/* Consent Body */}
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-blue-100">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">
              Authorization Request
            </h3>
            <p className="text-gray-600 mt-2 text-sm leading-relaxed">
              A third-party application is requesting access to your HelloKitty
              account.
            </p>
            <div className="mt-4 inline-block bg-gray-100 px-3 py-1.5 rounded-lg text-xs font-mono text-gray-600 border border-gray-200">
              Client ID: {clientId.substring(0, 8)}...
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 mb-8">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              This app will be able to:
            </p>
            <ul className="space-y-3">
              <li className="flex gap-3 text-sm text-gray-700 items-start">
                <Check className="w-5 h-5 text-green-500 shrink-0" />
                <span>Read your profile information (Name, Avatar).</span>
              </li>
              <li className="flex gap-3 text-sm text-gray-700 items-start">
                <Check className="w-5 h-5 text-green-500 shrink-0" />
                <span>Verify your verified email address.</span>
              </li>
            </ul>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleDeny}
              disabled={loading}
              className="flex-1 bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-xl font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAuthorize}
              disabled={loading}
              className="flex-1 bg-gray-900 text-white py-3 px-4 rounded-xl font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Authorize
            </button>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            You will be redirected to: <br />
            <span className="font-mono">{redirectUri}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

// ✨ Wrap in Suspense because we are using Next.js useSearchParams()
export function AuthorizeView() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
        </div>
      }
    >
      <AuthorizeContent />
    </Suspense>
  );
}
