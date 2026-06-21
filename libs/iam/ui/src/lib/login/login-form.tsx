'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Loader2, ShieldCheck } from 'lucide-react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // ✨ MFA States
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState('');

  const AUTH_API =
    process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:3001/api';
  const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${AUTH_API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Invalid email or password');
      }

      // ✨ CHECK FOR MFA CHALLENGE!
      if (data.mfa_required) {
        setMfaToken(data.mfa_token);
        toast.info('Please enter your authenticator code.');
        return; // Stop here and wait for the user to type the 6 digits!
      }

      // NO MFA REQUIRED -> Log them straight in
      localStorage.setItem('access_token', data.access_token);
      if (data.refresh_token)
        localStorage.setItem('refresh_token', data.refresh_token);

      toast.success('Successfully logged in!');
      router.push('/');
    } catch (err: unknown) {
      if (err instanceof Error) toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // 2. MFA LOGIN
  // ---------------------------------------------------------------------------
  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${AUTH_API}/auth/login/mfa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mfa_token: mfaToken, code: mfaCode }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Invalid 6-digit code');

      // Success! Lock it in.
      localStorage.setItem('access_token', data.access_token);
      if (data.refresh_token)
        localStorage.setItem('refresh_token', data.refresh_token);

      toast.success('Successfully authenticated!');
      router.push('/');
    } catch (err: unknown) {
      if (err instanceof Error) toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ✨ Handle the Google Login Success!
  const handleGoogleSuccess = async (credentialResponse: {
    credential?: string;
  }) => {
    try {
      // 1. Send the Google Token to our NestJS API
      const res = await fetch(`${AUTH_API}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: credentialResponse.credential }),
      });

      if (!res.ok) throw new Error('Failed to authenticate with Google');

      // 2. We get back our HelloKitty JWT!
      const data = await res.json();
      localStorage.setItem('access_token', data.access_token);
      if (data.refresh_token)
        localStorage.setItem('refresh_token', data.refresh_token);

      toast.success('Successfully logged in with Google!');
      router.push('/');
    } catch {
      toast.error('Google login failed. Please try again.');
    }
  };

  return (
    <GoogleOAuthProvider
      clientId={GOOGLE_CLIENT_ID || 'dummy-id-to-prevent-crash'}
    >
      <div className="flex min-h-screen bg-white font-sans">
        {/* Left Pane - Form Area */}
        <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:w-[480px] xl:w-[560px] relative">
          <div className="absolute top-8 left-8">
            <Link
              href="/"
              className="text-2xl font-black tracking-tighter italic select-none text-gray-900"
            >
              HelloKitty.
            </Link>
          </div>

          <div className="mx-auto w-full max-w-sm lg:w-96">
            {/* ✨ CONDITIONALLY RENDER THE MFA SCREEN IF A TOKEN EXISTS */}
            {mfaToken ? (
              <div className="animate-in fade-in zoom-in-95 duration-300">
                <div className="text-center mb-8">
                  <div className="mx-auto w-12 h-12 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center mb-4">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                    Two-Step Verification
                  </h2>
                  <p className="mt-2 text-sm text-gray-600">
                    Enter the 6-digit code from your authenticator app.
                  </p>
                </div>

                <form onSubmit={handleMfaSubmit} className="space-y-5">
                  <div>
                    <input
                      type="text"
                      required
                      autoFocus
                      maxLength={6}
                      value={mfaCode}
                      onChange={(e) => setMfaCode(e.target.value)}
                      className="block w-full text-center text-2xl tracking-[0.5em] font-mono rounded-xl border-0 py-3.5 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-200 placeholder:text-gray-300 focus:ring-2 focus:ring-inset focus:ring-pink-400 outline-none"
                      placeholder="000000"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || mfaCode.length < 6}
                    className="flex w-full justify-center items-center gap-2 rounded-full bg-[#0d0c22] py-3.5 px-3 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 disabled:opacity-70 transition-all"
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {loading ? 'Verifying...' : 'Verify Code'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setMfaToken(null)}
                    className="w-full text-center text-sm font-medium text-gray-500 hover:text-gray-900 mt-4"
                  >
                    Cancel and go back
                  </button>
                </form>
              </div>
            ) : (
              // ✨ OTHERWISE, SHOW THE STANDARD LOGIN SCREEN
              <div className="animate-in fade-in duration-300">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                    Welcome back
                  </h2>
                </div>

                <div className="mt-8">
                  <div className="flex justify-center w-full mb-6">
                    {GOOGLE_CLIENT_ID ? (
                      <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() =>
                          toast.error('Google Login closed or failed')
                        }
                        theme="outline"
                        shape="pill"
                        size="large"
                        text="continue_with"
                      />
                    ) : (
                      <div className="w-full p-4 border border-red-200 bg-red-50 text-red-600 rounded-xl text-sm text-center font-medium">
                        {/* ✨ Fixed: Wrapped the emoji for accessibility! */}
                        <span role="img" aria-label="warning">
                          ⚠️
                        </span>{' '}
                        NEXT_PUBLIC_GOOGLE_CLIENT_ID is missing in
                        apps/web/.env.local
                      </div>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="relative mt-4 mb-6">
                    <div
                      className="absolute inset-0 flex items-center"
                      aria-hidden="true"
                    >
                      <div className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-sm font-medium leading-6">
                      <span className="bg-white px-6 text-gray-400">or</span>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="block w-full rounded-xl border-0 py-3.5 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 hover:ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-pink-300 sm:text-sm transition-all outline-none"
                        placeholder="Email address or username"
                      />
                    </div>

                    <div>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full rounded-xl border-0 py-3.5 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 hover:ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-pink-300 sm:text-sm transition-all outline-none"
                        placeholder="Password"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="flex w-full justify-center items-center gap-2 rounded-full bg-[#0d0c22] py-3.5 px-3 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 disabled:opacity-70 transition-all"
                    >
                      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                      {loading ? 'Continuing...' : 'Continue'}
                    </button>
                  </form>

                  <p className="mt-6 text-center text-xs text-gray-500">
                    By continuing, you agree to our{' '}
                    <Link
                      href="/terms"
                      className="underline hover:text-gray-800"
                    >
                      Terms
                    </Link>{' '}
                    and{' '}
                    <Link
                      href="/privacy"
                      className="underline hover:text-gray-800"
                    >
                      Privacy Policy
                    </Link>
                    .
                  </p>

                  <p className="mt-8 text-center text-sm text-gray-600">
                    Don't have an account?{' '}
                    <Link
                      href="/signup"
                      className="font-semibold text-gray-900 hover:underline"
                    >
                      Sign up
                    </Link>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Pane - Showcase Image */}
        <div className="relative hidden w-0 flex-1 lg:block">
          <img
            className="absolute inset-0 h-full w-full object-cover"
            src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop"
            alt="Abstract 3D aesthetic"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          <div className="absolute bottom-8 right-8 text-white font-medium text-sm drop-shadow-md">
            @hellokitty_studio
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}
