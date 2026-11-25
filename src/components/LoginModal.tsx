import { useState } from 'react';
import { ShieldCheck, UserCheck, X } from 'lucide-react';
import { User, BOOTSTRAPPED_ADMIN_EMAIL, registerAccount, signIn, signOutUser } from '../lib/auth';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  isAdmin: boolean;
  onOpenCustomerDashboard: () => void;
  onOpenAdminDashboard: () => void;
}

export function LoginModal({
  isOpen,
  onClose,
  user,
  isAdmin,
  onOpenCustomerDashboard,
  onOpenAdminDashboard,
}: LoginModalProps) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  async function handleAccountSubmit() {
    setLoading(true);
    setErrorMsg(null);
    try {
      if (mode === 'register') {
        await registerAccount(displayName, email, password);
      } else {
        await signIn(email, password);
      }
      onClose();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to access your account right now.';
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    setLoading(true);
    setErrorMsg(null);
    try {
      await signOutUser();
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Sign out failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-label="MarketMadeEasyAbj Account Login"
    >
      <div className="w-full max-w-md rounded-xl border border-[#E7E5E4] bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-[#52525B]">
              MarketMadeEasyAbj · Apo, Abuja FCT
            </p>
            <h2 className="mt-1 font-display text-xl font-bold text-[#14221B]">
              {user ? 'Your Account' : 'Sign in to MarketMadeEasyAbj'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close login dialog"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#52525B] hover:bg-[#F4F4F0] hover:text-[#14221B]"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {user ? (
          <div className="mt-5 space-y-4">
            <div className="rounded-xl border border-[#E7E5E4] bg-[#FAFAF8] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#14221B] font-display text-sm font-bold text-white">
                  {(user.displayName || user.email || 'M')[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[#14221B]">
                    {user.displayName || 'MarketMadeEasyAbj User'}
                  </p>
                  <p className="truncate text-xs text-[#52525B]">{user.email}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 border-t border-[#E7E5E4] pt-3 text-xs font-medium text-[#14221B]">
                {isAdmin ? (
                  <>
                    <ShieldCheck className="h-4 w-4 text-[#DC2626]" aria-hidden="true" />
                    <span>Admin, Dispatch &amp; Shopper Camera Operator</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="h-4 w-4 text-[#15803D]" aria-hidden="true" />
                    <span>Verified Abuja Customer Account</span>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCustomerDashboard();
                }}
                className="min-h-[42px] rounded-lg bg-[#DC2626] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#B91C1C]"
              >
                Customer Dashboard
              </button>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAdminDashboard();
                  }}
                  className="min-h-[42px] rounded-lg bg-[#14221B] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#273830]"
                >
                  Admin Dashboard
                </button>
              )}
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={handleSignOut}
              className="min-h-[40px] w-full rounded-lg border border-[#D6D3D1] bg-white px-4 py-2 text-xs font-semibold text-[#14221B] transition-colors hover:bg-[#F5F5F4] disabled:opacity-50"
            >
              {loading ? 'Signing out...' : 'Sign out'}
            </button>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <p className="text-sm leading-relaxed text-[#52525B]">
              Sign in to save reusable shopping lists, track dispatch, and access live market
              sessions. Accounts are now managed directly by MarketMadeEasyAbj.
            </p>

            {mode === 'register' && (
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Full name"
                autoComplete="name"
                className="min-h-[44px] w-full rounded-lg border border-[#D6D3D1] px-3 text-sm"
              />
            )}
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email address"
              autoComplete="email"
              className="min-h-[44px] w-full rounded-lg border border-[#D6D3D1] px-3 text-sm"
            />
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password (at least 8 characters)"
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              className="min-h-[44px] w-full rounded-lg border border-[#D6D3D1] px-3 text-sm"
            />

            <button
              type="button"
              disabled={loading}
              onClick={handleAccountSubmit}
              className="flex min-h-[46px] w-full items-center justify-center gap-3 rounded-lg border border-[#D6D3D1] bg-white px-4 py-2.5 text-sm font-semibold text-[#14221B] shadow-xs transition-colors hover:bg-[#FAFAF8] disabled:opacity-60"
            >
              <span>{loading ? 'Please wait...' : mode === 'register' ? 'Create account' : 'Sign in'}</span>
            </button>

            <button
              type="button"
              onClick={() => setMode((value) => value === 'login' ? 'register' : 'login')}
              className="w-full text-xs font-semibold text-[#DC2626] hover:underline"
            >
              {mode === 'login' ? 'New customer? Create an account' : 'Already registered? Sign in'}
            </button>

            <p className="text-xs leading-relaxed text-[#71717A]">
              Admin &amp; Dispatch Console access is automatically enabled for{' '}
              <span className="font-mono text-[#14221B]">{BOOTSTRAPPED_ADMIN_EMAIL}</span> and
              authorized team UIDs.
            </p>
          </div>
        )}

        {errorMsg && (
          <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {errorMsg}
          </p>
        )}
      </div>
    </div>
  );
}
