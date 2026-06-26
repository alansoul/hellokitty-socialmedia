'use client';

import React, { createContext, useContext, useState } from 'react';
import { Lock, Loader2, X, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

interface StepUpContextType {
  safeFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

const StepUpContext = createContext<StepUpContextType | null>(null);

export function useStepUp() {
  const context = useContext(StepUpContext);
  if (!context) {
    throw new Error('useStepUp must be used within a StepUpProvider');
  }
  return context;
}

// Custom interface for our suspended promise queue
interface PendingRequest {
  input: RequestInfo | URL;
  init?: RequestInit;
  resolve: (value: Response | PromiseLike<Response>) => void;
  reject: (reason?: unknown) => void;
}

export function StepUpProvider({ children }: { children: React.ReactNode }) {
  const [showModal, setShowModal] = useState(false);
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  
  // Stores the suspended promise to execute after successful verification
  const [pendingRequest, setPendingRequest] = useState<PendingRequest | null>(null);

  const AUTH_API = process.env['NEXT_PUBLIC_AUTH_API_URL'] || 'http://localhost:3001/api';

  // ✨ The Interceptor: Wraps standard fetch to catch 'mfa_required' responses
  const safeFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const res = await fetch(input, init);

    if (res.status === 403) {
      const clone = res.clone();
      try {
        const data = await clone.json();
        if (data.error === 'mfa_required') {
          // Suspend the execution of the calling function, open the modal, and wait!
          return new Promise<Response>((resolve, reject) => {
            setPendingRequest({ input, init, resolve, reject });
            setShowModal(true);
          });
        }
      } catch {
        // Fallback for non-JSON or other 403 errors
      }
    }

    return res;
  };

  const handleStepUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 6 || !pendingRequest) return;

    setVerifying(true);
    try {
      const token = localStorage.getItem('access_token');
      
      // 1. Submit the 6-digit code to elevate the cookie/session
      const res = await fetch(`${AUTH_API}/auth/mfa/step-up`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code }),
        credentials: 'include',
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Verification failed.');
      }

      const data = await res.json();
      
      // Update local storage with the new elevated access token
      localStorage.setItem('access_token', data.access_token);
      if (data.refresh_token) {
        localStorage.setItem('refresh_token', data.refresh_token);
      }

      toast.success('Identity verified! Completing original action...');

      // 2. ✨ RETRY THE SENSITIVE REQUEST AUTOMATICALLY WITH ELEVATED CREDENTIALS!
      const originalInit = pendingRequest.init || {};
      const headers = originalInit.headers ? new Headers(originalInit.headers) : new Headers();
      headers.set('Authorization', `Bearer ${data.access_token}`);
      originalInit.headers = headers;

      const finalRes = await fetch(pendingRequest.input, originalInit);

      // 3. Resolve the original suspended promise with the successful response
      pendingRequest.resolve(finalRes);

      // 4. Reset state
      setShowModal(false);
      setPendingRequest(null);
      setCode('');
    } catch (error: unknown) {
      if (error instanceof Error) toast.error(error.message);
    } finally {
      setVerifying(false);
    }
  };

  const handleCancel = () => {
    if (pendingRequest) {
      pendingRequest.reject(new Error('MFA verification canceled by user.'));
    }
    setShowModal(false);
    setPendingRequest(null);
    setCode('');
  };

  return (
    <StepUpContext.Provider value={{ safeFetch }}>
      {children}

      {/* ✨ Secure Step-Up modal dialog */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-gray-100">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-pink-500" />
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Security Verification
                </span>
              </div>
              <button type="button" onClick={handleCancel} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStepUpSubmit} className="p-8 space-y-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-pink-50 text-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-pink-100 shadow-sm animate-pulse">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-gray-900">MFA Step-Up Required</h4>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                  You are performing a highly sensitive action. Enter your authenticator's 6-digit code to continue.
                </p>
              </div>

              <div className="space-y-1.5 flex flex-col items-center">
                <input
                  type="text"
                  required
                  autoFocus
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full max-w-[200px] pl-4 py-2.5 font-mono tracking-[0.2em] font-bold text-center border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 outline-none transition-all"
                  placeholder="000000"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={verifying || code.length < 6}
                  className="flex-1 px-5 py-2.5 text-sm font-semibold text-white bg-gray-900 rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {verifying && <Loader2 className="w-4 h-4 animate-spin" />}
                  Verify
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </StepUpContext.Provider>
  );
}