'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Loader2,
  QrCode,
  Lock,
  CheckCircle2,
  Copy,
} from 'lucide-react';
import { toast } from 'sonner';

// ✨ Helper to chunk long base32 strings into readable 4-character blocks
function formatSecretInChunks(str: string): string {
  return str.match(/.{1,4}/g)?.join(' ') || str;
}

export function MfaSetupView() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1); // Step 4 is 'MFA Active'
  const [loading, setLoading] = useState(true);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [disabling, setDisabling] = useState(false);

  const router = useRouter();
  const AUTH_API =
    process.env['NEXT_PUBLIC_AUTH_API_URL'] || 'http://localhost:3001/api';

  const checkMfaStatus = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        router.push('/login');
        return;
      }

      const res = await fetch(`${AUTH_API}/mfa/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        localStorage.removeItem('access_token');
        router.push('/login');
        return;
      }

      if (res.ok) {
        const data = await res.json();
        if (data.enabled) {
          setStep(4); // Move straight to Step 4 (Protected/Active State)
        } else {
          setStep(1); // Set up required
        }
      }
    } catch {
      toast.error('Could not verify MFA status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkMfaStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInitiateMfa = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${AUTH_API}/mfa/setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401) {
        localStorage.removeItem('access_token');
        router.push('/login');
        return;
      }

      if (!res.ok) throw new Error('Failed to initiate MFA setup.');

      const data = await res.json();
      setQrCode(data.qrCodeDataUrl);
      setSecret(data.secret);
      setStep(2);
      toast.success('MFA Setup initiated successfully!');
    } catch (error: unknown) {
      if (error instanceof Error) toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 6) return;

    setVerifying(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${AUTH_API}/mfa/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code }),
      });

      if (res.status === 401) {
        localStorage.removeItem('access_token');
        router.push('/login');
        return;
      }

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Invalid verification code.');
      }

      setStep(3);
      toast.success('Multi-factor authentication enabled successfully!');
    } catch (error: unknown) {
      if (error instanceof Error) toast.error(error.message);
    } finally {
      setVerifying(false);
    }
  };

  const handleDisableMfa = async () => {
    const confirm = window.confirm(
      'Are you absolutely sure you want to disable 2FA? This will lower your account security.',
    );
    if (!confirm) return;

    setDisabling(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${AUTH_API}/mfa/disable`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Failed to disable MFA.');

      toast.info('Multi-factor authentication has been disabled.');
      setStep(1); // Set back to install screen
    } catch (error: unknown) {
      if (error instanceof Error) toast.error(error.message);
    } finally {
      setDisabling(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    toast.success('MFA Secret copied to clipboard!');
  };

  if (loading && step === 1) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Multi-Factor Authentication (MFA)
        </h2>
        <p className="text-gray-500 mt-1">
          Add an extra layer of security to your identity account.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 max-w-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 to-orange-400"></div>

        {/* STEP 1: Introduce MFA */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="p-3 bg-pink-50 text-pink-600 rounded-xl">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Secure Your Account
                </h3>
                <p className="text-gray-500 mt-1 text-sm leading-relaxed">
                  Two-factor authentication adds an extra layer of security to
                  your account by requiring more than just a password to log in.
                </p>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <button
                onClick={handleInitiateMfa}
                disabled={loading}
                className="flex items-center gap-2 bg-gray-900 text-white px-5 py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 shadow-md"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Enable Authenticator MFA
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Scan QR Code & Verify */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Configure Authenticator App
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Scan the QR code below using Google Authenticator, Microsoft
                  Authenticator, or Duo.
                </p>
              </div>
            </div>

            {/* QR Code Container (✨ Fixed: Styled to wrap the long key block safely) */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 py-4 border-y border-gray-100">
              <div className="p-3 bg-white border border-gray-200 rounded-2xl shadow-sm shrink-0">
                <img src={qrCode} alt="MFA QR Code" className="w-40 h-40" />
              </div>
              <div className="space-y-3 w-full min-w-0">
                <p className="text-sm font-semibold text-gray-800">
                  Can't scan the code?
                </p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Enter this secret key manually into your authenticator app
                  instead:
                </p>
                <div className="flex items-center gap-2 w-full max-w-xs sm:max-w-none">
                  {/* ✨ Fixed: Added break-all, text-sm, selection, and formatted text into 4-char chunks */}
                  <span className="font-mono text-sm font-bold bg-gray-100 text-gray-700 px-3 py-2 rounded-lg border border-gray-200 uppercase tracking-wider select-all break-all whitespace-normal">
                    {formatSecretInChunks(secret)}
                  </span>
                  <button
                    type="button"
                    onClick={copySecret}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors shrink-0"
                  >
                    <Copy className="w-4.5 h-4.5" />
                  </button>
                </div>
                {/* ✨ Added instruction label */}
                <p className="text-[10px] text-gray-400 font-medium italic mt-1">
                  *If typing manually, enter the code without spaces.
                </p>
              </div>
            </div>

            {/* OTP Verification Form */}
            <form onSubmit={handleVerifyMfa} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-gray-700">
                  Verify 6-Digit Code
                </label>
                <div className="relative max-w-[200px]">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 font-mono tracking-[0.2em] font-bold text-center border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 outline-none transition-all"
                    placeholder="000000"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={verifying || code.length < 6}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-gray-900 rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {verifying && <Loader2 className="w-4 h-4 animate-spin" />}
                  Verify and Enable
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 3: Verification Success */}
        {step === 3 && (
          <div className="space-y-6 py-4 text-center">
            <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-100 shadow-sm animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-gray-900">
                MFA is Now Active!
              </h3>
              <p className="text-gray-500 text-sm max-w-sm mx-auto leading-relaxed">
                Your account is secure. The next time you log in, you will be
                prompted to enter the 6-digit code from your authenticator app.
              </p>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <button
                onClick={checkMfaStatus} // ✨ Clicking Done will run the status check to lock in State 4!
                className="bg-gray-900 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-gray-800 transition-colors shadow-sm"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* ✨ NEW: STEP 4: Persistent "Protected" Active State */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="p-3 bg-green-50 text-green-500 rounded-xl border border-green-100">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  Two-Factor Authentication is Enabled
                </h3>
                <p className="text-gray-500 mt-1 text-sm leading-relaxed">
                  Your account is protected by an Authenticator app (TOTP). Your
                  verification status is active.
                </p>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6 flex justify-between items-center">
              <span className="text-xs text-gray-400 font-mono">
                Factor type: app-based (TOTP)
              </span>
              <button
                onClick={handleDisableMfa}
                disabled={disabling}
                className="flex items-center gap-2 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {disabling && <Loader2 className="w-4 h-4 animate-spin" />}
                Disable 2FA
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
