'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export function SignupForm() {
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
      // ✨ Hit the SIGNUP endpoint instead of login
      const res = await fetch(`${AUTH_API}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to create account');
      }

      // ✨ Show a success toast and send them to the login page!
      toast.success('Account created! Please sign in.');
      router.push('/login');
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message);
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
              Create an account
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Join the ultimate enterprise social platform.
            </p>
          </div>

          <div className="mt-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-xl border-0 py-3.5 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 hover:ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-pink-300 sm:text-sm transition-all outline-none"
                  placeholder="Email address"
                />
              </div>

              <div>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl border-0 py-3.5 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 hover:ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-pink-300 sm:text-sm transition-all outline-none"
                  placeholder="Create a password (min 8 chars)"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center items-center gap-2 rounded-full bg-[#0d0c22] py-3.5 px-3 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 disabled:opacity-70 transition-all"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? 'Creating account...' : 'Sign Up'}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-gray-500">
              By signing up, you agree to our{' '}
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
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-semibold text-gray-900 hover:underline"
              >
                Sign in
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
