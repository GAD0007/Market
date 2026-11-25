import { useEffect, useState } from 'react';
import { Menu, ShoppingBag, ShoppingBasket, X } from 'lucide-react';
import { User } from '../lib/auth';

export type AppView = 'storefront' | 'tracking' | 'customer' | 'admin';
interface Props { bagCount: number; onOpenBag: () => void; activeView: AppView; onNavigateView: (view: AppView, sectionId?: string) => void; user: User | null; onOpenLogin: () => void }
const LINKS: { view: AppView; sectionId?: string; label: string }[] = [
  { view: 'storefront', sectionId: 'catalog', label: 'Catalog' },
  { view: 'tracking', label: 'Track Order' },
  { view: 'customer', label: 'Customer' },
  { view: 'admin', label: 'Admin' },
];

export function Navbar({ bagCount, onOpenBag, activeView, onNavigateView, user, onOpenLogin }: Props) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => { const fn = () => setScrolled(window.scrollY > 12); fn(); window.addEventListener('scroll', fn, { passive: true }); return () => window.removeEventListener('scroll', fn); }, []);
  useEffect(() => { const fn = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false); window.addEventListener('keydown', fn); document.body.style.overflow = open ? 'hidden' : ''; return () => { window.removeEventListener('keydown', fn); document.body.style.overflow = ''; }; }, [open]);
  const go = (view: AppView, sectionId?: string) => { onNavigateView(view, sectionId); setOpen(false); };
  const account = () => { onOpenLogin(); setOpen(false); };
  return <>
    <header className={`fixed inset-x-0 top-0 z-50 bg-[#14221B] shadow-[0_6px_24px_-12px_rgba(0,0,0,0.55)] transition-all duration-300 ${scrolled || open ? 'lg:bg-[#FFFCF7]/90 lg:shadow-[0_6px_24px_-12px_rgba(28,25,23,0.25)] lg:backdrop-blur-md' : 'lg:bg-transparent lg:shadow-none'}`}>
      <div className="mx-auto flex h-[68px] max-w-[1200px] items-center gap-4 px-4 sm:px-6 lg:px-8">
        <button type="button" onClick={() => go('storefront', 'top')} className="flex min-w-0 shrink items-center gap-2 font-display text-base font-extrabold tracking-tight text-white sm:text-xl lg:text-[#1C1917]">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFAA0D]"><ShoppingBasket className="h-[18px] w-[18px]" aria-hidden="true" /></span>
          <span className="truncate">MarketMadeEasy<span className="text-[#FFAA0D] lg:text-[#E08A00]">Abj</span></span>
        </button>
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <nav aria-label="Primary" className="hidden items-center lg:flex">
            {LINKS.map((link) => <button key={link.view} type="button" onClick={() => go(link.view, link.sectionId)} className="relative px-3 py-2 text-sm font-semibold text-[#1C1917] transition-opacity hover:opacity-70">
              {link.label}{activeView === link.view && <span className="absolute inset-x-3 bottom-0.5 h-[3px] rounded-full bg-[#1C1917]" />}
            </button>)}
          </nav>
          <button type="button" onClick={account} className="hidden px-3 py-2 text-sm font-semibold text-[#1C1917] transition-opacity hover:opacity-70 lg:block">{user ? 'Account' : 'Sign In'}</button>
          <button type="button" onClick={onOpenBag} aria-label={`Market bag, ${bagCount} items`} className="relative inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-[#DC2626] px-3 text-sm font-semibold text-white transition hover:bg-[#B91C1C] active:scale-95 sm:px-4 lg:bg-[#1C1917] lg:hover:bg-black">
            <ShoppingBag className="h-[18px] w-[18px]" aria-hidden="true" /><span className="hidden sm:inline">Market Bag</span><span className="hidden min-w-5 rounded-md bg-[#FFAA0D] px-1.5 text-center font-mono text-xs font-bold tabular-nums text-[#1C1917] sm:inline">{bagCount}</span>
            {bagCount > 0 && <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-[#14221B] bg-[#FFAA0D] px-1 font-mono text-[10px] font-bold text-[#1C1917] sm:hidden">{bagCount > 9 ? '9+' : bagCount}</span>}
          </button>
          <button type="button" onClick={() => setOpen(v => !v)} aria-label="Toggle navigation menu" aria-expanded={open} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white transition hover:bg-white/15 active:scale-95 lg:hidden">{open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
        </div>
      </div>
      <div className={`grid transition-[grid-template-rows] duration-300 ease-out lg:hidden ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}><div className="overflow-hidden"><nav aria-label="Mobile" className="flex flex-col gap-1 border-t border-white/10 bg-[#14221B] px-4 py-3 shadow-xl">
        {LINKS.map(link => <button key={link.view} type="button" onClick={() => go(link.view, link.sectionId)} className={`flex min-h-[48px] items-center rounded-xl px-3 text-base font-semibold ${activeView === link.view ? 'bg-[#DC2626] text-white' : 'text-white/90 hover:bg-white/10'}`}>{link.label}</button>)}
        <button type="button" onClick={account} className="mt-2 min-h-[48px] rounded-full border border-white/30 text-base font-bold text-white hover:bg-white hover:text-[#14221B]">{user ? `Account (${user.displayName || user.email})` : 'Sign In'}</button>
      </nav></div></div>
    </header>
    {open && <div onClick={() => setOpen(false)} className="fixed inset-0 z-40 bg-[#1C1917]/30 backdrop-blur-[1px] lg:hidden" aria-hidden="true" />}
  </>;
}
