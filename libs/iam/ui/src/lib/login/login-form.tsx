'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const AUTH_API =
    process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:3001/api';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${AUTH_API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Invalid email or password');
      }

      const data = await res.json();
      localStorage.setItem('access_token', data.access_token);

      toast.success('Successfully logged in!');
      router.push('/');
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message); // ✨ Premium toast instead of ugly red text!
      } else {
        toast.error('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white font-sans">
      {/* Left Pane - Form Area */}
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:w-[480px] xl:w-[560px] relative">
        {/* Brand Logo */}
        <div className="absolute top-8 left-8">
          <Link
            href="/"
            className="text-2xl font-black tracking-tighter italic select-none text-gray-900"
          >
            HelloKitty.
          </Link>
        </div>

        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              Welcome back
            </h2>
          </div>

          <div className="mt-8">
            {/* Social Login Button */}
            <button
              type="button"
              className="flex w-full items-center justify-center gap-3 rounded-full border border-gray-300 bg-white px-4 py-3.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.58c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.58-2.77c-.98.66-2.23 1.06-3.7 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </button>

            {/* Divider */}
            <div className="relative mt-8 mb-6">
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
                {/* ✨ Lucide React Loading Spinner! */}
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? 'Continuing...' : 'Continue'}
              </button>
            </form>

            {/* ✨ Fixed ESLint Link Errors */}
            <p className="mt-6 text-center text-xs text-gray-500">
              By continuing, you agree to our{' '}
              <Link href="/terms" className="underline hover:text-gray-800">
                Terms
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="underline hover:text-gray-800">
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
  );
}
